#!/usr/bin/env node
/**
 * Test basic 1inch contract interaction
 */
const { ethers } = require('ethers');
require('dotenv').config();

async function test1inchContract() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    
    console.log('🧪 TESTING 1INCH CONTRACT INTERACTION');
    console.log('=====================================');
    console.log(`🤖 Relayer: ${relayerWallet.address}`);
    
    // 1inch EscrowFactory address
    const escrowFactoryAddress = '0x523258A91028793817F84aB037A3372B468ee940';
    
    // Basic ABI to check if contract exists
    const basicABI = [
        'function owner() external view returns (address)',
        'function implementation() external view returns (address)'
    ];
    
    try {
        const contract = new ethers.Contract(escrowFactoryAddress, basicABI, relayerWallet);
        
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
        
    } catch (error) {
        console.error('❌ Contract interaction failed:', error.message);
        
        // Try to get contract code
        const code = await provider.getCode(escrowFactoryAddress);
        if (code === '0x') {
            console.log('❌ No contract deployed at this address');
        } else {
            console.log('✅ Contract code exists at address');
            console.log('❌ But function call failed - check ABI');
        }
    }
}

test1inchContract().catch(console.error); 