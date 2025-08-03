#!/usr/bin/env node

/**
 * 🚀 START FUSION+ COMPLETE RELAYER
 */

const { FusionPlusCompleteRelayer } = require('./fusionPlusCompleteRelayer.cjs');

async function startFusionPlusCompleteRelayer() {
    try {
        console.log('🚀 STARTING FUSION+ COMPLETE RELAYER');
        console.log('=====================================\n');
        
        const relayer = new FusionPlusCompleteRelayer();
        await relayer.start();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down Fusion+ complete relayer...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start Fusion+ complete relayer:', error.message);
        process.exit(1);
    }
}

startFusionPlusCompleteRelayer(); 