#!/usr/bin/env node

/**
 * 🔐 GENERATE CORRECT EIP-712 SIGNATURE
 * 
 * Generates the proper signature for limit order submission
 */

const { ethers } = require('ethers');

async function generateCorrectSignature() {
    console.log('🔐 GENERATING CORRECT EIP-712 SIGNATURE');
    console.log('========================================\n');
    
    require('dotenv').config();
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    
    // EIP-712 Domain
    const domain = {
        name: 'EnhancedLimitOrderBridge',
        version: '1',
        chainId: 11155111 // Sepolia
    };
    
    // EIP-712 Types
    const types = {
        LimitOrderIntent: [
            { name: 'maker', type: 'address' },
            { name: 'makerToken', type: 'address' },
            { name: 'takerToken', type: 'address' },
            { name: 'makerAmount', type: 'uint256' },
            { name: 'takerAmount', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'algorandChainId', type: 'uint256' },
            { name: 'algorandAddress', type: 'string' },
            { name: 'salt', type: 'bytes32' },
            { name: 'allowPartialFills', type: 'bool' },
            { name: 'minPartialFill', type: 'uint256' }
        ]
    };
    
    // Order values
    const value = {
        maker: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
        makerToken: '0x0000000000000000000000000000000000000000',
        takerToken: '0x0000000000000000000000000000000000000000',
        makerAmount: '2000000000000000', // 0.002 ETH
        takerAmount: '3000000000000000000', // 3.0 ALGO
        deadline: '1722679459', // 1 hour from now
        algorandChainId: '416001',
        algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        allowPartialFills: true,
        minPartialFill: '1000000000000000' // 0.001 ETH
    };
    
    console.log('📋 Order Intent:');
    console.log(`   Maker: ${value.maker}`);
    console.log(`   Amount: ${ethers.formatEther(value.makerAmount)} ETH`);
    console.log(`   Wants: ${ethers.formatEther(value.takerAmount)} ALGO`);
    console.log(`   Deadline: ${new Date(parseInt(value.deadline) * 1000).toLocaleString()}`);
    console.log(`   ALGO Address: ${value.algorandAddress}`);
    console.log(`   Allow Partial Fills: ${value.allowPartialFills}`);
    console.log(`   Min Partial Fill: ${ethers.formatEther(value.minPartialFill)} ETH`);
    
    try {
        // Generate EIP-712 signature
        const signature = await wallet.signTypedData(domain, types, value);
        
        console.log('\n✅ CORRECT EIP-712 SIGNATURE GENERATED:');
        console.log('========================================');
        console.log(`🔑 Signature: ${signature}`);
        console.log(`👤 Signer: ${wallet.address}`);
        
        // Verify the signature
        const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
        console.log(`🔍 Recovered Address: ${recoveredAddress}`);
        console.log(`✅ Signature Valid: ${recoveredAddress === wallet.address}`);
        
        return signature;
        
    } catch (error) {
        console.error('❌ Error generating signature:', error.message);
        return null;
    }
}

generateCorrectSignature(); 