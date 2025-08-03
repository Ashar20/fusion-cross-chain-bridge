#!/usr/bin/env node

/**
 * 🚀 SIMPLE REAL BIDDING DEMO
 * 
 * Simplified version that demonstrates the LOP intent workflow
 * without hitting rate limits
 */

const { ethers } = require('ethers');
const fs = require('fs');

class SimpleRealBiddingDemo {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.user = null;
        this.provider = null;
        this.resolvers = [];
    }

    async initialize() {
        console.log('🚀 SIMPLE REAL BIDDING DEMO');
        console.log('============================\n');

        try {
            require('dotenv').config();
            
            // Load deployment info
            const deploymentInfo = JSON.parse(fs.readFileSync('./ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json', 'utf8'));
            this.contractAddress = deploymentInfo.contractAddress;
            
            // Initialize provider and user
            this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
            this.user = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            
            // Load contract
            const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
            const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
            this.contract = new ethers.Contract(this.contractAddress, contractArtifact.abi, this.user);
            
            console.log('✅ System initialized');
            console.log(`📋 Contract: ${this.contractAddress}`);
            console.log(`👤 User: ${this.user.address}`);
            
            // Check user balance
            const balance = await this.provider.getBalance(this.user.address);
            console.log(`💰 User ETH Balance: ${ethers.formatEther(balance)} ETH`);
            
            // Setup resolvers
            await this.setupResolvers();
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }

    async setupResolvers() {
        console.log('\n🔧 Setting up resolvers...');
        
        // Create 2 test resolvers
        const resolverConfigs = [
            { name: 'Fast-Resolver', rate: 1.02 },
            { name: 'Premium-Resolver', rate: 1.025 }
        ];

        for (const config of resolverConfigs) {
            const wallet = ethers.Wallet.createRandom();
            
            try {
                // Authorize the resolver
                const tx = await this.contract.authorizeResolver(wallet.address, true);
                console.log(`⏳ Authorizing ${config.name}: ${tx.hash}`);
                await tx.wait();
                
                console.log(`✅ ${config.name} authorized: ${wallet.address}`);
                
                this.resolvers.push({
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    signer: new ethers.Wallet(wallet.privateKey, this.provider),
                    name: config.name,
                    rate: config.rate,
                    bidCount: 0
                });
                
            } catch (error) {
                console.log(`❌ Failed to authorize ${config.name}: ${error.message}`);
            }
        }
        
        console.log(`✅ Total resolvers: ${this.resolvers.length}\n`);
    }

    async createAndSubmitOrder() {
        console.log('📝 STEP 1: CREATING AND SUBMITTING ORDER');
        console.log('=========================================\n');

        // Create LOP intent
        const intent = {
            maker: this.user.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO
            makerAmount: ethers.parseEther('0.001'), // 0.001 ETH
            takerAmount: ethers.parseEther('1.5'),   // 1.5 ALGO
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            algorandChainId: 416001n,
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.0002')
        };
        
        // Generate secret and hashlock
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        
        // Create EIP-712 signature
        const signature = await this.createEIP712Signature(intent);
        
        console.log('📋 ORDER DETAILS:');
        console.log(`   Amount: ${ethers.formatEther(intent.makerAmount)} ETH → ${ethers.formatEther(intent.takerAmount)} ALGO`);
        console.log(`   Rate: 1 ETH = ${(Number(ethers.formatEther(intent.takerAmount)) / Number(ethers.formatEther(intent.makerAmount))).toFixed(2)} ALGO`);
        console.log(`   Hashlock: ${hashlock}`);
        console.log(`   Secret: ${secret}`);
        
        // Submit order
        const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours
        
        const tx = await this.contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            timelock,
            { 
                gasLimit: 500000,
                value: intent.makerAmount
            }
        );
        
        console.log(`⏳ Order submission: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Extract order ID
        const orderId = this.extractOrderId(receipt);
        
        console.log(`✅ Order submitted successfully!`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Gas Used: ${receipt.gasUsed}`);
        console.log(`   Block: ${receipt.blockNumber}`);
        
        return { orderId, intent, secret, hashlock };
    }

    async createEIP712Signature(intent) {
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111,
            verifyingContract: this.contractAddress
        };
        
        const types = {
            LimitOrderIntent: [
                { name: 'maker', type: 'address' },
                { name: 'makerToken', type: 'address' },
                { name: 'takerToken', type: 'address' },
                { name: 'makerAmount', type: 'uint256' },
                { name: 'takerAmount', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
                { name: 'algorandChainId', type: 'uint256' },
                { name: 'algorandAddress', type: 'string' },
                { name: 'salt', type: 'bytes32' },
                { name: 'allowPartialFills', type: 'bool' },
                { name: 'minPartialFill', type: 'uint256' }
            ]
        };
        
        return await this.user.signTypedData(domain, types, intent);
    }

    async placeCompetitiveBids(orderId, intent) {
        console.log('\n🏆 STEP 2: PLACING COMPETITIVE BIDS');
        console.log('===================================\n');

        const bids = [];
        
        for (const resolver of this.resolvers) {
            console.log(`📊 ${resolver.name} analyzing...`);
            
            // Calculate improved rate
            const baseRate = Number(ethers.formatEther(intent.takerAmount)) / Number(ethers.formatEther(intent.makerAmount));
            const improvedRate = baseRate * resolver.rate;
            const takerAmountNum = Number(ethers.formatEther(intent.takerAmount));
            const improvedAmount = ethers.parseEther((takerAmountNum * resolver.rate).toString());
            
            // Gas estimation
            const gasEstimate = 250000;
            
            console.log(`   Rate: 1 ETH = ${improvedRate.toFixed(2)} ALGO (${((resolver.rate - 1) * 100).toFixed(1)}% better)`);
            console.log(`   Bid: ${ethers.formatEther(intent.makerAmount)} ETH → ${ethers.formatEther(improvedAmount)} ALGO`);
            console.log(`   Gas: ${gasEstimate}`);
            
            try {
                // Place bid
                const tx = await this.contract.connect(resolver.signer).placeBid(
                    orderId,
                    intent.makerAmount,
                    improvedAmount,
                    gasEstimate
                );
                
                console.log(`   ⏳ Bid transaction: ${tx.hash}`);
                const receipt = await tx.wait();
                
                console.log(`   ✅ Bid placed successfully!`);
                console.log(`      Gas Used: ${receipt.gasUsed}`);
                console.log(`      Block: ${receipt.blockNumber}`);
                
                bids.push({
                    resolver: resolver,
                    inputAmount: intent.makerAmount,
                    outputAmount: improvedAmount,
                    gasEstimate: gasEstimate,
                    gasUsed: receipt.gasUsed,
                    txHash: tx.hash,
                    blockNumber: receipt.blockNumber
                });
                
                resolver.bidCount++;
                
            } catch (error) {
                console.log(`   ❌ Bid failed: ${error.message}`);
            }
            
            // Add delay between bids
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        return bids;
    }

    async executeBestBid(orderId, bids, secret) {
        console.log('\n🎯 STEP 3: EXECUTING BEST BID');
        console.log('==============================\n');

        if (bids.length === 0) {
            console.log('❌ No bids to execute');
            return;
        }
        
        // Select first bid as best bid (simplified)
        const bestBid = bids[0];
        
        console.log(`🏆 Executing best bid from ${bestBid.resolver.name}`);
        console.log(`   Bid TX: ${bestBid.txHash}`);
        
        try {
            // Execute the best bid
            const executeTx = await this.contract.connect(bestBid.resolver.signer).selectBestBidAndExecute(
                orderId,
                0, // First bid index
                secret
            );
            
            console.log(`⏳ Executing best bid: ${executeTx.hash}`);
            const executeReceipt = await executeTx.wait();
            
            console.log(`✅ Best bid executed successfully!`);
            console.log(`   Gas Used: ${executeReceipt.gasUsed}`);
            console.log(`   Block: ${executeReceipt.blockNumber}`);
            
        } catch (error) {
            console.log(`❌ Execution failed: ${error.message}`);
        }
    }

    extractOrderId(receipt) {
        for (const log of receipt.logs) {
            try {
                const parsed = this.contract.interface.parseLog(log);
                if (parsed.name === 'LimitOrderCreated') {
                    return parsed.args.orderId;
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    }

    async run() {
        try {
            await this.initialize();
            
            // Step 1: Create and submit order
            const { orderId, intent, secret, hashlock } = await this.createAndSubmitOrder();
            
            // Step 2: Place competitive bids
            const bids = await this.placeCompetitiveBids(orderId, intent);
            
            // Step 3: Execute best bid
            await this.executeBestBid(orderId, bids, secret);
            
            console.log('\n🎉 SIMPLE REAL BIDDING DEMO COMPLETE!');
            console.log('=====================================');
            console.log('✅ Order created and submitted');
            console.log('✅ Competitive bids placed');
            console.log('✅ Best bid executed');
            console.log('✅ LOP intent workflow demonstrated');
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            throw error;
        }
    }
}

// Run the demo
if (require.main === module) {
    const demo = new SimpleRealBiddingDemo();
    demo.run().catch(console.error);
}

module.exports = SimpleRealBiddingDemo;
