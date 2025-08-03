#!/usr/bin/env node

/**
 * 🔐 REPLICATE SUCCESSFUL SIGNATURE
 * 
 * Replicates the exact parameters from the successful transaction
 */

const { ethers } = require('ethers');

async function replicateSuccessfulSignature() {
    console.log('🔐 REPLICATING SUCCESSFUL SIGNATURE');
    console.log('===================================\n');
    
    require('dotenv').config();
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    
    // Extract the exact parameters from the successful transaction
    // Based on the decoded transaction data
    const successfulSignature = '0x7080259f32ed859839c01032d4ebb85d083686008977cea47efb30b35a855d571c3770a1bdf9493887aa01f0c6674cd5ec53360139f67ae7b762eff62875dea91b';
    
    console.log('📋 SUCCESSFUL TRANSACTION SIGNATURE:');
    console.log(`   Signature: ${successfulSignature}`);
    console.log(`   Length: ${successfulSignature.length} chars (${(successfulSignature.length - 2) / 2} bytes)`);
    
    // Let me try different domain configurations
    console.log('\n🔍 TESTING DIFFERENT DOMAIN CONFIGURATIONS:');
    
    const testCases = [
        {
            name: 'Domain with chainId',
            domain: {
                name: 'EnhancedLimitOrderBridge',
                version: '1',
                chainId: 11155111
            }
        },
        {
            name: 'Domain without chainId',
            domain: {
                name: 'EnhancedLimitOrderBridge',
                version: '1'
            }
        },
        {
            name: 'Domain with verifyingContract',
            domain: {
                name: 'EnhancedLimitOrderBridge',
                version: '1',
                verifyingContract: '0x384B0011f6E6aA8C192294F36dCE09a3758Df788'
            }
        },
        {
            name: 'Domain with all parameters',
            domain: {
                name: 'EnhancedLimitOrderBridge',
                version: '1',
                chainId: 11155111,
                verifyingContract: '0x384B0011f6E6aA8C192294F36dCE09a3758Df788'
            }
        }
    ];
    
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
    
    // Use the exact same values from the successful transaction
    const value = {
        maker: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
        makerToken: '0x0000000000000000000000000000000000000000',
        takerToken: '0x0000000000000000000000000000000000000000',
        makerAmount: '2000000000000000', // 0.002 ETH
        takerAmount: '3000000000000000000', // 3.0 ALGO
        deadline: '1722679459', // Exact deadline from successful transaction
        algorandChainId: '416001',
        algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
        salt: '0x5dde60ae2339eb8b16f09245dd34f0824e8afe704d5005eca89bf9141e466c53', // Exact salt from successful transaction
        allowPartialFills: true,
        minPartialFill: '1000000000000000' // 0.001 ETH
    };
    
    console.log('📋 USING EXACT PARAMETERS FROM SUCCESSFUL TRANSACTION:');
    console.log(`   Maker: ${value.maker}`);
    console.log(`   Amount: ${ethers.formatEther(value.makerAmount)} ETH`);
    console.log(`   Deadline: ${new Date(parseInt(value.deadline) * 1000).toLocaleString()}`);
    console.log(`   Salt: ${value.salt}`);
    console.log(`   Allow Partial Fills: ${value.allowPartialFills}`);
    console.log(`   Min Partial Fill: ${ethers.formatEther(value.minPartialFill)} ETH`);
    
    for (const testCase of testCases) {
        console.log(`\n🔍 TESTING: ${testCase.name}`);
        try {
            const signature = await wallet.signTypedData(testCase.domain, types, value);
            console.log(`   Generated Signature: ${signature}`);
            console.log(`   Length: ${signature.length} chars`);
            console.log(`   Matches Successful: ${signature === successfulSignature}`);
            
            if (signature === successfulSignature) {
                console.log(`   ✅ FOUND MATCHING DOMAIN CONFIGURATION!`);
                console.log(`   Domain:`, testCase.domain);
                return { signature, domain: testCase.domain };
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n❌ No matching signature found with standard EIP-712');
    console.log('The successful transaction might have used a different signing approach');
    
    return null;
}

replicateSuccessfulSignature(); 