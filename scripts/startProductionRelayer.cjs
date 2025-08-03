#!/usr/bin/env node

/**
 * 🚀 START PRODUCTION RELAYER
 * 
 * Starts the production-ready relayer service with:
 * ✅ Complete end-to-end automation
 * ✅ 1inch escrow factory integration
 * ✅ Deterministic escrow creation
 * ✅ Unified orderHash coordination
 * ✅ Automatic timelock refunds
 * ✅ Complete cross-chain claims
 */

const { ProductionRelayerService } = require('./productionRelayerService.cjs');

async function startProductionRelayer() {
    console.log('🚀 STARTING PRODUCTION RELAYER SERVICE');
    console.log('======================================\n');
    
    try {
        // Initialize and start the production relayer
        const relayer = new ProductionRelayerService();
        await relayer.start();
        
        console.log('\n✅ PRODUCTION RELAYER SERVICE STARTED SUCCESSFULLY!');
        console.log('==================================================');
        console.log('🔧 Features Active:');
        console.log('   ✅ 1inch Escrow Factory integration');
        console.log('   ✅ Deterministic escrow creation');
        console.log('   ✅ Unified orderHash coordination');
        console.log('   ✅ Automatic timelock refunds');
        console.log('   ✅ Complete cross-chain claims');
        console.log('   ✅ Event monitoring');
        console.log('   ✅ State persistence');
        console.log('   ✅ Error handling');
        console.log('   ✅ Status reporting');
        
        console.log('\n📡 Monitoring for new orders...');
        console.log('🔄 Processing automation...');
        console.log('🌉 Cross-chain coordination active...');
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down production relayer...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start production relayer:', error.message);
        process.exit(1);
    }
}

startProductionRelayer(); 