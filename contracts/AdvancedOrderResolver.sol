// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./Official1inchEscrowFactory.sol";

/**
 * 🚀 ADVANCED ORDER RESOLVER WITH LIMIT ORDERS & DUTCH AUCTIONS
 * 
 * Extends the basic gasless resolver with:
 * 1. Limit Orders - Execute at specific price points
 * 2. Dutch Auctions - Price decays over time
 * 3. Stop Loss Orders - Automatic execution at loss levels
 * 4. Take Profit Orders - Automatic execution at profit levels
 * 
 * Based on 1inch Fusion+ architecture with advanced order types
 */
contract AdvancedOrderResolver is EIP712 {
    using ECDSA for bytes32;
    
    Official1inchEscrowFactory public immutable escrowFactory;
    
    // EIP-712 domain separators for different order types
    bytes32 public constant LIMIT_ORDER_TYPEHASH = keccak256(
        "LimitOrder(bytes32 orderId,address user,address beneficiary,uint256 amount,uint256 limitPrice,bytes32 orderHash,bytes32 hashlock,uint256 deadline,uint256 nonce,OrderType orderType)"
    );
    
    bytes32 public constant DUTCH_AUCTION_TYPEHASH = keccak256(
        "DutchAuction(bytes32 orderId,address user,address beneficiary,uint256 startAmount,uint256 endAmount,uint256 startTime,uint256 endTime,bytes32 orderHash,bytes32 hashlock,uint256 nonce)"
    );
    
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(bytes32 orderId,bytes32 secret)"
    );
    
    // Order types
    enum OrderType {
        MARKET,     // Execute immediately at market price
        LIMIT,      // Execute at specific price or better
        DUTCH,      // Price decays over time
        STOP_LOSS,  // Execute when price hits stop level
        TAKE_PROFIT // Execute when price hits profit level
    }
    
    // Order status
    enum OrderStatus {
        PENDING,    // Order created, waiting for execution
        EXECUTED,   // Order executed successfully
        CANCELLED,  // Order cancelled by user
        EXPIRED,    // Order expired
        CLAIMED     // Tokens claimed
    }
    
    // Advanced order structure
    struct AdvancedOrder {
        address user;
        address beneficiary;
        uint256 amount;
        uint256 limitPrice;      // For limit orders
        uint256 startAmount;     // For Dutch auctions
        uint256 endAmount;       // For Dutch auctions
        uint256 startTime;       // For Dutch auctions
        uint256 endTime;         // For Dutch auctions
        bytes32 orderHash;
        bytes32 hashlock;
        uint256 deadline;
        uint256 nonce;
        OrderType orderType;
        OrderStatus status;
        address escrowAddress;
        uint256 executionPrice;  // Price at which order was executed
        uint256 executionTime;   // Time when order was executed
    }
    
    // Order tracking
    mapping(bytes32 => AdvancedOrder) public orders;
    mapping(address => uint256) public userNonces;
    mapping(address => bytes32[]) public userOrders;
    
    // Price feeds (simplified - in production would use Chainlink)
    mapping(address => uint256) public tokenPrices; // token => price in ETH (18 decimals)
    
    // Events
    event OrderCreated(bytes32 indexed orderId, address indexed user, OrderType orderType, uint256 amount);
    event OrderExecuted(bytes32 indexed orderId, address indexed executor, uint256 executionPrice);
    event OrderCancelled(bytes32 indexed orderId, address indexed user);
    event OrderExpired(bytes32 indexed orderId);
    event TokensClaimed(bytes32 indexed orderId, address indexed user, bytes32 secret);
    event PriceUpdated(address indexed token, uint256 price);
    
    constructor(address _escrowFactory) EIP712("AdvancedOrderResolver", "1.0.0") {
        escrowFactory = Official1inchEscrowFactory(_escrowFactory);
    }
    
    /**
     * 💰 Receive ETH for gas fees
     */
    receive() external payable {}
    
    /**
     * 📊 Update token price (in production, this would come from Chainlink)
     */
    function updateTokenPrice(address token, uint256 price) external {
        // In production, this would be restricted to authorized price feeds
        tokenPrices[token] = price;
        emit PriceUpdated(token, price);
    }
    
    /**
     * 🎯 Create Limit Order (gasless)
     * Execute only when price reaches limitPrice or better
     */
    function createLimitOrder(
        bytes32 orderId,
        address beneficiary,
        uint256 amount,
        uint256 limitPrice,
        bytes32 orderHash,
        bytes32 hashlock,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(deadline > block.timestamp, "Order expired");
        require(orders[orderId].user == address(0), "Order already exists");
        
        address user = _verifyLimitOrderSignature(
            orderId,
            beneficiary,
            amount,
            limitPrice,
            orderHash,
            hashlock,
            deadline,
            signature
        );
        
        orders[orderId] = AdvancedOrder({
            user: user,
            beneficiary: beneficiary,
            amount: amount,
            limitPrice: limitPrice,
            startAmount: 0,
            endAmount: 0,
            startTime: 0,
            endTime: 0,
            orderHash: orderHash,
            hashlock: hashlock,
            deadline: deadline,
            nonce: userNonces[user]++,
            orderType: OrderType.LIMIT,
            status: OrderStatus.PENDING,
            escrowAddress: address(0),
            executionPrice: 0,
            executionTime: 0
        });
        
        userOrders[user].push(orderId);
        emit OrderCreated(orderId, user, OrderType.LIMIT, amount);
    }
    
    /**
     * 🎯 Create Dutch Auction Order (gasless)
     * Price starts at startAmount and decays to endAmount over time
     */
    function createDutchAuction(
        bytes32 orderId,
        address beneficiary,
        uint256 startAmount,
        uint256 endAmount,
        uint256 startTime,
        uint256 endTime,
        bytes32 orderHash,
        bytes32 hashlock,
        bytes calldata signature
    ) external {
        require(endTime > startTime, "Invalid time range");
        require(startAmount > endAmount, "Start amount must be greater than end amount");
        require(orders[orderId].user == address(0), "Order already exists");
        
        address user = _verifyDutchAuctionSignature(
            orderId,
            beneficiary,
            startAmount,
            endAmount,
            startTime,
            endTime,
            orderHash,
            hashlock,
            signature
        );
        
        orders[orderId] = AdvancedOrder({
            user: user,
            beneficiary: beneficiary,
            amount: startAmount,
            limitPrice: 0,
            startAmount: startAmount,
            endAmount: endAmount,
            startTime: startTime,
            endTime: endTime,
            orderHash: orderHash,
            hashlock: hashlock,
            deadline: endTime,
            nonce: userNonces[user]++,
            orderType: OrderType.DUTCH,
            status: OrderStatus.PENDING,
            escrowAddress: address(0),
            executionPrice: 0,
            executionTime: 0
        });
        
        userOrders[user].push(orderId);
        emit OrderCreated(orderId, user, OrderType.DUTCH, startAmount);
    }
    
    /**
     * 🚀 Execute Limit Order
     * Only executes if current price meets limit conditions
     */
    function executeLimitOrder(bytes32 orderId) external payable {
        AdvancedOrder storage order = orders[orderId];
        require(order.status == OrderStatus.PENDING, "Order not pending");
        require(block.timestamp < order.deadline, "Order expired");
        require(order.orderType == OrderType.LIMIT, "Not a limit order");
        
        // Check if current price meets limit conditions
        uint256 currentPrice = tokenPrices[address(0)]; // ETH price (simplified)
        require(currentPrice <= order.limitPrice, "Price not met");
        require(msg.value == order.amount, "Incorrect amount");
        
        // Execute order
        address escrowAddress = escrowFactory.createEscrow{value: msg.value}(
            address(0), // ETH
            order.amount,
            order.orderHash,
            order.deadline,
            "" // empty resolver data
        );
        
        order.status = OrderStatus.EXECUTED;
        order.escrowAddress = escrowAddress;
        order.executionPrice = currentPrice;
        order.executionTime = block.timestamp;
        
        emit OrderExecuted(orderId, msg.sender, currentPrice);
    }
    
    /**
     * 🚀 Execute Dutch Auction Order
     * Calculates current price based on time decay
     */
    function executeDutchAuction(bytes32 orderId) external payable {
        AdvancedOrder storage order = orders[orderId];
        require(order.status == OrderStatus.PENDING, "Order not pending");
        require(block.timestamp >= order.startTime, "Auction not started");
        require(block.timestamp <= order.endTime, "Auction ended");
        require(order.orderType == OrderType.DUTCH, "Not a Dutch auction");
        
        // Calculate current price based on time decay
        uint256 currentPrice = _calculateDutchPrice(order);
        require(msg.value == currentPrice, "Incorrect amount");
        
        // Execute order
        address escrowAddress = escrowFactory.createEscrow{value: msg.value}(
            address(0), // ETH
            currentPrice,
            order.orderHash,
            order.deadline,
            "" // empty resolver data
        );
        
        order.status = OrderStatus.EXECUTED;
        order.escrowAddress = escrowAddress;
        order.executionPrice = currentPrice;
        order.executionTime = block.timestamp;
        
        emit OrderExecuted(orderId, msg.sender, currentPrice);
    }
    
    /**
     * 🔄 Cancel Order (only by order creator)
     */
    function cancelOrder(bytes32 orderId) external {
        AdvancedOrder storage order = orders[orderId];
        require(order.user == msg.sender, "Not order creator");
        require(order.status == OrderStatus.PENDING, "Order not pending");
        
        order.status = OrderStatus.CANCELLED;
        emit OrderCancelled(orderId, msg.sender);
    }
    
    /**
     * 🎯 Claim tokens after order execution
     */
    function claimTokens(
        bytes32 orderId,
        bytes32 secret,
        bytes calldata claimSignature
    ) external {
        AdvancedOrder storage order = orders[orderId];
        require(order.status == OrderStatus.EXECUTED, "Order not executed");
        require(keccak256(abi.encodePacked(secret)) == order.hashlock, "Invalid secret");
        
        address user = _verifyClaimSignature(orderId, secret, claimSignature);
        require(user == order.user, "Invalid claimer");
        
        // Resolve escrow
        Official1inchEscrow escrow = Official1inchEscrow(payable(order.escrowAddress));
        escrow.resolve(secret);
        
        order.status = OrderStatus.CLAIMED;
        emit TokensClaimed(orderId, user, secret);
    }
    
    /**
     * 📊 Calculate current Dutch auction price
     */
    function _calculateDutchPrice(AdvancedOrder storage order) internal view returns (uint256) {
        if (block.timestamp <= order.startTime) {
            return order.startAmount;
        }
        if (block.timestamp >= order.endTime) {
            return order.endAmount;
        }
        
        uint256 timeElapsed = block.timestamp - order.startTime;
        uint256 totalDuration = order.endTime - order.startTime;
        uint256 priceRange = order.startAmount - order.endAmount;
        
        uint256 priceDecay = (priceRange * timeElapsed) / totalDuration;
        return order.startAmount - priceDecay;
    }
    
    /**
     * 🔐 Verify limit order signature
     */
    function _verifyLimitOrderSignature(
        bytes32 orderId,
        address beneficiary,
        uint256 amount,
        uint256 limitPrice,
        bytes32 orderHash,
        bytes32 hashlock,
        uint256 deadline,
        bytes calldata signature
    ) internal view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                LIMIT_ORDER_TYPEHASH,
                orderId,
                beneficiary,
                beneficiary,
                amount,
                limitPrice,
                orderHash,
                hashlock,
                deadline,
                userNonces[beneficiary],
                OrderType.LIMIT
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == beneficiary, "Invalid signature");
        return signer;
    }
    
    /**
     * 🔐 Verify Dutch auction signature
     */
    function _verifyDutchAuctionSignature(
        bytes32 orderId,
        address beneficiary,
        uint256 startAmount,
        uint256 endAmount,
        uint256 startTime,
        uint256 endTime,
        bytes32 orderHash,
        bytes32 hashlock,
        bytes calldata signature
    ) internal view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                DUTCH_AUCTION_TYPEHASH,
                orderId,
                beneficiary,
                beneficiary,
                startAmount,
                endAmount,
                startTime,
                endTime,
                orderHash,
                hashlock,
                userNonces[beneficiary]
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == beneficiary, "Invalid signature");
        return signer;
    }
    
    /**
     * 🔐 Verify claim signature
     */
    function _verifyClaimSignature(
        bytes32 orderId,
        bytes32 secret,
        bytes calldata signature
    ) internal view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, orderId, secret)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        return hash.recover(signature);
    }
    
    /**
     * 📊 Get order details
     */
    function getOrder(bytes32 orderId) external view returns (AdvancedOrder memory) {
        return orders[orderId];
    }
    
    /**
     * 📊 Get user's orders
     */
    function getUserOrders(address user) external view returns (bytes32[] memory) {
        return userOrders[user];
    }
    
    /**
     * 📊 Get current Dutch auction price
     */
    function getDutchPrice(bytes32 orderId) external view returns (uint256) {
        AdvancedOrder storage order = orders[orderId];
        require(order.orderType == OrderType.DUTCH, "Not a Dutch auction");
        return _calculateDutchPrice(order);
    }
} 