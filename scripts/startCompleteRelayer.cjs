#!/usr/bin/env node

/**
 * 🚀 START COMPLETE CROSS-CHAIN RELAYER
 * 
 * Instantiates and starts the CompleteCrossChainRelayer service
 */

const { CompleteCrossChainRelayer } = require('../working-scripts/relayer/completeCrossChainRelayer.cjs');

async function startCompleteRelayer() {
    console.log('🚀 STARTING COMPLETE CROSS-CHAIN RELAYER');
    console.log('========================================');
    
    try {
        // Create relayer instance
        const relayer = new CompleteCrossChainRelayer();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Start the complete service
        await relayer.startCompleteService();
        
        console.log('\n🎉 COMPLETE CROSS-CHAIN RELAYER STARTED!');
        console.log('=========================================');
        console.log('✅ All monitoring services active');
        console.log('✅ Bidirectional ETH ↔ ALGO support');
        console.log('✅ LOP order monitoring and bidding');
        console.log('✅ Real-time cross-chain synchronization');
        console.log('✅ Gasless user experience');
        console.log('=========================================\n');
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down relayer service...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start complete relayer:', error.message);
        process.exit(1);
    }
}

// Start the relayer
startCompleteRelayer();
