#!/usr/bin/env node

/**
 * 🔍 VERIFY LOP BIDDING ON-CHAIN
 * 
 * Checks all LOP orders and their bids on the EnhancedLimitOrderBridge contract
 * Shows real-time bidding activity and order status
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function verifyLOPBidding() {
    console.log('🔍 VERIFYING LOP BIDDING ON-CHAIN');
    console.log('==================================\n');
    
    try {
        require('dotenv').config();
        
        // Contract address
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Initialize provider
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        
        // Load contract ABI
        const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        
        const contract = new ethers.Contract(contractAddress, contractArtifact.abi, provider);
        
        console.log('✅ Contract connected');
        console.log(`📋 Address: ${contractAddress}\n`);
        
        // Get current block
        const currentBlock = await provider.getBlockNumber();
        console.log(`📊 Current Block: ${currentBlock}`);
        
        // Check for LimitOrderCreated events (last 1000 blocks)
        console.log('\n🎯 SEARCHING FOR LOP ORDERS...');
        console.log('================================');
        
        const fromBlock = currentBlock - 1000;
        const orderEvents = await contract.queryFilter('LimitOrderCreated', fromBlock, currentBlock);
        
        if (orderEvents.length === 0) {
            console.log('❌ No LOP orders found in the last 1000 blocks');
            console.log('💡 Try creating an order first with: node scripts/createWorkingLOPOrder.cjs');
            return;
        }
        
        console.log(`✅ Found ${orderEvents.length} LOP order(s)\n`);
        
        // Process each order
        for (let i = 0; i < orderEvents.length; i++) {
            const event = orderEvents[i];
            const orderId = event.args.orderId;
            const maker = event.args.maker;
            const makerToken = event.args.makerToken;
            const takerToken = event.args.takerToken;
            const makerAmount = event.args.makerAmount;
            const takerAmount = event.args.takerAmount;
            const deadline = event.args.deadline;
            const algorandAddress = event.args.algorandAddress;
            const hashlock = event.args.hashlock;
            const timelock = event.args.timelock;
            
            console.log(`📋 ORDER #${i + 1}: ${orderId}`);
            console.log('==========================================');
            console.log(`   Maker: ${maker}`);
            console.log(`   Maker Token: ${makerToken === ethers.ZeroAddress ? 'ETH' : makerToken}`);
            console.log(`   Taker Token: ${takerToken === ethers.ZeroAddress ? 'ALGO' : takerToken}`);
            console.log(`   Maker Amount: ${ethers.formatEther(makerAmount)} ${makerToken === ethers.ZeroAddress ? 'ETH' : 'tokens'}`);
            console.log(`   Taker Amount: ${ethers.formatEther(takerAmount)} ${takerToken === ethers.ZeroAddress ? 'ALGO' : 'tokens'}`);
            console.log(`   Deadline: ${new Date(Number(deadline) * 1000).toISOString()}`);
            console.log(`   Algorand Address: ${algorandAddress}`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Timelock: ${new Date(Number(timelock) * 1000).toISOString()}`);
            console.log(`   Block: ${event.blockNumber}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            // Check order status
            try {
                const order = await contract.limitOrders(orderId);
                console.log(`   Status: ${order.filled ? '✅ FILLED' : order.cancelled ? '❌ CANCELLED' : '🔄 ACTIVE'}`);
                console.log(`   Resolver: ${order.resolver !== ethers.ZeroAddress ? order.resolver : 'None'}`);
                console.log(`   Created: ${new Date(Number(order.createdAt) * 1000).toISOString()}`);
                console.log(`   Deposited Amount: ${ethers.formatEther(order.depositedAmount)} ETH`);
                console.log(`   Remaining Amount: ${ethers.formatEther(order.remainingAmount)} ETH`);
                console.log(`   Partial Fills: ${order.partialFills}`);
                
                // Check if order is expired
                const now = Math.floor(Date.now() / 1000);
                if (Number(deadline) < now && !order.filled) {
                    console.log(`   ⚠️  EXPIRED: Order deadline passed`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error getting order status: ${error.message}`);
            }
            
            // Check bids for this order
            console.log('\n🏆 BIDDING ACTIVITY:');
            console.log('===================');
            
            try {
                const bidCount = await contract.getBidCount(orderId);
                console.log(`   Total Bids: ${bidCount}`);
                
                if (bidCount > 0) {
                    const bids = await contract.getBids(orderId);
                    console.log('\n   📊 BID DETAILS:');
                    
                    for (let j = 0; j < bids.length; j++) {
                        const bid = bids[j];
                        const bidAge = Math.floor((Date.now() / 1000) - Number(bid.timestamp));
                        
                        console.log(`\n     Bid #${j + 1}:`);
                        console.log(`       Resolver: ${bid.resolver}`);
                        console.log(`       Input Amount: ${ethers.formatEther(bid.inputAmount)} ETH`);
                        console.log(`       Output Amount: ${ethers.formatEther(bid.outputAmount)} ALGO`);
                        console.log(`       Gas Estimate: ${bid.gasEstimate}`);
                        console.log(`       Total Cost: ${ethers.formatEther(bid.totalCost)} ETH`);
                        console.log(`       Timestamp: ${new Date(Number(bid.timestamp) * 1000).toISOString()}`);
                        console.log(`       Age: ${bidAge} seconds ago`);
                        console.log(`       Status: ${bid.active ? '✅ ACTIVE' : '❌ INACTIVE'}`);
                        
                        // Calculate profitability
                        const inputValue = Number(ethers.formatEther(bid.inputAmount));
                        const outputValue = Number(ethers.formatEther(bid.outputAmount));
                        const gasCost = Number(ethers.formatEther(bid.totalCost)) - inputValue;
                        const profit = outputValue - inputValue - gasCost;
                        const profitMargin = (profit / inputValue) * 100;
                        
                        console.log(`       Profit: ${profit.toFixed(6)} ETH`);
                        console.log(`       Profit Margin: ${profitMargin.toFixed(2)}%`);
                        console.log(`       Gas Cost: ${gasCost.toFixed(6)} ETH`);
                    }
                    
                    // Find best bid
                    let bestBid = null;
                    let bestProfit = -Infinity;
                    
                    for (const bid of bids) {
                        if (bid.active) {
                            const inputValue = Number(ethers.formatEther(bid.inputAmount));
                            const outputValue = Number(ethers.formatEther(bid.outputAmount));
                            const gasCost = Number(ethers.formatEther(bid.totalCost)) - inputValue;
                            const profit = outputValue - inputValue - gasCost;
                            
                            if (profit > bestProfit) {
                                bestProfit = profit;
                                bestBid = bid;
                            }
                        }
                    }
                    
                    if (bestBid) {
                        console.log(`\n   🏆 BEST BID: ${bestBid.resolver}`);
                        console.log(`      Profit: ${bestProfit.toFixed(6)} ETH`);
                        console.log(`      Profit Margin: ${((bestProfit / Number(ethers.formatEther(bestBid.inputAmount))) * 100).toFixed(2)}%`);
                    }
                    
                } else {
                    console.log('   ❌ No bids placed yet');
                    console.log('   💡 Resolvers should place bids within 5-10 seconds');
                }
                
            } catch (error) {
                console.log(`   ❌ Error getting bids: ${error.message}`);
            }
            
            // Check for BidPlaced events
            console.log('\n📈 BID EVENTS:');
            console.log('==============');
            
            try {
                const bidEvents = await contract.queryFilter('BidPlaced', fromBlock, currentBlock);
                const orderBids = bidEvents.filter(event => event.args.orderId === orderId);
                
                if (orderBids.length > 0) {
                    console.log(`   Found ${orderBids.length} bid event(s):`);
                    
                    for (const bidEvent of orderBids) {
                        const resolver = bidEvent.args.resolver;
                        const inputAmount = bidEvent.args.inputAmount;
                        const outputAmount = bidEvent.args.outputAmount;
                        const gasEstimate = bidEvent.args.gasEstimate;
                        const blockNumber = bidEvent.blockNumber;
                        const txHash = bidEvent.transactionHash;
                        
                        console.log(`\n     📊 Bid Event:`);
                        console.log(`        Resolver: ${resolver}`);
                        console.log(`        Input: ${ethers.formatEther(inputAmount)} ETH`);
                        console.log(`        Output: ${ethers.formatEther(outputAmount)} ALGO`);
                        console.log(`        Gas: ${gasEstimate}`);
                        console.log(`        Block: ${blockNumber}`);
                        console.log(`        TX: ${txHash}`);
                    }
                } else {
                    console.log('   ❌ No bid events found');
                }
                
            } catch (error) {
                console.log(`   ❌ Error getting bid events: ${error.message}`);
            }
            
            // Check for OrderExecuted events
            console.log('\n✅ EXECUTION EVENTS:');
            console.log('====================');
            
            try {
                const executionEvents = await contract.queryFilter('OrderExecuted', fromBlock, currentBlock);
                const orderExecutions = executionEvents.filter(event => event.args.orderId === orderId);
                
                if (orderExecutions.length > 0) {
                    console.log(`   Found ${orderExecutions.length} execution event(s):`);
                    
                    for (const execEvent of orderExecutions) {
                        const resolver = execEvent.args.resolver;
                        const secret = execEvent.args.secret;
                        const blockNumber = execEvent.blockNumber;
                        const txHash = execEvent.transactionHash;
                        
                        console.log(`\n     🎉 Execution Event:`);
                        console.log(`        Resolver: ${resolver}`);
                        console.log(`        Secret: ${secret}`);
                        console.log(`        Block: ${blockNumber}`);
                        console.log(`        TX: ${txHash}`);
                    }
                } else {
                    console.log('   ❌ No execution events found');
                }
                
            } catch (error) {
                console.log(`   ❌ Error getting execution events: ${error.message}`);
            }
            
            console.log('\n' + '='.repeat(50) + '\n');
        }
        
        // Summary
        console.log('📊 BIDDING SUMMARY:');
        console.log('===================');
        console.log(`✅ Total Orders: ${orderEvents.length}`);
        
        let activeOrders = 0;
        let filledOrders = 0;
        let totalBids = 0;
        
        for (const event of orderEvents) {
            try {
                const order = await contract.limitOrders(event.args.orderId);
                if (order.filled) filledOrders++;
                else if (!order.cancelled) activeOrders++;
                
                const bidCount = await contract.getBidCount(event.args.orderId);
                totalBids += Number(bidCount);
            } catch (error) {
                // Ignore errors
            }
        }
        
        console.log(`🔄 Active Orders: ${activeOrders}`);
        console.log(`✅ Filled Orders: ${filledOrders}`);
        console.log(`🏆 Total Bids: ${totalBids}`);
        
        if (activeOrders > 0) {
            console.log('\n💡 ACTIVE ORDERS ARE WAITING FOR BIDS');
            console.log('   - Resolvers should place competitive bids');
            console.log('   - Best bid will be selected automatically');
            console.log('   - Orders will execute when profitable');
        }
        
    } catch (error) {
        console.error('❌ Error verifying LOP bidding:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    verifyLOPBidding();
}

module.exports = { verifyLOPBidding }; 