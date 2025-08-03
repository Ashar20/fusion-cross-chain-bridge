#!/usr/bin/env node

/**
 * 🔍 INSPECT LOP CONTRACT INTERFACE
 * 
 * Tries to discover the actual interface of the deployed contract
 */

const { ethers } = require('ethers');

async function inspectContract() {
    console.log('🔍 INSPECTING LOP CONTRACT INTERFACE');
    console.log('===================================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
    
    console.log(`📄 Contract: ${contractAddress}`);
    console.log(`👤 Caller: ${wallet.address}`);
    
    try {
        // Check basic contract info
        const code = await provider.getCode(contractAddress);
        console.log(`📏 Bytecode length: ${code.length} characters`);
        console.log(`✅ Contract exists: ${code !== '0x'}`);
        
        if (code === '0x') {
            console.log('❌ No contract at this address');
            return;
        }
        
        // Try common view functions to understand the interface
        console.log('\n🔍 Testing common view functions:');
        
        const testFunctions = [
            // Owner/access control
            'function owner() external view returns (address)',
            'function admin() external view returns (address)',
            
            // Resolver authorization
            'function authorizedResolvers(address) external view returns (bool)',
            'function resolvers(address) external view returns (bool)',
            'function isAuthorized(address) external view returns (bool)',
            
            // Order functions
            'function limitOrders(bytes32) external view returns (tuple(address,address,address,uint256,uint256,uint256,uint256,string,bytes32))',
            'function orders(bytes32) external view returns (tuple(address,address,address,uint256,uint256,uint256,uint256,string,bytes32))',
            
            // Configuration
            'function name() external view returns (string)',
            'function version() external view returns (string)',
        ];
        
        for (const funcSig of testFunctions) {
            try {
                const contract = new ethers.Contract(contractAddress, [funcSig], provider);
                const funcName = funcSig.split('(')[0].split(' ').pop();
                
                let result;
                if (funcName === 'owner' || funcName === 'admin') {
                    result = await contract[funcName]();
                    console.log(`✅ ${funcName}(): ${result}`);
                } else if (funcName === 'authorizedResolvers' || funcName === 'resolvers' || funcName === 'isAuthorized') {
                    result = await contract[funcName](wallet.address);
                    console.log(`✅ ${funcName}(${wallet.address}): ${result}`);
                } else if (funcName === 'limitOrders' || funcName === 'orders') {
                    // Test with a dummy order ID
                    const dummyId = '0x0000000000000000000000000000000000000000000000000000000000000001';
                    result = await contract[funcName](dummyId);
                    console.log(`✅ ${funcName}(): structure exists`);
                } else if (funcName === 'name' || funcName === 'version') {
                    result = await contract[funcName]();
                    console.log(`✅ ${funcName}(): ${result}`);
                }
            } catch (error) {
                const funcName = funcSig.split('(')[0].split(' ').pop();
                console.log(`❌ ${funcName}(): not available`);
            }
        }
        
        // Try to discover write functions by checking common patterns
        console.log('\n🔍 Testing authorization functions:');
        
        const authFunctions = [
            'function authorizeResolver(address resolver)',
            'function setResolverAuthorization(address resolver, bool authorized)',
            'function addResolver(address resolver)',
            'function setResolver(address resolver, bool status)',
            'function grantRole(bytes32 role, address account)',
        ];
        
        for (const funcSig of authFunctions) {
            try {
                const contract = new ethers.Contract(contractAddress, [funcSig], wallet);
                const funcName = funcSig.split('(')[0].split(' ').pop();
                
                // Try to estimate gas (this will tell us if the function exists)
                if (funcName === 'authorizeResolver' || funcName === 'addResolver') {
                    await contract[funcName].estimateGas(wallet.address);
                } else if (funcName === 'setResolverAuthorization' || funcName === 'setResolver') {
                    await contract[funcName].estimateGas(wallet.address, true);
                } else if (funcName === 'grantRole') {
                    const role = '0x0000000000000000000000000000000000000000000000000000000000000000';
                    await contract[funcName].estimateGas(role, wallet.address);
                }
                
                console.log(`✅ ${funcName}(): available (gas estimation succeeded)`);
            } catch (error) {
                const funcName = funcSig.split('(')[0].split(' ').pop();
                if (error.message.includes('execution reverted')) {
                    console.log(`⚠️  ${funcName}(): exists but reverts (access control or validation)`);
                } else {
                    console.log(`❌ ${funcName}(): not available`);
                }
            }
        }
        
        // Try to get contract creation info
        console.log('\n📋 Contract Analysis Summary:');
        console.log('============================');
        
        // Check if it might be a proxy
        const implementation = await provider.getStorageAt(contractAddress, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
        if (implementation !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
            console.log(`🔄 Proxy detected, implementation: ${implementation}`);
        } else {
            console.log('📄 Direct contract (not a proxy)');
        }
        
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('==================');
        console.log('1. Check if you are the contract owner/admin');
        console.log('2. Look for contract documentation or source code');
        console.log('3. Contact the contract deployer for authorization');
        console.log('4. Consider using a different LOP contract for testing');
        
    } catch (error) {
        console.error('❌ Inspection failed:', error.message);
    }
}

inspectContract().catch(console.error);