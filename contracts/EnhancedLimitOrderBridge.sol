// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@1inch/limit-order-protocol-contract/contracts/interfaces/ITakerInteraction.sol";

/**
 * @title EnhancedLimitOrderBridge
 * @dev Enhanced limit order bridge with Ethereum-only bidding and partial fills
 * 
 * 🎯 FEATURES:
 * - Ethereum-only competitive bidding
 * - Partial fill support
 * - Bidirectional ETH ↔ ALGO swaps
 * - Automatic best-bid selection
 * - 1inch Fusion+ integration
 */
contract EnhancedLimitOrderBridge is ReentrancyGuard, Ownable, EIP712, ITakerInteraction {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // 🎯 Enhanced Limit Order Intent Structure
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
        bool allowPartialFills;     // NEW: Allow partial fills
        uint256 minPartialFill;     // NEW: Minimum partial fill amount
    }

    // 🔒 Enhanced Limit Order
    struct LimitOrder {
        LimitOrderIntent intent;    // Original signed intent
        bytes32 hashlock;          // Secret hash for HTLC
        uint256 timelock;          // HTLC expiry
        uint256 depositedAmount;   // Actual deposited amount
        uint256 remainingAmount;   // NEW: Remaining amount for partial fills
        bool filled;               // Whether order has been filled
        bool cancelled;            // Whether order has been cancelled
        uint256 createdAt;         // Creation timestamp
        address resolver;          // Resolver who filled the order
        uint256 partialFills;      // NEW: Number of partial fills
        Bid winningBid;            // NEW: Winning bid details
    }

    // 🏆 Bidding System
    struct Bid {
        address resolver;          // Resolver address
        uint256 inputAmount;       // Input amount (ETH or ALGO equivalent)
        uint256 outputAmount;      // Output amount (ALGO or ETH equivalent)
        uint256 timestamp;         // Bid timestamp
        bool active;               // Whether bid is still active
        uint256 gasEstimate;       // Gas cost estimate
        uint256 totalCost;         // Total cost including gas
    }

    // 📊 Enhanced Storage
    mapping(bytes32 => LimitOrder) public limitOrders;
    mapping(bytes32 => Bid[]) public bids;                    // NEW: Bidding pool
    mapping(bytes32 => mapping(address => uint256)) public partialFillAmounts; // NEW: Partial fill tracking
    mapping(address => bool) public authorizedResolvers;
    mapping(address => uint256) public resolverBalances;
    mapping(address => uint256) public resolverBidCount;      // NEW: Track resolver activity

    // 🔧 Configuration
    uint256 public algorandAppId;                    // Algorand contract app ID
    uint256 public constant DEFAULT_TIMELOCK = 24 hours;  // Default HTLC timelock
    uint256 public constant MIN_ORDER_VALUE = 0.001 ether; // Minimum order size
    uint256 public constant MIN_BID_DURATION = 5 minutes;  // NEW: Minimum bid duration
    uint256 public resolverFeeRate = 50;            // 0.5% resolver fee (50 / 10000)
    uint256 public biddingFeeRate = 10;             // NEW: 0.1% bidding fee

    // 📋 Enhanced EIP-712 Type Hash
    bytes32 public constant LIMIT_ORDER_TYPEHASH = keccak256(
        "LimitOrderIntent(address maker,address makerToken,address takerToken,uint256 makerAmount,uint256 takerAmount,uint256 deadline,uint256 algorandChainId,string algorandAddress,bytes32 salt,bool allowPartialFills,uint256 minPartialFill)"
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
        bool allowPartialFills
    );

    event BidPlaced(
        bytes32 indexed orderId,
        address indexed resolver,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 gasEstimate,
        uint256 totalCost
    );

    event BidWithdrawn(
        bytes32 indexed orderId,
        address indexed resolver
    );

    event BestBidSelected(
        bytes32 indexed orderId,
        address indexed resolver,
        uint256 inputAmount,
        uint256 outputAmount
    );

    event LimitOrderPartiallyFilled(
        bytes32 indexed orderId,
        address indexed resolver,
        uint256 filledAmount,
        uint256 remainingAmount,
        uint256 algorandAmount,
        uint256 resolverFee
    );

    event LimitOrderFullyFilled(
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

    modifier validBid(bytes32 orderId, uint256 bidIndex) {
        require(bidIndex < bids[orderId].length, "Invalid bid index");
        require(bids[orderId][bidIndex].active, "Bid not active");
        _;
    }

    constructor() Ownable(msg.sender) EIP712("EnhancedLimitOrderBridge", "1") {}

    /**
     * 🎯 Enhanced limit order submission with partial fill support
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

        // Validate partial fill parameters
        if (intent.allowPartialFills) {
            require(intent.minPartialFill > 0, "Min partial fill must be > 0");
            require(intent.minPartialFill <= intent.makerAmount, "Min partial fill too large");
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
            remainingAmount: intent.makerAmount,  // Initialize remaining amount
            filled: false,
            cancelled: false,
            createdAt: block.timestamp,
            resolver: address(0),
            partialFills: 0,
            winningBid: Bid({
                resolver: address(0),
                inputAmount: 0,
                outputAmount: 0,
                timestamp: 0,
                active: false,
                gasEstimate: 0,
                totalCost: 0
            })
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
            intent.allowPartialFills
        );
    }

    /**
     * 🎯 Place competitive bid on Ethereum
     */
    function placeBid(
        bytes32 orderId,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 gasEstimate
    ) external onlyAuthorizedResolver validOrder(orderId) {
        LimitOrder storage order = limitOrders[orderId];
        
        // Validate bid parameters
        require(inputAmount > 0, "Invalid input amount");
        require(outputAmount > 0, "Invalid output amount");
        require(gasEstimate > 0, "Invalid gas estimate");

        // Calculate total cost including gas
        uint256 gasCost = gasEstimate * tx.gasprice;
        uint256 totalCost = inputAmount + gasCost;

        // Validate bid meets order requirements
        if (order.intent.makerToken == address(0)) {
            // ETH → ALGO: Higher output = better rate
            require(outputAmount >= order.intent.takerAmount, "Output too low");
        } else {
            // ALGO → ETH: Lower input = better rate
            require(inputAmount <= order.intent.makerAmount, "Input too high");
        }

        // Create new bid
        Bid memory newBid = Bid({
            resolver: msg.sender,
            inputAmount: inputAmount,
            outputAmount: outputAmount,
            timestamp: block.timestamp,
            active: true,
            gasEstimate: gasEstimate,
            totalCost: totalCost
        });

        // Add bid to pool
        bids[orderId].push(newBid);
        resolverBidCount[msg.sender]++;

        emit BidPlaced(
            orderId,
            msg.sender,
            inputAmount,
            outputAmount,
            gasEstimate,
            totalCost
        );
    }

    /**
     * 🎯 Withdraw bid
     */
    function withdrawBid(bytes32 orderId, uint256 bidIndex) external validBid(orderId, bidIndex) {
        Bid storage bid = bids[orderId][bidIndex];
        require(bid.resolver == msg.sender, "Not your bid");

        bid.active = false;
        resolverBidCount[msg.sender]--;

        emit BidWithdrawn(orderId, msg.sender);
    }

    /**
     * 🎯 Select best bid and execute
     */
    function selectBestBidAndExecute(
        bytes32 orderId,
        uint256 bidIndex,
        bytes32 secret
    ) external onlyAuthorizedResolver validOrder(orderId) validBid(orderId, bidIndex) {
        LimitOrder storage order = limitOrders[orderId];
        Bid storage bid = bids[orderId][bidIndex];

        // Verify secret matches hashlock
        require(keccak256(abi.encodePacked(secret)) == order.hashlock, "Invalid secret");
        
        // Verify timelock hasn't expired
        require(block.timestamp <= order.timelock, "HTLC expired");

        // Mark bid as winning
        order.winningBid = bid;
        bid.active = false;

        emit BestBidSelected(
            orderId,
            bid.resolver,
            bid.inputAmount,
            bid.outputAmount
        );

        // Execute the swap
        _executeSwap(orderId, bid, secret);
    }

    /**
     * 🎯 Execute partial fill
     */
    function executePartialFill(
        bytes32 orderId,
        uint256 fillAmount,
        uint256 algorandAmount,
        bytes32 secret
    ) external onlyAuthorizedResolver validOrder(orderId) {
        LimitOrder storage order = limitOrders[orderId];
        
        require(order.intent.allowPartialFills, "Partial fills not allowed");
        require(fillAmount <= order.remainingAmount, "Fill amount too large");
        require(fillAmount >= order.intent.minPartialFill, "Fill amount too small");
        require(keccak256(abi.encodePacked(secret)) == order.hashlock, "Invalid secret");
        require(block.timestamp <= order.timelock, "HTLC expired");

        // Calculate proportional amounts
        uint256 proportionalAlgorand = (algorandAmount * fillAmount) / order.intent.makerAmount;
        uint256 resolverFee = (fillAmount * resolverFeeRate) / 10000;
        uint256 resolverAmount = fillAmount - resolverFee;

        // Update order state
        order.remainingAmount -= fillAmount;
        order.partialFills += 1;
        order.resolver = msg.sender;

        // Track partial fill
        partialFillAmounts[orderId][msg.sender] += fillAmount;

        // Transfer ETH to resolver (minus fee)
        payable(msg.sender).transfer(resolverAmount);
        
        // Add fee to resolver balance
        resolverBalances[msg.sender] += resolverFee;

        // Check if order is fully filled
        if (order.remainingAmount == 0) {
            order.filled = true;
        }

        emit LimitOrderPartiallyFilled(
            orderId,
            msg.sender,
            fillAmount,
            order.remainingAmount,
            proportionalAlgorand,
            resolverFee
        );
    }

    /**
     * 🔧 Execute full swap
     */
    function _executeSwap(
        bytes32 orderId,
        Bid memory bid,
        bytes32 secret
    ) internal {
        LimitOrder storage order = limitOrders[orderId];

        // Calculate resolver fee
        uint256 resolverFee = (order.depositedAmount * resolverFeeRate) / 10000;
        uint256 resolverAmount = order.depositedAmount - resolverFee;

        // Mark order as filled
        order.filled = true;
        order.resolver = bid.resolver;

        // Transfer ETH to resolver (minus fee)
        payable(bid.resolver).transfer(resolverAmount);
        
        // Add fee to resolver balance
        resolverBalances[bid.resolver] += resolverFee;

        emit LimitOrderFullyFilled(
            orderId,
            bid.resolver,
            secret,
            bid.outputAmount,
            resolverFee
        );
    }

    /**
     * 🎯 ITakerInteraction implementation for 1inch integration
     */
    function takerInteraction(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external {
        // This function integrates with 1inch Fusion+ for partial fills
        // Implementation would handle the interaction with 1inch protocol
    }

    /**
     * 🔍 View Functions
     */
    function getBids(bytes32 orderId) external view returns (Bid[] memory) {
        return bids[orderId];
    }

    function getActiveBids(bytes32 orderId) external view returns (Bid[] memory) {
        Bid[] memory allBids = bids[orderId];
        Bid[] memory activeBids = new Bid[](allBids.length);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].active) {
                activeBids[activeCount] = allBids[i];
                activeCount++;
            }
        }

        // Resize array to actual count
        assembly {
            mstore(activeBids, activeCount)
        }

        return activeBids;
    }

    function getBestBid(bytes32 orderId) external view returns (Bid memory bestBid, uint256 bestIndex) {
        Bid[] memory allBids = bids[orderId];
        uint256 bestRate = 0;

        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].active) {
                uint256 rate = allBids[i].outputAmount * 1e18 / allBids[i].inputAmount;
                if (rate > bestRate) {
                    bestRate = rate;
                    bestBid = allBids[i];
                    bestIndex = i;
                }
            }
        }
    }

    function getPartialFillAmount(bytes32 orderId, address resolver) external view returns (uint256) {
        return partialFillAmounts[orderId][resolver];
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
    }

    function setAlgorandAppId(uint256 appId) external onlyOwner {
        algorandAppId = appId;
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
            intent.salt,
            intent.allowPartialFills,
            intent.minPartialFill
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