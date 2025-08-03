#!/usr/bin/env node

const { ethers } = require('hardhat');
const crypto = require('crypto');

async function testSimpleBidding() {
    console.log('🎯 TESTING SIMPLE BIDDING FUNCTIONALITY...\n');

    try {
        // Load deployment info
        const deploymentInfo = require('../ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');
        const contractAddress = deploymentInfo.contractAddress;
        console.log(`📋 Using deployed contract: ${contractAddress}`);

        // Get contract instance with signer
        const contractABI = require('../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json').abi;
        const [signer] = await ethers.getSigners();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Create test resolver with provider
        const testResolver = ethers.Wallet.createRandom().connect(ethers.provider);
        console.log(`🔧 Test resolver: ${testResolver.address}`);

        // Create test user
        const [user] = await ethers.getSigners();
        console.log(`👤 Test user: ${user.address}`);

        // Authorize test resolver
        console.log('\n🔧 Authorizing test resolver...');
        const tx0 = await contract.authorizeResolver(testResolver.address, true);
        await tx0.wait();
        console.log(`✅ Test resolver authorized: ${testResolver.address}`);

        // Test 1: Create a simple limit order
        console.log('\n📝 TEST 1: Creating limit order...');
        
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

        // Test 2: Place a bid
        console.log('\n🏆 TEST 2: Placing bid...');
        
        const bidInputAmount = ethers.parseEther('0.1');
        const bidOutputAmount = ethers.parseEther('155'); // Slightly better rate
        const gasEstimate = 250000;

        const tx2 = await contract.connect(testResolver).placeBid(
            orderId,
            bidInputAmount,
            bidOutputAmount,
            gasEstimate
        );

        await tx2.wait();
        console.log(`✅ Bid placed successfully`);

        // Test 3: Get bids
        console.log('\n📊 TEST 3: Getting bids...');
        
        const bids = await contract.getBids(orderId);
        console.log(`📋 Total bids: ${bids.length}`);
        
        for (let i = 0; i < bids.length; i++) {
            const bid = bids[i];
            console.log(`  Bid ${i + 1}:`);
            console.log(`    Resolver: ${bid.resolver}`);
            console.log(`    Input: ${ethers.formatEther(bid.inputAmount)} ETH`);
            console.log(`    Output: ${ethers.formatEther(bid.outputAmount)} ALGO`);
            console.log(`    Rate: ${(Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount))).toFixed(2)}`);
            console.log(`    Active: ${bid.active}`);
        }

        // Test 4: Get best bid
        console.log('\n🏆 TEST 4: Getting best bid...');
        
        const [bestBid, bestIndex] = await contract.getBestBid(orderId);
        console.log(`🏆 Best bid index: ${bestIndex}`);
        console.log(`🏆 Best bid resolver: ${bestBid.resolver}`);
        console.log(`🏆 Best bid rate: ${(Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount))).toFixed(2)}`);

        // Test 5: Get order details
        console.log('\n📋 TEST 5: Getting order details...');
        
        const order = await contract.getOrder(orderId);
        console.log(`📋 Order details:`);
        console.log(`   Maker: ${order.intent.maker}`);
        console.log(`   Maker amount: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
        console.log(`   Taker amount: ${ethers.formatEther(order.intent.takerAmount)} ALGO`);
        console.log(`   Remaining amount: ${ethers.formatEther(order.remainingAmount)} ETH`);
        console.log(`   Partial fills: ${order.partialFills}`);
        console.log(`   Filled: ${order.filled}`);
        console.log(`   Cancelled: ${order.cancelled}`);

        console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
        
        // Save test results
        const testResults = {
            timestamp: new Date().toISOString(),
            contractAddress: contractAddress,
            orderId: orderId,
            testResolver: testResolver.address,
            testUser: user.address,
            bids: bids.map(bid => ({
                resolver: bid.resolver,
                inputAmount: ethers.formatEther(bid.inputAmount),
                outputAmount: ethers.formatEther(bid.outputAmount),
                rate: Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount)),
                active: bid.active
            })),
            bestBid: {
                index: bestIndex,
                resolver: bestBid.resolver,
                rate: Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount))
            },
            status: 'SUCCESS'
        };

        require('fs').writeFileSync(
            'SIMPLE_BIDDING_TEST_RESULTS.json',
            JSON.stringify(testResults, null, 2)
        );

        console.log('📄 Test results saved to: SIMPLE_BIDDING_TEST_RESULTS.json');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run the test
async function main() {
    await testSimpleBidding();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testSimpleBidding }; 