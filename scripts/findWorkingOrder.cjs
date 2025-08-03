#!/usr/bin/env node

/**
 * Find a working order to test bidding
 */

const { ethers } = require('ethers');

async function findWorkingOrder() {
    console.log('🔍 FINDING WORKING ORDER FOR BIDDING TEST');
    console.log('========================================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    
    console.log(`🏦 Contract: ${contractAddress}\n`);
    
    try {
        // Get recent blocks and look for LimitOrderCreated events
        const currentBlock = await provider.getBlock('latest');
        console.log(`📊 Current block: ${currentBlock.number}`);
        
        // Look back more blocks to find recent orders
        const fromBlock = currentBlock.number - 100;
        const toBlock = currentBlock.number;
        
        console.log(`🔍 Searching blocks ${fromBlock} to ${toBlock} for LimitOrderCreated events...\n`);
        
        const eventTopic = ethers.id('LimitOrderCreated(bytes32,address,address,address,uint256,uint256,uint256,string,bytes32,uint256,bool)');
        
        const logs = await provider.getLogs({
            address: contractAddress,
            topics: [eventTopic],
            fromBlock: fromBlock,
            toBlock: toBlock
        });
        
        console.log(`📋 Found ${logs.length} LimitOrderCreated events\n`);
        
        if (logs.length === 0) {
            console.log('❌ No orders found in recent blocks');
            console.log('💡 Try creating a new order first');
            return;
        }
        
        // Check each order to see which ones exist and have no bids
        const bidABI = [
            'function getBids(bytes32) external view returns (tuple(address,uint256,uint256,uint256,bool,uint256,uint256)[])'
        ];
        const contract = new ethers.Contract(contractAddress, bidABI, provider);
        
        for (let i = logs.length - 1; i >= 0; i--) {
            const log = logs[i];
            const orderId = log.topics[1]; // Order ID is in topics[1]
            const blockNumber = log.blockNumber;
            
            console.log(`🔍 Checking order ${orderId.slice(0, 10)}... from block ${blockNumber}`);
            
            try {
                const bids = await contract.getBids(orderId);
                console.log(`   📊 Current bids: ${bids.length}`);
                
                if (bids.length === 0) {
                    console.log(`   ✅ Found order with no bids: ${orderId}`);
                    console.log(`   📅 Created in block: ${blockNumber}`);
                    
                    // Test if we can bid on this order
                    console.log(`\n🧪 Testing bid on order ${orderId}...`);
                    
                    const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
                    const bidAbi = [
                        'function placeBid(bytes32 orderId, uint256 inputAmount, uint256 outputAmount, uint256 gasEstimate) external payable'
                    ];
                    const bidContract = new ethers.Contract(contractAddress, bidAbi, wallet);
                    
                    try {
                        const gasEstimate = await bidContract.placeBid.estimateGas(
                            orderId,
                            ethers.parseEther('0.001'),
                            ethers.parseEther('1.0'),
                            150000,
                            { value: ethers.parseEther('0.001') }
                        );
                        
                        console.log(`   ✅ Gas estimation successful: ${gasEstimate.toString()}`);
                        console.log(`   🎯 This order is valid for bidding!`);
                        
                        // Place the actual bid
                        console.log(`   ⏳ Placing actual bid...`);
                        const tx = await bidContract.placeBid(
                            orderId,
                            ethers.parseEther('0.001'),
                            ethers.parseEther('1.0'),
                            150000,
                            {
                                value: ethers.parseEther('0.001'),
                                gasLimit: gasEstimate,
                                maxFeePerGas: ethers.parseUnits('10', 'gwei'),
                                maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
                            }
                        );
                        
                        console.log(`   🔗 Bid transaction: ${tx.hash}`);
                        const receipt = await tx.wait();
                        console.log(`   ✅ Bid placed successfully in block ${receipt.blockNumber}`);
                        
                        // Verify bid was placed
                        const newBids = await contract.getBids(orderId);
                        console.log(`   🎉 Order now has ${newBids.length} bid(s)!`);
                        
                        return orderId;
                        
                    } catch (bidError) {
                        console.log(`   ❌ Cannot bid on this order: ${bidError.message.split(':')[0]}`);
                    }
                } else {
                    console.log(`   ℹ️  Order already has ${bids.length} bid(s)`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error checking order: ${error.message.split(':')[0]}`);
            }
            
            console.log('');
        }
        
        console.log('🔍 No valid orders found for bidding');
        console.log('💡 All orders either have bids or are invalid');
        
    } catch (error) {
        console.error('❌ Error finding working order:', error.message);
    }
}

findWorkingOrder().catch(console.error);