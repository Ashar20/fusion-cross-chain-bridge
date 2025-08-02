#!/usr/bin/env node

const { ethers } = require('hardhat');
const fs = require('fs');

async function checkTestWalletBalance() {
    console.log(' CHECKING WALLET BALANCE...\n');
    
    try {
        // Use the provided wallet address
        const walletAddress = '0xeb636Cf3a27AbF02D75Cd2FA253ac09af0FE1f90';
        const infuraEndpoint = 'https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104';
        
        console.log(` Wallet Address: ${walletAddress}`);
        console.log(`🌐 Network: Sepolia Testnet`);
        console.log(`🔗 RPC: ${infuraEndpoint}\n`);
        
        // Check balance
        const provider = new ethers.JsonRpcProvider(infuraEndpoint);
        const balance = await provider.getBalance(walletAddress);
        const balanceETH = ethers.formatEther(balance);
        
        console.log(`💰 Current Balance: ${balanceETH} ETH`);
        
        const requiredETH = "0.05"; // Minimum required for deployment
        const recommendedETH = "0.1"; // Recommended amount
        
        if (parseFloat(balanceETH) < parseFloat(requiredETH)) {
            console.log(`❌ INSUFFICIENT BALANCE!`);
            console.log(`   Required: ${requiredETH} ETH`);
            console.log(`   Current: ${balanceETH} ETH`);
            console.log(`   Needed: ${(parseFloat(requiredETH) - parseFloat(balanceETH)).toFixed(6)} ETH more\n`);
            
            console.log(`🚰 GET MORE SEPOLIA ETH:`);
            console.log(`   1. https://sepoliafaucet.com/`);
            console.log(`   2. https://faucets.chain.link/sepolia`);
            console.log(`   3. https://sepolia-faucet.pk910.de/\n`);
            
            return { 
                success: false, 
                balance: balanceETH, 
                required: requiredETH,
                address: walletAddress 
            };
        }
        
        console.log(`✅ SUFFICIENT BALANCE DETECTED!`);
        console.log(`   Balance: ${balanceETH} ETH`);
        console.log(`   Required: ${requiredETH} ETH`);
        console.log(`   Status: Ready for deployment! 🚀\n`);
        
        return { 
            success: true, 
            balance: balanceETH, 
            required: requiredETH,
            address: walletAddress 
        };
        
    } catch (error) {
        console.error('❌ Balance check failed:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    checkTestWalletBalance()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { checkTestWalletBalance }; 