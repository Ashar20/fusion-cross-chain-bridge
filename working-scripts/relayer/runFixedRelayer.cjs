#!/usr/bin/env node

/**
 * 🚀 RUNNER FOR FIXED COMPLETE CROSS-CHAIN RELAYER
 * 
 * This script starts the complete cross-chain relayer with proper LOP integration
 */

const { CompleteCrossChainRelayer } = require('./completeCrossChainRelayer copy.cjs');

async function main() {
    console.log('🚀 STARTING FIXED COMPLETE CROSS-CHAIN RELAYER');
    console.log('=============================================');
    
    try {
        // Create relayer instance
        const relayer = new CompleteCrossChainRelayer();
        
        // Start the complete service
        await relayer.startCompleteService();
        
        console.log('✅ Fixed relayer started successfully!');
        console.log('🛰️ Monitoring for:');
        console.log('   - Algorand HTLC creation');
        console.log('   - Ethereum swap commitment');
        console.log('   - Secret reveals');
        console.log('   - Algorand claims');
        console.log('   - LOP order execution');
        console.log('   - Automatic refunds');
        
    } catch (error) {
        console.error('❌ Failed to start fixed relayer:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down fixed relayer...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down fixed relayer...');
    process.exit(0);
});

// Start the relayer
main(); 