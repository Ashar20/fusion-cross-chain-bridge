// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Gasless1inchResolver.sol";

/**
 * 🚀 SIMPLIFIED RELAYER SYSTEM FOR AUTOMATIC ESCROW CREATION
 * 
 * Focuses on automatic escrow creation without duplicating gas handling:
 * 1. Monitors pending intents
 * 2. Automatically executes intents (resolver handles gas)
 * 3. Creates escrows automatically
 * 4. Handles batch processing for efficiency
 * 
 * Gas costs are handled by the resolver, not the relayer
 */
contract RelayerSystem {
    Gasless1inchResolver public immutable resolver;
    
    // Relayer configuration
    address public immutable relayerOwner;
    uint256 public batchSize = 10;
    uint256 public executionDelay = 0; // Can add delay if needed
    
    // Relayer state
    mapping(bytes32 => bool) public executedIntents;
    mapping(address => uint256) public relayerNonces;
    uint256 public totalExecutedIntents;
    
    // Events
    event IntentExecuted(bytes32 indexed swapId, address indexed relayer);
    event BatchExecuted(bytes32[] swapIds, address indexed relayer);
    event ConfigUpdated(uint256 batchSize, uint256 executionDelay);
    
    constructor(address payable _resolver, address _relayerOwner) {
        resolver = Gasless1inchResolver(_resolver);
        relayerOwner = _relayerOwner;
    }
    
    /**
     * 🚀 Execute single intent (automatic escrow creation)
     * Resolver handles gas costs, relayer just triggers execution
     */
    function executeIntent(bytes32 swapId) external {
        require(!executedIntents[swapId], "Already executed");
        
        // Get intent details from resolver
        Gasless1inchResolver.Intent memory intent = resolver.getIntent(swapId);
        require(intent.user != address(0), "Intent not found");
        require(!intent.executed, "Intent already executed");
        require(block.timestamp < intent.deadline, "Intent expired");
        
        // Execute intent through resolver (resolver pays gas)
        resolver.executeIntent{value: intent.amount}(swapId);
        
        // Mark as executed
        executedIntents[swapId] = true;
        totalExecutedIntents++;
        
        emit IntentExecuted(swapId, msg.sender);
    }
    
    /**
     * 🚀 Execute batch of intents (efficient batch processing)
     */
    function executeBatch(bytes32[] calldata swapIds) external {
        require(swapIds.length <= batchSize, "Batch too large");
        
        uint256 successfulExecutions = 0;
        
        for (uint256 i = 0; i < swapIds.length; i++) {
            bytes32 swapId = swapIds[i];
            
            if (executedIntents[swapId]) {
                continue; // Skip already executed
            }
            
            try this.executeIntentInternal(swapId) {
                successfulExecutions++;
            } catch {
                // Continue with next intent if one fails
                continue;
            }
        }
        
        emit BatchExecuted(swapIds, msg.sender);
    }
    
    /**
     * 🔄 Internal intent execution (for batch processing)
     */
    function executeIntentInternal(bytes32 swapId) external {
        require(msg.sender == address(this), "Internal only");
        
        Gasless1inchResolver.Intent memory intent = resolver.getIntent(swapId);
        require(intent.user != address(0), "Intent not found");
        require(!intent.executed, "Intent already executed");
        require(block.timestamp < intent.deadline, "Intent expired");
        
        // Execute intent through resolver (resolver pays gas)
        resolver.executeIntent{value: intent.amount}(swapId);
        
        executedIntents[swapId] = true;
        totalExecutedIntents++;
    }
    
    /**
     * 🔧 Update relayer configuration (owner only)
     */
    function updateConfig(uint256 _batchSize, uint256 _executionDelay) external {
        require(msg.sender == relayerOwner, "Only owner");
        batchSize = _batchSize;
        executionDelay = _executionDelay;
        emit ConfigUpdated(_batchSize, _executionDelay);
    }
    
    /**
     * 📊 Get pending intents for relayer
     */
    function getPendingIntents(uint256 limit) external view returns (bytes32[] memory) {
        // This would need to be implemented with event indexing
        // For now, return empty array
        return new bytes32[](0);
    }
    
    /**
     * 📊 Get relayer statistics
     */
    function getRelayerStats() external view returns (
        uint256 _totalExecutedIntents,
        uint256 _batchSize,
        uint256 _executionDelay
    ) {
        return (
            totalExecutedIntents,
            batchSize,
            executionDelay
        );
    }
    
    /**
     * 💰 Receive ETH for intent execution (forwarded to resolver)
     */
    receive() external payable {
        // ETH received here will be used for intent execution
        // The relayer doesn't keep ETH, it forwards it to the resolver
    }
} 