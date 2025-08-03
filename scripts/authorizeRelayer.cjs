#!/usr/bin/env node

/**
 * Authorize relayer address
 */

const { ethers } = require('ethers');

async function authorizeRelayer() {
    console.log('🔐 AUTHORIZING RELAYER ADDRESS');
    console.log('==============================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // User is contract owner
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    
    const relayerToAuthorize = '0x58924acDe600D5a0Fb3fb0AF49c8FE02060F79Ea';
    
    console.log(`🏦 Contract: ${contractAddress}`);
    console.log(`👑 Owner: ${wallet.address}`);
    console.log(`🤖 Authorizing: ${relayerToAuthorize}\n`);
    
    try {
        const authABI = [
            'function authorizeResolver(address resolver, bool authorized) external',
            'function authorizedResolvers(address) external view returns (bool)'
        ];
        
        const contract = new ethers.Contract(contractAddress, authABI, wallet);
        
        // Check current status
        const currentAuth = await contract.authorizedResolvers(relayerToAuthorize);
        console.log(`🔍 Current authorization: ${currentAuth ? '✅ YES' : '❌ NO'}`);
        
        if (currentAuth) {
            console.log('✅ Relayer is already authorized!');
            return;
        }
        
        console.log('⏳ Authorizing relayer...');
        const tx = await contract.authorizeResolver(relayerToAuthorize, true, {
            gasLimit: 100000,
            maxFeePerGas: ethers.parseUnits('15', 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
        });
        
        console.log(`🔗 Authorization transaction: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Authorization completed in block ${receipt.blockNumber}`);
        
        // Verify authorization
        const newAuth = await contract.authorizedResolvers(relayerToAuthorize);
        console.log(`🔍 New authorization status: ${newAuth ? '✅ YES' : '❌ NO'}`);
        
        if (newAuth) {
            console.log('\n🎉 SUCCESS: Relayer is now authorized to place bids!');
            console.log('💡 The relayer can now bid on orders');
        } else {
            console.log('\n❌ Authorization failed - status not updated');
        }
        
    } catch (error) {
        console.error('❌ Error authorizing relayer:', error.message);
        
        if (error.message.includes('execution reverted')) {
            console.log('\n🔍 POSSIBLE ISSUES:');
            console.log('- User account is not the contract owner');
            console.log('- Contract may have access control restrictions');
            console.log('- Transaction parameters may be invalid');
        }
    }
}

authorizeRelayer().catch(console.error);