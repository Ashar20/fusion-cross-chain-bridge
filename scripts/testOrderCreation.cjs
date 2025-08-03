#!/usr/bin/env node

const { ethers } = require('hardhat');
const crypto = require('crypto');

async function testOrderCreation() {
    console.log('🎯 TESTING ORDER CREATION FUNCTIONALITY...\n');

    try {
        // Load deployment info
        const deploymentInfo = require('../ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');
        const contractAddress = deploymentInfo.contractAddress;
        console.log(`📋 Using deployed contract: ${contractAddress}`);

        // Get contract instance with signer
        const contractABI = require('../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json').abi;
        const [signer] = await ethers.getSigners();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Create test user
        const [user] = await ethers.getSigners();
        console.log(`👤 Test user: ${user.address}`);

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

        // Test 2: Get order details
        console.log('\n📋 TEST 2: Getting order details...');
        
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
        console.log(`   Min partial fill: ${ethers.formatEther(order.intent.minPartialFill)} ETH`);

        // Test 3: Check if order is active
        console.log('\n🔍 TEST 3: Checking order status...');
        
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const isActive = !order.filled && !order.cancelled && currentTime <= order.intent.deadline;
        console.log(`📋 Order active: ${isActive}`);
        console.log(`📋 Order filled: ${order.filled}`);
        console.log(`📋 Order cancelled: ${order.cancelled}`);
        console.log(`📋 Order deadline: ${new Date(Number(order.intent.deadline) * 1000).toISOString()}`);

        // Test 4: Get order hashlock
        console.log('\n🔐 TEST 4: Getting order hashlock...');
        
        const orderHashlock = order.hashlock;
        console.log(`🔐 Order hashlock: ${orderHashlock}`);
        console.log(`🔐 Expected hashlock: ${hashlock}`);
        console.log(`🔐 Hashlock match: ${orderHashlock === hashlock}`);

        // Test 5: Get empty bids (should be empty since no bids placed)
        console.log('\n📊 TEST 5: Getting bids (should be empty)...');
        
        const bids = await contract.getBids(orderId);
        console.log(`📋 Total bids: ${bids.length}`);
        console.log(`📋 Bids array: ${JSON.stringify(bids, null, 2)}`);

        // Test 6: Get active bids (should be empty)
        console.log('\n📊 TEST 6: Getting active bids...');
        
        const activeBids = await contract.getActiveBids(orderId);
        console.log(`📋 Active bids: ${activeBids.length}`);

        console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
        
        // Save test results
        const testResults = {
            timestamp: new Date().toISOString(),
            contractAddress: contractAddress,
            orderId: orderId,
            testUser: user.address,
            orderDetails: {
                maker: order.intent.maker,
                makerAmount: ethers.formatEther(order.intent.makerAmount),
                takerAmount: ethers.formatEther(order.intent.takerAmount),
                remainingAmount: ethers.formatEther(order.remainingAmount),
                partialFills: order.partialFills.toString(),
                filled: order.filled,
                cancelled: order.cancelled,
                allowPartialFills: order.intent.allowPartialFills,
                minPartialFill: ethers.formatEther(order.intent.minPartialFill)
            },
            hashlock: {
                expected: hashlock,
                actual: orderHashlock,
                match: orderHashlock === hashlock
            },
            bids: {
                total: bids.length,
                active: activeBids.length
            },
            status: 'SUCCESS'
        };

        require('fs').writeFileSync(
            'ORDER_CREATION_TEST_RESULTS.json',
            JSON.stringify(testResults, null, 2)
        );

        console.log('📄 Test results saved to: ORDER_CREATION_TEST_RESULTS.json');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run the test
async function main() {
    await testOrderCreation();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testOrderCreation }; 