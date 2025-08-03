#!/usr/bin/env node

/**
 * 🚀 START REAL PRODUCTION RELAYER
 */

const { RealProductionRelayer } = require('./realProductionRelayer.cjs');

async function startRealRelayer() {
    try {
        console.log('🚀 STARTING REAL PRODUCTION RELAYER');
        console.log('=====================================\n');
        
        const relayer = new RealProductionRelayer();
        await relayer.start();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down real relayer...');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start real relayer:', error.message);
        process.exit(1);
    }
}

startRealRelayer(); 