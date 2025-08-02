#!/usr/bin/env node

/**
 * 🔍 EXTRACT ORDER HASH FROM TRANSACTION
 * 
 * Extract the order hash from the successful ETH → ALGO swap transaction
 */

const { ethers } = require('ethers');

async function extractOrderHash() {
    console.log('🔍 EXTRACTING ORDER HASH FROM TRANSACTION');
    console.log('==========================================');
    
    const txHash = '0x99978437ff418ff8294f13838ff8819dab4bcb64337f3316ab0ac0c0a510a3d0';
    const resolverAddress = '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64';
    
    // Initialize provider
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    console.log('📋 TRANSACTION RECEIPT:');
    console.log(`   Hash: ${txHash}`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
    console.log(`   Logs: ${receipt.logs.length}`);
    console.log('');
    
    // Parse all logs to find the CrossChainOrderCreated event
    const resolver = new ethers.Contract(
        resolverAddress,
        [
            'event CrossChainOrderCreated(bytes32 indexed orderHash, address indexed maker, address token, uint256 amount, bytes32 hashlock, uint256 timelock, string algorandAddress)'
        ],
        provider
    );
    
    console.log('🔍 PARSING LOGS...');
    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`   Log ${i}:`);
        console.log(`     Address: ${log.address}`);
        console.log(`     Topics: ${log.topics.length}`);
        
        try {
            const parsed = resolver.interface.parseLog(log);
            console.log(`     ✅ Parsed Event: ${parsed.name}`);
            if (parsed.name === 'CrossChainOrderCreated') {
                console.log(`     🎯 Order Hash: ${parsed.args.orderHash}`);
                console.log(`     👤 Maker: ${parsed.args.maker}`);
                console.log(`     💰 Amount: ${ethers.formatEther(parsed.args.amount)} ETH`);
                console.log(`     🔒 Hashlock: ${parsed.args.hashlock}`);
                console.log(`     ⏰ Timelock: ${parsed.args.timelock}`);
                console.log(`     🪙 Algorand Address: ${parsed.args.algorandAddress}`);
                
                // Save the order hash
                const orderHash = parsed.args.orderHash;
                console.log('');
                console.log('✅ ORDER HASH EXTRACTED SUCCESSFULLY!');
                console.log(`🎯 Order Hash: ${orderHash}`);
                console.log('');
                
                return orderHash;
            }
        } catch (error) {
            console.log(`     ❌ Parse failed: ${error.message}`);
        }
        console.log('');
    }
    
    console.log('❌ CrossChainOrderCreated event not found in logs');
    return null;
}

// Run extraction
extractOrderHash().catch(console.error); 