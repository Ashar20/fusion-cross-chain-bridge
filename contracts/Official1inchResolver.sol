// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Official1inchEscrowFactory.sol";

/**
 * 🎯 OFFICIAL 1INCH CUSTOM RESOLVER
 * 
 * This resolver implements the official hackathon requirements:
 * 1. Commits to the swap
 * 2. Funds the destination escrow  
 * 3. Claims the origin escrow once secret is revealed
 */
contract Official1inchResolver {
    
    Official1inchEscrowFactory public immutable escrowFactory;
    
    // Swap state tracking
    struct SwapCommitment {
        address initiator;
        address beneficiary;
        uint256 amount;
        bytes32 orderHash;
        bytes32 hashlock;
        uint256 deadline;
        bool committed;
        bool funded;
        bool claimed;
        address escrowAddress;
    }
    
    mapping(bytes32 => SwapCommitment) public swapCommitments;
    
    // Events for hackathon requirements
    event SwapCommitted(bytes32 indexed swapId, address indexed initiator, bytes32 orderHash);
    event DestinationEscrowFunded(bytes32 indexed swapId, address indexed escrowAddress, uint256 amount);
    event OriginEscrowClaimed(bytes32 indexed swapId, bytes32 secret);
    
    constructor(address _escrowFactory) {
        escrowFactory = Official1inchEscrowFactory(_escrowFactory);
    }
    
    /**
     * 🎯 REQUIREMENT 1: Commit to the swap
     * Resolver commits to executing a cross-chain atomic swap
     */
    function commitToSwap(
        bytes32 swapId,
        address beneficiary,
        bytes32 orderHash,
        bytes32 hashlock,
        uint256 deadline
    ) external payable {
        require(msg.value > 0, "Must commit funds");
        require(!swapCommitments[swapId].committed, "Swap already committed");
        require(deadline > block.timestamp, "Invalid deadline");
        
        // Store swap commitment
        swapCommitments[swapId] = SwapCommitment({
            initiator: msg.sender,
            beneficiary: beneficiary,
            amount: msg.value,
            orderHash: orderHash,
            hashlock: hashlock,
            deadline: deadline,
            committed: true,
            funded: false,
            claimed: false,
            escrowAddress: address(0)
        });
        
        emit SwapCommitted(swapId, msg.sender, orderHash);
    }
    
    /**
     * 🎯 REQUIREMENT 2: Fund the destination escrow
     * Resolver deploys and funds the 1inch escrow contract
     */
    function fundDestinationEscrow(bytes32 swapId) external {
        SwapCommitment storage swap = swapCommitments[swapId];
        require(swap.committed, "Swap not committed");
        require(!swap.funded, "Already funded");
        require(block.timestamp < swap.deadline, "Swap expired");
        require(msg.sender == swap.initiator, "Only initiator can fund");
        
        // Deploy and fund 1inch escrow using the factory
        address escrowAddress = escrowFactory.createEscrow{value: swap.amount}(
            address(0), // ETH
            swap.amount,
            swap.orderHash,
            swap.deadline,
            "" // empty resolver data
        );
        
        // Update swap state
        swap.funded = true;
        swap.escrowAddress = escrowAddress;
        
        emit DestinationEscrowFunded(swapId, escrowAddress, swap.amount);
    }
    
    /**
     * 🎯 REQUIREMENT 3: Claim origin escrow once secret is revealed
     * This function is called after the secret is revealed on the destination chain
     */
    function claimOriginEscrow(
        bytes32 swapId, 
        bytes32 secret
    ) external {
        SwapCommitment storage swap = swapCommitments[swapId];
        require(swap.committed, "Swap not committed");
        require(swap.funded, "Escrow not funded");
        require(!swap.claimed, "Already claimed");
        
        // Verify secret matches hashlock
        require(keccak256(abi.encodePacked(secret)) == swap.hashlock, "Invalid secret");
        
        // Resolve the 1inch escrow with the secret
        Official1inchEscrow escrow = Official1inchEscrow(payable(swap.escrowAddress));
        escrow.resolve(secret);
        
        // Mark as claimed
        swap.claimed = true;
        
        emit OriginEscrowClaimed(swapId, secret);
    }
    
    /**
     * 📊 Get swap commitment details
     */
    function getSwapCommitment(bytes32 swapId) external view returns (SwapCommitment memory) {
        return swapCommitments[swapId];
    }
    
    /**
     * 🔄 Refund if swap fails
     */
    function refundExpiredSwap(bytes32 swapId) external {
        SwapCommitment storage swap = swapCommitments[swapId];
        require(swap.committed, "Swap not committed");
        require(block.timestamp >= swap.deadline, "Swap not expired");
        require(!swap.claimed, "Already claimed");
        require(msg.sender == swap.initiator, "Only initiator can refund");
        
        if (swap.funded) {
            // Refund from escrow
            Official1inchEscrow escrow = Official1inchEscrow(payable(swap.escrowAddress));
            escrow.refund();
        } else {
            // Direct refund
            (bool success, ) = swap.initiator.call{value: swap.amount}("");
            require(success, "Refund failed");
        }
    }
    
    /**
     * 🎯 Complete atomic swap (combines all 3 requirements)
     * This function demonstrates the full hackathon requirement in one call
     */
    function executeAtomicSwap(
        bytes32 swapId,
        address beneficiary,
        bytes32 orderHash,
        bytes32 hashlock,
        uint256 deadline
    ) external payable returns (address escrowAddress) {
        
        // 1. Commit to the swap
        require(msg.value > 0, "Must commit funds");
        require(!swapCommitments[swapId].committed, "Swap already committed");
        
        swapCommitments[swapId] = SwapCommitment({
            initiator: msg.sender,
            beneficiary: beneficiary,
            amount: msg.value,
            orderHash: orderHash,
            hashlock: hashlock,
            deadline: deadline,
            committed: true,
            funded: false,
            claimed: false,
            escrowAddress: address(0)
        });
        
        emit SwapCommitted(swapId, msg.sender, orderHash);
        
        // 2. Fund the destination escrow
        escrowAddress = escrowFactory.createEscrow{value: msg.value}(
            address(0), // ETH
            msg.value,
            orderHash,
            deadline,
            "" // empty resolver data
        );
        
        swapCommitments[swapId].funded = true;
        swapCommitments[swapId].escrowAddress = escrowAddress;
        
        emit DestinationEscrowFunded(swapId, escrowAddress, msg.value);
        
        // 3. Claim will be done separately when secret is revealed
        
        return escrowAddress;
    }
}