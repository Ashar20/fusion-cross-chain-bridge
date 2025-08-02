#!/usr/bin/env node

/**
 * 🔍 TEST CORRECT HASHING METHOD
 * 
 * The contract uses keccak256(abi.encodePacked(_secret)) not SHA256
 * Let's test both methods to find the correct secret
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

async function testCorrectHashing() {
    console.log('🔍 TESTING CORRECT HASHING METHOD');
    console.log('==================================');
    
    const targetHashlock = '0x04496c310a28bdca0e86a43cf816b16ed744811c54bb0ef735e6007c9190e924';
    const testSecret = '0x29e9ed4b703647ba630d20d26e9c2e3b11021c018f17146fbbfa44e55f406356';
    
    console.log(`🎯 Target Hashlock: ${targetHashlock}`);
    console.log(`🔐 Test Secret: ${testSecret}`);
    console.log('');
    
    // Method 1: SHA256 (what I was using)
    const sha256Hash = crypto.createHash('sha256').update(Buffer.from(testSecret.slice(2), 'hex')).digest('hex');
    const sha256Hashlock = '0x' + sha256Hash;
    
    console.log('🔍 METHOD 1: SHA256 (What I was using)');
    console.log(`   Hash: ${sha256Hashlock}`);
    console.log(`   Match: ${sha256Hashlock === targetHashlock ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    // Method 2: Keccak256 (what the contract uses)
    const keccak256Hash = ethers.keccak256(testSecret);
    
    console.log('🔍 METHOD 2: KECCAK256 (What the contract uses)');
    console.log(`   Hash: ${keccak256Hash}`);
    console.log(`   Match: ${keccak256Hash === targetHashlock ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    // Method 3: Try to find the correct secret using keccak256
    console.log('🔍 METHOD 3: FINDING CORRECT SECRET WITH KECCAK256');
    console.log('==================================================');
    
    // Try some common patterns with keccak256
    const testSecrets = [
        '0x' + '0'.repeat(64), // All zeros
        '0x' + '1'.repeat(64), // All ones
        '0x' + 'a'.repeat(64), // All 'a'
        '0x' + 'f'.repeat(64), // All 'f'
        '0x' + 'deadbeef'.repeat(16), // Deadbeef pattern
        '0x' + 'cafebabe'.repeat(16), // Cafebabe pattern
        '0x' + '1234567890abcdef'.repeat(4), // Hex pattern
        '0x' + 'abcdef1234567890'.repeat(4), // Hex pattern
        
        // Random secrets
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
    
    console.log('🔍 Testing secrets with keccak256...');
    let foundSecret = null;
    
    for (let i = 0; i < testSecrets.length; i++) {
        const secret = testSecrets[i];
        const hash = ethers.keccak256(secret);
        
        console.log(`   Test ${i + 1}: ${secret.slice(0, 10)}... -> ${hash.slice(0, 10)}...`);
        
        if (hash === targetHashlock) {
            console.log(`✅ FOUND MATCHING SECRET: ${secret}`);
            foundSecret = secret;
            break;
        }
    }
    
    if (!foundSecret) {
        console.log('❌ No match found in test set');
        console.log('');
        console.log('💡 The original secret was generated randomly and is not in our test set');
        console.log('💡 We need to find the actual secret that was used in the original transaction');
        console.log('');
        
        // Let me check if we can find it by looking at the original transaction data
        console.log('🔍 METHOD 4: ANALYZING ORIGINAL TRANSACTION DATA');
        console.log('================================================');
        
        const txHash = '0x99978437ff418ff8294f13838ff8819dab4bcb64337f3316ab0ac0c0a510a3d0';
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        
        try {
            const tx = await provider.getTransaction(txHash);
            console.log('📋 Original Transaction Data:');
            console.log(`   From: ${tx.from}`);
            console.log(`   To: ${tx.to}`);
            console.log(`   Data: ${tx.data}`);
            console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
            
            // The transaction data might contain clues about the original secret
            // But since it was generated randomly, we can't recover it
            
        } catch (error) {
            console.log(`❌ Error getting transaction: ${error.message}`);
        }
        
        return {
            status: 'Original secret not recoverable',
            reason: 'Secret was generated randomly and not saved',
            recommendation: 'Create a new test with a known secret'
        };
    }
    
    return {
        status: 'Secret found!',
        secret: foundSecret,
        hashlock: targetHashlock,
        hashingMethod: 'keccak256'
    };
}

// Run the test
testCorrectHashing().then(result => {
    console.log('');
    console.log('🎯 RESULT SUMMARY');
    console.log('==================');
    console.log(`Status: ${result.status}`);
    if (result.secret) {
        console.log(`Secret: ${result.secret}`);
        console.log(`Hashlock: ${result.hashlock}`);
        console.log(`Hashing Method: ${result.hashingMethod}`);
        console.log('');
        console.log('✅ We can now complete the atomic swap!');
    } else {
        console.log(`Reason: ${result.reason}`);
        console.log(`Recommendation: ${result.recommendation}`);
    }
}).catch(console.error); 