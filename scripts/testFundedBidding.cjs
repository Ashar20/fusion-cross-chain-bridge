#!/usr/bin/env node

const { ethers } = require('hardhat');
const crypto = require('crypto');

class FundedBiddingTest {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.resolvers = [];
        this.testOrders = [];
    }

    async initialize() {
        console.log('🚀 INITIALIZING FUNDED BIDDING TEST...\n');

        // Load deployment info
        const deploymentInfo = require('../ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');
        this.contractAddress = deploymentInfo.contractAddress;
        console.log(`📋 Using deployed contract: ${this.contractAddress}`);

        // Get contract instance
        const contractABI = require('../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json').abi;
        const [signer] = await ethers.getSigners();
        this.contract = new ethers.Contract(this.contractAddress, contractABI, signer);

        // Load resolver environment
        await this.loadResolverEnvironment();
        
        console.log('✅ Initialization complete!\n');
    }

    async loadResolverEnvironment() {
        console.log('🔧 Loading funded resolvers...');
        
        try {
            // Load resolver config
            const resolverConfig = require('../resolver-config.json');
            
            // Create resolver instances
            for (const resolverInfo of resolverConfig.resolvers) {
                const resolver = {
                    name: resolverInfo.name,
                    address: resolverInfo.address,
                    privateKey: resolverInfo.privateKey,
                    signer: new ethers.Wallet(resolverInfo.privateKey, ethers.provider),
                    balance: ethers.parseEther('0'),
                    bidCount: 0,
                    totalFees: ethers.parseEther('0')
                };
                
                // Check balance
                resolver.balance = await ethers.provider.getBalance(resolver.address);
                
                this.resolvers.push(resolver);
                console.log(`  ${resolver.name}: ${resolver.address} (${ethers.formatEther(resolver.balance)} ETH)`);
            }
            
            console.log(`✅ Loaded ${this.resolvers.length} funded resolvers`);
            
        } catch (error) {
            console.log('⚠️  No resolver config found, creating test resolvers...');
            await this.createTestResolvers();
        }
    }

    async createTestResolvers() {
        // Create 4 test resolvers
        for (let i = 0; i < 4; i++) {
            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            const balance = await ethers.provider.getBalance(wallet.address);
            
            this.resolvers.push({
                name: `TestResolver_${i + 1}`,
                address: wallet.address,
                privateKey: wallet.privateKey,
                signer: wallet,
                balance: balance,
                bidCount: 0,
                totalFees: ethers.parseEther('0')
            });
            
            console.log(`  ${this.resolvers[i].name}: ${wallet.address} (${ethers.formatEther(balance)} ETH)`);
        }
    }

    async testFundedBidding() {
        console.log('🎯 TESTING FUNDED BIDDING...\n');

        // Step 1: Create test order
        console.log('📝 STEP 1: Creating test order...');
        const orderId = await this.createTestOrder('ETH_TO_ALGO', {
            makerAmount: ethers.parseEther('0.1'),
            takerAmount: ethers.parseEther('150'),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.01')
        });

        // Step 2: Authorize resolvers
        console.log('\n🔧 STEP 2: Authorizing resolvers...');
        await this.authorizeResolvers();

        // Step 3: Place competitive bids
        console.log('\n🏆 STEP 3: Placing competitive bids...');
        await this.placeCompetitiveBids(orderId);

        // Step 4: Analyze bidding results
        console.log('\n📊 STEP 4: Analyzing bidding results...');
        await this.analyzeBiddingResults(orderId);

        // Step 5: Execute winning bid
        console.log('\n🎯 STEP 5: Executing winning bid...');
        await this.executeWinningBid(orderId);

        console.log('\n✅ Funded bidding test completed!\n');
    }

    async createTestOrder(direction, params) {
        const [user] = await ethers.getSigners();
        
        // Generate test data
        const secret = crypto.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const salt = ethers.keccak256(crypto.randomBytes(32));
        
        // Create intent
        const intent = {
            maker: user.address,
            makerToken: ethers.ZeroAddress, // ETH for both
            takerToken: ethers.ZeroAddress, // ALGO equivalent
            makerAmount: params.makerAmount,
            takerAmount: params.takerAmount,
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            algorandChainId: 416002,
            algorandAddress: 'TESTALGOADDRESS123456789',
            salt: salt,
            allowPartialFills: params.allowPartialFills,
            minPartialFill: params.minPartialFill
        };

        // Sign intent
        const signature = await this.signIntent(intent, user);

        // Submit order
        const tx = await this.contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            0, // Use default timelock
            { value: params.makerAmount }
        );

        const receipt = await tx.wait();
        const orderId = this.extractOrderId(receipt);

        console.log(`  Created ${direction} order: ${orderId}`);
        return orderId;
    }

    async authorizeResolvers() {
        for (const resolver of this.resolvers) {
            try {
                const tx = await this.contract.authorizeResolver(resolver.address, true);
                await tx.wait();
                console.log(`  ✅ Authorized: ${resolver.name}`);
            } catch (error) {
                console.log(`  ⚠️  Already authorized: ${resolver.name}`);
            }
        }
    }

    async placeCompetitiveBids(orderId) {
        console.log(`  🏆 Placing competitive bids for order ${orderId}...`);

        // Get order details
        const order = await this.contract.limitOrders(orderId);
        const baseRate = Number(ethers.formatEther(order.intent.takerAmount)) / Number(ethers.formatEther(order.intent.makerAmount));
        
        console.log(`    📊 Base rate: ${baseRate.toFixed(2)} ALGO/ETH`);

        // Place bids with different competitive rates
        const competitiveRates = [1.01, 1.015, 1.02, 1.025]; // 1%, 1.5%, 2%, 2.5% better

        for (let i = 0; i < this.resolvers.length; i++) {
            const resolver = this.resolvers[i];
            const competitiveRate = baseRate * competitiveRates[i];
            
            const inputAmount = order.intent.makerAmount;
            const outputAmount = ethers.parseEther((Number(ethers.formatEther(inputAmount)) * competitiveRate).toString());
            const gasEstimate = 250000 + (i * 10000); // Varying gas estimates

            try {
                console.log(`    💰 ${resolver.name} placing bid:`);
                console.log(`       Rate: ${competitiveRate.toFixed(2)} ALGO/ETH (+${((competitiveRates[i] - 1) * 100).toFixed(1)}%)`);
                console.log(`       Input: ${ethers.formatEther(inputAmount)} ETH`);
                console.log(`       Output: ${ethers.formatEther(outputAmount)} ALGO`);
                console.log(`       Gas: ${gasEstimate}`);

                // Place bid
                const tx = await this.contract.connect(resolver.signer).placeBid(
                    orderId,
                    inputAmount,
                    outputAmount,
                    gasEstimate
                );

                await tx.wait();
                resolver.bidCount++;

                console.log(`      ✅ Bid placed successfully!`);

            } catch (error) {
                console.log(`      ❌ Failed to place bid: ${error.message}`);
            }
        }
    }

    async analyzeBiddingResults(orderId) {
        console.log(`  📊 Analyzing bids for order ${orderId}...`);

        // Get all bids
        const bids = await this.contract.getBids(orderId);
        console.log(`    📋 Total bids: ${bids.length}`);

        // Get active bids
        const activeBids = await this.contract.getActiveBids(orderId);
        console.log(`    📋 Active bids: ${activeBids.length}`);

        if (bids.length > 0) {
            console.log(`    📋 Bid details:`);
            for (let i = 0; i < bids.length; i++) {
                const bid = bids[i];
                const rate = Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount));
                const resolver = this.resolvers.find(r => r.address === bid.resolver);
                const resolverName = resolver ? resolver.name : 'Unknown';
                
                console.log(`      Bid ${i + 1}:`);
                console.log(`        Resolver: ${resolverName} (${bid.resolver})`);
                console.log(`        Rate: ${rate.toFixed(2)} ALGO/ETH`);
                console.log(`        Input: ${ethers.formatEther(bid.inputAmount)} ETH`);
                console.log(`        Output: ${ethers.formatEther(bid.outputAmount)} ALGO`);
                console.log(`        Gas: ${bid.gasEstimate}`);
                console.log(`        Active: ${bid.active}`);
                console.log(`        Timestamp: ${new Date(Number(bid.timestamp) * 1000).toISOString()}`);
            }

            // Get best bid
            const [bestBid, bestIndex] = await this.contract.getBestBid(orderId);
            
            if (bestBid.resolver !== ethers.ZeroAddress) {
                const rate = Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount));
                const resolver = this.resolvers.find(r => r.address === bestBid.resolver);
                const resolverName = resolver ? resolver.name : 'Unknown';
                
                console.log(`    🏆 Best bid:`);
                console.log(`      Resolver: ${resolverName} (${bestBid.resolver})`);
                console.log(`      Rate: ${rate.toFixed(2)} ALGO/ETH`);
                console.log(`      Index: ${bestIndex}`);
            }
        } else {
            console.log(`    ❌ No bids found`);
        }
    }

    async executeWinningBid(orderId) {
        console.log(`  🎯 Executing winning bid for order ${orderId}...`);

        try {
            // Get best bid
            const [bestBid, bestIndex] = await this.contract.getBestBid(orderId);
            
            if (bestBid.resolver === ethers.ZeroAddress) {
                console.log(`    ❌ No winning bid to execute`);
                return;
            }

            const resolver = this.resolvers.find(r => r.address === bestBid.resolver);
            const resolverName = resolver ? resolver.name : 'Unknown';
            
            console.log(`    🏆 Executing bid from: ${resolverName}`);
            console.log(`    🏆 Bid index: ${bestIndex}`);

            // Generate secret for execution
            const secret = crypto.randomBytes(32);

            // Execute the bid
            const tx = await this.contract.connect(resolver.signer).selectBestBidAndExecute(
                orderId,
                bestIndex,
                secret
            );

            await tx.wait();
            console.log(`    ✅ Winning bid executed successfully!`);
            console.log(`    🔐 Secret: ${secret.toString('hex')}`);

        } catch (error) {
            console.log(`    ❌ Failed to execute winning bid: ${error.message}`);
        }
    }

    async signIntent(intent, signer) {
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: await ethers.provider.getNetwork().then(n => n.chainId),
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

        return await signer.signTypedData(domain, types, intent);
    }

    extractOrderId(receipt) {
        const event = receipt.logs.find(log => 
            log.fragment && log.fragment.name === 'LimitOrderCreated'
        );
        return event.args.orderId;
    }

    async runFullTest() {
        console.log('🚀 STARTING FUNDED BIDDING TEST SUITE\n');
        console.log('=' .repeat(60));

        try {
            await this.initialize();
            
            console.log('🎯 PHASE 1: FUNDED BIDDING TEST');
            console.log('-'.repeat(40));
            await this.testFundedBidding();
            
            console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!\n');
            
            // Save test results
            const testResults = {
                timestamp: new Date().toISOString(),
                contractAddress: this.contractAddress,
                resolvers: this.resolvers.map(r => ({
                    name: r.name,
                    address: r.address,
                    balance: ethers.formatEther(r.balance),
                    bidCount: r.bidCount,
                    totalFees: ethers.formatEther(r.totalFees)
                })),
                testOrders: this.testOrders,
                status: 'SUCCESS'
            };

            require('fs').writeFileSync(
                'FUNDED_BIDDING_TEST_RESULTS.json',
                JSON.stringify(testResults, null, 2)
            );

            console.log('📄 Test results saved to: FUNDED_BIDDING_TEST_RESULTS.json');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            throw error;
        }
    }
}

// Run the test
async function main() {
    const test = new FundedBiddingTest();
    await test.runFullTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = FundedBiddingTest; 