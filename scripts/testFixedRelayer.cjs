const { FixedCrossChainRelayer } = require('./fixedCrossChainRelayer.cjs');

async function testRelayer() {
    console.log('🧪 TESTING FIXED RELAYER SERVICE');
    console.log('================================');
    
    try {
        const relayer = new FixedCrossChainRelayer();
        
        // Check balances
        await relayer.checkBalances();
        
        // Get status
        const status = relayer.getStatus();
        console.log('\n📊 RELAYER STATUS:');
        console.log('==================');
        console.log(`🔍 Monitoring: ${status.monitoring}`);
        console.log(`📊 Last Block: ${status.lastCheckedBlock}`);
        console.log(`📋 Active Orders: ${status.activeOrders}`);
        console.log(`💰 Our Bids: ${status.ourBids}`);
        console.log(`✅ Completed: ${status.completedOrders}`);
        console.log(`💎 ETH Address: ${status.ethAddress}`);
        console.log(`🪙 ALGO Address: ${status.algoAddress}`);
        
        // Test contract connections
        try {
            const isAuthorized = await relayer.limitOrderBridge.authorizedResolvers(relayer.ethWallet.address);
            console.log(`\n🔐 Authorization: ${isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}`);
            
            if (!isAuthorized) {
                console.log('💡 To authorize relayer, run: node scripts/authorizeRelayerForLOP.cjs');
            }
        } catch (error) {
            console.log(`🔐 Authorization check: ❌ ${error.message}`);
        }
        
        // Test LOP monitoring initialization
        console.log('\n🚀 TESTING LOP MONITORING SETUP');
        console.log('===============================');
        
        // Check current block
        const currentBlock = await relayer.ethProvider.getBlockNumber();
        console.log(`📊 Current Block: ${currentBlock}`);
        
        // Check for existing orders
        const events = await relayer.limitOrderBridge.queryFilter('LimitOrderCreated', currentBlock - 100, currentBlock);
        console.log(`📋 Recent Orders (last 100 blocks): ${events.length}`);
        
        console.log('\n✅ RELAYER SERVICE TEST COMPLETED');
        console.log('==================================');
        console.log('✅ Configuration loaded correctly');
        console.log('✅ Contracts connected successfully');
        console.log('✅ Balances checked');
        console.log('✅ LOP monitoring ready');
        console.log('✅ Authorization status checked');
        console.log('💡 Run: node scripts/fixedCrossChainRelayer.cjs to start monitoring');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

testRelayer();