#!/usr/bin/env node

/**
 * 🏆 PLACE TEST BID ON LOP ORDER
 * 
 * Places a test bid on an existing LOP order to verify bidding functionality
 */

const { ethers } = require('ethers');

async function placeTestBid() {
    console.log('🏆 PLACING TEST BID ON LOP ORDER');
    console.log('==================================\n');
    
    try {
        require('dotenv').config();
        
        // Contract address
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Initialize provider and signer (using relayer private key)
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        const signer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        
        // Basic ABI for bidding
        const abi = [
            'function placeBid(bytes32 orderId, uint256 inputAmount, uint256 outputAmount, uint256 gasEstimate) external',
            'function authorizedResolvers(address resolver) external view returns (bool)',
            'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock)'
        ];
        
        const contract = new ethers.Contract(contractAddress, abi, signer);
        
        console.log('✅ Contract connected');
        console.log(`📋 Address: ${contractAddress}`);
        console.log(`👤 Bidder: ${signer.address}\n`);
        
        // Check if we're authorized
        const isAuthorized = await contract.authorizedResolvers(signer.address);
        console.log(`🔐 Authorization Status: ${isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}`);
        
        if (!isAuthorized) {
            console.log('❌ Cannot place bid - not authorized as resolver');
            return;
        }
        
        // Get current block
        const currentBlock = await provider.getBlockNumber();
        console.log(`📊 Current Block: ${currentBlock}`);
        
        // Search for recent orders (last 2000 blocks)
        console.log('\n🎯 SEARCHING FOR RECENT LOP ORDERS...');
        console.log('=====================================');
        
        const fromBlock = currentBlock - 2000;
        const orderEvents = await contract.queryFilter('LimitOrderCreated', fromBlock, currentBlock);
        
        if (orderEvents.length === 0) {
            console.log('❌ No LOP orders found in the last 2000 blocks');
            console.log('💡 Create an order first with: node scripts/createWorkingLOPOrder.cjs');
            return;
        }
        
        console.log(`✅ Found ${orderEvents.length} LOP order(s)\n`);
        
        // Use the most recent order
        const latestOrder = orderEvents[orderEvents.length - 1];
        const orderId = latestOrder.args.orderId;
        const makerAmount = latestOrder.args.makerAmount;
        const takerAmount = latestOrder.args.takerAmount;
        const deadline = latestOrder.args.deadline;
        
        console.log('📋 LATEST ORDER DETAILS:');
        console.log('=========================');
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Maker Amount: ${ethers.formatEther(makerAmount)} ETH`);
        console.log(`   Taker Amount: ${ethers.formatEther(takerAmount)} ALGO`);
        console.log(`   Deadline: ${new Date(Number(deadline) * 1000).toISOString()}`);
        
        // Check if order is expired
        const now = Math.floor(Date.now() / 1000);
        if (Number(deadline) < now) {
            console.log('❌ Order has expired');
            return;
        }
        
        // Calculate bid parameters
        const inputAmount = makerAmount; // Same as maker amount
        const outputAmount = takerAmount; // Same as taker amount
        const gasEstimate = 250000; // Estimated gas for execution
        
        console.log('\n🏆 PLACING BID:');
        console.log('===============');
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Input Amount: ${ethers.formatEther(inputAmount)} ETH`);
        console.log(`   Output Amount: ${ethers.formatEther(outputAmount)} ALGO`);
        console.log(`   Gas Estimate: ${gasEstimate}`);
        
        // Calculate profitability
        const inputValue = Number(ethers.formatEther(inputAmount));
        const outputValue = Number(ethers.formatEther(outputAmount));
        const gasCost = (gasEstimate * 0.00000002); // Rough gas cost estimate
        const profit = outputValue - inputValue - gasCost;
        const profitMargin = (profit / inputValue) * 100;
        
        console.log(`   Estimated Profit: ${profit.toFixed(6)} ETH`);
        console.log(`   Profit Margin: ${profitMargin.toFixed(2)}%`);
        console.log(`   Gas Cost: ${gasCost.toFixed(6)} ETH`);
        
        if (profitMargin < 2) {
            console.log('⚠️  Warning: Low profit margin (< 2%)');
        }
        
        // Place the bid
        console.log('\n⏳ Placing bid transaction...');
        
        const tx = await contract.placeBid(
            orderId,
            inputAmount,
            outputAmount,
            gasEstimate,
            { gasLimit: 300000 }
        );
        
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Check for BidPlaced event
        let bidPlaced = false;
        for (const log of receipt.logs) {
            try {
                const parsed = contract.interface.parseLog(log);
                if (parsed.name === 'BidPlaced') {
                    console.log('\n🎉 BID PLACED SUCCESSFULLY!');
                    console.log('===========================');
                    console.log(`   Order ID: ${parsed.args.orderId}`);
                    console.log(`   Resolver: ${parsed.args.resolver}`);
                    console.log(`   Input Amount: ${ethers.formatEther(parsed.args.inputAmount)} ETH`);
                    console.log(`   Output Amount: ${ethers.formatEther(parsed.args.outputAmount)} ALGO`);
                    console.log(`   Gas Estimate: ${parsed.args.gasEstimate}`);
                    console.log(`   Block: ${receipt.blockNumber}`);
                    console.log(`   Transaction: ${tx.hash}`);
                    bidPlaced = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!bidPlaced) {
            console.log('❌ BidPlaced event not found in transaction');
        }
        
        console.log('\n🏆 BIDDING VERIFICATION:');
        console.log('========================');
        console.log('✅ Bid transaction confirmed');
        console.log('✅ Bid should now be visible in order details');
        console.log('✅ Relayer should detect the bid');
        console.log('✅ Order may execute if this is the best bid');
        
    } catch (error) {
        console.error('❌ Error placing test bid:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 TROUBLESHOOTING:');
            console.log('   - Check relayer ETH balance for gas fees');
            console.log('   - Ensure relayer has enough ETH for bidding');
        } else if (error.message.includes('execution reverted')) {
            console.log('\n💡 TROUBLESHOOTING:');
            console.log('   - Check if order still exists');
            console.log('   - Verify bid parameters');
            console.log('   - Ensure relayer is authorized');
        }
        
        process.exit(1);
    }
}

if (require.main === module) {
    placeTestBid();
}

module.exports = { placeTestBid }; 