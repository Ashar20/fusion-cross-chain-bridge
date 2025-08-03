#!/usr/bin/env node

/**
 * Fixed bidding - placeBid is NOT payable
 */

const { ethers } = require('ethers');

async function fixedBidding() {
    console.log('🔧 FIXED BIDDING MECHANISM');
    console.log('===========================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const privateKey = process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const relayerWallet = new ethers.Wallet(privateKey, provider);
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    
    const orderId = '0xfc20a25969492fb0fe5f86861c2e6853a8e486b90d31ad67124350d3f4a77b30';
    
    console.log(`🆔 Order ID: ${orderId}`);
    console.log(`🤖 Relayer: ${relayerWallet.address}`);
    console.log(`🏦 Contract: ${contractAddress}\n`);
    
    try {
        // Check authorization
        const authABI = ['function authorizedResolvers(address) external view returns (bool)'];
        const authContract = new ethers.Contract(contractAddress, authABI, provider);
        const isAuthorized = await authContract.authorizedResolvers(relayerWallet.address);
        console.log(`🔐 Relayer Authorized: ${isAuthorized ? '✅ YES' : '❌ NO'}`);
        
        if (!isAuthorized) {
            console.log('❌ Relayer not authorized - cannot place bids');
            return;
        }
        
        // FIXED: placeBid is NOT payable - don't send value
        const placeBidABI = [
            'function placeBid(bytes32 orderId, uint256 inputAmount, uint256 outputAmount, uint256 gasEstimate) external'
        ];
        const placeBidContract = new ethers.Contract(contractAddress, placeBidABI, relayerWallet);
        
        const bidParams = {
            orderId: orderId,
            inputAmount: ethers.parseEther('0.001'), // 0.001 ETH
            outputAmount: ethers.parseEther('0.5'),  // 0.5 ALGO
            gasEstimate: 150000
        };
        
        console.log('📊 Bid Parameters:');
        console.log(`   Order ID: ${bidParams.orderId}`);
        console.log(`   Input: ${ethers.formatEther(bidParams.inputAmount)} ETH`);
        console.log(`   Output: ${ethers.formatEther(bidParams.outputAmount)} ALGO`);
        console.log(`   Gas Estimate: ${bidParams.gasEstimate}`);
        console.log(`   ⚠️  NO VALUE SENT (function not payable)\n`);
        
        // Gas estimation (without value)
        console.log('⛽ Testing gas estimation...');
        const gasEstimate = await placeBidContract.placeBid.estimateGas(
            bidParams.orderId,
            bidParams.inputAmount,
            bidParams.outputAmount,
            bidParams.gasEstimate
            // NO VALUE PARAMETER
        );
        console.log(`✅ Gas estimation successful: ${gasEstimate.toString()}`);
        
        // Place the bid (without value)
        console.log('\n⏳ Placing bid...');
        const tx = await placeBidContract.placeBid(
            bidParams.orderId,
            bidParams.inputAmount,
            bidParams.outputAmount,
            bidParams.gasEstimate,
            {
                gasLimit: gasEstimate * 2n,
                maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                // NO VALUE PARAMETER
            }
        );
        
        console.log(`🔗 Transaction: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`✅ Bid placed successfully in block ${receipt.blockNumber}`);
        
        // Verify bid was placed
        const bidABI = ['function getBids(bytes32) external view returns (tuple(address,uint256,uint256,uint256,bool,uint256,uint256)[])'];
        const bidContract = new ethers.Contract(contractAddress, bidABI, provider);
        const bids = await bidContract.getBids(orderId);
        
        console.log(`\n🎉 SUCCESS: Order now has ${bids.length} bid(s)!`);
        if (bids.length > 0) {
            bids.forEach((bid, i) => {
                if (bid.active) {
                    console.log(`   Bid ${i + 1}: ${bid.resolver}`);
                    console.log(`     Input: ${ethers.formatEther(bid.inputAmount)} ETH`);
                    console.log(`     Output: ${ethers.formatEther(bid.outputAmount)} ALGO`);
                    console.log(`     Active: ${bid.active}`);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Fixed bidding failed:', error.message);
        
        if (error.message.includes('execution reverted')) {
            console.log('\n🔍 REVERT ANALYSIS:');
            console.log('- Check if order is expired');
            console.log('- Verify input/output amounts are > 0');
            console.log('- Ensure gasEstimate is > 0');
            console.log('- Check order validity');
        }
    }
}

fixedBidding().catch(console.error);