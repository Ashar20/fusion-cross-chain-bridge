#!/usr/bin/env node

/**
 * 🚀 RUNNER FOR COMPLETE CROSS-CHAIN RELAYER
 * 
 * This script instantiates and starts the CompleteCrossChainRelayer service
 */

const { CompleteCrossChainRelayer } = require('./completeCrossChainRelayer.cjs');

async function main() {
    console.log('🚀 STARTING COMPLETE CROSS-CHAIN RELAYER SERVICE');
    console.log('==============================================');
    
    try {
        // Create relayer instance
        const relayer = new CompleteCrossChainRelayer();
        
        // Wait for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Start the complete service
        await relayer.startCompleteService();
        
        console.log('✅ Complete Cross-Chain Relayer Service is now running!');
        console.log('🛰️ Monitoring both Algorand and Ethereum chains...');
        console.log('🎯 Ready to process cross-chain atomic swaps...');
        console.log('💰 Ready to place competitive bids on LOP orders...');
        console.log('🔐 Ready to handle secret reveals and claims...');
        console.log('==============================================\n');
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down relayer service...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start relayer service:', error.message);
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error); 