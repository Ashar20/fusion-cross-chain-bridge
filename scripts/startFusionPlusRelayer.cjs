#!/usr/bin/env node

/**
 * 🚀 START FUSION+ DUTCH AUCTION RELAYER
 */

const { FusionPlusDutchAuctionRelayer } = require('./fusionPlusDutchAuctionRelayer.cjs');

async function startFusionPlusRelayer() {
    try {
        console.log('🚀 STARTING FUSION+ DUTCH AUCTION RELAYER');
        console.log('==========================================\n');
        
        const relayer = new FusionPlusDutchAuctionRelayer();
        await relayer.start();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down Fusion+ relayer...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start Fusion+ relayer:', error.message);
        process.exit(1);
    }
}

startFusionPlusRelayer(); 