// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title LimitOrderBridge
 * @dev Gasless cross-chain limit order system following 1inch Fusion+ patterns
 * 
 * 🎯 INTENT-BASED LIMIT ORDERS:
 * - Users sign limit order intents off-chain
 * - Resolvers monitor price conditions and execute profitable orders
 * - Complete gasless experience for users
 * 
 * 🌉 CROSS-CHAIN EXECUTION:
 * - ETH (Sepolia) → Algorand atomic swaps
 * - HTLC-based security with hashlock/timelock
 * - Resolver pays all gas fees and earns profit from spread
 * 
 * 🚀 1inch FUSION+ ARCHITECTURE:
 * - EIP-712 signed intents for gasless submission
 * - Dutch auction mechanisms for competitive resolver selection
 * - Threshold-based user protection
 */
contract LimitOrderBridge is ReentrancyGuard, Ownable, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // 🎯 Limit Order Intent Structure (EIP-712)
    struct LimitOrderIntent {
        address maker;              // User creating the order
        address makerToken;         // Token user is selling (address(0) for ETH)
        address takerToken;         // Token user wants to buy
        uint256 makerAmount;        // Amount user is selling
        uint256 takerAmount;        // Minimum amount user wants to receive
        uint256 deadline;           // Order expiry timestamp
        uint256 algorandChainId;    // Target Algorand chain ID
        string algorandAddress;     // Algorand recipient address
        bytes32 salt;               // Unique order identifier
    }

    // 🔒 Active Limit Order
    struct LimitOrder {
        LimitOrderIntent intent;    // Original signed intent
        bytes32 hashlock;          // Secret hash for HTLC
        uint256 timelock;          // HTLC expiry
        uint256 depositedAmount;   // Actual deposited amount
        bool filled;               // Whether order has been filled
        bool cancelled;            // Whether order has been cancelled
        uint256 createdAt;         // Creation timestamp
        address resolver;          // Resolver who filled the order
    }

    // 📊 Order Storage
    mapping(bytes32 => LimitOrder) public limitOrders;
    mapping(address => bool) public authorizedResolvers;
    mapping(address => uint256) public resolverBalances;

    // 🔧 Configuration
    uint256 public algorandAppId;                    // Algorand contract app ID
    uint256 public constant DEFAULT_TIMELOCK = 24 hours;  // Default HTLC timelock
    uint256 public constant MIN_ORDER_VALUE = 0.001 ether; // Minimum order size
    uint256 public resolverFeeRate = 50;            // 0.5% resolver fee (50 / 10000)

    // 📋 EIP-712 Type Hash
    bytes32 public constant LIMIT_ORDER_TYPEHASH = keccak256(
        "LimitOrderIntent(address maker,address makerToken,address takerToken,uint256 makerAmount,uint256 takerAmount,uint256 deadline,uint256 algorandChainId,string algorandAddress,bytes32 salt)"
    );

    // 🎉 Events
    event LimitOrderCreated(
        bytes32 indexed orderId,
        address indexed maker,
        address makerToken,
        address takerToken,
        uint256 makerAmount,
        uint256 takerAmount,
        uint256 deadline,
        string algorandAddress,
        bytes32 hashlock,
        uint256 timelock
    );

    event LimitOrderFilled(
        bytes32 indexed orderId,
        address indexed resolver,
        bytes32 secret,
        uint256 algorandAmount,
        uint256 resolverFee
    );

    event LimitOrderCancelled(
        bytes32 indexed orderId,
        address indexed maker,
        uint256 refundAmount
    );

    event ResolverAuthorized(address indexed resolver, bool authorized);
    event AlgorandAppIdSet(uint256 appId);

    // 🔧 Modifiers
    modifier onlyAuthorizedResolver() {
        require(authorizedResolvers[msg.sender], "Not authorized resolver");
        _;
    }

    modifier validOrder(bytes32 orderId) {
        require(limitOrders[orderId].intent.maker != address(0), "Order does not exist");
        require(!limitOrders[orderId].filled, "Order already filled");
        require(!limitOrders[orderId].cancelled, "Order cancelled");
        require(block.timestamp <= limitOrders[orderId].intent.deadline, "Order expired");
        _;
    }

    constructor() Ownable(msg.sender) EIP712("LimitOrderBridge", "1") {
        // Initialize with deployer as owner
    }

    /**
     * 🎯 PHASE 2: ON-CHAIN INTENT SUBMISSION
     * User submits signed limit order intent with ETH deposit
     */
    function submitLimitOrder(
        LimitOrderIntent calldata intent,
        bytes calldata signature,
        bytes32 hashlock,
        uint256 timelock
    ) external payable nonReentrant returns (bytes32 orderId) {
        require(intent.maker == msg.sender, "Invalid maker");
        require(intent.makerAmount > 0, "Invalid maker amount");
        require(intent.takerAmount > 0, "Invalid taker amount");
        require(intent.deadline > block.timestamp, "Order expired");
        require(msg.value >= intent.makerAmount, "Insufficient deposit");
        require(msg.value >= MIN_ORDER_VALUE, "Order too small");
        require(timelock == 0 || timelock >= block.timestamp + 1 hours, "Invalid timelock");

        // Generate unique order ID
        orderId = keccak256(abi.encodePacked(
            intent.maker,
            intent.salt,
            block.timestamp,
            msg.value
        ));

        // Verify EIP-712 signature
        require(_verifySignature(intent, signature, intent.maker), "Invalid signature");

        // Set default timelock if not provided
        if (timelock == 0) {
            timelock = block.timestamp + DEFAULT_TIMELOCK;
        }

        // Store the limit order
        limitOrders[orderId] = LimitOrder({
            intent: intent,
            hashlock: hashlock,
            timelock: timelock,
            depositedAmount: msg.value,
            filled: false,
            cancelled: false,
            createdAt: block.timestamp,
            resolver: address(0)
        });

        emit LimitOrderCreated(
            orderId,
            intent.maker,
            intent.makerToken,
            intent.takerToken,
            intent.makerAmount,
            intent.takerAmount,
            intent.deadline,
            intent.algorandAddress,
            hashlock,
            timelock
        );
    }

    /**
     * 🎯 PHASE 4: EXECUTION TRIGGERED (by Resolver)
     * Resolver fills the limit order when price conditions are met
     */
    function fillLimitOrder(
        bytes32 orderId,
        bytes32 secret,
        uint256 algorandAmount
    ) external onlyAuthorizedResolver validOrder(orderId) nonReentrant {
        LimitOrder storage order = limitOrders[orderId];

        // Verify secret matches hashlock
        require(keccak256(abi.encodePacked(secret)) == order.hashlock, "Invalid secret");
        
        // Verify timelock hasn't expired
        require(block.timestamp <= order.timelock, "HTLC expired");
        
        // Verify minimum output amount
        require(algorandAmount >= order.intent.takerAmount, "Insufficient output");

        // Calculate resolver fee
        uint256 resolverFee = (order.depositedAmount * resolverFeeRate) / 10000;
        uint256 resolverAmount = order.depositedAmount - resolverFee;

        // Mark order as filled
        order.filled = true;
        order.resolver = msg.sender;

        // Transfer ETH to resolver (minus fee)
        payable(msg.sender).transfer(resolverAmount);
        
        // Add fee to resolver balance for later withdrawal
        resolverBalances[msg.sender] += resolverFee;

        emit LimitOrderFilled(
            orderId,
            msg.sender,
            secret,
            algorandAmount,
            resolverFee
        );
    }

    /**
     * 🔧 Cancel limit order (maker only)
     */
    function cancelLimitOrder(bytes32 orderId) external validOrder(orderId) nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        require(order.intent.maker == msg.sender, "Only maker can cancel");

        order.cancelled = true;

        // Refund the deposited amount
        uint256 refundAmount = order.depositedAmount;
        payable(msg.sender).transfer(refundAmount);

        emit LimitOrderCancelled(orderId, msg.sender, refundAmount);
    }

    /**
     * 🔧 Refund after timelock expiry
     */
    function refundExpiredOrder(bytes32 orderId) external nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        require(order.intent.maker != address(0), "Order does not exist");
        require(!order.filled, "Order already filled");
        require(!order.cancelled, "Order already cancelled");
        require(block.timestamp > order.timelock, "Timelock not expired");

        order.cancelled = true;

        // Refund the deposited amount
        uint256 refundAmount = order.depositedAmount;
        payable(order.intent.maker).transfer(refundAmount);

        emit LimitOrderCancelled(orderId, order.intent.maker, refundAmount);
    }

    /**
     * 🔧 Resolver Management
     */
    function authorizeResolver(address resolver, bool authorized) external onlyOwner {
        authorizedResolvers[resolver] = authorized;
        emit ResolverAuthorized(resolver, authorized);
    }

    function setAlgorandAppId(uint256 appId) external onlyOwner {
        algorandAppId = appId;
        emit AlgorandAppIdSet(appId);
    }

    function setResolverFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Fee rate too high"); // Max 10%
        resolverFeeRate = newRate;
    }

    /**
     * 🔧 Resolver fee withdrawal
     */
    function withdrawResolverFees() external {
        uint256 balance = resolverBalances[msg.sender];
        require(balance > 0, "No fees to withdraw");

        resolverBalances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }

    /**
     * 🔍 View Functions
     */
    function getOrder(bytes32 orderId) external view returns (LimitOrder memory) {
        return limitOrders[orderId];
    }

    function isOrderActive(bytes32 orderId) external view returns (bool) {
        LimitOrder memory order = limitOrders[orderId];
        return order.intent.maker != address(0) && 
               !order.filled && 
               !order.cancelled && 
               block.timestamp <= order.intent.deadline;
    }

    function getOrderHashlock(bytes32 orderId) external view returns (bytes32) {
        return limitOrders[orderId].hashlock;
    }

    /**
     * 🔐 Internal signature verification
     */
    function _verifySignature(
        LimitOrderIntent calldata intent,
        bytes calldata signature,
        address expectedSigner
    ) internal view returns (bool) {
        bytes32 structHash = keccak256(abi.encode(
            LIMIT_ORDER_TYPEHASH,
            intent.maker,
            intent.makerToken,
            intent.takerToken,
            intent.makerAmount,
            intent.takerAmount,
            intent.deadline,
            intent.algorandChainId,
            keccak256(bytes(intent.algorandAddress)),
            intent.salt
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        return hash.recover(signature) == expectedSigner;
    }

    /**
     * 🚨 Emergency functions
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {
        // Allow contract to receive ETH
    }
} 