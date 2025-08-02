#!/usr/bin/env node

const { ethers } = require('hardhat');
const crypto = require('crypto');

class BidirectionalBiddingTest {
    constructor() {
        this.contract = null;
        this.resolvers = [];
        this.testOrders = [];
        this.contractAddress = null;
    }

    async initialize() {
        console.log('🚀 INITIALIZING BIDIRECTIONAL BIDDING TEST...\n');

        // Get contract address from deployment
        try {
            const deploymentInfo = require('../ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');
            this.contractAddress = deploymentInfo.contractAddress;
            console.log(`📋 Using deployed contract: ${this.contractAddress}`);
        } catch (error) {
            console.log('⚠️  No deployment info found, using default address');
            this.contractAddress = '0x0000000000000000000000000000000000000000'; // Placeholder
        }

        // Get contract instance
        const contractABI = require('../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json').abi;
        this.contract = new ethers.Contract(this.contractAddress, contractABI, ethers.provider);

        // Create test resolvers
        await this.createTestResolvers();
        
        console.log('✅ Initialization complete!\n');
    }

    async createTestResolvers() {
        console.log('🔧 Creating test resolvers...');
        
        // Create 5 test resolvers
        for (let i = 0; i < 5; i++) {
            const wallet = ethers.Wallet.createRandom();
            this.resolvers.push({
                address: wallet.address,
                privateKey: wallet.privateKey,
                signer: new ethers.Wallet(wallet.privateKey, ethers.provider),
                bidCount: 0,
                totalFees: ethers.parseEther('0'),
                name: `Resolver_${i + 1}`
            });
            
            console.log(`  ${this.resolvers[i].name}: ${wallet.address}`);
        }
        
        console.log('✅ Test resolvers created!\n');
    }

    async testEthToAlgoBidding() {
        console.log('🎯 TESTING ETH → ALGO BIDDING...\n');

        // Create test order: 1 ETH → ALGO
        const orderId = await this.createTestOrder('ETH_TO_ALGO', {
            makerAmount: ethers.parseEther('1'),
            takerAmount: ethers.parseEther('1500'), // 1500 ALGO equivalent
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.1')
        });

        // Simulate competitive bidding
        await this.simulateCompetitiveBidding(orderId, 'ETH_TO_ALGO');

        // Select best bid and execute
        await this.executeBestBid(orderId);

        console.log('✅ ETH → ALGO bidding test complete!\n');
    }

    async testAlgoToEthBidding() {
        console.log('🎯 TESTING ALGO → ETH BIDDING...\n');

        // Create test order: ALGO → 1 ETH
        const orderId = await this.createTestOrder('ALGO_TO_ETH', {
            makerAmount: ethers.parseEther('1500'), // 1500 ALGO equivalent
            takerAmount: ethers.parseEther('1'),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('150')
        });

        // Simulate competitive bidding
        await this.simulateCompetitiveBidding(orderId, 'ALGO_TO_ETH');

        // Select best bid and execute
        await this.executeBestBid(orderId);

        console.log('✅ ALGO → ETH bidding test complete!\n');
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
            makerToken: direction === 'ETH_TO_ALGO' ? ethers.ZeroAddress : ethers.ZeroAddress, // ETH for both
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

        console.log(`📝 Created ${direction} order: ${orderId}`);
        return orderId;
    }

    async simulateCompetitiveBidding(orderId, direction) {
        console.log(`🏆 Simulating competitive bidding for ${direction}...`);

        const baseRate = direction === 'ETH_TO_ALGO' ? 1500 : 1/1500;
        const variations = [0.98, 0.99, 1.0, 1.01, 1.02]; // ±2% variations

        for (let i = 0; i < this.resolvers.length; i++) {
            const resolver = this.resolvers[i];
            const variation = variations[i];
            
            let inputAmount, outputAmount;
            
            if (direction === 'ETH_TO_ALGO') {
                inputAmount = ethers.parseEther('1');
                outputAmount = ethers.parseEther((1500 * variation).toString());
            } else {
                inputAmount = ethers.parseEther((1500 * variation).toString());
                outputAmount = ethers.parseEther('1');
            }

            const gasEstimate = 200000 + (i * 10000); // Varying gas estimates

            // Place bid
            const tx = await this.contract.connect(resolver.signer).placeBid(
                orderId,
                inputAmount,
                outputAmount,
                gasEstimate
            );

            await tx.wait();

            console.log(`  ${resolver.name}: ${ethers.formatEther(inputAmount)} → ${ethers.formatEther(outputAmount)} (${(variation * 100).toFixed(1)}%)`);
        }

        console.log('✅ Competitive bidding simulation complete!\n');
    }

    async executeBestBid(orderId) {
        console.log('🎯 Executing best bid...');

        // Get best bid
        const [bestBid, bestIndex] = await this.contract.getBestBid(orderId);
        
        console.log(`🏆 Best bid: ${bestBid.resolver}`);
        console.log(`   Input: ${ethers.formatEther(bestBid.inputAmount)}`);
        console.log(`   Output: ${ethers.formatEther(bestBid.outputAmount)}`);
        console.log(`   Rate: ${(Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount))).toFixed(2)}`);

        // Generate secret for execution
        const secret = crypto.randomBytes(32);

        // Execute best bid
        const resolver = this.resolvers.find(r => r.address === bestBid.resolver);
        const tx = await this.contract.connect(resolver.signer).selectBestBidAndExecute(
            orderId,
            bestIndex,
            secret
        );

        await tx.wait();

        console.log('✅ Best bid executed successfully!\n');
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
        // Extract order ID from event
        const event = receipt.logs.find(log => 
            log.fragment && log.fragment.name === 'LimitOrderCreated'
        );
        return event.args.orderId;
    }

    async testPartialFills() {
        console.log('🎯 TESTING PARTIAL FILLS...\n');

        // Create order with partial fills enabled
        const orderId = await this.createTestOrder('PARTIAL_FILL', {
            makerAmount: ethers.parseEther('1'),
            takerAmount: ethers.parseEther('1500'),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.2')
        });

        // Execute multiple partial fills
        const partialAmounts = [0.3, 0.4, 0.3]; // 30%, 40%, 30%
        
        for (let i = 0; i < partialAmounts.length; i++) {
            const fillAmount = ethers.parseEther(partialAmounts[i].toString());
            const algorandAmount = ethers.parseEther((1500 * partialAmounts[i]).toString());
            
            const resolver = this.resolvers[i % this.resolvers.length];
            const secret = crypto.randomBytes(32);

            const tx = await this.contract.connect(resolver.signer).executePartialFill(
                orderId,
                fillAmount,
                algorandAmount,
                secret
            );

            await tx.wait();

            console.log(`  Partial fill ${i + 1}: ${ethers.formatEther(fillAmount)} ETH → ${ethers.formatEther(algorandAmount)} ALGO`);
        }

        console.log('✅ Partial fill testing complete!\n');
    }

    async runFullTest() {
        console.log('🚀 STARTING BIDIRECTIONAL BIDDING TEST SUITE\n');
        console.log('=' .repeat(60));

        try {
            await this.initialize();
            
            console.log('🎯 PHASE 1: ETH → ALGO BIDDING');
            console.log('-'.repeat(40));
            await this.testEthToAlgoBidding();
            
            console.log('🎯 PHASE 2: ALGO → ETH BIDDING');
            console.log('-'.repeat(40));
            await this.testAlgoToEthBidding();
            
            console.log('🎯 PHASE 3: PARTIAL FILL TESTING');
            console.log('-'.repeat(40));
            await this.testPartialFills();
            
            console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!\n');
            
            // Save test results
            const testResults = {
                timestamp: new Date().toISOString(),
                contractAddress: this.contractAddress,
                resolvers: this.resolvers.map(r => ({
                    name: r.name,
                    address: r.address,
                    bidCount: r.bidCount
                })),
                testOrders: this.testOrders,
                status: 'SUCCESS'
            };

            require('fs').writeFileSync(
                'BIDIRECTIONAL_BIDDING_TEST_RESULTS.json',
                JSON.stringify(testResults, null, 2)
            );

            console.log('📄 Test results saved to: BIDIRECTIONAL_BIDDING_TEST_RESULTS.json');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            throw error;
        }
    }
}

// Run the test
async function main() {
    const test = new BidirectionalBiddingTest();
    await test.runFullTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = BidirectionalBiddingTest; 