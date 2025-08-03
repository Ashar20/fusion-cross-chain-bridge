#!/usr/bin/env node

/**
 * 🔬 BASIC CONTRACT TEST
 * 
 * Tests the most basic interactions with the contract
 */

const { ethers } = require('ethers');

async function basicContractTest() {
    console.log('🔬 BASIC CONTRACT TEST');
    console.log('=====================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com');
    const owner = new ethers.Wallet('c41444fbbdf8e13030b011a9af8c1d576c0056f64e4dab07eca0e0aec55abc11', provider);
    const contractAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
    
    console.log(`📄 Contract: ${contractAddress}`);
    console.log(`👤 Owner: ${owner.address}\n`);
    
    try {
        // Get basic contract info
        const code = await provider.getCode(contractAddress);
        console.log(`📏 Bytecode length: ${code.length} chars`);
        console.log(`📋 First 100 chars: ${code.slice(0, 100)}...\n`);
        
        // Try sending a simple transaction with no data to see what happens
        console.log('🧪 Test 1: Send empty transaction');
        try {
            const emptyTx = {
                to: contractAddress,
                value: 0,
                data: '0x'
            };
            
            const gasEstimate = await provider.estimateGas({
                ...emptyTx,
                from: owner.address
            });
            console.log(`✅ Empty transaction gas estimate: ${gasEstimate}`);
            
        } catch (error) {
            console.log(`❌ Empty transaction failed: ${error.message}`);
        }
        
        // Try calling common fallback/receive patterns
        console.log('\n🧪 Test 2: Try common function selectors');
        const commonSelectors = [
            '0x00000000', // Empty function selector
            '0x8da5cb5b', // owner()
            '0xf2fde38b', // transferOwnership(address)
            '0x715018a6', // renounceOwnership()
            '0xa217fddf', // DEFAULT_ADMIN_ROLE
        ];
        
        for (const selector of commonSelectors) {
            try {
                const result = await provider.call({
                    to: contractAddress,
                    data: selector
                });
                console.log(`✅ Selector ${selector}: ${result}`);
            } catch (error) {
                console.log(`❌ Selector ${selector}: ${error.message.split('(')[0]}`);
            }
        }
        
        // Check if it might be a proxy contract
        console.log('\n🧪 Test 3: Check for proxy patterns');
        const proxySlots = [
            '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', // EIP-1967 implementation slot
            '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103', // EIP-1967 admin slot
            '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3', // Proxy admin slot
        ];
        
        for (const slot of proxySlots) {
            try {
                const value = await provider.getStorage(contractAddress, slot);
                if (value !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    console.log(`✅ Proxy slot ${slot}: ${value}`);
                    const address = '0x' + value.slice(-40);
                    console.log(`   Possible implementation: ${address}`);
                }
            } catch (error) {
                console.log(`❌ Could not read slot ${slot}`);
            }
        }
        
        // Try to send a very simple transaction
        console.log('\n🧪 Test 4: Send minimal ETH transaction');
        try {
            const tx = await owner.sendTransaction({
                to: contractAddress,
                value: ethers.parseEther('0.000001'), // Very small amount
                gasLimit: 21000
            });
            
            console.log(`✅ Sent transaction: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
            
        } catch (error) {
            console.log(`❌ ETH transaction failed: ${error.message}`);
        }
        
        // Check transaction history to understand contract behavior
        console.log('\n🧪 Test 5: Check recent transactions');
        try {
            const latestBlock = await provider.getBlock('latest');
            const fromBlock = Math.max(0, latestBlock.number - 1000);
            
            const events = await provider.getLogs({
                address: contractAddress,
                fromBlock: fromBlock,
                toBlock: 'latest'
            });
            
            console.log(`📋 Found ${events.length} events in last 1000 blocks`);
            if (events.length > 0) {
                console.log(`   Latest event block: ${events[events.length - 1].blockNumber}`);
                console.log(`   Topics: ${events[events.length - 1].topics.length}`);
            }
            
        } catch (error) {
            console.log(`❌ Could not check transaction history: ${error.message}`);
        }
        
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('==================');
        console.log('1. This contract appears to have a very restricted interface');
        console.log('2. It might be a proxy or have custom access controls');
        console.log('3. Consider deploying a new LOP contract for testing');
        console.log('4. Check if there\'s contract documentation or source code');
        
        console.log('\n📋 SUGGESTED NEXT STEPS:');
        console.log('========================');
        console.log('🚀 Deploy your own LOP contract for full control');
        console.log('🔍 Use the existing multi-resolver system with your own contract');
        console.log('📄 All the 1inch-grade features are already implemented');
        
    } catch (error) {
        console.error('❌ Basic test failed:', error.message);
    }
}

basicContractTest().catch(console.error);