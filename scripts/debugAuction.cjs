#!/usr/bin/env node

/**
 * 🔍 DEBUG AUCTION STATE
 * Investigating why the bidding transaction is reverting
 */

const { ethers } = require('ethers');

async function debugAuction() {
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth-sepolia.public.blastapi.io');
    const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY, provider);
    
    const contractABI = [
        'function auctions(bytes32) external view returns (bytes32 htlcId, tuple(uint256 startTime, uint256 duration, uint256 initialRateBump, bool linearDecay) config, address winningResolver, uint256 winningGasPrice, uint256 currentPrice, bool filled, bool expired)',
        'function getCurrentAuctionPrice(bytes32) external view returns (uint256)',
        'function MIN_GAS_PRICE() external view returns (uint256)',
        'function INITIAL_GAS_PRICE() external view returns (uint256)',
        'function authorizedResolvers(address) external view returns (bool)',
        'function placeBid(bytes32,uint256) external'
    ];
    
    const contract = new ethers.Contract(
        '0x2879422E4f1418aC2d3852065C913CaF11Db7c56',
        contractABI,
        provider
    );
    
    const auctionId = '0x6b870f69f099fb21bfb2d60472aca5713f7869b1b2f9b41c9239b4d9a049b9ae';
    
    console.log('🔍 DEBUGGING AUCTION STATE');
    console.log('==========================');
    console.log('Auction ID:', auctionId);
    console.log('Relayer:', relayerWallet.address);
    console.log('');
    
    try {
        // Check auction state
        const auction = await contract.auctions(auctionId);
        console.log('📊 AUCTION STATE:');
        console.log('  HTLC ID:', auction.htlcId);
        console.log('  Start Time:', new Date(Number(auction.config.startTime) * 1000).toISOString());
        console.log('  Duration:', auction.config.duration.toString(), 'seconds');
        console.log('  Winning Resolver:', auction.winningResolver);
        console.log('  Current Price:', ethers.formatUnits(auction.currentPrice, 'gwei'), 'gwei');
        console.log('  Filled:', auction.filled);
        console.log('  Expired:', auction.expired);
        console.log('');
        
        // Check current price
        const currentPrice = await contract.getCurrentAuctionPrice(auctionId);
        console.log('💰 CURRENT PRICE (LIVE):', ethers.formatUnits(currentPrice, 'gwei'), 'gwei');
        
        // Check constants
        const minGasPrice = await contract.MIN_GAS_PRICE();
        const initialGasPrice = await contract.INITIAL_GAS_PRICE();
        console.log('📏 Min Gas Price:', ethers.formatUnits(minGasPrice, 'gwei'), 'gwei');
        console.log('📏 Initial Gas Price:', ethers.formatUnits(initialGasPrice, 'gwei'), 'gwei');
        console.log('');
        
        // Check authorization
        const isAuthorized = await contract.authorizedResolvers(relayerWallet.address);
        console.log('🔐 RELAYER AUTHORIZED:', isAuthorized);
        
        // Check timing
        const now = Math.floor(Date.now() / 1000);
        const auctionEnd = Number(auction.config.startTime) + Number(auction.config.duration);
        console.log('⏰ Current Time:', new Date(now * 1000).toISOString());
        console.log('⏰ Auction End:', new Date(auctionEnd * 1000).toISOString());
        console.log('⏰ Time Remaining:', Math.max(0, auctionEnd - now), 'seconds');
        console.log('');
        
        // Analyze the issue
        console.log('🔍 ISSUE ANALYSIS:');
        let issueFound = false;
        
        if (auction.filled) {
            console.log('❌ Issue: Auction already filled');
            issueFound = true;
        }
        
        if (auction.expired) {
            console.log('❌ Issue: Auction marked as expired');
            issueFound = true;
        }
        
        if (now >= auctionEnd) {
            console.log('❌ Issue: Auction time ended');
            issueFound = true;
        }
        
        if (!isAuthorized) {
            console.log('❌ Issue: Relayer not authorized');
            issueFound = true;
        }
        
        if (auction.htlcId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            console.log('❌ Issue: Auction not found (zero HTLC ID)');
            issueFound = true;
        }
        
        if (!issueFound) {
            console.log('✅ Auction state looks valid');
            console.log('💡 Suggested bid price:', ethers.formatUnits(currentPrice, 'gwei'), 'gwei');
            
            // Try to simulate the bid
            console.log('');
            console.log('🧪 SIMULATING BID...');
            
            try {
                // Use callStatic to simulate the transaction
                await contract.connect(relayerWallet).placeBid.staticCall(auctionId, currentPrice);
                console.log('✅ Bid simulation successful - transaction should work');
                
                // Try actual bid
                console.log('🚀 ATTEMPTING REAL BID...');
                const bidTx = await contract.connect(relayerWallet).placeBid(auctionId, currentPrice);
                console.log('📝 Bid transaction:', bidTx.hash);
                
                const receipt = await bidTx.wait();
                console.log('✅ BID SUCCESSFUL!');
                console.log('Block:', receipt.blockNumber);
                
            } catch (bidError) {
                console.log('❌ Bid failed:', bidError.message);
                
                // Try with a lower bid
                const lowerBid = currentPrice - ethers.parseUnits('1', 'gwei');
                console.log('🔄 Trying lower bid:', ethers.formatUnits(lowerBid, 'gwei'), 'gwei');
                
                try {
                    await contract.connect(relayerWallet).placeBid.staticCall(auctionId, lowerBid);
                    console.log('✅ Lower bid simulation successful');
                } catch (lowerError) {
                    console.log('❌ Lower bid also failed:', lowerError.message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugAuction().catch(console.error); 
 
 