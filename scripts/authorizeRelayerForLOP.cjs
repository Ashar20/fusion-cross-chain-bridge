#!/usr/bin/env node

/**
 * 🔧 AUTHORIZE RELAYER FOR LOP
 * 
 * Authorizes the relayer as a resolver on the EnhancedLimitOrderBridge
 * so it can place bids and execute orders
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function authorizeRelayerForLOP() {
    console.log('🔧 AUTHORIZING RELAYER FOR LOP');
    console.log('==============================\n');
    
    try {
        require('dotenv').config();
        
        // Contract address
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Initialize provider and signer (owner)
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Load contract ABI
        const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        
        const contract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);
        
        console.log('✅ Contract initialized');
        console.log(`📋 Address: ${contractAddress}`);
        console.log(`👤 Owner: ${signer.address}`);
        
        // Load relayer address from .env.relayer
        const relayerEnv = fs.readFileSync('.env.relayer', 'utf8');
        const relayerLines = relayerEnv.split('\n');
        
        let ethRelayerAddress;
        for (const line of relayerLines) {
            if (line.startsWith('RELAYER_ETH_ADDRESS=')) {
                ethRelayerAddress = line.split('=')[1];
                break;
            }
        }
        
        if (!ethRelayerAddress) {
            throw new Error('Relayer ETH address not found in .env.relayer');
        }
        
        console.log(`🛰️ Relayer Address: ${ethRelayerAddress}\n`);
        
        // Check current authorization status
        console.log('📝 CHECKING CURRENT AUTHORIZATION');
        console.log('===============================');
        
        const isCurrentlyAuthorized = await contract.authorizedResolvers(ethRelayerAddress);
        console.log(`✅ Current authorization: ${isCurrentlyAuthorized}`);
        
        if (isCurrentlyAuthorized) {
            console.log('✅ Relayer is already authorized!');
            return;
        }
        
        // Check if signer is owner
        const owner = await contract.owner();
        if (signer.address !== owner) {
            throw new Error(`Signer ${signer.address} is not the owner ${owner}`);
        }
        
        console.log('✅ Signer is the owner - can authorize resolvers\n');
        
        // Authorize the relayer
        console.log('🔧 AUTHORIZING RELAYER');
        console.log('=====================');
        
        const tx = await contract.authorizeResolver(ethRelayerAddress, true, {
            gasLimit: 200000
        });
        
        console.log(`⏳ Authorization transaction submitted: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Authorization confirmed in block: ${receipt.blockNumber}`);
        
        // Verify authorization
        console.log('\n✅ VERIFYING AUTHORIZATION');
        console.log('==========================');
        
        const isAuthorized = await contract.authorizedResolvers(ethRelayerAddress);
        console.log(`✅ Relayer authorized: ${isAuthorized}`);
        
        if (isAuthorized) {
            console.log('🎉 RELAYER SUCCESSFULLY AUTHORIZED FOR LOP!');
            console.log('==========================================');
            console.log('✅ Relayer can now place bids');
            console.log('✅ Relayer can execute winning bids');
            console.log('✅ LOP monitoring is ready');
            console.log('==========================================\n');
        } else {
            throw new Error('Authorization failed - relayer still not authorized');
        }
        
    } catch (error) {
        console.error('❌ Authorization failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    authorizeRelayerForLOP();
}

module.exports = { authorizeRelayerForLOP }; 