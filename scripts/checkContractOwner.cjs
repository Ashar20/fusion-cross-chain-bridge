#!/usr/bin/env node

/**
 * Check contract owner and authorization status
 */

const { ethers } = require('ethers');

async function checkContractOwner() {
    console.log('🔍 CHECKING CONTRACT AUTHORIZATION');
    console.log('==================================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    
    // Addresses to check
    const userAddress = '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53';
    const relayerAddress = '0x58924acDe600D5a0Fb3fb0AF49c8FE02060F79Ea';
    const relayerAddress2 = '0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d';
    
    console.log(`🏦 Contract: ${contractAddress}`);
    console.log(`👤 User: ${userAddress}`);
    console.log(`🤖 Relayer: ${relayerAddress}\n`);
    
    try {
        // Check contract owner
        const ownerABI = ['function owner() external view returns (address)'];
        const ownerContract = new ethers.Contract(contractAddress, ownerABI, provider);
        const owner = await ownerContract.owner();
        
        console.log(`👑 Contract Owner: ${owner}`);
        console.log(`👤 User is owner: ${owner.toLowerCase() === userAddress.toLowerCase()}`);
        console.log(`🤖 Relayer is owner: ${owner.toLowerCase() === relayerAddress.toLowerCase()}\n`);
        
        // Check authorization status
        const authABI = ['function authorizedResolvers(address) external view returns (bool)'];
        const authContract = new ethers.Contract(contractAddress, authABI, provider);
        
        const userAuthorized = await authContract.authorizedResolvers(userAddress);
        const relayerAuthorized = await authContract.authorizedResolvers(relayerAddress);
        const relayer2Authorized = await authContract.authorizedResolvers(relayerAddress2);
        
        console.log('🔐 AUTHORIZATION STATUS:');
        console.log(`👤 User authorized: ${userAuthorized ? '✅ YES' : '❌ NO'}`);
        console.log(`🤖 Relayer 1 authorized: ${relayerAuthorized ? '✅ YES' : '❌ NO'}`);
        console.log(`🤖 Relayer 2 authorized: ${relayer2Authorized ? '✅ YES' : '❌ NO'}\n`);
        
        if (!relayerAuthorized && owner.toLowerCase() === userAddress.toLowerCase()) {
            console.log('🎯 SOLUTION: User is owner and can authorize the relayer!');
            console.log('💡 Next step: Call authorizeResolver(relayerAddress, true)');
            return { needsAuth: true, canAuth: true, owner, userAddress, relayerAddress };
        } else if (!relayerAuthorized) {
            console.log('❌ PROBLEM: Relayer not authorized and user is not owner');
            console.log(`💡 Contact owner ${owner} to authorize relayer`);
            return { needsAuth: true, canAuth: false, owner, userAddress, relayerAddress };
        } else {
            console.log('✅ Relayer is already authorized to place bids!');
            return { needsAuth: false, canAuth: false, owner, userAddress, relayerAddress };
        }
        
    } catch (error) {
        console.error('❌ Error checking contract:', error.message);
        return null;
    }
}

checkContractOwner().then(result => {
    if (result) {
        console.log('\n📊 SUMMARY:');
        console.log(`Owner: ${result.owner}`);
        console.log(`Needs Auth: ${result.needsAuth}`);
        console.log(`Can Auth: ${result.canAuth}`);
    }
}).catch(console.error);