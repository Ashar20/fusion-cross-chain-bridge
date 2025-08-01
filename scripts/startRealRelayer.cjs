#!/usr/bin/env node

/**
 * 🚀 START REAL RELAYER SERVICE
 * ✅ Launches production relayer for gasless swaps
 * ✅ Uses funded dedicated addresses
 * ✅ Monitors both Ethereum and Algorand
 */

console.log('🚀 STARTING REAL RELAYER SERVICE');
console.log('================================');
console.log('✅ Using funded dedicated addresses');
console.log('✅ Production-ready gasless execution');
console.log('✅ Monitoring both chains simultaneously');
console.log('================================\n');

// Import the enhanced relayer service
const EnhancedRelayerService = require('./enhancedRelayerService.cjs');

async function startRealRelayer() {
    try {
        console.log('🔧 Initializing Enhanced Relayer Service...');
        
        // Create and start the relayer
        const relayer = new EnhancedRelayerService();
        
        console.log('🌉 Starting complete cross-chain monitoring...');
        await relayer.startCompleteService();
        
        console.log('✅ RELAYER IS NOW LIVE AND PROCESSING GASLESS SWAPS!');
        console.log('📡 Monitoring both Ethereum (Sepolia) and Algorand (Testnet)');
        console.log('💰 Using funded dedicated relayer addresses');
        console.log('🤖 Fully automated - users pay ZERO gas fees!');
        
        // Keep the service running
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down relayer service...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error starting relayer:', error.message);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Ensure relayer addresses are funded');
        console.log('2. Check .env configuration');
        console.log('3. Verify contract deployments');
        process.exit(1);
    }
}

// Start the relayer
startRealRelayer(); 