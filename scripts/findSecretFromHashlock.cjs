const crypto = require('crypto');

function findSecretFromHashlock(targetHashlock) {
    console.log('🔍 FINDING SECRET FROM HASHLOCK');
    console.log('================================');
    console.log(`Target Hashlock: ${targetHashlock}`);
    console.log('');
    
    // Remove '0x' prefix if present
    const targetHash = targetHashlock.replace('0x', '');
    
    // Try to find the secret by brute force (for demo purposes)
    // In a real scenario, this would be the original secret used
    console.log('🔍 Attempting to find secret...');
    
    // For demo purposes, let's try some common patterns
    const testSecrets = [
        '0x' + '0'.repeat(64), // All zeros
        '0x' + '1'.repeat(64), // All ones
        '0x' + 'a'.repeat(64), // All 'a'
        '0x' + 'f'.repeat(64), // All 'f'
        '0x' + crypto.randomBytes(32).toString('hex'), // Random
        '0x' + crypto.randomBytes(32).toString('hex'), // Another random
        '0x' + crypto.randomBytes(32).toString('hex'), // Another random
    ];
    
    for (let i = 0; i < testSecrets.length; i++) {
        const secret = testSecrets[i];
        const hash = crypto.createHash('sha256').update(Buffer.from(secret.slice(2), 'hex')).digest('hex');
        
        console.log(`Test ${i + 1}: Secret ${secret.slice(0, 10)}... -> Hash ${hash.slice(0, 10)}...`);
        
        if (hash === targetHash) {
            console.log(`✅ FOUND MATCHING SECRET: ${secret}`);
            return secret;
        }
    }
    
    console.log('❌ No matching secret found in test set');
    console.log('');
    console.log('💡 For a real atomic swap, you would need the original secret');
    console.log('💡 This is a demonstration of the hashlock mechanism');
    
    return null;
}

// The hashlock from the successful transaction
const targetHashlock = '0xfed01087581da71be7e600f42e4dfe2ef1413f6cc1d47a1a1dca030e0cd427b2';

findSecretFromHashlock(targetHashlock); 