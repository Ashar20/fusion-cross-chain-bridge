#!/usr/bin/env node
/**
 * Test enhanced bridge contract
 */
const { ethers } = require('ethers');
require('dotenv').config();

async function testEnhancedBridge() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    
    console.log('🧪 TESTING ENHANCED BRIDGE CONTRACT');
    console.log('====================================');
    console.log(`🤖 Relayer: ${relayerWallet.address}`);
    
    // Enhanced Bridge address
    const bridgeAddress = '0x343E44b629fcd1E97Fd787D0f60F39F8FEA123eE';
    
    // Basic ABI to check if contract exists
    const basicABI = [
        'function owner() external view returns (address)',
        'function MIN_GAS_PRICE() external view returns (uint256)',
        'function MAX_GAS_PRICE() external view returns (uint256)'
    ];
    
    try {
        const contract = new ethers.Contract(bridgeAddress, basicABI, relayerWallet);
        
        console.log('📋 Testing contract existence...');
        
        // Try to call a simple view function
        const owner = await contract.owner();
        console.log(`✅ Contract exists! Owner: ${owner}`);
        
        // Check if relayer is the owner
        if (owner.toLowerCase() === relayerWallet.address.toLowerCase()) {
            console.log('✅ Relayer is the contract owner!');
        } else {
            console.log('⚠️ Relayer is NOT the contract owner');
        }
        
        // Get gas price limits
        const minGasPrice = await contract.MIN_GAS_PRICE();
        const maxGasPrice = await contract.MAX_GAS_PRICE();
        console.log(`💰 Min Gas Price: ${ethers.formatUnits(minGasPrice, 'gwei')} gwei`);
        console.log(`💰 Max Gas Price: ${ethers.formatUnits(maxGasPrice, 'gwei')} gwei`);
        
    } catch (error) {
        console.error('❌ Contract interaction failed:', error.message);
        
        // Try to get contract code
        const code = await provider.getCode(bridgeAddress);
        if (code === '0x') {
            console.log('❌ No contract deployed at this address');
        } else {
            console.log('✅ Contract code exists at address');
            console.log('❌ But function call failed - check ABI');
        }
    }
}

testEnhancedBridge().catch(console.error); 