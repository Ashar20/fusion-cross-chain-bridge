#!/usr/bin/env node

const { ethers } = require('hardhat');
const crypto = require('crypto');

async function testFundedResolvers() {
    console.log('🎯 TESTING FUNDED RESOLVERS...\n');

    try {
        // Load deployment info
        const deploymentInfo = require('../ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');
        const contractAddress = deploymentInfo.contractAddress;
        console.log(`📋 Contract: ${contractAddress}`);

        // Get contract instance
        const contractABI = require('../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json').abi;
        const [signer] = await ethers.getSigners();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Load resolver config
        const resolverConfig = require('../resolver-config.json');
        console.log(`📋 Loaded ${resolverConfig.resolvers.length} resolvers`);

        // Step 1: Create test order
        console.log('\n📝 STEP 1: Creating test order...');
        
        const secret = crypto.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const salt = ethers.keccak256(crypto.randomBytes(32));
        
        const intent = {
            maker: signer.address,
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

        const signature = await signer.signTypedData(domain, types, intent);

        // Submit order
        const tx = await contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            0, // Use default timelock
            { value: intent.makerAmount }
        );

        const receipt = await tx.wait();
        const orderId = receipt.logs.find(log => 
            log.fragment && log.fragment.name === 'LimitOrderCreated'
        ).args.orderId;

        console.log(`✅ Order created: ${orderId}`);

        // Step 2: Check resolver balances
        console.log('\n💰 STEP 2: Checking resolver balances...');
        
        for (const resolver of resolverConfig.resolvers) {
            const balance = await ethers.provider.getBalance(resolver.address);
            console.log(`  ${resolver.name}: ${resolver.address}`);
            console.log(`    Balance: ${ethers.formatEther(balance)} ETH`);
            console.log(`    Strategy: ${resolver.strategy}`);
            console.log(`    Risk: ${resolver.riskTolerance}`);
            console.log(`    Required: ${resolver.funding} ETH`);
            console.log(`    Status: ${balance >= ethers.parseEther(resolver.funding) ? '✅ Funded' : '❌ Underfunded'}`);
        }

        // Step 3: Authorize resolvers
        console.log('\n🔧 STEP 3: Authorizing resolvers...');
        
        for (const resolver of resolverConfig.resolvers) {
            try {
                const tx = await contract.authorizeResolver(resolver.address, true);
                await tx.wait();
                console.log(`  ✅ Authorized: ${resolver.name}`);
            } catch (error) {
                console.log(`  ⚠️  Already authorized: ${resolver.name}`);
            }
        }

        // Step 4: Demonstrate bidding strategy for each resolver
        console.log('\n🏆 STEP 4: Demonstrating bidding strategies...');
        
        const order = await contract.limitOrders(orderId);
        const baseRate = Number(ethers.formatEther(order.intent.takerAmount)) / Number(ethers.formatEther(order.intent.makerAmount));
        
        console.log(`📊 Base rate: ${baseRate.toFixed(2)} ALGO/ETH`);

        for (let i = 0; i < resolverConfig.resolvers.length; i++) {
            const resolver = resolverConfig.resolvers[i];
            const balance = await ethers.provider.getBalance(resolver.address);
            
            // Calculate competitive rate based on strategy
            let competitiveRate;
            let improvement;
            
            switch (resolver.strategy) {
                case 'High-frequency bidding':
                    competitiveRate = baseRate * 1.025; // 2.5% better
                    improvement = '2.5%';
                    break;
                case 'Arbitrage opportunities':
                    competitiveRate = baseRate * 1.02; // 2% better
                    improvement = '2%';
                    break;
                case 'MEV extraction':
                    competitiveRate = baseRate * 1.03; // 3% better
                    improvement = '3%';
                    break;
                case 'Conservative bidding':
                    competitiveRate = baseRate * 1.01; // 1% better
                    improvement = '1%';
                    break;
                default:
                    competitiveRate = baseRate * 1.015; // 1.5% better
                    improvement = '1.5%';
            }

            const inputAmount = order.intent.makerAmount;
            const outputAmount = ethers.parseEther((Number(ethers.formatEther(inputAmount)) * competitiveRate).toString());
            const gasEstimate = 250000 + (i * 10000);
            const gasPrice = await ethers.provider.getFeeData().then(fee => fee.gasPrice);
            const gasCost = gasEstimate * gasPrice;
            const totalCost = inputAmount + gasCost;

            console.log(`\n  💰 ${resolver.name} Strategy:`);
            console.log(`    Address: ${resolver.address}`);
            console.log(`    Balance: ${ethers.formatEther(balance)} ETH`);
            console.log(`    Strategy: ${resolver.strategy}`);
            console.log(`    Risk: ${resolver.riskTolerance}`);
            console.log(`    Competitive rate: ${competitiveRate.toFixed(2)} ALGO/ETH (+${improvement})`);
            console.log(`    Input amount: ${ethers.formatEther(inputAmount)} ETH`);
            console.log(`    Output amount: ${ethers.formatEther(outputAmount)} ALGO`);
            console.log(`    Gas estimate: ${gasEstimate}`);
            console.log(`    Gas cost: ${ethers.formatEther(gasCost)} ETH`);
            console.log(`    Total cost: ${ethers.formatEther(totalCost)} ETH`);
            
            if (balance >= totalCost) {
                console.log(`    Status: ✅ Ready to bid`);
            } else {
                console.log(`    Status: ❌ Insufficient funds (need ${ethers.formatEther(totalCost - balance)} more ETH)`);
            }
        }

        // Step 5: Get order details
        console.log('\n📋 STEP 5: Order details...');
        
        console.log(`📋 Order details:`);
        console.log(`   Maker: ${order.intent.maker}`);
        console.log(`   Maker amount: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
        console.log(`   Taker amount: ${ethers.formatEther(order.intent.takerAmount)} ALGO`);
        console.log(`   Remaining amount: ${ethers.formatEther(order.remainingAmount)} ETH`);
        console.log(`   Partial fills: ${order.partialFills}`);
        console.log(`   Filled: ${order.filled}`);
        console.log(`   Cancelled: ${order.cancelled}`);
        console.log(`   Allow partial fills: ${order.intent.allowPartialFills}`);

        // Step 6: Check current bids
        console.log('\n📊 STEP 6: Current bidding status...');
        
        const bids = await contract.getBids(orderId);
        const activeBids = await contract.getActiveBids(orderId);
        
        console.log(`📋 Bidding pool:`);
        console.log(`   Total bids: ${bids.length}`);
        console.log(`   Active bids: ${activeBids.length}`);

        if (bids.length > 0) {
            console.log(`   Bid details:`);
            for (let i = 0; i < bids.length; i++) {
                const bid = bids[i];
                const rate = Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount));
                const resolver = resolverConfig.resolvers.find(r => r.address === bid.resolver);
                const resolverName = resolver ? resolver.name : 'Unknown';
                
                console.log(`     Bid ${i + 1}: ${resolverName} - ${rate.toFixed(2)} ALGO/ETH (${bid.active ? 'Active' : 'Inactive'})`);
            }

            const [bestBid, bestIndex] = await contract.getBestBid(orderId);
            if (bestBid.resolver !== ethers.ZeroAddress) {
                const rate = Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount));
                const resolver = resolverConfig.resolvers.find(r => r.address === bestBid.resolver);
                const resolverName = resolver ? resolver.name : 'Unknown';
                console.log(`   🏆 Best bid: ${resolverName} - ${rate.toFixed(2)} ALGO/ETH`);
            }
        } else {
            console.log(`   No bids placed yet`);
            console.log(`   💡 Resolvers are ready to place competitive bids!`);
        }

        console.log('\n✅ FUNDED RESOLVERS TEST COMPLETED!');
        
        // Save test results
        const testResults = {
            timestamp: new Date().toISOString(),
            contractAddress: contractAddress,
            orderId: orderId,
            resolvers: resolverConfig.resolvers.map(async (resolver) => {
                const balance = await ethers.provider.getBalance(resolver.address);
                return {
                    name: resolver.name,
                    address: resolver.address,
                    balance: ethers.formatEther(balance),
                    strategy: resolver.strategy,
                    riskTolerance: resolver.riskTolerance,
                    requiredFunding: resolver.funding,
                    status: balance >= ethers.parseEther(resolver.funding) ? 'Funded' : 'Underfunded'
                };
            }),
            orderDetails: {
                maker: order.intent.maker,
                makerAmount: ethers.formatEther(order.intent.makerAmount),
                takerAmount: ethers.formatEther(order.intent.takerAmount),
                baseRate: baseRate,
                allowPartialFills: order.intent.allowPartialFills,
                filled: order.filled,
                cancelled: order.cancelled
            },
            biddingStatus: {
                totalBids: bids.length,
                activeBids: activeBids.length
            },
            status: 'SUCCESS'
        };

        require('fs').writeFileSync(
            'FUNDED_RESOLVERS_TEST_RESULTS.json',
            JSON.stringify(testResults, null, 2)
        );

        console.log('📄 Test results saved to: FUNDED_RESOLVERS_TEST_RESULTS.json');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run the test
async function main() {
    await testFundedResolvers();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testFundedResolvers }; 