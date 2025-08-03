#!/usr/bin/env node

/**
 * Force relayer to check specific order
 */

const { ethers } = require('ethers');

async function testRelayerOnOrder() {
    console.log('🧪 TESTING RELAYER ON SPECIFIC ORDER');
    console.log('===================================\n');
    
    require('dotenv').config();
    
    // Fresh order from createSimpleTestOrder.cjs
    const orderId = '0x4304f5989c4d45570208d76adf249e67afc8ab2ce20b4a6b6e8acbd5136f1c4e';
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    
    console.log(`🔍 Testing Order: ${orderId}`);
    console.log(`🏦 Contract: ${contractAddress}`);
    console.log(`👤 Relayer: ${wallet.address}\n`);
    
    try {
        console.log('📋 ORDER DETECTED - ANALYZING FOR BIDDING...');
        
        // Check current bids
        const bidABI = [
            'function getBids(bytes32) external view returns (tuple(address,uint256,uint256,uint256,bool,uint256,uint256)[])'
        ];
        const bidContract = new ethers.Contract(contractAddress, bidABI, provider);
        const bids = await bidContract.getBids(orderId);
        
        console.log(`\n🔍 CURRENT BIDS: ${bids.length}`);
        if (bids.length > 0) {
            bids.forEach((bid, i) => {
                if (bid.active) {
                    console.log(`   Bid ${i + 1}: ${bid.resolver} - ${ethers.formatEther(bid.inputAmount)} ETH`);
                }
            });
            console.log('\n✅ Relayer already bid on this order!');
            return;
        }
        
        console.log('\n🤖 NO BIDS FOUND - MANUALLY TRIGGERING RELAYER BID');
        
        // Use known order parameters from createSimpleTestOrder.cjs
        const makerAmount = ethers.parseEther('0.001'); // 0.001 ETH
        const takerAmount = ethers.parseEther('0.5');   // 0.5 ALGO
        
        console.log('\n💰 PROFITABILITY ANALYSIS:');
        console.log(`   ETH to sell: ${ethers.formatEther(makerAmount)} ETH`);
        console.log(`   ALGO to get: ${ethers.formatEther(takerAmount)} ALGO`);
        
        // Simple test: place a bid regardless of profitability
        console.log('\n🎯 PLACING TEST BID (ignoring profitability)...');
        
        const bidAbi = [
            'function placeBid(bytes32 orderId, uint256 inputAmount, uint256 outputAmount, uint256 gasEstimate) external payable returns (bool)'
        ];
        const bidder = new ethers.Contract(contractAddress, bidAbi, wallet);
        
        // Bid parameters
        const inputAmount = makerAmount; // Full ETH amount
        const outputAmount = takerAmount; // Full ALGO amount  
        const gasEstimate = ethers.parseEther('0.002'); // 0.002 ETH gas estimate
        const totalCost = gasEstimate; // Cost to place bid
        
        console.log(`   Input: ${ethers.formatEther(inputAmount)} ETH`);
        console.log(`   Output: ${ethers.formatEther(outputAmount)} ALGO`);
        console.log(`   Gas Est: ${ethers.formatEther(gasEstimate)} ETH`);
        console.log(`   Total Cost: ${ethers.formatEther(totalCost)} ETH`);
        
        const tx = await bidder.placeBid(
            orderId,
            inputAmount,
            outputAmount, 
            gasEstimate,
            {
                value: totalCost,
                gasLimit: 300000,
                maxFeePerGas: ethers.parseUnits('15', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
            }
        );
        
        console.log(`🔗 Bid Transaction: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`✅ Bid placed in block ${receipt.blockNumber}`);
        
        // Check bids again
        const newBids = await bidContract.getBids(orderId);
        console.log(`\n🎉 SUCCESS: Order now has ${newBids.length} bid(s)!`);
        
        if (newBids.length > 0) {
            newBids.forEach((bid, i) => {
                if (bid.active) {
                    console.log(`   Bid ${i + 1}: ${bid.resolver} - ${ethers.formatEther(bid.inputAmount)} ETH`);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('execution reverted')) {
            console.log('\n🔍 POSSIBLE ISSUES:');
            console.log('- Order may be expired or cancelled');
            console.log('- Bid parameters may be invalid');
            console.log('- Contract may have specific requirements');
            console.log('- Insufficient balance for bid cost');
        }
    }
}

testRelayerOnOrder().catch(console.error);