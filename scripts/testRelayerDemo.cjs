#!/usr/bin/env node

const { ethers } = require('hardhat');

async function testRelayerDemo() {
    console.log('🎯 RELAYER BIDDING DEMONSTRATION...\n');

    try {
        // Load deployment info
        const deploymentInfo = require('../ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');
        const contractAddress = deploymentInfo.contractAddress;
        console.log(`📋 Contract: ${contractAddress}`);

        // Get contract instance
        const contractABI = require('../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json').abi;
        const [signer] = await ethers.getSigners();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        console.log(`👤 User: ${signer.address}`);

        // Step 1: Create a small test order
        console.log('\n📝 STEP 1: Creating test order...');
        
        const orderId = '0x5bd213f96ce1f70d40a6543413da84ef04d7ba0a1d0757cff27ceba0a24315b5'; // From previous test
        console.log(`📋 Using existing order: ${orderId}`);

        // Step 2: Get order details
        console.log('\n📋 STEP 2: Getting order details...');
        
        const order = await contract.limitOrders(orderId);
        console.log(`📋 Order details:`);
        console.log(`   Maker: ${order.intent.maker}`);
        console.log(`   Maker amount: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
        console.log(`   Taker amount: ${ethers.formatEther(order.intent.takerAmount)} ALGO`);
        console.log(`   Allow partial fills: ${order.intent.allowPartialFills}`);
        console.log(`   Filled: ${order.filled}`);
        console.log(`   Cancelled: ${order.cancelled}`);

        // Step 3: Demonstrate relayer analysis
        console.log('\n🤖 STEP 3: Relayer Analysis Simulation...');
        
        const baseRate = Number(ethers.formatEther(order.intent.takerAmount)) / Number(ethers.formatEther(order.intent.makerAmount));
        console.log(`📊 Order Analysis:`);
        console.log(`   Base rate: ${baseRate.toFixed(2)} ALGO/ETH`);
        console.log(`   Order value: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
        console.log(`   Target amount: ${ethers.formatEther(order.intent.takerAmount)} ALGO`);

        // Step 4: Demonstrate relayer bidding strategy
        console.log('\n💰 STEP 4: Relayer Bidding Strategy...');
        
        const competitiveRate = baseRate * 1.02; // 2% better rate
        const inputAmount = order.intent.makerAmount;
        const outputAmount = ethers.parseEther((Number(ethers.formatEther(inputAmount)) * competitiveRate).toString());
        const gasEstimate = 250000;
        const gasPrice = await ethers.provider.getFeeData().then(fee => fee.gasPrice);
        const gasCost = gasEstimate * gasPrice;
        const totalCost = inputAmount + gasCost;

        console.log(`💡 Relayer Strategy:`);
        console.log(`   Competitive rate: ${competitiveRate.toFixed(2)} ALGO/ETH (+2%)`);
        console.log(`   Input amount: ${ethers.formatEther(inputAmount)} ETH`);
        console.log(`   Output amount: ${ethers.formatEther(outputAmount)} ALGO`);
        console.log(`   Gas estimate: ${gasEstimate}`);
        console.log(`   Gas cost: ${ethers.formatEther(gasCost)} ETH`);
        console.log(`   Total cost: ${ethers.formatEther(totalCost)} ETH`);
        console.log(`   Profit margin: 2%`);

        // Step 5: Demonstrate relayer execution plan
        console.log('\n🎯 STEP 5: Relayer Execution Plan...');
        
        if (!order.filled && !order.cancelled) {
            console.log(`✅ Order ready for execution`);
            console.log(`🤖 Relayer would:`);
            console.log(`   1. Place competitive bid (${competitiveRate.toFixed(2)} ALGO/ETH)`);
            console.log(`   2. Wait for best bid selection`);
            console.log(`   3. Execute cross-chain swap:`);
            console.log(`      - Create Algorand HTLC`);
            console.log(`      - Execute Ethereum side`);
            console.log(`      - Complete atomic swap`);
            console.log(`   4. Earn resolver fees (0.5%)`);
            console.log(`   5. Profit from rate difference`);
        } else {
            console.log(`❌ Order not available for execution`);
        }

        // Step 6: Demonstrate bidding pool analysis
        console.log('\n📊 STEP 6: Bidding Pool Analysis...');
        
        const bids = await contract.getBids(orderId);
        const activeBids = await contract.getActiveBids(orderId);
        
        console.log(`📋 Bidding Pool:`);
        console.log(`   Total bids: ${bids.length}`);
        console.log(`   Active bids: ${activeBids.length}`);

        if (bids.length > 0) {
            console.log(`   Bid details:`);
            for (let i = 0; i < bids.length; i++) {
                const bid = bids[i];
                const rate = Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount));
                console.log(`     Bid ${i + 1}: ${rate.toFixed(2)} ALGO/ETH (${bid.active ? 'Active' : 'Inactive'})`);
            }

            const [bestBid, bestIndex] = await contract.getBestBid(orderId);
            if (bestBid.resolver !== ethers.ZeroAddress) {
                const rate = Number(ethers.formatEther(bestBid.outputAmount)) / Number(ethers.formatEther(bestBid.inputAmount));
                console.log(`   🏆 Best bid: ${rate.toFixed(2)} ALGO/ETH`);
            }
        } else {
            console.log(`   No bids placed yet`);
            console.log(`   💡 Relayer opportunity: Be first to bid!`);
        }

        // Step 7: Demonstrate partial fill capabilities
        console.log('\n🔄 STEP 7: Partial Fill Capabilities...');
        
        if (order.intent.allowPartialFills) {
            console.log(`✅ Partial fills enabled`);
            console.log(`📋 Partial fill options:`);
            console.log(`   Min partial fill: ${ethers.formatEther(order.intent.minPartialFill)} ETH`);
            console.log(`   Remaining amount: ${ethers.formatEther(order.remainingAmount)} ETH`);
            console.log(`   Partial fills executed: ${order.partialFills}`);
            
            const makerAmountNum = Number(ethers.formatEther(order.intent.makerAmount));
            console.log(`🤖 Relayer partial fill strategy:`);
            console.log(`   1. Execute 30% fill: ${(makerAmountNum * 0.3).toFixed(4)} ETH`);
            console.log(`   2. Execute 40% fill: ${(makerAmountNum * 0.4).toFixed(4)} ETH`);
            console.log(`   3. Execute 30% fill: ${(makerAmountNum * 0.3).toFixed(4)} ETH`);
            console.log(`   4. Complete order with multiple transactions`);
        } else {
            console.log(`❌ Partial fills disabled`);
            console.log(`💡 Order requires full execution`);
        }

        console.log('\n✅ RELAYER DEMONSTRATION COMPLETE!');
        
        // Save demonstration results
        const demoResults = {
            timestamp: new Date().toISOString(),
            contractAddress: contractAddress,
            orderId: orderId,
            orderDetails: {
                maker: order.intent.maker,
                makerAmount: ethers.formatEther(order.intent.makerAmount),
                takerAmount: ethers.formatEther(order.intent.takerAmount),
                baseRate: baseRate,
                allowPartialFills: order.intent.allowPartialFills,
                filled: order.filled,
                cancelled: order.cancelled
            },
            relayerStrategy: {
                competitiveRate: competitiveRate,
                inputAmount: ethers.formatEther(inputAmount),
                outputAmount: ethers.formatEther(outputAmount),
                gasEstimate: gasEstimate,
                gasCost: ethers.formatEther(gasCost),
                totalCost: ethers.formatEther(totalCost),
                profitMargin: '2%'
            },
            biddingPool: {
                totalBids: bids.length,
                activeBids: activeBids.length,
                bids: bids.map(bid => ({
                    inputAmount: ethers.formatEther(bid.inputAmount),
                    outputAmount: ethers.formatEther(bid.outputAmount),
                    rate: Number(ethers.formatEther(bid.outputAmount)) / Number(ethers.formatEther(bid.inputAmount)),
                    active: bid.active
                }))
            },
            partialFills: {
                enabled: order.intent.allowPartialFills,
                minPartialFill: ethers.formatEther(order.intent.minPartialFill),
                remainingAmount: ethers.formatEther(order.remainingAmount),
                partialFills: order.partialFills.toString()
            },
            status: 'SUCCESS'
        };

        require('fs').writeFileSync(
            'RELAYER_DEMO_RESULTS.json',
            JSON.stringify(demoResults, null, 2)
        );

        console.log('📄 Demo results saved to: RELAYER_DEMO_RESULTS.json');

    } catch (error) {
        console.error('❌ Demo failed:', error);
        throw error;
    }
}

// Run the demo
async function main() {
    await testRelayerDemo();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testRelayerDemo }; 