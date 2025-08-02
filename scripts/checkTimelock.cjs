#!/usr/bin/env node

/**
 * 🔍 CHECK TIMELOCK REQUIREMENTS
 * 
 * Check current block timestamp and calculate correct timelock
 */

const { ethers } = require('ethers');

async function checkTimelock() {
    console.log('🔍 CHECKING TIMELOCK REQUIREMENTS');
    console.log('==================================');
    
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
    
    // Get current block
    const currentBlock = await provider.getBlock('latest');
    const currentTimestamp = currentBlock.timestamp;
    
    console.log('📋 CURRENT BLOCK INFO:');
    console.log(`   Block Number: ${currentBlock.number}`);
    console.log(`   Timestamp: ${currentTimestamp}`);
    console.log(`   Date: ${new Date(currentTimestamp * 1000).toISOString()}`);
    console.log('');
    
    // Contract requirements
    const DEFAULT_TIMELOCK = 24 * 60 * 60; // 24 hours in seconds
    const MIN_TIMELOCK = currentTimestamp + DEFAULT_TIMELOCK;
    
    console.log('📋 CONTRACT REQUIREMENTS:');
    console.log(`   DEFAULT_TIMELOCK: ${DEFAULT_TIMELOCK} seconds (24 hours)`);
    console.log(`   MIN_TIMELOCK: ${MIN_TIMELOCK}`);
    console.log(`   MIN_TIMELOCK Date: ${new Date(MIN_TIMELOCK * 1000).toISOString()}`);
    console.log('');
    
    // Calculate a safe timelock (24 hours + 2 hours buffer)
    const SAFE_TIMELOCK = currentTimestamp + DEFAULT_TIMELOCK + (2 * 60 * 60); // 24 hours + 2 hours
    
    console.log('📋 RECOMMENDED TIMELOCK:');
    console.log(`   SAFE_TIMELOCK: ${SAFE_TIMELOCK}`);
    console.log(`   SAFE_TIMELOCK Date: ${new Date(SAFE_TIMELOCK * 1000).toISOString()}`);
    console.log(`   Buffer: 2 hours extra`);
    console.log('');
    
    // Test the calculation
    const isValid = SAFE_TIMELOCK >= MIN_TIMELOCK;
    console.log('✅ VALIDATION:');
    console.log(`   SAFE_TIMELOCK >= MIN_TIMELOCK: ${isValid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Difference: ${SAFE_TIMELOCK - MIN_TIMELOCK} seconds`);
    console.log('');
    
    return {
        currentTimestamp,
        minTimelock: MIN_TIMELOCK,
        safeTimelock: SAFE_TIMELOCK,
        isValid
    };
}

// Run the check
checkTimelock().then(result => {
    console.log('🎯 RESULT SUMMARY');
    console.log('==================');
    console.log(`Current Timestamp: ${result.currentTimestamp}`);
    console.log(`Min Timelock: ${result.minTimelock}`);
    console.log(`Safe Timelock: ${result.safeTimelock}`);
    console.log(`Valid: ${result.isValid}`);
}).catch(console.error); 