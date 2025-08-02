#!/usr/bin/env node

/**
 * 🔍 FIND ORIGINAL SECRET FOR HASHLOCK
 * 
 * Find the secret that generates hashlock: 0x04496c310a28bdca0e86a43cf816b16ed744811c54bb0ef735e6007c9190e924
 * This will allow us to complete the atomic swap
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

async function findOriginalSecret() {
    console.log('🔍 FINDING ORIGINAL SECRET FOR HASHLOCK');
    console.log('========================================');
    
    const targetHashlock = '0x04496c310a28bdca0e86a43cf816b16ed744811c54bb0ef735e6007c9190e924';
    const txHash = '0x99978437ff418ff8294f13838ff8819dab4bcb64337f3316ab0ac0c0a510a3d0';
    
    console.log(`🎯 Target Hashlock: ${targetHashlock}`);
    console.log(`🔗 Transaction: ${txHash}`);
    console.log('');
    
    // Method 1: Check if the secret was logged in the original script
    console.log('🔍 METHOD 1: CHECKING ORIGINAL SCRIPT LOGS');
    console.log('==========================================');
    
    // The original script should have logged the secret when it was generated
    // Let me check if we can find it in the console output or logs
    
    // Method 2: Try common patterns and brute force
    console.log('🔍 METHOD 2: BRUTE FORCE COMMON PATTERNS');
    console.log('=========================================');
    
    const testSecrets = [
        // Common test secrets
        '0x' + '0'.repeat(64), // All zeros
        '0x' + '1'.repeat(64), // All ones
        '0x' + 'a'.repeat(64), // All 'a'
        '0x' + 'f'.repeat(64), // All 'f'
        '0x' + 'deadbeef'.repeat(16), // Deadbeef pattern
        '0x' + 'cafebabe'.repeat(16), // Cafebabe pattern
        '0x' + '1234567890abcdef'.repeat(4), // Hex pattern
        '0x' + 'abcdef1234567890'.repeat(4), // Hex pattern
        
        // Random secrets that might have been used
        '0x' + crypto.randomBytes(32).toString('hex'),
        '0x' + crypto.randomBytes(32).toString('hex'),
        '0x' + crypto.randomBytes(32).toString('hex'),
        '0x' + crypto.randomBytes(32).toString('hex'),
        '0x' + crypto.randomBytes(32).toString('hex'),
        
        // Check if any of these match
        '0x29e9ed4b703647ba630d20d26e9c2e3b11021c018f17146fbbfa44e55f406356', // From earlier test
        '0xefd6e79f24eb5c7c8273c06d3fc9d84e12454a679b9e47c56d574546f64a8b86', // From earlier test
        '0xd3504c8ebd2e524f3927b61ea1ad0eb96f0ddec99535e8fd58330a1f393519cf', // From earlier test
        '0x90fdd8a1f203d22ea037b3e4431f17093f48a82bd4db420f603c6c691f92a6e6', // From earlier test
    ];
    
    console.log('🔍 Testing common secret patterns...');
    let foundSecret = null;
    
    for (let i = 0; i < testSecrets.length; i++) {
        const secret = testSecrets[i];
        const hash = crypto.createHash('sha256').update(Buffer.from(secret.slice(2), 'hex')).digest('hex');
        const hashlock = '0x' + hash;
        
        console.log(`   Test ${i + 1}: ${secret.slice(0, 10)}... -> ${hashlock.slice(0, 10)}...`);
        
        if (hashlock === targetHashlock) {
            console.log(`✅ FOUND MATCHING SECRET: ${secret}`);
            foundSecret = secret;
            break;
        }
    }
    
    if (!foundSecret) {
        console.log('❌ No match found in common patterns');
        console.log('');
        
        // Method 3: Check the original transaction for any clues
        console.log('🔍 METHOD 3: ANALYZING ORIGINAL TRANSACTION');
        console.log('============================================');
        
        try {
            const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
            const receipt = await provider.getTransactionReceipt(txHash);
            
            console.log('📋 Transaction Analysis:');
            console.log(`   Block: ${receipt.blockNumber}`);
            console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
            console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
            console.log(`   Logs: ${receipt.logs.length}`);
            
            // Check if there are any other events that might contain the secret
            for (let i = 0; i < receipt.logs.length; i++) {
                const log = receipt.logs[i];
                console.log(`   Log ${i}: ${log.topics.length} topics, ${log.data.length} bytes of data`);
            }
            
        } catch (error) {
            console.log(`❌ Error analyzing transaction: ${error.message}`);
        }
        
        // Method 4: Try to reconstruct from the original script
        console.log('');
        console.log('🔍 METHOD 4: RECONSTRUCTING FROM ORIGINAL SCRIPT');
        console.log('================================================');
        
        // The original script generated the secret randomly, but we can try to find it
        // by looking at the exact parameters used in the transaction
        
        console.log('💡 The original script generated a random secret using crypto.randomBytes(32)');
        console.log('💡 Unfortunately, this secret was not saved and cannot be recovered');
        console.log('💡 However, we can create a new test with a known secret');
        console.log('');
        
        // Method 5: Create a new test with known secret
        console.log('🔍 METHOD 5: CREATING NEW TEST WITH KNOWN SECRET');
        console.log('=================================================');
        
        const newSecret = crypto.randomBytes(32);
        const newHashlock = '0x' + crypto.createHash('sha256').update(newSecret).digest('hex');
        
        console.log('✅ Generated new secret/hashlock pair:');
        console.log(`   🔐 Secret: 0x${newSecret.toString('hex')}`);
        console.log(`   🔒 Hashlock: ${newHashlock}`);
        console.log('');
        console.log('💡 This new pair can be used for a complete atomic swap test');
        
        return {
            originalSecret: null,
            originalHashlock: targetHashlock,
            newSecret: '0x' + newSecret.toString('hex'),
            newHashlock: newHashlock,
            status: 'Original secret not recoverable, but new test pair generated'
        };
    }
    
    return {
        originalSecret: foundSecret,
        originalHashlock: targetHashlock,
        status: 'Original secret found!'
    };
}

// Run the secret finder
findOriginalSecret().then(result => {
    console.log('');
    console.log('🎯 RESULT SUMMARY');
    console.log('==================');
    console.log(`Status: ${result.status}`);
    if (result.originalSecret) {
        console.log(`Original Secret: ${result.originalSecret}`);
        console.log(`Original Hashlock: ${result.originalHashlock}`);
        console.log('');
        console.log('✅ We can now complete the atomic swap!');
    } else if (result.newSecret) {
        console.log(`New Secret: ${result.newSecret}`);
        console.log(`New Hashlock: ${result.newHashlock}`);
        console.log('');
        console.log('✅ We can create a new complete atomic swap test!');
    }
}).catch(console.error); 