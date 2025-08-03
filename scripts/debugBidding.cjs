#!/usr/bin/env node

/**
 * Debug why bidding is failing
 */

const { ethers } = require('ethers');

async function debugBidding() {
    console.log('🔍 DEBUGGING BIDDING MECHANISM');
    console.log('==============================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    console.log('Private key from env:', process.env.RELAYER_ETH_PRIVATE_KEY ? 'Found' : 'Not found');
    
    // Try different env var names
    const privateKey = process.env.RELAYER_ETH_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    console.log('Using private key from:', privateKey === process.env.RELAYER_ETH_PRIVATE_KEY ? 'RELAYER_ETH_PRIVATE_KEY' : 
                                          privateKey === process.env.RELAYER_PRIVATE_KEY ? 'RELAYER_PRIVATE_KEY' : 'PRIVATE_KEY');
    
    const relayerWallet = new ethers.Wallet(privateKey, provider);
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    
    // Fresh order
    const orderId = '0xfc20a25969492fb0fe5f86861c2e6853a8e486b90d31ad67124350d3f4a77b30';
    
    console.log(`🆔 Order ID: ${orderId}`);
    console.log(`🤖 Relayer: ${relayerWallet.address}`);
    console.log(`🏦 Contract: ${contractAddress}\n`);
    
    try {
        // 1. Check relayer balance
        const balance = await provider.getBalance(relayerWallet.address);
        console.log(`💰 Relayer Balance: ${ethers.formatEther(balance)} ETH`);
        
        // 2. Check authorization
        const authABI = ['function authorizedResolvers(address) external view returns (bool)'];
        const authContract = new ethers.Contract(contractAddress, authABI, provider);
        const isAuthorized = await authContract.authorizedResolvers(relayerWallet.address);
        console.log(`🔐 Relayer Authorized: ${isAuthorized ? '✅ YES' : '❌ NO'}`);
        
        // 3. Check if order exists and has bids
        const bidABI = ['function getBids(bytes32) external view returns (tuple(address,uint256,uint256,uint256,bool,uint256,uint256)[])'];
        const bidContract = new ethers.Contract(contractAddress, bidABI, provider);
        const bids = await bidContract.getBids(orderId);
        console.log(`📊 Current bids: ${bids.length}`);
        
        // 4. Check current block time
        const currentBlock = await provider.getBlock('latest');
        console.log(`⏰ Current time: ${new Date(currentBlock.timestamp * 1000).toISOString()}`);
        console.log(`📦 Current block: ${currentBlock.number}\n`);
        
        // 5. Try the bid with detailed error handling
        console.log('🧪 ATTEMPTING BID WITH FULL ERROR DETAILS...');
        
        const placeBidABI = [
            'function placeBid(bytes32 orderId, uint256 inputAmount, uint256 outputAmount, uint256 gasEstimate) external payable'
        ];
        const placeBidContract = new ethers.Contract(contractAddress, placeBidABI, relayerWallet);
        
        const bidParams = {
            orderId: orderId,
            inputAmount: ethers.parseEther('0.001'),
            outputAmount: ethers.parseEther('0.5'),
            gasEstimate: 150000
        };
        
        console.log('📊 Bid Parameters:');
        console.log(`   Order ID: ${bidParams.orderId}`);
        console.log(`   Input: ${ethers.formatEther(bidParams.inputAmount)} ETH`);
        console.log(`   Output: ${ethers.formatEther(bidParams.outputAmount)} ALGO`);
        console.log(`   Gas Estimate: ${bidParams.gasEstimate}`);
        
        // Try gas estimation first
        try {
            console.log('\n⛽ Testing gas estimation...');
            const gasEstimate = await placeBidContract.placeBid.estimateGas(
                bidParams.orderId,
                bidParams.inputAmount,
                bidParams.outputAmount,
                bidParams.gasEstimate,
                { value: bidParams.inputAmount }
            );
            console.log(`✅ Gas estimation successful: ${gasEstimate.toString()}`);
            
            // If gas estimation works, try actual transaction
            console.log('\n⏳ Placing actual bid...');
            const tx = await placeBidContract.placeBid(
                bidParams.orderId,
                bidParams.inputAmount,
                bidParams.outputAmount,
                bidParams.gasEstimate,
                {
                    value: bidParams.inputAmount,
                    gasLimit: gasEstimate * 2n, // Double the gas limit
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                }
            );
            
            console.log(`🔗 Transaction: ${tx.hash}`);
            console.log('⏳ Waiting for confirmation...');
            
            const receipt = await tx.wait();
            console.log(`✅ Bid placed successfully in block ${receipt.blockNumber}`);
            
            // Check bids again
            const newBids = await bidContract.getBids(orderId);
            console.log(`🎉 Order now has ${newBids.length} bid(s)!`);
            
        } catch (bidError) {
            console.log(`❌ Bidding failed: ${bidError.message}`);
            
            // Parse the error for more details
            if (bidError.data) {
                console.log(`📋 Error data: ${bidError.data}`);
            }
            
            if (bidError.message.includes('execution reverted')) {
                console.log('\n🔍 ANALYZING REVERT REASON:');
                
                // Try to decode the revert reason
                try {
                    const errorData = bidError.data || bidError.error?.data;
                    if (errorData && errorData !== '0x') {
                        console.log(`Raw error data: ${errorData}`);
                        
                        // Try to decode as string
                        if (errorData.length > 10) {
                            try {
                                const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + errorData.slice(10));
                                console.log(`🔍 Decoded error: ${decoded[0]}`);
                            } catch (decodeError) {
                                console.log('🔍 Could not decode error string');
                            }
                        }
                    }
                } catch (parseError) {
                    console.log('🔍 Could not parse error data');
                }
                
                console.log('\n💡 POSSIBLE CAUSES:');
                console.log('- Order may be expired (deadline passed)');
                console.log('- Order may already be filled or cancelled');
                console.log('- Input/output amounts may be invalid');
                console.log('- Contract validation failed');
                console.log('- Insufficient gas or value sent');
            }
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
    }
}

debugBidding().catch(console.error);