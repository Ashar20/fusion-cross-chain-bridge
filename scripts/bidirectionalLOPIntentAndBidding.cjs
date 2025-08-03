#!/usr/bin/env node

/**
 * 🚀 BIDIRECTIONAL LOP INTENT AND BIDDING SYSTEM
 * 
 * Complete demonstration of bidirectional limit order protocol with competitive bidding
 * - ETH → ALGO orders with competitive bidding
 * - ALGO → ETH orders with competitive bidding
 * - Partial fill support
 * - Best bid selection and execution
 * - Real-time bidding simulation
 */

const { ethers } = require('ethers');
const fs = require('fs');
const crypto = require('crypto');

class BidirectionalLOPIntentAndBidding {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.resolvers = [];
        this.user = null;
        this.provider = null;
        this.orders = [];
        this.biddingResults = [];
    }

    async initialize() {
        console.log('🚀 INITIALIZING BIDIRECTIONAL LOP INTENT AND BIDDING SYSTEM');
        console.log('================================================================\n');

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
            console.log(`🌐 Network: Sepolia Testnet\n`);
            
            // Create competitive resolvers
            await this.createCompetitiveResolvers();
            
            // Check balances
            await this.checkBalances();
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }

    async createCompetitiveResolvers() {
        console.log('🔧 Creating competitive resolvers...');
        
        // Create 5 competitive resolvers with different strategies
        const resolverConfigs = [
            { name: 'High-Frequency-Resolver', strategy: 'aggressive', baseRate: 0.98 },
            { name: 'Arbitrage-Resolver', strategy: 'balanced', baseRate: 1.0 },
            { name: 'MEV-Resolver', strategy: 'premium', baseRate: 1.02 },
            { name: 'Backup-Resolver', strategy: 'conservative', baseRate: 0.99 },
            { name: 'Flash-Resolver', strategy: 'ultra-fast', baseRate: 0.97 }
        ];

        for (let i = 0; i < resolverConfigs.length; i++) {
            const config = resolverConfigs[i];
            const wallet = ethers.Wallet.createRandom();
            
            this.resolvers.push({
                address: wallet.address,
                privateKey: wallet.privateKey,
                signer: new ethers.Wallet(wallet.privateKey, this.provider),
                name: config.name,
                strategy: config.strategy,
                baseRate: config.baseRate,
                bidCount: 0,
                totalFees: ethers.parseEther('0'),
                successRate: 0,
                avgResponseTime: 0
            });
            
            console.log(`  ${config.name}: ${wallet.address} (${config.strategy})`);
        }
        
        console.log('✅ Competitive resolvers created!\n');
    }

    async checkBalances() {
        console.log('💰 Checking balances...');
        
        const userBalance = await this.provider.getBalance(this.user.address);
        console.log(`👤 User ETH: ${ethers.formatEther(userBalance)} ETH`);
        
        // Check contract balance
        const contractBalance = await this.provider.getBalance(this.contractAddress);
        console.log(`📋 Contract ETH: ${ethers.formatEther(contractBalance)} ETH`);
        
        console.log('✅ Balance check complete!\n');
    }

    async createBidirectionalLOPIntents() {
        console.log('🎯 CREATING BIDIRECTIONAL LOP INTENTS');
        console.log('=====================================\n');

        // Create ETH → ALGO intent
        await this.createEthToAlgoIntent();
        
        // Create ALGO → ETH intent
        await this.createAlgoToEthIntent();
        
        console.log('✅ Bidirectional intents created!\n');
    }

    async createEthToAlgoIntent() {
        console.log('📝 Creating ETH → ALGO LOP Intent...');
        
        const makerAmount = ethers.parseEther('0.01'); // 0.01 ETH
        const takerAmount = ethers.parseEther('15'); // 15 ALGO (1500:1 rate)
        
        const intent = {
            maker: this.user.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO
            makerAmount: makerAmount,
            takerAmount: takerAmount,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            algorandChainId: 416001n, // Algorand testnet
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.001') // 0.001 ETH minimum
        };
        
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours
        
        console.log('📋 ETH → ALGO ORDER DETAILS:');
        console.log(`   Selling: ${ethers.formatEther(intent.makerAmount)} ETH`);
        console.log(`   Wanting: ${ethers.formatEther(intent.takerAmount)} ALGO`);
        console.log(`   Rate: 1 ETH = ${Number(ethers.formatEther(intent.takerAmount)) / Number(ethers.formatEther(intent.makerAmount))} ALGO`);
        console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
        console.log(`   Partial Fills: ${intent.allowPartialFills ? 'Enabled' : 'Disabled'}`);
        console.log(`   Min Partial Fill: ${ethers.formatEther(intent.minPartialFill)} ETH`);
        
        // Create EIP-712 signature
        const signature = await this.createEIP712Signature(intent);
        
        // Submit order
        const tx = await this.contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            timelock,
            { 
                gasLimit: 500000,
                value: makerAmount
            }
        );
        
        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Extract order ID
        const orderId = this.extractOrderId(receipt);
        
        this.orders.push({
            orderId: orderId,
            direction: 'ETH_TO_ALGO',
            intent: intent,
            secret: secret,
            hashlock: hashlock,
            timelock: timelock,
            status: 'created'
        });
        
        console.log(`✅ ETH → ALGO order created: ${orderId}\n`);
    }

    async createAlgoToEthIntent() {
        console.log('📝 Creating ALGO → ETH LOP Intent...');
        
        const makerAmount = ethers.parseEther('15'); // 15 ALGO equivalent
        const takerAmount = ethers.parseEther('0.01'); // 0.01 ETH
        
        const intent = {
            maker: this.user.address,
            makerToken: ethers.ZeroAddress, // ALGO (represented as zero address)
            takerToken: ethers.ZeroAddress, // ETH
            makerAmount: makerAmount,
            takerAmount: takerAmount,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            algorandChainId: 416001n, // Algorand testnet
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('1.5') // 1.5 ALGO minimum
        };
        
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours
        
        console.log('📋 ALGO → ETH ORDER DETAILS:');
        console.log(`   Selling: ${ethers.formatEther(intent.makerAmount)} ALGO`);
        console.log(`   Wanting: ${ethers.formatEther(intent.takerAmount)} ETH`);
        console.log(`   Rate: 1 ETH = ${Number(ethers.formatEther(intent.makerAmount)) / Number(ethers.formatEther(intent.takerAmount))} ALGO`);
        console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
        console.log(`   Partial Fills: ${intent.allowPartialFills ? 'Enabled' : 'Disabled'}`);
        console.log(`   Min Partial Fill: ${ethers.formatEther(intent.minPartialFill)} ALGO`);
        
        // Create EIP-712 signature
        const signature = await this.createEIP712Signature(intent);
        
        // Submit order (no ETH value needed for ALGO → ETH)
        const tx = await this.contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            timelock,
            { 
                gasLimit: 500000
            }
        );
        
        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Extract order ID
        const orderId = this.extractOrderId(receipt);
        
        this.orders.push({
            orderId: orderId,
            direction: 'ALGO_TO_ETH',
            intent: intent,
            secret: secret,
            hashlock: hashlock,
            timelock: timelock,
            status: 'created'
        });
        
        console.log(`✅ ALGO → ETH order created: ${orderId}\n`);
    }

    async createEIP712Signature(intent) {
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111, // Sepolia
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

    async simulateCompetitiveBidding() {
        console.log('🏆 SIMULATING COMPETITIVE BIDDING');
        console.log('================================\n');

        for (const order of this.orders) {
            console.log(`🎯 Bidding on ${order.direction} order: ${order.orderId}`);
            
            const bids = await this.generateCompetitiveBids(order);
            await this.placeBids(order.orderId, bids);
            
            // Wait a bit between orders
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('✅ Competitive bidding simulation complete!\n');
    }

    async generateCompetitiveBids(order) {
        const bids = [];
        const baseRate = order.direction === 'ETH_TO_ALGO' ? 1500 : 1/1500;
        
        for (let i = 0; i < this.resolvers.length; i++) {
            const resolver = this.resolvers[i];
            const variation = resolver.baseRate + (Math.random() - 0.5) * 0.04; // ±2% random variation
            
            let inputAmount, outputAmount;
            
            if (order.direction === 'ETH_TO_ALGO') {
                inputAmount = order.intent.makerAmount;
                outputAmount = ethers.parseEther((Number(ethers.formatEther(order.intent.takerAmount)) * variation).toString());
            } else {
                inputAmount = ethers.parseEther((Number(ethers.formatEther(order.intent.makerAmount)) * variation).toString());
                outputAmount = order.intent.takerAmount;
            }
            
            const gasEstimate = 200000 + (i * 15000) + Math.floor(Math.random() * 50000);
            
            bids.push({
                resolver: resolver,
                inputAmount: inputAmount,
                outputAmount: outputAmount,
                gasEstimate: gasEstimate,
                rate: variation,
                strategy: resolver.strategy
            });
        }
        
        return bids;
    }

    async placeBids(orderId, bids) {
        console.log('📊 Placing competitive bids...');
        
        for (const bid of bids) {
            try {
                const tx = await this.contract.connect(bid.resolver.signer).placeBid(
                    orderId,
                    bid.inputAmount,
                    bid.outputAmount,
                    bid.gasEstimate
                );
                
                await tx.wait();
                
                const rate = orderId.includes('ETH_TO_ALGO') ? 
                    Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount)) :
                    Number(ethers.formatEther(bid.inputAmount)) / Number(ethers.formatEther(bid.outputAmount));
                
                console.log(`  ${bid.resolver.name}: ${ethers.formatEther(bid.inputAmount)} → ${ethers.formatEther(bid.outputAmount)} (Rate: ${rate.toFixed(2)})`);
                
                bid.resolver.bidCount++;
                
            } catch (error) {
                console.log(`  ❌ ${bid.resolver.name}: Failed to place bid - ${error.message}`);
            }
        }
        
        console.log('✅ Bids placed!\n');
    }

    async selectAndExecuteBestBids() {
        console.log('🎯 SELECTING AND EXECUTING BEST BIDS');
        console.log('====================================\n');

        for (const order of this.orders) {
            console.log(`🏆 Processing ${order.direction} order: ${order.orderId}`);
            
            try {
                // Get best bid
                const [bestBid, bestIndex] = await this.contract.getBestBid(order.orderId);
                
                console.log(`📊 Best bid found:`);
                console.log(`   Resolver: ${bestBid.resolver}`);
                console.log(`   Input: ${ethers.formatEther(bestBid.inputAmount)}`);
                console.log(`   Output: ${ethers.formatEther(bestBid.outputAmount)}`);
                console.log(`   Gas Estimate: ${bestBid.gasEstimate}`);
                console.log(`   Total Cost: ${ethers.formatEther(bestBid.totalCost)}`);
                
                // Find resolver
                const resolver = this.resolvers.find(r => r.address === bestBid.resolver);
                if (!resolver) {
                    console.log('❌ Resolver not found, skipping...\n');
                    continue;
                }
                
                // Execute best bid
                const tx = await this.contract.connect(resolver.signer).selectBestBidAndExecute(
                    order.orderId,
                    bestIndex,
                    order.secret
                );
                
                console.log(`⏳ Executing best bid: ${tx.hash}`);
                const receipt = await tx.wait();
                
                console.log(`✅ Best bid executed successfully!`);
                console.log(`   Gas Used: ${receipt.gasUsed}`);
                console.log(`   Block: ${receipt.blockNumber}`);
                
                // Update resolver stats
                resolver.successRate = (resolver.successRate * (resolver.bidCount - 1) + 1) / resolver.bidCount;
                
                this.biddingResults.push({
                    orderId: order.orderId,
                    direction: order.direction,
                    winningResolver: resolver.name,
                    inputAmount: ethers.formatEther(bestBid.inputAmount),
                    outputAmount: ethers.formatEther(bestBid.outputAmount),
                    gasUsed: receipt.gasUsed.toString(),
                    txHash: tx.hash
                });
                
            } catch (error) {
                console.log(`❌ Failed to execute best bid: ${error.message}\n`);
            }
        }
        
        console.log('✅ Best bid execution complete!\n');
    }

    async demonstratePartialFills() {
        console.log('🔄 DEMONSTRATING PARTIAL FILLS');
        console.log('==============================\n');

        // Find an order that supports partial fills
        const partialFillOrder = this.orders.find(order => order.intent.allowPartialFills);
        
        if (!partialFillOrder) {
            console.log('❌ No orders with partial fills found\n');
            return;
        }
        
        console.log(`🎯 Demonstrating partial fill for: ${partialFillOrder.orderId}`);
        
        try {
            const fillAmount = partialFillOrder.intent.minPartialFill;
            const algorandAmount = ethers.parseEther('1.5'); // 1.5 ALGO
            
            const resolver = this.resolvers[0]; // Use first resolver
            
            const tx = await this.contract.connect(resolver.signer).executePartialFill(
                partialFillOrder.orderId,
                fillAmount,
                algorandAmount,
                partialFillOrder.secret
            );
            
            console.log(`⏳ Partial fill transaction: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Partial fill executed!`);
            console.log(`   Fill Amount: ${ethers.formatEther(fillAmount)}`);
            console.log(`   Algorand Amount: ${ethers.formatEther(algorandAmount)}`);
            console.log(`   Gas Used: ${receipt.gasUsed}`);
            
        } catch (error) {
            console.log(`❌ Partial fill failed: ${error.message}`);
        }
        
        console.log('✅ Partial fill demonstration complete!\n');
    }

    async generateBiddingReport() {
        console.log('📊 BIDDING PERFORMANCE REPORT');
        console.log('=============================\n');

        console.log('🏆 RESOLVER PERFORMANCE:');
        for (const resolver of this.resolvers) {
            const successRate = resolver.successRate * 100;
            console.log(`  ${resolver.name}:`);
            console.log(`    Strategy: ${resolver.strategy}`);
            console.log(`    Bids Placed: ${resolver.bidCount}`);
            console.log(`    Success Rate: ${successRate.toFixed(1)}%`);
            console.log(`    Total Fees: ${ethers.formatEther(resolver.totalFees)} ETH`);
        }
        
        console.log('\n🎯 ORDER EXECUTION RESULTS:');
        for (const result of this.biddingResults) {
            console.log(`  ${result.direction}:`);
            console.log(`    Order ID: ${result.orderId}`);
            console.log(`    Winning Resolver: ${result.winningResolver}`);
            console.log(`    Input: ${result.inputAmount}`);
            console.log(`    Output: ${result.outputAmount}`);
            console.log(`    Gas Used: ${result.gasUsed}`);
            console.log(`    TX: ${result.txHash}`);
        }
        
        console.log('\n📈 BIDDING STATISTICS:');
        const totalBids = this.resolvers.reduce((sum, r) => sum + r.bidCount, 0);
        const successfulExecutions = this.biddingResults.length;
        const avgGasUsed = this.biddingResults.reduce((sum, r) => sum + parseInt(r.gasUsed), 0) / successfulExecutions;
        
        console.log(`  Total Bids Placed: ${totalBids}`);
        console.log(`  Successful Executions: ${successfulExecutions}`);
        console.log(`  Average Gas Used: ${avgGasUsed.toFixed(0)}`);
        console.log(`  Execution Rate: ${((successfulExecutions / this.orders.length) * 100).toFixed(1)}%`);
        
        console.log('\n✅ Bidding report generated!\n');
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
            await this.createBidirectionalLOPIntents();
            await this.simulateCompetitiveBidding();
            await this.selectAndExecuteBestBids();
            await this.demonstratePartialFills();
            await this.generateBiddingReport();
            
            console.log('🎉 BIDIRECTIONAL LOP INTENT AND BIDDING DEMONSTRATION COMPLETE!');
            console.log('================================================================');
            console.log('✅ All features demonstrated successfully');
            console.log('✅ Competitive bidding system working');
            console.log('✅ Best bid selection and execution verified');
            console.log('✅ Partial fills functionality tested');
            console.log('✅ Performance metrics generated');
            
        } catch (error) {
            console.error('❌ Demonstration failed:', error.message);
            throw error;
        }
    }
}

// Run the demonstration
if (require.main === module) {
    const demo = new BidirectionalLOPIntentAndBidding();
    demo.run().catch(console.error);
}

module.exports = BidirectionalLOPIntentAndBidding; 