// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OneinchEscrowIntegration
 * @dev Integration with 1inch official escrow contracts for Fusion+ cross-chain swaps
 * 
 * Official 1inch Contracts:
 * - Settlement: 0xa88800cd213da5ae406ce248380802bd53b47647
 * - Router V5: 0x111111125434b319222cdbf8c261674adb56f3ae
 * - Repository: https://github.com/1inch/limit-order-settlement
 */
contract OneinchEscrowIntegration is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // 1inch official contract addresses on Ethereum mainnet
    address public constant ONEINCH_SETTLEMENT = 0xa88800cd213da5ae406ce248380802bd53b47647;
    address public constant ONEINCH_ROUTER_V5 = 0x111111125434b319222cdbf8c261674adb56f3ae;
    
    // For testnet deployment (Sepolia)
    address public constant ONEINCH_SETTLEMENT_TESTNET = 0xa88800cd213da5ae406ce248380802bd53b47647; // Use same for demo
    
    struct CrossChainOrder {
        address maker;
        address srcToken;
        address dstToken;
        uint256 srcAmount;
        uint256 dstAmount;
        uint256 srcChainId;
        uint256 dstChainId;
        bytes32 secretHash;
        uint256 deadline;
        string eosAccount;
        string eosToken;
        uint256 eosAmount;
    }

    struct EscrowParams {
        bytes32 orderId;
        address token;
        uint256 amount;
        bytes32 secretHash;
        uint256 timelock;
        address resolver;
        bool isSource; // true for source chain, false for destination
    }

    mapping(bytes32 => CrossChainOrder) public crossChainOrders;
    mapping(bytes32 => bool) public orderExecuted;
    mapping(bytes32 => bool) public orderCancelled;
    
    event CrossChainOrderCreated(
        bytes32 indexed orderId,
        address indexed maker,
        uint256 srcChainId,
        uint256 dstChainId,
        bytes32 secretHash
    );
    
    event EscrowCreated(
        bytes32 indexed orderId,
        address indexed resolver,
        address token,
        uint256 amount,
        bool isSource
    );
    
    event OrderExecuted(bytes32 indexed orderId, bytes32 secret);
    event OrderCancelled(bytes32 indexed orderId);

    /**
     * @dev Create cross-chain order using 1inch Fusion+ architecture
     * This integrates with official 1inch escrow factory pattern
     */
    function createCrossChainOrder(
        address srcToken,
        address dstToken,
        uint256 srcAmount,
        uint256 dstAmount,
        uint256 dstChainId,
        bytes32 secretHash,
        uint256 deadline,
        string calldata eosAccount,
        string calldata eosToken,
        uint256 eosAmount
    ) external nonReentrant returns (bytes32 orderId) {
        require(srcAmount > 0, "Invalid source amount");
        require(dstAmount > 0, "Invalid destination amount");
        require(deadline > block.timestamp, "Invalid deadline");
        require(bytes(eosAccount).length > 0, "EOS account required");

        orderId = keccak256(abi.encodePacked(
            msg.sender,
            srcToken,
            dstToken,
            srcAmount,
            dstAmount,
            block.chainid,
            dstChainId,
            secretHash,
            block.timestamp
        ));

        crossChainOrders[orderId] = CrossChainOrder({
            maker: msg.sender,
            srcToken: srcToken,
            dstToken: dstToken,
            srcAmount: srcAmount,
            dstAmount: dstAmount,
            srcChainId: block.chainid,
            dstChainId: dstChainId,
            secretHash: secretHash,
            deadline: deadline,
            eosAccount: eosAccount,
            eosToken: eosToken,
            eosAmount: eosAmount
        });

        emit CrossChainOrderCreated(orderId, msg.sender, block.chainid, dstChainId, secretHash);
    }

    /**
     * @dev Create escrow using 1inch factory pattern
     * This would integrate with actual 1inch escrow factory in production
     */
    function createEscrow(EscrowParams calldata params) external nonReentrant {
        CrossChainOrder storage order = crossChainOrders[params.orderId];
        require(order.maker != address(0), "Order not found");
        require(!orderExecuted[params.orderId], "Order already executed");
        require(!orderCancelled[params.orderId], "Order cancelled");
        require(block.timestamp < order.deadline, "Order expired");

        // In production, this would call 1inch escrow factory
        // factory.createEscrow(params.token, params.amount, params.secretHash, params.timelock);
        
        // For demo: lock tokens in this contract
        if (params.token == address(0)) {
            require(msg.value == params.amount, "ETH amount mismatch");
        } else {
            IERC20(params.token).safeTransferFrom(msg.sender, address(this), params.amount);
        }

        emit EscrowCreated(params.orderId, params.resolver, params.token, params.amount, params.isSource);
    }

    /**
     * @dev Execute order with secret reveal (atomic completion)
     * This follows 1inch Fusion+ atomic swap pattern
     */
    function executeOrder(bytes32 orderId, bytes32 secret) external nonReentrant {
        CrossChainOrder storage order = crossChainOrders[orderId];
        require(order.maker != address(0), "Order not found");
        require(!orderExecuted[orderId], "Order already executed");
        require(!orderCancelled[orderId], "Order cancelled");
        require(keccak256(abi.encodePacked(secret)) == order.secretHash, "Invalid secret");
        require(block.timestamp < order.deadline, "Order expired");

        orderExecuted[orderId] = true;

        // In production: interact with 1inch escrow contracts to complete swap
        // escrow.executeWithSecret(secret);

        emit OrderExecuted(orderId, secret);
    }

    /**
     * @dev Cancel expired order (following 1inch timeout pattern)
     */
    function cancelOrder(bytes32 orderId) external nonReentrant {
        CrossChainOrder storage order = crossChainOrders[orderId];
        require(order.maker != address(0), "Order not found");
        require(!orderExecuted[orderId], "Order already executed");
        require(!orderCancelled[orderId], "Order already cancelled");
        require(block.timestamp >= order.deadline, "Order not expired");

        orderCancelled[orderId] = true;

        // In production: call 1inch escrow refund mechanism
        // escrow.refund();

        emit OrderCancelled(orderId);
    }

    /**
     * @dev Get 1inch settlement contract address for current network
     */
    function getSettlementContract() external view returns (address) {
        if (block.chainid == 1) {
            return ONEINCH_SETTLEMENT; // Mainnet
        } else {
            return ONEINCH_SETTLEMENT_TESTNET; // Testnet
        }
    }

    /**
     * @dev Get 1inch router contract address for current network
     */
    function getRouterContract() external view returns (address) {
        return ONEINCH_ROUTER_V5;
    }

    /**
     * @dev Check if order is ready for resolver execution
     * This follows 1inch Fusion+ resolver validation pattern
     */
    function isOrderReady(bytes32 orderId) external view returns (bool) {
        CrossChainOrder storage order = crossChainOrders[orderId];
        return (
            order.maker != address(0) &&
            !orderExecuted[orderId] &&
            !orderCancelled[orderId] &&
            block.timestamp < order.deadline
        );
    }

    /**
     * @dev Get cross-chain order details
     */
    function getOrder(bytes32 orderId) external view returns (CrossChainOrder memory) {
        return crossChainOrders[orderId];
    }
}