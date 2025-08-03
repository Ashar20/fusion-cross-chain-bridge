#!/usr/bin/env node

/**
 * Check the actual state of the order and contract
 */

const { ethers } = require('ethers');

async function checkOrderState() {
    console.log('🔍 CHECKING ORDER STATE AND VALIDITY');
    console.log('====================================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    const orderId = '0xfc20a25969492fb0fe5f86861c2e6853a8e486b90d31ad67124350d3f4a77b30';
    
    console.log(`🆔 Order ID: ${orderId}`);
    console.log(`🏦 Contract: ${contractAddress}\n`);
    
    try {
        // Get current time
        const currentBlock = await provider.getBlock('latest');
        const currentTime = currentBlock.timestamp;
        console.log(`⏰ Current time: ${new Date(currentTime * 1000).toISOString()}`);
        console.log(`⏰ Current timestamp: ${currentTime}\n`);
        
        // Check if the order was actually created by looking at transaction logs
        console.log('🔍 Checking if order exists in contract...');
        
        // Method 1: Check via getBids (we know this works)
        const bidABI = ['function getBids(bytes32) external view returns (tuple(address,uint256,uint256,uint256,bool,uint256,uint256)[])'];
        const bidContract = new ethers.Contract(contractAddress, bidABI, provider);
        
        try {
            const bids = await bidContract.getBids(orderId);
            console.log(`✅ getBids works: Found ${bids.length} bids`);
        } catch (bidError) {
            console.log(`❌ getBids failed: ${bidError.message}`);
            console.log('🚨 This means the order doesn\'t exist in the contract!');
            return;
        }
        
        // Method 2: Try to read the order creation transaction
        console.log('\n🔍 Checking order creation transaction...');
        const txHash = '0xa25f6dc0b3cd3850f2d3919fc86f34381a0184d1e8cf4a51f4cc9ab09d6d7987';
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (receipt) {
            console.log(`✅ Transaction found in block ${receipt.blockNumber}`);
            console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`📊 Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
            console.log(`📊 Number of logs: ${receipt.logs.length}`);
            
            if (receipt.status === 0) {
                console.log('🚨 ORDER CREATION TRANSACTION FAILED!');
                console.log('This is why bidding fails - the order was never created.');
                return;
            }
            
            // Look for LimitOrderCreated event
            const orderCreatedTopic = ethers.id('LimitOrderCreated(bytes32,address,address,address,uint256,uint256,uint256,string,bytes32,uint256,bool)');
            const orderEvent = receipt.logs.find(log => log.topics[0] === orderCreatedTopic);
            
            if (orderEvent) {
                console.log('✅ LimitOrderCreated event found');
                console.log(`🆔 Event order ID: ${orderEvent.topics[1]}`);
                console.log(`🆔 Expected order ID: ${orderId}`);
                console.log(`✅ Order IDs match: ${orderEvent.topics[1] === orderId}`);
            } else {
                console.log('❌ LimitOrderCreated event NOT found');
                console.log('🚨 Order creation event missing - this explains the bidding failure');
            }
        } else {
            console.log('❌ Transaction receipt not found');
        }
        
        // Method 3: Try different order validation approaches
        console.log('\n🔍 Testing different order validation methods...');
        
        const testFunctions = [
            {
                name: 'orders mapping',
                abi: ['function orders(bytes32) external view returns (bool)']
            },
            {
                name: 'isValidOrder',
                abi: ['function isValidOrder(bytes32) external view returns (bool)']
            },
            {
                name: 'orderExists',
                abi: ['function orderExists(bytes32) external view returns (bool)']
            }
        ];
        
        for (const test of testFunctions) {
            try {
                const testContract = new ethers.Contract(contractAddress, test.abi, provider);
                const result = await testContract[test.abi[0].split(' ')[1].split('(')[0]](orderId);
                console.log(`✅ ${test.name}: ${result}`);
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message.split(':')[0]}`);
            }
        }
        
        // Method 4: Check if we can find ANY working order to test with
        console.log('\n🔍 Looking for any working orders in recent blocks...');
        
        const fromBlock = currentBlock.number - 50;
        const orderCreatedTopic = ethers.id('LimitOrderCreated(bytes32,address,address,address,uint256,uint256,uint256,string,bytes32,uint256,bool)');
        
        const logs = await provider.getLogs({
            address: contractAddress,
            topics: [orderCreatedTopic],
            fromBlock: fromBlock,
            toBlock: currentBlock.number
        });
        
        console.log(`📋 Found ${logs.length} order creation events in last 50 blocks`);
        
        if (logs.length > 0) {
            // Test the most recent order
            const recentLog = logs[logs.length - 1];
            const recentOrderId = recentLog.topics[1];
            console.log(`🔍 Testing most recent order: ${recentOrderId}`);
            
            try {
                const recentBids = await bidContract.getBids(recentOrderId);
                console.log(`✅ Recent order exists with ${recentBids.length} bids`);
                
                if (recentBids.length === 0) {
                    console.log('💡 Found a working order with no bids - use this for testing!');
                    console.log(`💡 Working order ID: ${recentOrderId}`);
                }
            } catch (error) {
                console.log(`❌ Recent order check failed: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking order state:', error.message);
    }
}

checkOrderState().catch(console.error);