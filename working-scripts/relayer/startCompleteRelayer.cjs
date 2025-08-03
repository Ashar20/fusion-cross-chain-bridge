#!/usr/bin/env node

/**
 * 🚀 START COMPLETE CROSS-CHAIN RELAYER
 * 
 * Launch the complete relayer service that handles:
 * ✅ Bidirectional ETH ↔ ALGO atomic swaps
 * ✅ 1inch Fusion+ integration
 * ✅ Real-time cross-chain monitoring
 * ✅ Gasless user experience
 */

const { CompleteCrossChainRelayer } = require('./completeCrossChainRelayer.cjs');

async function main() {
    console.log('🚀 STARTING COMPLETE CROSS-CHAIN RELAYER SERVICE');
    console.log('===============================================');
            console.log('✅ Bidirectional ETH ↔ ALGO Atomic Swaps');
        console.log('✅ 1inch Fusion+ Integration');
        console.log('✅ Limit Order Protocol (LOP)');
        console.log('✅ Competitive Bidding System');
        console.log('✅ Real-time Cross-Chain Monitoring');
        console.log('✅ Cryptographic Secret Validation');
        console.log('✅ Gasless User Experience');
        console.log('✅ Complete Automation');
    console.log('===============================================\n');
    
    try {
        // Create and start the complete relayer
        const relayer = new CompleteCrossChainRelayer();
        await relayer.startCompleteService();
        
        // Start LOP monitoring
        await relayer.startLOPMonitoring();
        
        console.log('🎉 COMPLETE RELAYER SERVICE IS LIVE!');
        console.log('====================================');
        console.log('✅ All monitoring services active');
        console.log('✅ Ready to process cross-chain swaps');
        console.log('✅ Users pay ZERO gas fees');
        console.log('✅ Trustless atomic execution');
        console.log('====================================\n');
        
        // Keep the service running
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down complete relayer service...');
            relayer.saveDBToFile();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Terminating complete relayer service...');
            relayer.saveDBToFile();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error starting complete relayer:', error.message);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Check environment variables (.env)');
        console.log('2. Ensure relayer addresses are funded');
        console.log('3. Verify contract deployments');
        console.log('4. Check network connectivity');
        process.exit(1);
    }
}

// Run the complete relayer
main(); 