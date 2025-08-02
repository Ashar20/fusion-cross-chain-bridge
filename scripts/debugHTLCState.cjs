#!/usr/bin/env node

const { ethers } = require('ethers');

async function debugHTLCState() {
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth-sepolia.public.blastapi.io');
    
    const contractABI = [
        'function htlcContracts(bytes32) external view returns (address initiator, address recipient, address token, uint256 amount, bytes32 hashlock, uint256 timelock, uint256 algorandChainId, string algorandAddress, uint256 algorandAmount, uint256 thresholdAmount, bytes interactionData, bool executed, bool refunded, uint256 createdAt)',
        'function auctions(bytes32) external view returns (bytes32 htlcId, tuple(uint256 startTime, uint256 duration, uint256 initialRateBump, bool linearDecay) config, address winningResolver, uint256 winningGasPrice, uint256 currentPrice, bool filled, bool expired)',
        'function revealedSecrets(bytes32) external view returns (bytes32)'
    ];
    
    const contract = new ethers.Contract(
        '0x2879422E4f1418aC2d3852065C913CaF11Db7c56',
        contractABI,
        provider
    );
    
    const htlcId = '0x54fbab3404d2f7a28dda2c8245a1651da33229bcec5cf1063372936c39359c96';
    const auctionId = '0x6b870f69f099fb21bfb2d60472aca5713f7869b1b2f9b41c9239b4d9a049b9ae';
    const expectedSecret = '0x17f126504d574b710df32b13cffcb85099aedb02bd040295535b6b42e07f5666';
    const relayerAddress = '0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d';
    
    console.log('🔍 DEBUGGING HTLC STATE');
    console.log('=======================');
    
    try {
        // Get HTLC details
        const htlc = await contract.htlcContracts(htlcId);
        console.log('📊 HTLC STATE:');
        console.log('  Initiator:', htlc.initiator);
        console.log('  Recipient:', htlc.recipient);
        console.log('  Token:', htlc.token);
        console.log('  Amount:', ethers.formatEther(htlc.amount), 'ETH');
        console.log('  Hashlock:', htlc.hashlock);
        console.log('  Timelock:', new Date(Number(htlc.timelock) * 1000).toISOString());
        console.log('  Executed:', htlc.executed);
        console.log('  Refunded:', htlc.refunded);
        console.log('  Threshold:', ethers.formatEther(htlc.thresholdAmount), 'ETH');
        console.log('  Algo Amount:', htlc.algorandAmount.toString());
        console.log('');
        
        // Get auction state  
        const auction = await contract.auctions(auctionId);
        console.log('🎯 AUCTION STATE:');
        console.log('  HTLC ID:', auction.htlcId);
        console.log('  Winning Resolver:', auction.winningResolver);
        console.log('  Is Relayer Winner:', auction.winningResolver === relayerAddress);
        console.log('  Filled:', auction.filled);
        console.log('  Current Price:', ethers.formatUnits(auction.currentPrice, 'gwei'), 'gwei');
        console.log('');
        
        // Check if secret is revealed
        const revealedSecret = await contract.revealedSecrets(htlcId);
        console.log('🔑 SECRET STATE:');
        console.log('  Expected:', expectedSecret);
        console.log('  Revealed:', revealedSecret);
        console.log('  Is Revealed:', revealedSecret !== '0x0000000000000000000000000000000000000000000000000000000000000000');
        console.log('  Matches:', revealedSecret === expectedSecret);
        console.log('');
        
        // Verify hashlock
        const computedHash = ethers.keccak256(expectedSecret);
        console.log('🔒 HASHLOCK VERIFICATION:');
        console.log('  HTLC Hashlock:', htlc.hashlock);
        console.log('  Computed Hash:', computedHash);
        console.log('  Matches:', htlc.hashlock === computedHash);
        console.log('');
        
        // Check timing
        const now = Math.floor(Date.now() / 1000);
        console.log('⏰ TIMING:');
        console.log('  Current Time:', new Date(now * 1000).toISOString());
        console.log('  Timelock:', new Date(Number(htlc.timelock) * 1000).toISOString());
        console.log('  Expired:', now >= Number(htlc.timelock));
        console.log('');
        
        // Analyze issues
        console.log('🔍 EXECUTION REQUIREMENTS CHECK:');
        const isWinner = auction.winningResolver === relayerAddress;
        const htlcExists = htlc.initiator !== ethers.ZeroAddress;
        const notExecuted = !htlc.executed;
        const validSecret = htlc.hashlock === computedHash;
        const notExpired = now < Number(htlc.timelock);
        const thresholdMet = Number(htlc.algorandAmount) >= Number(htlc.thresholdAmount);
        
        console.log('  Auction winner:', isWinner ? '✅' : '❌');
        console.log('  HTLC exists:', htlcExists ? '✅' : '❌');
        console.log('  Not executed:', notExecuted ? '✅' : '❌');
        console.log('  Valid secret:', validSecret ? '✅' : '❌');
        console.log('  Not expired:', notExpired ? '✅' : '❌');
        console.log('  Threshold met:', thresholdMet ? '✅' : '❌');
        
        if (!isWinner) console.log('❌ Issue: Relayer is not the auction winner');
        if (!htlcExists) console.log('❌ Issue: HTLC does not exist');
        if (!notExecuted) console.log('❌ Issue: HTLC already executed');
        if (!validSecret) console.log('❌ Issue: Secret does not match hashlock');
        if (!notExpired) console.log('❌ Issue: HTLC has expired');
        if (!thresholdMet) console.log('❌ Issue: Threshold amount not met');
        
        if (isWinner && htlcExists && notExecuted && validSecret && notExpired && thresholdMet) {
            console.log('✅ All requirements met - execution should work!');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugHTLCState().catch(console.error); 
 
 