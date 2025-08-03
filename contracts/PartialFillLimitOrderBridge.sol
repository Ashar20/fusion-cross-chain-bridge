// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title PartialFillLimitOrderBridge
 * @dev Advanced gasless cross-chain limit order system with PARTIAL FILL support
 * 
 * 🧩 PARTIAL FILL FEATURES:
 * - Orders can be filled incrementally over time
 * - Multiple resolvers can compete for partial fills
 * - Optimal capital efficiency and price discovery
 * 
 * 🎯 INTENT-BASED LIMIT ORDERS:
 * - Users sign limit order intents off-chain
 * - Resolvers monitor price conditions and execute profitable chunks
 * - Complete gasless experience for users
 * 
 * 🌉 CROSS-CHAIN EXECUTION:
 * - ETH (Sepolia) → Algorand atomic swaps
 * - HTLC-based security with hashlock/timelock
 * - Resolver pays all gas fees and earns profit from spread
 */
contract PartialFillLimitOrderBridge is ReentrancyGuard, Ownable, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // 🎯 Enhanced Limit Order Intent Structure (EIP-712)
    struct LimitOrderIntent {
        address maker;              // User creating the order
        address makerToken;         // Token user is selling (address(0) for ETH)
        address takerToken;         // Token user wants to buy
        uint256 makerAmount;        // Total amount user is selling
        uint256 takerAmount;        // Minimum total amount user wants to receive
        uint256 deadline;           // Order expiry timestamp
        uint256 algorandChainId;    // Target Algorand chain ID
        string algorandAddress;     // Algorand recipient address
        bytes32 salt;               // Unique order identifier
        bool partialFillsEnabled;   // Whether partial fills are allowed
        uint256 minFillAmount;      // Minimum partial fill size
    }

    // 🔒 Enhanced Active Limit Order with Partial Fill Tracking
    struct LimitOrder {
        LimitOrderIntent intent;    // Original signed intent
        bytes32 hashlock;          // Secret hash for HTLC
        uint256 timelock;          // HTLC expiry
        uint256 depositedAmount;   // Total deposited amount
        uint256 filledAmount;      // Amount already filled (NEW!)
        uint256 remainingAmount;   // Amount remaining to fill (NEW!)
        bool fullyFilled;          // Whether order is completely filled
        bool cancelled;            // Whether order has been cancelled
        uint256 createdAt;         // Creation timestamp
        address[] resolvers;       // List of resolvers who filled parts (NEW!)
        uint256 fillCount;         // Number of partial fills (NEW!)
    }

    // 🧩 Partial Fill Execution Record
    struct PartialFill {
        bytes32 orderId;           // Order being filled
        address resolver;          // Resolver executing the fill
        uint256 fillAmount;        // Amount being filled in this execution
        uint256 algorandAmount;    // Corresponding Algorand amount
        bytes32 secret;            // HTLC secret for this fill
        uint256 timestamp;         // Execution timestamp
        uint256 resolverFee;       // Fee earned by resolver
    }

    // 📊 Enhanced Storage
    mapping(bytes32 => LimitOrder) public limitOrders;
    mapping(bytes32 => PartialFill[]) public orderFills;  // All fills for an order
    mapping(address => bool) public authorizedResolvers;
    mapping(address => uint256) public resolverBalances;
    
    // 🧩 Partial Fill Configuration
    uint256 public constant MIN_PARTIAL_FILL_RATIO = 500;    // 5% minimum (500/10000)
    uint256 public constant MAX_PARTIAL_FILLS_PER_ORDER = 10; // Max 10 partial fills per order
    uint256 public partialFillFeeBonus = 25;                 // 0.25% bonus for partial fills

    // 🔧 Configuration
    uint256 public algorandAppId;
    uint256 public constant DEFAULT_TIMELOCK = 24 hours;
    uint256 public constant MIN_ORDER_VALUE = 0.001 ether;
    uint256 public resolverFeeRate = 50;            // 0.5% resolver fee (50 / 10000)

    // 📋 EIP-712 Type Hash (Enhanced)
    bytes32 public constant LIMIT_ORDER_TYPEHASH = keccak256(
        "LimitOrderIntent(address maker,address makerToken,address takerToken,uint256 makerAmount,uint256 takerAmount,uint256 deadline,uint256 algorandChainId,string algorandAddress,bytes32 salt,bool partialFillsEnabled,uint256 minFillAmount)"
    );

    // 🎉 Enhanced Events
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
        uint256 timelock,
        bool partialFillsEnabled,
        uint256 minFillAmount
    );

    event PartialOrderFilled(
        bytes32 indexed orderId,
        address indexed resolver,
        uint256 fillAmount,
        uint256 remainingAmount,
        uint256 algorandAmount,
        uint256 resolverFee,
        uint256 fillIndex,
        bool isFullyFilled
    );

    event OrderFullyFilled(
        bytes32 indexed orderId,
        address indexed finalResolver,
        uint256 totalFilled,
        uint256 totalResolverFees,
        uint256 fillCount
    );

    event LimitOrderCancelled(
        bytes32 indexed orderId,
        address indexed maker,
        uint256 refundAmount
    );

    event ResolverAuthorized(address indexed resolver, bool authorized);

    // 🔧 Enhanced Modifiers
    modifier onlyAuthorizedResolver() {
        require(authorizedResolvers[msg.sender], "Not authorized resolver");
        _;
    }

    modifier validOrderForFill(bytes32 orderId) {
        require(limitOrders[orderId].intent.maker != address(0), "Order does not exist");
        require(!limitOrders[orderId].fullyFilled, "Order fully filled");
        require(!limitOrders[orderId].cancelled, "Order cancelled");
        require(block.timestamp <= limitOrders[orderId].intent.deadline, "Order expired");
        require(limitOrders[orderId].remainingAmount > 0, "No remaining amount");
        _;
    }

    constructor() Ownable(msg.sender) EIP712("PartialFillLimitOrderBridge", "1") {
        // Initialize with deployer as owner
    }

    /**
     * 🎯 ENHANCED: Submit limit order with partial fill support
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
        
        // Partial fill validation
        if (intent.partialFillsEnabled) {
            require(intent.minFillAmount > 0, "Invalid min fill amount");
            require(intent.minFillAmount <= intent.makerAmount, "Min fill too large");
            require(intent.minFillAmount >= (intent.makerAmount * MIN_PARTIAL_FILL_RATIO) / 10000, "Min fill too small");
        }

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

        // Store the enhanced limit order
        limitOrders[orderId] = LimitOrder({
            intent: intent,
            hashlock: hashlock,
            timelock: timelock,
            depositedAmount: msg.value,
            filledAmount: 0,                    // NEW: Track filled amount
            remainingAmount: msg.value,         // NEW: Track remaining amount
            fullyFilled: false,                 // NEW: Full fill status
            cancelled: false,
            createdAt: block.timestamp,
            resolvers: new address[](0),        // NEW: Resolver history
            fillCount: 0                        // NEW: Fill counter
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
            timelock,
            intent.partialFillsEnabled,
            intent.minFillAmount
        );
    }

    /**
     * 🧩 ENHANCED: Fill limit order with partial fill support
     */
    function fillLimitOrder(
        bytes32 orderId,
        uint256 fillAmount,        // NEW: Specific amount to fill
        bytes32 secret,
        uint256 algorandAmount
    ) external onlyAuthorizedResolver validOrderForFill(orderId) nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        
        // Validate fill amount
        require(fillAmount > 0, "Fill amount must be > 0");
        require(fillAmount <= order.remainingAmount, "Fill amount exceeds remaining");
        
        // Partial fill validation
        if (order.intent.partialFillsEnabled) {
            require(fillAmount >= order.intent.minFillAmount || fillAmount == order.remainingAmount, "Fill too small");
            require(order.fillCount < MAX_PARTIAL_FILLS_PER_ORDER, "Too many partial fills");
        } else {
            require(fillAmount == order.remainingAmount, "Partial fills disabled");
        }

        // Verify secret matches hashlock
        require(keccak256(abi.encodePacked(secret)) == order.hashlock, "Invalid secret");
        
        // Verify timelock hasn't expired
        require(block.timestamp <= order.timelock, "HTLC expired");
        
        // Calculate proportional taker amount
        uint256 proportionalTakerAmount = (order.intent.takerAmount * fillAmount) / order.intent.makerAmount;
        require(algorandAmount >= proportionalTakerAmount, "Insufficient output");

        // Calculate resolver fee with partial fill bonus
        uint256 baseFeeRate = resolverFeeRate;
        if (order.intent.partialFillsEnabled && fillAmount < order.remainingAmount) {
            baseFeeRate += partialFillFeeBonus; // Bonus for partial fills
        }
        
        uint256 resolverFee = (fillAmount * baseFeeRate) / 10000;
        uint256 resolverAmount = fillAmount - resolverFee;

        // Update order state
        order.filledAmount += fillAmount;
        order.remainingAmount -= fillAmount;
        order.fillCount += 1;
        
        // Check if order is now fully filled
        bool isFullyFilled = (order.remainingAmount == 0);
        if (isFullyFilled) {
            order.fullyFilled = true;
        }
        
        // Add resolver to history
        order.resolvers.push(msg.sender);

        // Record this partial fill
        orderFills[orderId].push(PartialFill({
            orderId: orderId,
            resolver: msg.sender,
            fillAmount: fillAmount,
            algorandAmount: algorandAmount,
            secret: secret,
            timestamp: block.timestamp,
            resolverFee: resolverFee
        }));

        // Transfer ETH to resolver (minus fee)
        payable(msg.sender).transfer(resolverAmount);
        
        // Add fee to resolver balance
        resolverBalances[msg.sender] += resolverFee;

        emit PartialOrderFilled(
            orderId,
            msg.sender,
            fillAmount,
            order.remainingAmount,
            algorandAmount,
            resolverFee,
            order.fillCount - 1,
            isFullyFilled
        );

        // Emit full completion event if applicable
        if (isFullyFilled) {
            uint256 totalFees = 0;
            PartialFill[] memory fills = orderFills[orderId];
            for (uint i = 0; i < fills.length; i++) {
                totalFees += fills[i].resolverFee;
            }

            emit OrderFullyFilled(
                orderId,
                msg.sender,
                order.filledAmount,
                totalFees,
                order.fillCount
            );
        }
    }

    /**
     * 🔍 Get order fill history
     */
    function getOrderFills(bytes32 orderId) external view returns (PartialFill[] memory) {
        return orderFills[orderId];
    }

    /**
     * 📊 Get order fill summary
     */
    function getOrderSummary(bytes32 orderId) external view returns (
        uint256 totalAmount,
        uint256 filledAmount,
        uint256 remainingAmount,
        uint256 fillCount,
        bool fullyFilled,
        address[] memory resolvers
    ) {
        LimitOrder storage order = limitOrders[orderId];
        return (
            order.intent.makerAmount,
            order.filledAmount,
            order.remainingAmount,
            order.fillCount,
            order.fullyFilled,
            order.resolvers
        );
    }

    /**
     * 🔧 Enhanced cancel with partial fill support
     */
    function cancelLimitOrder(bytes32 orderId) external validOrderForFill(orderId) nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        require(order.intent.maker == msg.sender, "Only maker can cancel");

        order.cancelled = true;

        // Refund only the remaining amount (not filled portion)
        uint256 refundAmount = order.remainingAmount;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }

        emit LimitOrderCancelled(orderId, msg.sender, refundAmount);
    }

    /**
     * 🔧 Internal signature verification
     */
    function _verifySignature(
        LimitOrderIntent calldata intent,
        bytes calldata signature,
        address signer
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
            intent.salt,
            intent.partialFillsEnabled,
            intent.minFillAmount
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address recoveredSigner = hash.recover(signature);
        return recoveredSigner == signer;
    }

    // Additional utility and admin functions...
    function setResolverAuthorization(address resolver, bool authorized) external onlyOwner {
        authorizedResolvers[resolver] = authorized;
        emit ResolverAuthorized(resolver, authorized);
    }
} 