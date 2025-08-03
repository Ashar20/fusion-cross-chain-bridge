#!/usr/bin/env node

const { FixedCrossChainRelayer } = require('./fixedCrossChainRelayer.cjs');

async function testRelayerOnNewOrder() {
    console.log('🧪 TESTING RELAYER ON NEW LOP ORDER');
    console.log('===================================');
    
    try {
        const relayer = new FixedCrossChainRelayer();
        
        console.log('\n🚀 Starting LOP monitoring...');
        await relayer.startLOPMonitoring();
        
        console.log('\n🔍 Checking for recent orders...');
        await relayer.checkForNewLOPOrders();
        
        // Check what we found
        const status = relayer.getStatus();
        console.log('\n📊 MONITORING RESULTS:');
        console.log('======================');
        console.log(`📋 Active Orders: ${status.activeOrders}`);
        console.log(`💰 Our Bids: ${status.ourBids}`);
        console.log(`🔍 Monitoring: ${status.monitoring}`);
        
        if (status.activeOrders > 0) {
            console.log('\n✅ Orders detected! Relayer should be processing them...');
            
            // Wait a bit for processing
            console.log('⏳ Waiting for bid placement...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check again
            const updatedStatus = relayer.getStatus();
            console.log('\n📊 UPDATED STATUS:');
            console.log('==================');
            console.log(`📋 Active Orders: ${updatedStatus.activeOrders}`);
            console.log(`💰 Our Bids: ${updatedStatus.ourBids}`);
            
            if (updatedStatus.ourBids > 0) {
                console.log('✅ Relayer successfully placed bids!');
            } else {
                console.log('⚠️  No bids placed - may not be profitable');
            }
        } else {
            console.log('❌ No orders detected in recent blocks');
        }
        
        // Stop monitoring
        relayer.stopMonitoring();
        console.log('\\n🔄 Monitoring stopped');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

testRelayerOnNewOrder();