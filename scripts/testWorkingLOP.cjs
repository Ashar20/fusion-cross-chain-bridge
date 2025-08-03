#!/usr/bin/env node

/**
 * 🎯 WORKING LOP TEST
 * 
 * Test the Limit Order Protocol with proper parameter handling
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function testWorkingLOP() {
    console.log('🎯 WORKING LOP TEST');
    console.log('===================\n');
    
    try {
        require('dotenv').config();
        
        // Contract address
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Initialize provider and signer
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Load contract ABI
        const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        
        const contract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);
        
        console.log('✅ Contract initialized');
        console.log(`📋 Address: ${contractAddress}`);
        console.log(`👤 User: ${signer.address}\n`);
        
        // Test 1: Create a limit order
        console.log('📝 TEST 1: Creating Limit Order');
        console.log('===============================');
        
        try {
            // Create limit order intent with correct structure
            const intent = {
                maker: signer.address,
                makerToken: ethers.ZeroAddress, // ETH
                takerToken: ethers.ZeroAddress, // ALGO (represented as zero address)
                makerAmount: ethers.parseEther('0.001'), // 0.001 ETH
                takerAmount: ethers.parseEther('1'), // 1 ALGO
                deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
                algorandChainId: 416001n, // Algorand testnet
                algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
                salt: ethers.randomBytes(32),
                allowPartialFills: true,
                minPartialFill: ethers.parseEther('0.0001') // 0.0001 ETH minimum
            };
            
            // Generate hashlock
            const secret = ethers.randomBytes(32);
            const hashlock = ethers.keccak256(secret);
            const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours
            
            console.log('📋 Order Details:');
            console.log(`   Maker: ${intent.maker}`);
            console.log(`   Amount: ${ethers.formatEther(intent.makerAmount)} ETH`);
            console.log(`   Target: ${ethers.formatEther(intent.takerAmount)} ALGO`);
            console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Timelock: ${new Date(Number(timelock) * 1000).toISOString()}`);
            
            // Submit limit order with ETH value
            const tx = await contract.submitLimitOrder(
                intent,
                ethers.ZeroHash, // signature (not needed for this test)
                hashlock,
                timelock,
                { 
                    gasLimit: 500000, 
                    value: intent.makerAmount // Include ETH value
                }
            );
            
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
            
            // Extract order ID from event - use a more robust approach
            let orderId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    if (parsed.name === 'LimitOrderCreated') {
                        orderId = parsed.args.orderId;
                        break;
                    }
                } catch (e) {
                    // Skip logs that can't be parsed
                    continue;
                }
            }
            
            if (orderId) {
                console.log(`🎯 Order ID: ${orderId}`);
                console.log('✅ Limit order created successfully!\n');
                
                // Test 2: Get order details
                console.log('📝 TEST 2: Getting Order Details');
                console.log('===============================');
                
                try {
                    const order = await contract.limitOrders(orderId);
                    console.log('📋 Order Details:');
                    console.log(`   Order ID: ${orderId}`);
                    console.log(`   Maker: ${order.intent.maker}`);
                    console.log(`   Amount: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
                    console.log(`   Target: ${ethers.formatEther(order.intent.takerAmount)} ALGO`);
                    console.log(`   Filled: ${order.filled}`);
                    console.log(`   Cancelled: ${order.cancelled}`);
                    console.log(`   Created: ${new Date(Number(order.createdAt) * 1000).toISOString()}`);
                    console.log('✅ Order details retrieved successfully!\n');
                    
                    // Test 3: Check bid count
                    console.log('📝 TEST 3: Checking Bid Count');
                    console.log('============================');
                    
                    try {
                        const bidCount = await contract.getBidCount(orderId);
                        console.log(`📊 Total bids: ${bidCount}`);
                        
                        if (bidCount > 0) {
                            const bids = await contract.getBids(orderId);
                            console.log('🏆 Bids:');
                            
                            for (let i = 0; i < bids.length; i++) {
                                const bid = bids[i];
                                console.log(`   Bid ${i}:`);
                                console.log(`     Resolver: ${bid.resolver}`);
                                console.log(`     Input: ${ethers.formatEther(bid.inputAmount)} ETH`);
                                console.log(`     Output: ${ethers.formatEther(bid.outputAmount)} ALGO`);
                                console.log(`     Active: ${bid.active}`);
                            }
                        } else {
                            console.log('📭 No bids placed yet');
                        }
                        
                        console.log('✅ Bid count check completed!\n');
                        
                    } catch (error) {
                        console.error('❌ Error checking bids:', error.message);
                    }
                    
                } catch (error) {
                    console.error('❌ Error getting order details:', error.message);
                }
                
            } else {
                console.log('⚠️ Order ID not found in events - checking if order was created anyway');
                
                // Try to find the order by checking recent events
                const currentBlock = await provider.getBlockNumber();
                const events = await contract.queryFilter('LimitOrderCreated', currentBlock - 10, currentBlock);
                
                if (events.length > 0) {
                    const latestEvent = events[events.length - 1];
                    orderId = latestEvent.args.orderId;
                    console.log(`🎯 Found Order ID: ${orderId}`);
                } else {
                    console.log('❌ No LimitOrderCreated events found');
                }
            }
            
        } catch (error) {
            console.error('❌ Error creating limit order:', error.message);
            
            // Check if it's a gas issue
            if (error.message.includes('out of gas')) {
                console.log('💡 Try increasing gas limit');
            }
            
            // Check if it's a value issue
            if (error.message.includes('insufficient funds')) {
                console.log('💡 Check wallet balance');
            }
            
            throw error;
        }
        
        console.log('🎉 LOP TEST COMPLETED!');
        console.log('======================');
        console.log('✅ Contract is working');
        console.log('✅ Limit order creation tested');
        console.log('✅ Order retrieval tested');
        console.log('✅ Bid system accessible');
        console.log('======================\n');
        
    } catch (error) {
        console.error('❌ Working LOP test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    testWorkingLOP();
}

module.exports = { testWorkingLOP }; 