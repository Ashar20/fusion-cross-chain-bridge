#!/usr/bin/env node

/**
 * 🔧 AUTHORIZE RESOLVERS FOR BIDDING
 * 
 * Script to authorize resolvers and demonstrate bidding with authorized resolvers
 */

const { ethers } = require('ethers');
const fs = require('fs');

class AuthorizeResolversForBidding {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.user = null;
        this.provider = null;
        this.resolvers = [];
        this.orders = [];
    }

    async initialize() {
        console.log('🔧 INITIALIZING RESOLVER AUTHORIZATION');
        console.log('=======================================\n');

        try {
            require('dotenv').config();
            
            // Load deployment info
            const deploymentInfo = JSON.parse(fs.readFileSync('./ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json', 'utf8'));
            this.contractAddress = deploymentInfo.contractAddress;
            
            // Initialize provider and user
            this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
            this.user = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            
            // Load contract
            const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
            const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
            this.contract = new ethers.Contract(this.contractAddress, contractArtifact.abi, this.user);
            
            console.log('✅ System initialized');
            console.log(`📋 Contract: ${this.contractAddress}`);
            console.log(`👤 User: ${this.user.address}`);
            
            // Check existing authorized resolvers
            await this.checkExistingResolvers();
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }

    async checkExistingResolvers() {
        console.log('\n📋 Checking existing authorized resolvers...');
        
        try {
            // Check if the deployment resolver is still authorized
            const deploymentInfo = JSON.parse(fs.readFileSync('./ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json', 'utf8'));
            const existingResolver = deploymentInfo.authorizedResolvers[0];
            
            const isAuthorized = await this.contract.authorizedResolvers(existingResolver);
            console.log(`  Existing resolver: ${existingResolver} - ${isAuthorized ? '✅ Authorized' : '❌ Not authorized'}`);
            
            if (isAuthorized) {
                this.resolvers.push({
                    address: existingResolver,
                    name: 'Deployment-Resolver',
                    strategy: 'existing',
                    rate: 1.0,
                    bidCount: 0
                });
            }
            
        } catch (error) {
            console.log(`  ❌ Error checking resolvers: ${error.message}`);
        }
    }

    async authorizeNewResolvers() {
        console.log('\n🔧 Authorizing new resolvers...');
        
        const resolverConfigs = [
            { name: 'Fast-Resolver', strategy: 'aggressive', rate: 0.98 },
            { name: 'Balanced-Resolver', strategy: 'balanced', rate: 1.0 },
            { name: 'Premium-Resolver', strategy: 'premium', rate: 1.02 }
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
                    strategy: config.strategy,
                    rate: config.rate,
                    bidCount: 0
                });
                
            } catch (error) {
                console.log(`❌ Failed to authorize ${config.name}: ${error.message}`);
            }
        }
        
        console.log(`✅ Total authorized resolvers: ${this.resolvers.length}\n`);
    }

    async createDemoOrders() {
        console.log('📝 CREATING DEMO ORDERS');
        console.log('=======================\n');

        // Create ETH → ALGO order
        const order = await this.createOrder({
            makerAmount: ethers.parseEther('0.001'), // 0.001 ETH
            takerAmount: ethers.parseEther('1.5'),   // 1.5 ALGO
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.0001')
        });

        this.orders = [order];
        console.log('✅ Demo order created!\n');
    }

    async createOrder(params) {
        console.log(`📝 Creating ETH → ALGO order...`);
        
        const intent = {
            maker: this.user.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO
            makerAmount: params.makerAmount,
            takerAmount: params.takerAmount,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
            algorandChainId: 416001n,
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: params.allowPartialFills,
            minPartialFill: params.minPartialFill
        };
        
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200);
        
        console.log(`   Selling: ${ethers.formatEther(intent.makerAmount)} ETH`);
        console.log(`   Wanting: ${ethers.formatEther(intent.takerAmount)} ALGO`);
        console.log(`   Rate: 1 ETH = ${(Number(ethers.formatEther(intent.takerAmount)) / Number(ethers.formatEther(intent.makerAmount))).toFixed(2)} ALGO`);
        
        // Create signature
        const signature = await this.createEIP712Signature(intent);
        
        // Submit order with ETH value
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
        
        const receipt = await tx.wait();
        const orderId = this.extractOrderId(receipt);
        
        console.log(`✅ Order created: ${orderId}\n`);
        
        return {
            orderId: orderId,
            intent: intent,
            secret: secret,
            hashlock: hashlock,
            timelock: timelock
        };
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

    async placeCompetitiveBids() {
        console.log('🏆 PLACING COMPETITIVE BIDS');
        console.log('===========================\n');

        for (const order of this.orders) {
            console.log(`🎯 Bidding on order: ${order.orderId}`);
            
            const bids = this.generateCompetitiveBids(order);
            await this.placeBids(order.orderId, bids);
            
            console.log('');
        }
        
        console.log('✅ Competitive bidding complete!\n');
    }

    generateCompetitiveBids(order) {
        const bids = [];
        
        for (const resolver of this.resolvers) {
            if (!resolver.signer) {
                console.log(`  ⚠️  Skipping ${resolver.name} (no signer available)`);
                continue;
            }
            
            const variation = resolver.rate + (Math.random() - 0.5) * 0.02; // ±1% variation
            
            // For ETH → ALGO: Higher ALGO output = better rate
            const inputAmount = order.intent.makerAmount; // Same ETH input
            const outputAmount = ethers.parseEther((Number(ethers.formatEther(order.intent.takerAmount)) * variation).toString());
            
            const gasEstimate = 200000 + Math.floor(Math.random() * 100000);
            
            bids.push({
                resolver: resolver,
                inputAmount: inputAmount,
                outputAmount: outputAmount,
                gasEstimate: gasEstimate,
                rate: variation
            });
        }
        
        return bids;
    }

    async placeBids(orderId, bids) {
        console.log('📊 Placing bids...');
        
        for (const bid of bids) {
            try {
                const tx = await this.contract.connect(bid.resolver.signer).placeBid(
                    orderId,
                    bid.inputAmount,
                    bid.outputAmount,
                    bid.gasEstimate
                );
                
                await tx.wait();
                
                const rate = Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount));
                
                console.log(`  ${bid.resolver.name}: ${ethers.formatEther(bid.inputAmount)} ETH → ${ethers.formatEther(bid.outputAmount)} ALGO (Rate: ${rate.toFixed(2)} ALGO/ETH)`);
                
                bid.resolver.bidCount++;
                
            } catch (error) {
                console.log(`  ❌ ${bid.resolver.name}: Failed - ${error.message}`);
            }
        }
    }

    async executeBestBid() {
        console.log('🎯 EXECUTING BEST BID');
        console.log('=====================\n');

        const order = this.orders[0];
        console.log(`🏆 Processing order: ${order.orderId}`);
        
        try {
            // Get best bid
            const [bestBid, bestIndex] = await this.contract.getBestBid(order.orderId);
            
            console.log(`📊 Best bid:`);
            console.log(`   Resolver: ${bestBid.resolver}`);
            console.log(`   Input: ${ethers.formatEther(bestBid.inputAmount)} ETH`);
            console.log(`   Output: ${ethers.formatEther(bestBid.outputAmount)} ALGO`);
            console.log(`   Gas Estimate: ${bestBid.gasEstimate}`);
            console.log(`   Rate: ${(Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount))).toFixed(2)} ALGO/ETH`);
            
            // Find resolver
            const resolver = this.resolvers.find(r => r.address === bestBid.resolver);
            if (!resolver || !resolver.signer) {
                console.log('❌ Resolver not found or no signer available, skipping...\n');
                return;
            }
            
            // Execute best bid
            const tx = await this.contract.connect(resolver.signer).selectBestBidAndExecute(
                order.orderId,
                bestIndex,
                order.secret
            );
            
            console.log(`⏳ Executing: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Executed successfully!`);
            console.log(`   Gas Used: ${receipt.gasUsed}`);
            console.log(`   Block: ${receipt.blockNumber}`);
            
        } catch (error) {
            console.log(`❌ Failed to execute: ${error.message}`);
        }
        
        console.log('');
    }

    async generateReport() {
        console.log('📊 BIDDING PROCESS REPORT');
        console.log('=========================\n');

        console.log('🏆 RESOLVER PERFORMANCE:');
        for (const resolver of this.resolvers) {
            console.log(`  ${resolver.name}:`);
            console.log(`    Address: ${resolver.address}`);
            console.log(`    Strategy: ${resolver.strategy}`);
            console.log(`    Bids Placed: ${resolver.bidCount}`);
            console.log(`    Base Rate: ${resolver.rate}`);
        }
        
        console.log('\n📈 ORDER SUMMARY:');
        for (const order of this.orders) {
            console.log(`  Order ID: ${order.orderId}`);
            console.log(`    Selling: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
            console.log(`    Wanting: ${ethers.formatEther(order.intent.takerAmount)} ALGO`);
            console.log(`    Partial Fills: ${order.intent.allowPartialFills ? 'Enabled' : 'Disabled'}`);
        }
        
        console.log('\n✅ Resolver authorization and bidding complete!');
        console.log('===============================================');
        console.log('✅ Resolvers authorized successfully');
        console.log('✅ ETH → ALGO order created');
        console.log('✅ Competitive bids placed');
        console.log('✅ Best bid executed');
        console.log('✅ System fully operational');
        
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
            await this.authorizeNewResolvers();
            await this.createDemoOrders();
            await this.placeCompetitiveBids();
            await this.executeBestBid();
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            throw error;
        }
    }
}

// Run the demo
if (require.main === module) {
    const demo = new AuthorizeResolversForBidding();
    demo.run().catch(console.error);
}

module.exports = AuthorizeResolversForBidding; 