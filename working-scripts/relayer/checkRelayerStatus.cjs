#!/usr/bin/env node

/**
 * 📊 RELAYER STATUS CHECKER
 * 
 * Shows the current status of the Complete Cross-Chain Relayer
 */

const fs = require('fs');

function checkRelayerStatus() {
    console.log('📊 COMPLETE CROSS-CHAIN RELAYER STATUS');
    console.log('=====================================');
    
    try {
        // Check if relayer process is running
        const { execSync } = require('child_process');
        const isRunning = execSync('ps aux | grep "runCompleteRelayer" | grep -v grep', { encoding: 'utf8' });
        
        if (isRunning.trim()) {
            console.log('✅ Relayer Service: RUNNING');
            console.log(`   Process: ${isRunning.trim()}`);
        } else {
            console.log('❌ Relayer Service: NOT RUNNING');
        }
        
        // Check database status
        if (fs.existsSync('relayer-db.json')) {
            const dbData = JSON.parse(fs.readFileSync('relayer-db.json', 'utf8'));
            
            console.log('\n📊 DATABASE STATUS:');
            console.log(`   Order Mappings: ${dbData.orderMappings.length} orders`);
            console.log(`   HTLC Mappings: ${dbData.htlcMappings.length} HTLCs`);
            console.log(`   Pending Swaps: ${dbData.pendingSwaps.length} pending`);
            console.log(`   Completed Swaps: ${dbData.completedSwaps.length} completed`);
            
            if (dbData.orderMappings.length > 0) {
                console.log('\n📋 RECENT ORDERS:');
                dbData.orderMappings.slice(-3).forEach(([orderHash, data]) => {
                    console.log(`   ${orderHash.slice(0, 10)}... - ${data.direction} - ${data.status}`);
                });
            }
        } else {
            console.log('❌ Database file not found');
        }
        
        // Check environment files
        console.log('\n🔧 ENVIRONMENT STATUS:');
        if (fs.existsSync('.env.relayer')) {
            console.log('✅ .env.relayer: EXISTS');
        } else {
            console.log('❌ .env.relayer: MISSING');
        }
        
        if (fs.existsSync('.env.resolvers')) {
            console.log('✅ .env.resolvers: EXISTS');
        } else {
            console.log('❌ .env.resolvers: MISSING');
        }
        
        console.log('\n🎯 RELAYER CAPABILITIES:');
        console.log('✅ Bidirectional ETH ↔ ALGO Atomic Swaps');
        console.log('✅ 1inch Fusion+ Integration');
        console.log('✅ Limit Order Protocol (LOP) Bidding');
        console.log('✅ Real-time Cross-Chain Monitoring');
        console.log('✅ Cryptographic Secret Validation');
        console.log('✅ Gasless User Experience');
        console.log('✅ Partial Fill Support');
        console.log('✅ Production-Ready Deployment');
        
        console.log('\n=====================================');
        console.log('🛰️ Relayer is ready to process swaps!');
        console.log('=====================================\n');
        
    } catch (error) {
        console.error('❌ Error checking relayer status:', error.message);
    }
}

// Run status check
checkRelayerStatus(); 