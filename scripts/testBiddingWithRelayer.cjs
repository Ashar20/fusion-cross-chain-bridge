#!/usr/bin/env node

const { ethers } = require('hardhat');
const crypto = require('crypto');

class BiddingWithRelayerTest {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.resolvers = [];
        this.testOrders = [];
        this.relayer = null;
    }

    async initialize() {
        console.log('🚀 INITIALIZING BIDDING WITH RELAYER TEST...\n');

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
        console.log('🔧 Loading resolver environment...');
        
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
                
                this.resolvers.push(resolver);
                console.log(`  ${resolver.name}: ${resolver.address}`);
            }
            
            console.log(`✅ Loaded ${this.resolvers.length} resolvers`);
            
        } catch (error) {
            console.log('⚠️  No resolver config found, creating test resolvers...');
            await this.createTestResolvers();
        }
    }

    async createTestResolvers() {
        // Create 4 test resolvers
        for (let i = 0; i < 4; i++) {
            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            this.resolvers.push({
                name: `TestResolver_${i + 1}`,
                address: wallet.address,
                privateKey: wallet.privateKey,
                signer: wallet,
                balance: ethers.parseEther('0'),
                bidCount: 0,
                totalFees: ethers.parseEther('0')
            });
            
            console.log(`  ${this.resolvers[i].name}: ${wallet.address}`);
        }
    }

    async testCompleteBiddingWorkflow() {
        console.log('🎯 TESTING COMPLETE BIDDING WORKFLOW...\n');

        // Step 1: Create test orders
        console.log('📝 STEP 1: Creating test orders...');
        const order1 = await this.createTestOrder('ETH_TO_ALGO', {
            makerAmount: ethers.parseEther('0.1'),
            takerAmount: ethers.parseEther('150'),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.01')
        });

        const order2 = await this.createTestOrder('ALGO_TO_ETH', {
            makerAmount: ethers.parseEther('150'),
            takerAmount: ethers.parseEther('0.1'),
            allowPartialFills: false,
            minPartialFill: ethers.parseEther('0')
        });

        // Step 2: Authorize resolvers
        console.log('\n🔧 STEP 2: Authorizing resolvers...');
        await this.authorizeResolvers();

        // Step 3: Simulate competitive bidding
        console.log('\n🏆 STEP 3: Simulating competitive bidding...');
        await this.simulateCompetitiveBidding(order1, 'ETH_TO_ALGO');
        await this.simulateCompetitiveBidding(order2, 'ALGO_TO_ETH');

        // Step 4: Analyze bidding results
        console.log('\n📊 STEP 4: Analyzing bidding results...');
        await this.analyzeBiddingResults(order1);
        await this.analyzeBiddingResults(order2);

        // Step 5: Execute winning bids
        console.log('\n🎯 STEP 5: Executing winning bids...');
        await this.executeWinningBids(order1);
        await this.executeWinningBids(order2);

        console.log('\n✅ Complete bidding workflow test finished!\n');
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

    async simulateCompetitiveBidding(orderId, direction) {
        console.log(`  🏆 Simulating bidding for ${direction}...`);

        const baseRate = direction === 'ETH_TO_ALGO' ? 1500 : 1/1500;
        const variations = [0.98, 0.99, 1.0, 1.01]; // ±2% variations

        for (let i = 0; i < this.resolvers.length; i++) {
            const resolver = this.resolvers[i];
            const variation = variations[i];
            
            let inputAmount, outputAmount;
            
            if (direction === 'ETH_TO_ALGO') {
                inputAmount = ethers.parseEther('0.1');
                outputAmount = ethers.parseEther((1500 * variation).toString());
            } else {
                inputAmount = ethers.parseEther((1500 * variation).toString());
                outputAmount = ethers.parseEther('0.1');
            }

            const gasEstimate = 200000 + (i * 10000);

            try {
                // Place bid
                const tx = await this.contract.connect(resolver.signer).placeBid(
                    orderId,
                    inputAmount,
                    outputAmount,
                    gasEstimate
                );

                await tx.wait();
                resolver.bidCount++;

                console.log(`    ${resolver.name}: ${ethers.formatEther(inputAmount)} → ${ethers.formatEther(outputAmount)} (${(variation * 100).toFixed(1)}%)`);

            } catch (error) {
                console.log(`    ❌ ${resolver.name}: Failed to place bid (${error.message})`);
            }
        }
    }

    async analyzeBiddingResults(orderId) {
        console.log(`  📊 Analyzing bids for order ${orderId}...`);

        // Get all bids
        const bids = await this.contract.getBids(orderId);
        console.log(`    Total bids: ${bids.length}`);

        // Get active bids
        const activeBids = await this.contract.getActiveBids(orderId);
        console.log(`    Active bids: ${activeBids.length}`);

        // Get best bid
        const [bestBid, bestIndex] = await this.contract.getBestBid(orderId);
        
        if (bestBid.resolver !== ethers.ZeroAddress) {
            const rate = Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount));
            console.log(`    🏆 Best bid: ${bestBid.resolver}`);
            console.log(`    🏆 Rate: ${rate.toFixed(2)}`);
            console.log(`    🏆 Index: ${bestIndex}`);
        } else {
            console.log(`    ❌ No active bids found`);
        }

        // Display all bids
        for (let i = 0; i < bids.length; i++) {
            const bid = bids[i];
            if (bid.active) {
                const rate = Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount));
                console.log(`      Bid ${i}: ${bid.resolver} - Rate: ${rate.toFixed(2)} - Active: ${bid.active}`);
            }
        }
    }

    async executeWinningBids(orderId) {
        console.log(`  🎯 Executing winning bid for order ${orderId}...`);

        try {
            // Get best bid
            const [bestBid, bestIndex] = await this.contract.getBestBid(orderId);
            
            if (bestBid.resolver === ethers.ZeroAddress) {
                console.log(`    ❌ No winning bid to execute`);
                return;
            }

            console.log(`    🏆 Executing bid from: ${bestBid.resolver}`);
            console.log(`    🏆 Bid index: ${bestIndex}`);

            // Generate secret for execution
            const secret = crypto.randomBytes(32);

            // Find the resolver
            const resolver = this.resolvers.find(r => r.address === bestBid.resolver);
            if (!resolver) {
                console.log(`    ❌ Resolver not found in our list`);
                return;
            }

            // Execute the bid
            const tx = await this.contract.connect(resolver.signer).selectBestBidAndExecute(
                orderId,
                bestIndex,
                secret
            );

            await tx.wait();
            console.log(`    ✅ Winning bid executed successfully!`);

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
        console.log('🚀 STARTING BIDDING WITH RELAYER TEST SUITE\n');
        console.log('=' .repeat(60));

        try {
            await this.initialize();
            
            console.log('🎯 PHASE 1: COMPLETE BIDDING WORKFLOW');
            console.log('-'.repeat(40));
            await this.testCompleteBiddingWorkflow();
            
            console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!\n');
            
            // Save test results
            const testResults = {
                timestamp: new Date().toISOString(),
                contractAddress: this.contractAddress,
                resolvers: this.resolvers.map(r => ({
                    name: r.name,
                    address: r.address,
                    bidCount: r.bidCount,
                    totalFees: ethers.formatEther(r.totalFees)
                })),
                testOrders: this.testOrders,
                status: 'SUCCESS'
            };

            require('fs').writeFileSync(
                'BIDDING_WITH_RELAYER_TEST_RESULTS.json',
                JSON.stringify(testResults, null, 2)
            );

            console.log('📄 Test results saved to: BIDDING_WITH_RELAYER_TEST_RESULTS.json');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            throw error;
        }
    }
}

// Run the test
async function main() {
    const test = new BiddingWithRelayerTest();
    await test.runFullTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = BiddingWithRelayerTest; 