#!/usr/bin/env node

/**
 * 🎯 TEST LIMIT ORDER PROTOCOL (LOP)
 * 
 * Tests the deployed EnhancedLimitOrderBridge contract:
 * - Create a limit order
 * - Place bids
 * - Execute the order
 */

const { ethers } = require('ethers');
const fs = require('fs');

class TestLOP {
    constructor() {
        console.log('🎯 TESTING LIMIT ORDER PROTOCOL (LOP)');
        console.log('=====================================');
        console.log('✅ Testing EnhancedLimitOrderBridge');
        console.log('✅ Creating limit orders');
        console.log('✅ Placing bids');
        console.log('✅ Executing orders');
        console.log('=====================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        // Contract address from deployment
        this.contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Initialize provider and signer
        this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        
        // Load contract ABI
        const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        
        this.contract = new ethers.Contract(this.contractAddress, contractArtifact.abi, this.signer);
        
        console.log('✅ LOP Test Initialized');
        console.log(`📋 Contract: ${this.contractAddress}`);
        console.log(`👤 User: ${this.signer.address}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${this.contractAddress}#code\n`);
    }
    
    async testCreateLimitOrder() {
        console.log('📝 TEST 1: Creating Limit Order');
        console.log('===============================');
        
        try {
            // Create limit order intent with correct structure
            const intent = {
                maker: this.signer.address,
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
            
            // Submit limit order
            const tx = await this.contract.submitLimitOrder(
                intent,
                ethers.ZeroHash, // signature (not needed for this test)
                hashlock,
                timelock,
                { gasLimit: 500000, value: intent.makerAmount }
            );
            
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
            
            // Extract order ID from event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed.name === 'LimitOrderCreated';
                } catch {
                    return false;
                }
            });
            
            if (event) {
                const parsed = this.contract.interface.parseLog(event);
                const orderId = parsed.args.orderId;
                
                console.log(`🎯 Order ID: ${orderId}`);
                console.log('✅ Limit order created successfully!\n');
                
                return { orderId, secret, hashlock };
            } else {
                throw new Error('LimitOrderCreated event not found');
            }
            
        } catch (error) {
            console.error('❌ Error creating limit order:', error.message);
            throw error;
        }
    }
    
    async testPlaceBid(orderId) {
        console.log('🏆 TEST 2: Placing Bid');
        console.log('======================');
        
        try {
            // Get order details
            const order = await this.contract.limitOrders(orderId);
            console.log('📋 Order Details:');
            console.log(`   Order ID: ${orderId}`);
            console.log(`   Maker: ${order.intent.maker}`);
            console.log(`   Amount: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
            console.log(`   Target: ${ethers.formatEther(order.intent.takerAmount)} ALGO`);
            console.log(`   Active: ${!order.filled && !order.cancelled}`);
            
            // Calculate bid parameters
            const inputAmount = order.intent.makerAmount;
            const outputAmount = order.intent.takerAmount;
            const gasEstimate = 250000n;
            
            console.log('💰 Bid Details:');
            console.log(`   Input Amount: ${ethers.formatEther(inputAmount)} ETH`);
            console.log(`   Output Amount: ${ethers.formatEther(outputAmount)} ALGO`);
            console.log(`   Gas Estimate: ${gasEstimate}`);
            
            // Place bid
            const tx = await this.contract.placeBid(
                orderId,
                inputAmount,
                outputAmount,
                gasEstimate,
                { gasLimit: 300000 }
            );
            
            console.log(`⏳ Bid transaction submitted: ${tx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Bid placed successfully in block: ${receipt.blockNumber}`);
            
            // Get bid count
            const bidCount = await this.contract.getBidCount(orderId);
            console.log(`📊 Total bids: ${bidCount}`);
            
            console.log('✅ Bid placed successfully!\n');
            
        } catch (error) {
            console.error('❌ Error placing bid:', error.message);
            throw error;
        }
    }
    
    async testGetBids(orderId) {
        console.log('📊 TEST 3: Getting Bids');
        console.log('========================');
        
        try {
            const bidCount = await this.contract.getBidCount(orderId);
            console.log(`📊 Total bids: ${bidCount}`);
            
            if (bidCount > 0) {
                const bids = await this.contract.getBids(orderId);
                console.log('🏆 Bids:');
                
                for (let i = 0; i < bids.length; i++) {
                    const bid = bids[i];
                    console.log(`   Bid ${i}:`);
                    console.log(`     Resolver: ${bid.resolver}`);
                    console.log(`     Input: ${ethers.formatEther(bid.inputAmount)} ETH`);
                    console.log(`     Output: ${ethers.formatEther(bid.outputAmount)} ALGO`);
                    console.log(`     Gas: ${bid.gasEstimate}`);
                    console.log(`     Active: ${bid.active}`);
                    console.log(`     Timestamp: ${new Date(Number(bid.timestamp) * 1000).toISOString()}`);
                }
            }
            
            console.log('✅ Bids retrieved successfully!\n');
            
        } catch (error) {
            console.error('❌ Error getting bids:', error.message);
            throw error;
        }
    }
    
    async testExecuteOrder(orderId, secret) {
        console.log('🚀 TEST 4: Executing Order');
        console.log('===========================');
        
        try {
            // Get our bid index (assuming we're the only bidder)
            const bids = await this.contract.getBids(orderId);
            let ourBidIndex = 0;
            
            for (let i = 0; i < bids.length; i++) {
                if (bids[i].resolver === this.signer.address && bids[i].active) {
                    ourBidIndex = i;
                    break;
                }
            }
            
            console.log(`🎯 Executing order with bid index: ${ourBidIndex}`);
            console.log(`🔑 Secret: ${secret}`);
            
            // Execute the order
            const tx = await this.contract.selectBestBidAndExecute(
                orderId,
                ourBidIndex,
                secret,
                { gasLimit: 500000 }
            );
            
            console.log(`⏳ Execution transaction submitted: ${tx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Order executed successfully in block: ${receipt.blockNumber}`);
            
            console.log('✅ Order executed successfully!\n');
            
        } catch (error) {
            console.error('❌ Error executing order:', error.message);
            throw error;
        }
    }
    
    async runAllTests() {
        console.log('🚀 RUNNING ALL LOP TESTS');
        console.log('========================\n');
        
        try {
            // Test 1: Create limit order
            const { orderId, secret, hashlock } = await this.testCreateLimitOrder();
            
            // Test 2: Place bid
            await this.testPlaceBid(orderId);
            
            // Test 3: Get bids
            await this.testGetBids(orderId);
            
            // Test 4: Execute order
            await this.testExecuteOrder(orderId, secret);
            
            console.log('🎉 ALL LOP TESTS COMPLETED SUCCESSFULLY!');
            console.log('=========================================');
            console.log('✅ Limit order created');
            console.log('✅ Bid placed');
            console.log('✅ Bids retrieved');
            console.log('✅ Order executed');
            console.log('✅ LOP functionality verified!');
            console.log('=========================================\n');
            
        } catch (error) {
            console.error('❌ LOP tests failed:', error.message);
            throw error;
        }
    }
}

// Run the tests
async function main() {
    try {
        const testLOP = new TestLOP();
        await testLOP.runAllTests();
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { TestLOP }; 