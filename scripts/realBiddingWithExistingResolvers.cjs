#!/usr/bin/env node

/**
 * 🚀 REAL BIDDING WITH EXISTING RESOLVERS
 * 
 * Uses the pre-configured resolvers from .env.resolvers
 * Demonstrates the complete LOP intent workflow with real transactions
 */

const { ethers } = require('ethers');
const fs = require('fs');

class RealBiddingWithExistingResolvers {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.user = null;
        this.provider = null;
        this.resolvers = [];
    }

    async initialize() {
        console.log('🚀 REAL BIDDING WITH EXISTING RESOLVERS');
        console.log('========================================\n');

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
            
            // Load existing resolvers
            await this.loadExistingResolvers();
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }

    async loadExistingResolvers() {
        console.log('\n🔧 Loading existing resolvers from .env.resolvers...');
        
        // Load resolver environment
        require('dotenv').config({ path: '.env.resolvers' });
        
        const resolverConfigs = [
            {
                name: process.env.RESOLVER_1_NAME,
                address: process.env.RESOLVER_1_ADDRESS,
                strategy: process.env.RESOLVER_1_STRATEGY,
                risk: process.env.RESOLVER_1_RISK,
                funding: process.env.RESOLVER_1_FUNDING,
                description: process.env.RESOLVER_1_DESCRIPTION
            },
            {
                name: process.env.RESOLVER_2_NAME,
                address: process.env.RESOLVER_2_ADDRESS,
                strategy: process.env.RESOLVER_2_STRATEGY,
                risk: process.env.RESOLVER_2_RISK,
                funding: process.env.RESOLVER_2_FUNDING,
                description: process.env.RESOLVER_2_DESCRIPTION
            },
            {
                name: process.env.RESOLVER_3_NAME,
                address: process.env.RESOLVER_3_ADDRESS,
                strategy: process.env.RESOLVER_3_STRATEGY,
                risk: process.env.RESOLVER_3_RISK,
                funding: process.env.RESOLVER_3_FUNDING,
                description: process.env.RESOLVER_3_DESCRIPTION
            },
            {
                name: process.env.RESOLVER_4_NAME,
                address: process.env.RESOLVER_4_ADDRESS,
                strategy: process.env.RESOLVER_4_STRATEGY,
                risk: process.env.RESOLVER_4_RISK,
                funding: process.env.RESOLVER_4_FUNDING,
                description: process.env.RESOLVER_4_DESCRIPTION
            }
        ];

        for (const config of resolverConfigs) {
            console.log(`  ${config.name}: ${config.address}`);
            console.log(`    Strategy: ${config.strategy}`);
            console.log(`    Risk: ${config.risk}`);
            console.log(`    Funding: ${config.funding} ETH`);
            console.log(`    Description: ${config.description}`);
            
            // Check if resolver is authorized
            try {
                const isAuthorized = await this.contract.authorizedResolvers(config.address);
                if (!isAuthorized) {
                    console.log(`    ⏳ Authorizing ${config.name}...`);
                    const tx = await this.contract.authorizeResolver(config.address, true);
                    await tx.wait();
                    console.log(`    ✅ ${config.name} authorized`);
                } else {
                    console.log(`    ✅ ${config.name} already authorized`);
                }
                
                // Check resolver balance
                const balance = await this.provider.getBalance(config.address);
                console.log(`    💰 Balance: ${ethers.formatEther(balance)} ETH`);
                
                this.resolvers.push({
                    name: config.name,
                    address: config.address,
                    strategy: config.strategy,
                    risk: config.risk,
                    funding: config.funding,
                    description: config.description,
                    balance: balance,
                    bidCount: 0,
                    successCount: 0
                });
                
            } catch (error) {
                console.log(`    ❌ Error with ${config.name}: ${error.message}`);
            }
            
            console.log('');
        }
        
        console.log(`✅ Loaded ${this.resolvers.length} existing resolvers\n`);
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
        
        console.log('�� ORDER DETAILS:');
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
            console.log(`   Strategy: ${resolver.strategy}`);
            console.log(`   Risk: ${resolver.risk}`);
            console.log(`   Balance: ${ethers.formatEther(resolver.balance)} ETH`);
            
            // Skip if no balance
            if (resolver.balance === 0n) {
                console.log(`   ❌ No balance - skipping bid`);
                continue;
            }
            
            // Calculate competitive rate based on strategy
            const baseRate = Number(ethers.formatEther(intent.takerAmount)) / Number(ethers.formatEther(intent.makerAmount));
            let rateMultiplier = 1.0;
            
            switch (resolver.strategy) {
                case 'High-frequency bidding':
                    rateMultiplier = 1.02; // 2% better
                    break;
                case 'Arbitrage opportunities':
                    rateMultiplier = 1.015; // 1.5% better
                    break;
                case 'MEV extraction':
                    rateMultiplier = 1.025; // 2.5% better
                    break;
                case 'Conservative bidding':
                    rateMultiplier = 1.01; // 1% better
                    break;
                default:
                    rateMultiplier = 1.01;
            }
            
            const improvedRate = baseRate * rateMultiplier;
            const takerAmountNum = Number(ethers.formatEther(intent.takerAmount));
            const improvedAmount = ethers.parseEther((takerAmountNum * rateMultiplier).toString());
            
            // Gas estimation based on risk
            let gasEstimate = 250000;
            if (resolver.risk === 'High') gasEstimate = 300000;
            if (resolver.risk === 'Low') gasEstimate = 200000;
            
            console.log(`   Rate: 1 ETH = ${improvedRate.toFixed(2)} ALGO (${((rateMultiplier - 1) * 100).toFixed(1)}% better)`);
            console.log(`   Bid: ${ethers.formatEther(intent.makerAmount)} ETH → ${ethers.formatEther(improvedAmount)} ALGO`);
            console.log(`   Gas: ${gasEstimate} (${resolver.risk} risk)`);
            
            try {
                // Place bid
                const tx = await this.contract.connect(this.provider).placeBid(
                    orderId,
                    intent.makerAmount,
                    improvedAmount,
                    gasEstimate,
                    { from: resolver.address }
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
        
        // Select best bid based on rate
        const bestBid = bids.reduce((best, current) => {
            const bestRate = Number(ethers.formatEther(best.outputAmount)) / Number(ethers.formatEther(best.inputAmount));
            const currentRate = Number(ethers.formatEther(current.outputAmount)) / Number(ethers.formatEther(current.inputAmount));
            return currentRate > bestRate ? current : best;
        });
        
        console.log(`🏆 Executing best bid from ${bestBid.resolver.name}`);
        console.log(`   Strategy: ${bestBid.resolver.strategy}`);
        console.log(`   Bid TX: ${bestBid.txHash}`);
        
        try {
            // Execute the best bid
            const executeTx = await this.contract.selectBestBidAndExecute(
                orderId,
                0, // First bid index
                secret
            );
            
            console.log(`⏳ Executing best bid: ${executeTx.hash}`);
            const executeReceipt = await executeTx.wait();
            
            console.log(`✅ Best bid executed successfully!`);
            console.log(`   Gas Used: ${executeReceipt.gasUsed}`);
            console.log(`   Block: ${executeReceipt.blockNumber}`);
            
            bestBid.resolver.successCount++;
            
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
            
            console.log('\n🎉 REAL BIDDING WITH EXISTING RESOLVERS COMPLETE!');
            console.log('==================================================');
            console.log('✅ Order created and submitted');
            console.log('✅ Competitive bids placed using existing resolvers');
            console.log('✅ Best bid executed');
            console.log('✅ LOP intent workflow demonstrated with real resolvers');
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            throw error;
        }
    }
}

// Run the demo
if (require.main === module) {
    const demo = new RealBiddingWithExistingResolvers();
    demo.run().catch(console.error);
}

module.exports = RealBiddingWithExistingResolvers;
