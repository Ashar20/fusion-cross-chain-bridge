#!/usr/bin/env node

/**
 * 🎯 SIMPLE LOP TEST
 * 
 * Test basic functionality of EnhancedLimitOrderBridge
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function testSimpleLOP() {
    console.log('🎯 SIMPLE LOP TEST');
    console.log('==================\n');
    
    try {
        require('dotenv').config();
        
        // Contract address
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Initialize provider and signer
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Load contract ABI
        const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        
        const contract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);
        
        console.log('✅ Contract initialized');
        console.log(`📋 Address: ${contractAddress}`);
        console.log(`👤 User: ${signer.address}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code\n`);
        
        // Test 1: Check if contract is accessible
        console.log('📝 TEST 1: Contract Accessibility');
        console.log('===============================');
        
        try {
            const owner = await contract.owner();
            console.log(`✅ Owner: ${owner}`);
            
            const algorandAppId = await contract.algorandAppId();
            console.log(`✅ Algorand App ID: ${algorandAppId}`);
            
            const minOrderValue = await contract.MIN_ORDER_VALUE();
            console.log(`✅ Min Order Value: ${ethers.formatEther(minOrderValue)} ETH`);
            
            const defaultTimelock = await contract.DEFAULT_TIMELOCK();
            console.log(`✅ Default Timelock: ${defaultTimelock} seconds`);
            
            console.log('✅ Contract is accessible and working!\n');
            
        } catch (error) {
            console.error('❌ Error accessing contract:', error.message);
            throw error;
        }
        
        // Test 2: Check if user is authorized resolver
        console.log('📝 TEST 2: Resolver Authorization');
        console.log('================================');
        
        try {
            const isAuthorized = await contract.authorizedResolvers(signer.address);
            console.log(`✅ User authorized: ${isAuthorized}`);
            
            if (!isAuthorized) {
                console.log('⚠️ User is not authorized as resolver');
                console.log('🔧 This is normal for testing - resolvers are typically separate addresses');
            }
            
            console.log('✅ Authorization check completed!\n');
            
        } catch (error) {
            console.error('❌ Error checking authorization:', error.message);
            throw error;
        }
        
        // Test 3: Check contract balance
        console.log('📝 TEST 3: Contract Balance');
        console.log('==========================');
        
        try {
            const balance = await provider.getBalance(contractAddress);
            console.log(`✅ Contract ETH balance: ${ethers.formatEther(balance)} ETH`);
            
            if (balance > 0) {
                console.log('💰 Contract has ETH balance - ready for operations');
            } else {
                console.log('⚠️ Contract has no ETH balance - orders will need to include ETH');
            }
            
            console.log('✅ Balance check completed!\n');
            
        } catch (error) {
            console.error('❌ Error checking balance:', error.message);
            throw error;
        }
        
        console.log('🎉 ALL SIMPLE TESTS PASSED!');
        console.log('===========================');
        console.log('✅ Contract is deployed and accessible');
        console.log('✅ Basic functions are working');
        console.log('✅ Ready for limit order operations');
        console.log('===========================\n');
        
    } catch (error) {
        console.error('❌ Simple LOP test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    testSimpleLOP();
}

module.exports = { testSimpleLOP }; 