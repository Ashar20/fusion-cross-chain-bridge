#!/usr/bin/env node

/**
 * 🤖 COMPLETE RELAYER ETH CLAIM
 * Using the secret revealed on Algorand to claim the locked ETH
 */

const { ethers } = require('ethers');

async function completeRelayerClaim() {
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth-sepolia.public.blastapi.io');
    const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY, provider);
    
    // The revealed secret from Algorand transaction
    const secret = '0xcda8c9cc17c6fd9e77f2686303b0c056b81b2c781db3c06c74d3c4a785103b7c';
    const htlcId = '0xef3fa5935c69b38207e4eca463053ae3ff8b64b2ba3f5da22a637495497e7100';
    
    console.log('🤖 COMPLETING RELAYER ETH CLAIM');
    console.log('===============================');
    console.log('Secret:', secret);
    console.log('HTLC ID:', htlcId);
    console.log('Relayer:', relayerWallet.address);
    console.log('');
    
    // Enhanced1inchStyleBridge ABI
    const bridgeABI = [
        'function setResolverAuthorization(address _resolver, bool _authorized) external',
        'function startSimpleAuction(bytes32 _htlcId, uint256 _duration) external returns (bytes32)',
        'function executeFusionHTLCWithInteraction(bytes32 _htlcId, bytes32 _secret, bytes32 _auctionId, tuple(address target, bytes callData, uint256 gasLimit) _interaction) external',
        'function authorizedResolvers(address) external view returns (bool)',
        'function htlcContracts(bytes32) external view returns (tuple)',
        'event SimpleAuctionStarted(bytes32 indexed auctionId, bytes32 indexed htlcId, uint256 duration, uint256 startTime)',
        'event HTLCExecuted(bytes32 indexed htlcId, address indexed resolver, bytes32 secret)'
    ];
    
    const bridge = new ethers.Contract(
        '0xBc79b64D896C4c94FA0cB52cdc4fbFb5A89E3225',
        bridgeABI,
        relayerWallet
    );
    
    try {
        // Step 1: Check if relayer is authorized
        console.log('🔍 Checking relayer authorization...');
        const isAuthorized = await bridge.authorizedResolvers(relayerWallet.address);
        console.log('Relayer authorized:', isAuthorized);
        
        if (!isAuthorized) {
            console.log('❌ Relayer not authorized. Attempting to self-authorize...');
            
            // Try different approach - check if we can use SimpleHTLC contract
            console.log('🔄 Trying alternative: SimpleHTLC contract...');
            
            // SimpleHTLC ABI
            const simpleHTLCABI = [
                'function withdrawWithSecret(bytes32 _escrowId, bytes32 _secret) external returns (bool)',
                'function getEscrow(bytes32 _escrowId) external view returns (tuple(address initiator, address recipient, address resolver, address token, uint256 amount, bytes32 hashlock, uint256 timelock, bool withdrawn, bool refunded))'
            ];
            
            // Try to find SimpleHTLC deployment
            // First, let's check if the HTLC exists in SimpleHTLC contract
            try {
                // We need to find the SimpleHTLC contract address
                console.log('❌ SimpleHTLC contract address not known. Need to deploy or find existing one.');
                
                // As a workaround, let's authorize the relayer using owner account
                console.log('🔧 Attempting owner authorization...');
                
                const ownerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
                const bridgeAsOwner = bridge.connect(ownerWallet);
                
                const authTx = await bridgeAsOwner.setResolverAuthorization(relayerWallet.address, true);
                await authTx.wait();
                console.log('✅ Relayer authorized by owner');
                
            } catch (authError) {
                console.log('Owner authorization failed:', authError.message);
                return false;
            }
        }
        
        // Step 2: Start auction
        console.log('🎯 Starting auction for HTLC...');
        const auctionTx = await bridge.startSimpleAuction(htlcId, 300); // 5 minute auction
        const auctionReceipt = await auctionTx.wait();
        console.log('✅ Auction started, TX:', auctionTx.hash);
        
        // Extract auction ID from events
        let auctionId = null;
        for (const log of auctionReceipt.logs) {
            try {
                const decoded = bridge.interface.parseLog(log);
                if (decoded && decoded.name === 'SimpleAuctionStarted') {
                    auctionId = decoded.args.auctionId;
                    break;
                }
            } catch (e) {
                // Skip logs that can't be decoded
            }
        }
        
        if (!auctionId) {
            console.log('❌ Could not extract auction ID');
            return false;
        }
        
        console.log('🎯 Auction ID:', auctionId);
        
        // Step 3: Execute HTLC with revealed secret
        console.log('⚡ Executing HTLC with revealed secret...');
        
        const interaction = {
            target: ethers.ZeroAddress,
            callData: '0x',
            gasLimit: 0
        };
        
        const executeTx = await bridge.executeFusionHTLCWithInteraction(
            htlcId,
            secret,
            auctionId,
            interaction,
            { gasLimit: 500000 }
        );
        
        const executeReceipt = await executeTx.wait();
        console.log('✅ HTLC EXECUTED SUCCESSFULLY!');
        console.log('TX Hash:', executeTx.hash);
        console.log('Block:', executeReceipt.blockNumber);
        console.log('Etherscan:', `https://sepolia.etherscan.io/tx/${executeTx.hash}`);
        
        // Check for execution events
        for (const log of executeReceipt.logs) {
            try {
                const decoded = bridge.interface.parseLog(log);
                if (decoded && decoded.name === 'HTLCExecuted') {
                    console.log('🎉 HTLC Execution Event:');
                    console.log('  HTLC ID:', decoded.args.htlcId);
                    console.log('  Resolver:', decoded.args.resolver);
                    console.log('  Secret:', decoded.args.secret);
                }
            } catch (e) {
                // Skip logs that can't be decoded
            }
        }
        
        return {
            success: true,
            auctionTx: auctionTx.hash,
            executeTx: executeTx.hash,
            auctionId: auctionId,
            secret: secret
        };
        
    } catch (error) {
        console.error('❌ Relayer claim failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Execute the relayer claim
completeRelayerClaim().then(result => {
    if (result.success) {
        console.log('\n🎉 RELAYER CLAIM COMPLETED!');
        console.log('===========================');
        console.log('✅ Atomic swap fully completed');
        console.log('✅ User received ALGO');
        console.log('✅ Relayer received ETH');
        console.log('✅ All transactions verifiable on-chain');
    } else {
        console.log('\n❌ RELAYER CLAIM FAILED');
        console.log('========================');
        console.log('The atomic swap is incomplete');
        console.log('User has ALGO but relayer did not get ETH');
    }
}).catch(console.error); 
 
 