#!/usr/bin/env node

/**
 * 💰 FUND RESOLVER WALLETS
 * 
 * Script to fund the generated resolver wallets
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function fundResolverWallets() {
    console.log('💰 FUNDING RESOLVER WALLETS');
    console.log('============================\n');

    try {
        require('dotenv').config();
        
        // Load resolver data
        const resolverData = JSON.parse(fs.readFileSync('./resolver-wallets-with-keys.json', 'utf8'));
        
        // Initialize provider and user wallet
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log(`👤 Funding from: ${userWallet.address}`);
        
        const userBalance = await provider.getBalance(userWallet.address);
        console.log(`💰 User balance: ${ethers.formatEther(userBalance)} ETH\n`);
        
        for (const resolver of resolverData.resolvers) {
            const fundingAmount = ethers.parseEther(resolver.funding);
            
            console.log(`🎯 Funding ${resolver.name}...`);
            console.log(`   Address: ${resolver.address}`);
            console.log(`   Amount: ${resolver.funding} ETH`);
            
            try {
                const tx = await userWallet.sendTransaction({
                    to: resolver.address,
                    value: fundingAmount
                });
                
                console.log(`   ⏳ Transaction: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`   ✅ Funded successfully! (Block: ${receipt.blockNumber})\n`);
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}\n`);
            }
        }
        
        console.log('🎉 RESOLVER FUNDING COMPLETE!');
        console.log('=============================');
        console.log('✅ All resolvers funded and ready for bidding');
        
    } catch (error) {
        console.error('❌ Funding failed:', error.message);
    }
}

if (require.main === module) {
    fundResolverWallets();
}

module.exports = { fundResolverWallets };
