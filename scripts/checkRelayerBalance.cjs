#!/usr/bin/env node
/**
 * Check relayer ETH balance
 */
const { ethers } = require('ethers');
require('dotenv').config();

async function checkRelayerBalance() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    
    console.log('💰 CHECKING RELAYER BALANCE');
    console.log('==========================');
    console.log(`🤖 Relayer: ${relayerWallet.address}`);
    
    const balance = await provider.getBalance(relayerWallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.01')) {
        console.log('⚠️ Low balance! Relayer needs more ETH for transactions.');
    } else {
        console.log('✅ Sufficient balance for transactions.');
    }
}

checkRelayerBalance().catch(console.error); 
/**
 * Check relayer ETH balance
 */
const { ethers } = require('ethers');
require('dotenv').config();

async function checkRelayerBalance() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    
    console.log('💰 CHECKING RELAYER BALANCE');
    console.log('==========================');
    console.log(`🤖 Relayer: ${relayerWallet.address}`);
    
    const balance = await provider.getBalance(relayerWallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.01')) {
        console.log('⚠️ Low balance! Relayer needs more ETH for transactions.');
    } else {
        console.log('✅ Sufficient balance for transactions.');
    }
}

checkRelayerBalance().catch(console.error); 
 