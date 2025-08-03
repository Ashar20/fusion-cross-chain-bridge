#!/usr/bin/env node

/**
 * 🔐 TEST SIGNATURE VERIFICATION
 * 
 * Tests the EIP-712 signature verification step by step
 */

const { ethers } = require('ethers');

async function testSignatureVerification() {
    console.log('🔐 TESTING SIGNATURE VERIFICATION');
    console.log('==================================\n');
    
    require('dotenv').config();
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
    
    // Get current block timestamp
    const currentBlock = await provider.getBlock('latest');
    const deadline = currentBlock.timestamp + 3600;
    
    // EIP-712 Domain (must match contract constructor)
    const domain = {
        name: 'EnhancedLimitOrderBridge',
        version: '1'
        // Note: contract constructor doesn't specify chainId, so we might not need it
    };
    
    // EIP-712 Types (must match contract LIMIT_ORDER_TYPEHASH)
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
    
    // Order values (exact same as our script)
    const value = {
        maker: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
        makerToken: '0x0000000000000000000000000000000000000000',
        takerToken: '0x0000000000000000000000000000000000000000',
        makerAmount: '2000000000000000', // 0.002 ETH
        takerAmount: '3000000000000000000', // 3.0 ALGO
        deadline: deadline.toString(),
        algorandChainId: '416001',
        algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        allowPartialFills: true,
        minPartialFill: '1000000000000000' // 0.001 ETH
    };
    
    console.log('📋 Test Parameters:');
    console.log(`   Maker: ${value.maker}`);
    console.log(`   Amount: ${ethers.formatEther(value.makerAmount)} ETH`);
    console.log(`   Deadline: ${new Date(parseInt(value.deadline) * 1000).toLocaleString()}`);
    console.log(`   Salt: ${value.salt}`);
    console.log(`   Allow Partial Fills: ${value.allowPartialFills}`);
    console.log(`   Min Partial Fill: ${ethers.formatEther(value.minPartialFill)} ETH`);
    
    try {
        // Generate EIP-712 signature
        const signature = await wallet.signTypedData(domain, types, value);
        
        console.log('\n✅ SIGNATURE GENERATED:');
        console.log(`🔑 Signature: ${signature}`);
        console.log(`👤 Signer: ${wallet.address}`);
        
        // Verify the signature locally
        const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
        console.log(`🔍 Recovered Address: ${recoveredAddress}`);
        console.log(`✅ Local Verification: ${recoveredAddress === wallet.address}`);
        
        // Test contract verification by calling a view function
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        const abi = [
            'function _verifySignature(tuple(address,address,address,uint256,uint256,uint256,uint256,string,bytes32,bool,uint256),bytes,address) external view returns (bool)'
        ];
        
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        // Convert value to tuple format for contract call
        const intentTuple = [
            value.maker,
            value.makerToken,
            value.takerToken,
            value.makerAmount,
            value.takerAmount,
            value.deadline,
            value.algorandChainId,
            value.algorandAddress,
            value.salt,
            value.allowPartialFills,
            value.minPartialFill
        ];
        
        console.log('\n🔍 TESTING CONTRACT VERIFICATION:');
        try {
            const contractVerification = await contract._verifySignature(intentTuple, signature, wallet.address);
            console.log(`✅ Contract Verification: ${contractVerification}`);
        } catch (error) {
            console.log(`❌ Contract Verification Error: ${error.message}`);
        }
        
        return signature;
        
    } catch (error) {
        console.error('❌ Error in signature verification:', error.message);
        return null;
    }
}

testSignatureVerification(); 