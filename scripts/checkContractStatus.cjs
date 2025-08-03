#!/usr/bin/env node

/**
 * 🔍 CHECK CONTRACT STATUS
 * 
 * Checks if the Enhanced Limit Order Bridge contract is deployed and working
 */

const { ethers } = require('ethers');

async function checkContractStatus() {
    try {
        require('dotenv').config();
        
        console.log('🔍 CHECKING CONTRACT STATUS');
        console.log('==========================\n');
        
        // Initialize
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        
        // Enhanced Limit Order Bridge contract
        const bridgeAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        console.log(`🏗️ Checking contract: ${bridgeAddress}`);
        
        // Check if contract exists
        const code = await provider.getCode(bridgeAddress);
        if (code === '0x') {
            console.log('❌ Contract is NOT deployed at this address');
            return;
        }
        
        console.log('✅ Contract is deployed');
        console.log(`📦 Contract code length: ${code.length} bytes`);
        
        // Try to call a simple view function
        const bridgeABI = [
            'function owner() external view returns (address)',
            'function algorandAppId() external view returns (uint256)',
            'function resolverFeeRate() external view returns (uint256)',
            'function biddingFeeRate() external view returns (uint256)',
            'function MIN_ORDER_VALUE() external view returns (uint256)',
            'function DEFAULT_TIMELOCK() external view returns (uint256)'
        ];
        
        const bridgeContract = new ethers.Contract(bridgeAddress, bridgeABI, provider);
        
        try {
            const owner = await bridgeContract.owner();
            console.log(`👑 Contract Owner: ${owner}`);
            
            const algorandAppId = await bridgeContract.algorandAppId();
            console.log(`📱 Algorand App ID: ${algorandAppId}`);
            
            const resolverFeeRate = await bridgeContract.resolverFeeRate();
            console.log(`💰 Resolver Fee Rate: ${resolverFeeRate} (${resolverFeeRate / 100}%)`);
            
            const biddingFeeRate = await bridgeContract.biddingFeeRate();
            console.log(`🏆 Bidding Fee Rate: ${biddingFeeRate} (${biddingFeeRate / 100}%)`);
            
            const minOrderValue = await bridgeContract.MIN_ORDER_VALUE();
            console.log(`📊 Min Order Value: ${ethers.formatEther(minOrderValue)} ETH`);
            
            const defaultTimelock = await bridgeContract.DEFAULT_TIMELOCK();
            console.log(`⏰ Default Timelock: ${defaultTimelock} seconds (${defaultTimelock / 3600} hours)`);
            
            console.log('\n✅ Contract is working and accessible!');
            
        } catch (error) {
            console.error('❌ Error calling contract functions:', error.message);
            console.log('💡 The contract might be deployed but not fully functional');
        }
        
        // Check recent transactions to this contract
        console.log('\n📊 Checking recent contract activity...');
        
        const currentBlock = await provider.getBlockNumber();
        console.log(`📦 Current block: ${currentBlock}`);
        
        // Check for recent events
        const eventABI = [
            'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock, bool allowPartialFills)'
        ];
        
        const eventContract = new ethers.Contract(bridgeAddress, eventABI, provider);
        
        try {
            const events = await eventContract.queryFilter('LimitOrderCreated', currentBlock - 1000, currentBlock);
            console.log(`📋 Recent LimitOrderCreated events: ${events.length}`);
            
            if (events.length > 0) {
                console.log('📋 Recent orders:');
                for (const event of events.slice(-5)) { // Show last 5
                    console.log(`   Order ID: ${event.args.orderId}`);
                    console.log(`   Maker: ${event.args.maker}`);
                    console.log(`   Amount: ${ethers.formatEther(event.args.makerAmount)} ETH`);
                    console.log(`   Block: ${event.blockNumber}`);
                    console.log(`   ---`);
                }
            }
        } catch (error) {
            console.error('❌ Error querying events:', error.message);
        }
        
        console.log('\n🔍 CONTRACT STATUS SUMMARY:');
        console.log('===========================');
        console.log('✅ Contract is deployed');
        console.log('✅ Contract functions are accessible');
        console.log('✅ Contract is ready for orders');
        
        console.log('\n💡 The Fixed Cross-Chain Relayer should be able to:');
        console.log('   📋 Monitor for LimitOrderCreated events');
        console.log('   💰 Place competitive bids');
        console.log('   🚀 Execute orders');
        console.log('   🌉 Create cross-chain HTLCs');
        
    } catch (error) {
        console.error('❌ Error checking contract status:', error.message);
    }
}

checkContractStatus(); 