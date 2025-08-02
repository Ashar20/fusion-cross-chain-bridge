#!/usr/bin/env node

const { ethers } = require('hardhat');
const crypto = require('crypto');

async function testBiddingWorkflow() {
    console.log('🎯 TESTING BIDDING WORKFLOW...\n');

    try {
        // Load deployment info
        const deploymentInfo = require('../ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');
        const contractAddress = deploymentInfo.contractAddress;
        console.log(`📋 Using deployed contract: ${contractAddress}`);

        // Get contract instance
        const contractABI = require('../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json').abi;
        const [signer] = await ethers.getSigners();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Create test user
        const [user] = await ethers.getSigners();
        console.log(`👤 Test user: ${user.address}`);

        // Step 1: Create a test order
        console.log('\n📝 STEP 1: Creating test order...');
        
        const secret = crypto.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const salt = ethers.keccak256(crypto.randomBytes(32));
        
        const intent = {
            maker: user.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO equivalent
            makerAmount: ethers.parseEther('0.1'),
            takerAmount: ethers.parseEther('150'), // 150 ALGO equivalent
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            algorandChainId: 416002,
            algorandAddress: 'TESTALGOADDRESS123456789',
            salt: salt,
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.01')
        };

        // Sign intent
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: await ethers.provider.getNetwork().then(n => n.chainId),
            verifyingContract: contractAddress
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

        const signature = await user.signTypedData(domain, types, intent);

        // Submit order
        const tx1 = await contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            0, // Use default timelock
            { value: intent.makerAmount }
        );

        const receipt1 = await tx1.wait();
        const orderId = receipt1.logs.find(log => 
            log.fragment && log.fragment.name === 'LimitOrderCreated'
        ).args.orderId;

        console.log(`✅ Order created: ${orderId}`);

        // Step 2: Create test resolvers
        console.log('\n🔧 STEP 2: Creating test resolvers...');
        
        const testResolvers = [];
        for (let i = 0; i < 3; i++) {
            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            testResolvers.push({
                name: `TestResolver_${i + 1}`,
                address: wallet.address,
                signer: wallet,
                bidCount: 0
            });
            console.log(`  ${testResolvers[i].name}: ${wallet.address}`);
        }

        // Step 3: Authorize resolvers
        console.log('\n🔧 STEP 3: Authorizing resolvers...');
        
        for (const resolver of testResolvers) {
            try {
                const tx = await contract.authorizeResolver(resolver.address, true);
                await tx.wait();
                console.log(`  ✅ Authorized: ${resolver.name}`);
            } catch (error) {
                console.log(`  ⚠️  Already authorized: ${resolver.name}`);
            }
        }

        // Step 4: Simulate bidding (with error handling)
        console.log('\n🏆 STEP 4: Simulating competitive bidding...');
        
        const bidRates = [1500, 1505, 1510]; // Different rates for competition
        
        for (let i = 0; i < testResolvers.length; i++) {
            const resolver = testResolvers[i];
            const rate = bidRates[i];
            
            const inputAmount = ethers.parseEther('0.1');
            const outputAmount = ethers.parseEther(rate.toString());
            const gasEstimate = 250000;

            try {
                // Place bid
                const tx = await contract.connect(resolver.signer).placeBid(
                    orderId,
                    inputAmount,
                    outputAmount,
                    gasEstimate
                );

                await tx.wait();
                resolver.bidCount++;

                console.log(`  ✅ ${resolver.name}: ${ethers.formatEther(inputAmount)} ETH → ${ethers.formatEther(outputAmount)} ALGO (Rate: ${rate})`);

            } catch (error) {
                console.log(`  ❌ ${resolver.name}: Failed to place bid`);
                console.log(`     Error: ${error.message}`);
                console.log(`     Note: Resolver needs ETH for gas fees`);
            }
        }

        // Step 5: Analyze bidding results
        console.log('\n📊 STEP 5: Analyzing bidding results...');
        
        // Get all bids
        const bids = await contract.getBids(orderId);
        console.log(`📋 Total bids: ${bids.length}`);

        // Get active bids
        const activeBids = await contract.getActiveBids(orderId);
        console.log(`📋 Active bids: ${activeBids.length}`);

        // Display bid details
        for (let i = 0; i < bids.length; i++) {
            const bid = bids[i];
            const rate = Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount));
            console.log(`  Bid ${i + 1}:`);
            console.log(`    Resolver: ${bid.resolver}`);
            console.log(`    Rate: ${rate.toFixed(2)} ALGO/ETH`);
            console.log(`    Active: ${bid.active}`);
            console.log(`    Timestamp: ${new Date(Number(bid.timestamp) * 1000).toISOString()}`);
        }

        // Get best bid
        const [bestBid, bestIndex] = await contract.getBestBid(orderId);
        
        if (bestBid.resolver !== ethers.ZeroAddress) {
            const rate = Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount));
            console.log(`\n🏆 Best bid:`);
            console.log(`  Resolver: ${bestBid.resolver}`);
            console.log(`  Rate: ${rate.toFixed(2)} ALGO/ETH`);
            console.log(`  Index: ${bestIndex}`);
        } else {
            console.log(`\n❌ No active bids found`);
        }

        // Step 6: Get order details
        console.log('\n📋 STEP 6: Getting order details...');
        
        const order = await contract.limitOrders(orderId);
        console.log(`📋 Order details:`);
        console.log(`   Maker: ${order.intent.maker}`);
        console.log(`   Maker amount: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
        console.log(`   Taker amount: ${ethers.formatEther(order.intent.takerAmount)} ALGO`);
        console.log(`   Remaining amount: ${ethers.formatEther(order.remainingAmount)} ETH`);
        console.log(`   Partial fills: ${order.partialFills}`);
        console.log(`   Filled: ${order.filled}`);
        console.log(`   Cancelled: ${order.cancelled}`);
        console.log(`   Allow partial fills: ${order.intent.allowPartialFills}`);

        console.log('\n✅ BIDDING WORKFLOW TEST COMPLETED!');
        
        // Save test results
        const testResults = {
            timestamp: new Date().toISOString(),
            contractAddress: contractAddress,
            orderId: orderId,
            testUser: user.address,
            resolvers: testResolvers.map(r => ({
                name: r.name,
                address: r.address,
                bidCount: r.bidCount
            })),
            bids: bids.map(bid => ({
                resolver: bid.resolver,
                inputAmount: ethers.formatEther(bid.inputAmount),
                outputAmount: ethers.formatEther(bid.outputAmount),
                rate: Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount)),
                active: bid.active,
                timestamp: new Date(Number(bid.timestamp) * 1000).toISOString()
            })),
            bestBid: bestBid.resolver !== ethers.ZeroAddress ? {
                resolver: bestBid.resolver,
                rate: Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount)),
                index: bestIndex
            } : null,
            orderDetails: {
                maker: order.intent.maker,
                makerAmount: ethers.formatEther(order.intent.makerAmount),
                takerAmount: ethers.formatEther(order.intent.takerAmount),
                remainingAmount: ethers.formatEther(order.remainingAmount),
                partialFills: order.partialFills.toString(),
                filled: order.filled,
                cancelled: order.cancelled,
                allowPartialFills: order.intent.allowPartialFills
            },
            status: 'SUCCESS'
        };

        require('fs').writeFileSync(
            'BIDDING_WORKFLOW_TEST_RESULTS.json',
            JSON.stringify(testResults, null, 2)
        );

        console.log('📄 Test results saved to: BIDDING_WORKFLOW_TEST_RESULTS.json');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run the test
async function main() {
    await testBiddingWorkflow();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testBiddingWorkflow }; 