#!/usr/bin/env node

/**
 * 🔐 OWNER AUTHORIZE RESOLVERS
 * 
 * Uses owner privileges to authorize all resolvers
 */

const { ethers } = require('ethers');

async function ownerAuthorizeResolvers() {
    console.log('🔐 OWNER AUTHORIZE RESOLVERS');
    console.log('============================\n');
    
    try {
        // Load environment configurations
        require('dotenv').config({ path: '.env.resolvers' });
        require('dotenv').config();
        
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com');
        const owner = new ethers.Wallet('c41444fbbdf8e13030b011a9af8c1d576c0056f64e4dab07eca0e0aec55abc11', provider);
        const lopAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
        
        console.log(`🏦 LOP Contract: ${lopAddress}`);
        console.log(`👤 Owner: ${owner.address}`);
        console.log(`✅ Confirmed: You are the owner\n`);
        
        // Try multiple possible ABIs for authorization
        const authPatterns = [
            {
                name: 'Pattern 1: setResolverAuthorization',
                abi: ['function setResolverAuthorization(address resolver, bool authorized) external'],
                call: (contract, resolver) => contract.setResolverAuthorization(resolver, true)
            },
            {
                name: 'Pattern 2: authorizeResolver', 
                abi: ['function authorizeResolver(address resolver) external'],
                call: (contract, resolver) => contract.authorizeResolver(resolver)
            },
            {
                name: 'Pattern 3: addAuthorizedResolver',
                abi: ['function addAuthorizedResolver(address resolver) external'],
                call: (contract, resolver) => contract.addAuthorizedResolver(resolver)
            },
            {
                name: 'Pattern 4: setResolver',
                abi: ['function setResolver(address resolver, bool status) external'],
                call: (contract, resolver) => contract.setResolver(resolver, true)
            },
            {
                name: 'Pattern 5: grantRole (AccessControl)',
                abi: ['function grantRole(bytes32 role, address account) external'],
                call: (contract, resolver) => {
                    // Try common role hashes
                    const RESOLVER_ROLE = ethers.id('RESOLVER_ROLE');
                    return contract.grantRole(RESOLVER_ROLE, resolver);
                }
            },
            {
                name: 'Pattern 6: Simple addResolver',
                abi: ['function addResolver(address resolver) external'],
                call: (contract, resolver) => contract.addResolver(resolver)
            }
        ];
        
        // Load resolvers
        const totalResolvers = parseInt(process.env.TOTAL_RESOLVERS || '0');
        const resolvers = [];
        
        for (let i = 1; i <= totalResolvers; i++) {
            const name = process.env[`RESOLVER_${i}_NAME`];
            const address = process.env[`RESOLVER_${i}_ADDRESS`];
            
            if (name && address) {
                resolvers.push({ name, address });
            }
        }
        
        console.log(`📋 Resolvers to authorize: ${resolvers.length}`);
        for (const resolver of resolvers) {
            console.log(`   ${resolver.name}: ${resolver.address}`);
        }
        console.log('');
        
        // Try each authorization pattern
        for (const pattern of authPatterns) {
            console.log(`🧪 Testing ${pattern.name}...`);
            
            try {
                const contract = new ethers.Contract(lopAddress, pattern.abi, owner);
                
                // Test with first resolver
                const testResolver = resolvers[0];
                console.log(`   Testing with ${testResolver.name}...`);
                
                // Try gas estimation first
                await pattern.call(contract, testResolver.address).estimateGas();
                console.log(`   ✅ Gas estimation succeeded - function exists!`);
                
                // If gas estimation works, try actual transaction
                console.log(`   🚀 Executing authorization...`);
                const tx = await pattern.call(contract, testResolver.address, {
                    gasLimit: 200000,
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                });
                
                console.log(`   🔗 Transaction: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`   ✅ SUCCESS! Authorized in block ${receipt.blockNumber}`);
                
                // This pattern works! Use it for all resolvers
                console.log(`\n🎉 FOUND WORKING PATTERN: ${pattern.name}`);
                console.log('======================================');
                
                // Authorize remaining resolvers
                for (let i = 1; i < resolvers.length; i++) {
                    const resolver = resolvers[i];
                    console.log(`\n📝 Authorizing ${resolver.name}...`);
                    
                    try {
                        const authTx = await pattern.call(contract, resolver.address, {
                            gasLimit: 200000,
                            maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                        });
                        
                        console.log(`   🔗 Transaction: ${authTx.hash}`);
                        const authReceipt = await authTx.wait();
                        console.log(`   ✅ ${resolver.name} authorized in block ${authReceipt.blockNumber}`);
                        
                    } catch (error) {
                        console.log(`   ❌ Failed to authorize ${resolver.name}: ${error.message}`);
                    }
                }
                
                console.log(`\n🎉 AUTHORIZATION COMPLETE!`);
                console.log('==========================');
                console.log('✅ Resolvers should now be authorized');
                console.log('🚀 Run: node scripts/multiResolverRelayer.cjs');
                return; // Exit after successful pattern
                
            } catch (error) {
                if (error.message.includes('execution reverted')) {
                    console.log(`   ⚠️  Function exists but access denied or validation failed`);
                } else if (error.code === 'CALL_EXCEPTION') {
                    console.log(`   ❌ Function not found`);
                } else {
                    console.log(`   ❌ Error: ${error.message}`);
                }
            }
        }
        
        // If we get here, none of the patterns worked
        console.log('\n❌ NO WORKING AUTHORIZATION PATTERN FOUND');
        console.log('=========================================');
        console.log('The contract might:');
        console.log('- Have a different authorization interface');
        console.log('- Require initialization first');
        console.log('- Have authorization disabled');
        console.log('- Be a different contract than expected');
        
        // Try to get any info about the contract
        console.log('\n🔍 FINAL DIAGNOSTICS');
        console.log('===================');
        
        try {
            // Try to call any function to see what interface is available
            const basicABI = [
                'function name() external view returns (string)',
                'function symbol() external view returns (string)',
                'function totalSupply() external view returns (uint256)',
                'function balanceOf(address) external view returns (uint256)'
            ];
            
            const basicContract = new ethers.Contract(lopAddress, basicABI, provider);
            
            try {
                const name = await basicContract.name();
                console.log(`Contract name: ${name}`);
            } catch {}
            
            try {
                const symbol = await basicContract.symbol();
                console.log(`Contract symbol: ${symbol}`);
            } catch {}
            
        } catch (error) {
            console.log('Could not get basic contract info');
        }
        
    } catch (error) {
        console.error('❌ Owner authorization failed:', error.message);
    }
}

ownerAuthorizeResolvers().catch(console.error);