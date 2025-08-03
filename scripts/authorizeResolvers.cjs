#!/usr/bin/env node

/**
 * 🔐 AUTHORIZE RESOLVERS IN LOP CONTRACT
 * 
 * Authorizes all resolvers from .env.resolvers in the LOP contract
 */

const { ethers } = require('ethers');

async function authorizeResolvers() {
    console.log('🔐 AUTHORIZING RESOLVERS IN LOP CONTRACT');
    console.log('========================================\n');
    
    try {
        // Load environment configurations
        require('dotenv').config({ path: '.env.resolvers' });
        require('dotenv').config();
        
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com');
        const owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // Contract owner
        const lopAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
        
        console.log(`🏦 LOP Contract: ${lopAddress}`);
        console.log(`👤 Owner: ${owner.address}`);
        
        const lopABI = [
            'function authorizedResolvers(address resolver) external view returns (bool)',
            'function authorizeResolver(address resolver) external',
            'function setResolverAuthorization(address resolver, bool authorized) external',
            'function owner() external view returns (address)',
            'event ResolverAuthorized(address indexed resolver, bool authorized)'
        ];
        
        const lopContract = new ethers.Contract(lopAddress, lopABI, owner);
        
        // Check if we're the owner
        console.log('🔍 Checking contract ownership...');
        try {
            const contractOwner = await lopContract.owner();
            console.log(`Contract Owner: ${contractOwner}`);
            console.log(`Is Owner: ${contractOwner.toLowerCase() === owner.address.toLowerCase() ? '✅ YES' : '❌ NO'}`);
            
            if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
                console.log('❌ You are not the contract owner. Cannot authorize resolvers.');
                console.log(`💡 Contact the contract owner: ${contractOwner}`);
                return;
            }
        } catch (error) {
            console.log('⚠️  Could not check owner, trying to authorize anyway...');
        }
        
        // Load resolvers from .env.resolvers
        const totalResolvers = parseInt(process.env.TOTAL_RESOLVERS || '0');
        console.log(`\n📋 Found ${totalResolvers} resolvers to authorize:`);
        
        const resolvers = [];
        for (let i = 1; i <= totalResolvers; i++) {
            const name = process.env[`RESOLVER_${i}_NAME`];
            const address = process.env[`RESOLVER_${i}_ADDRESS`];
            
            if (name && address) {
                resolvers.push({ name, address });
                console.log(`   ${i}. ${name}: ${address}`);
            }
        }
        
        if (resolvers.length === 0) {
            console.log('❌ No resolvers found in .env.resolvers');
            return;
        }
        
        // Check current authorization status
        console.log('\n🔍 Checking current authorization status:');
        for (const resolver of resolvers) {
            try {
                const isAuthorized = await lopContract.authorizedResolvers(resolver.address);
                console.log(`   ${resolver.name}: ${isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}`);
                resolver.needsAuth = !isAuthorized;
            } catch (error) {
                console.log(`   ${resolver.name}: ⚠️  Could not check status`);
                resolver.needsAuth = true;
            }
        }
        
        // Authorize resolvers that need it
        const resolversToAuth = resolvers.filter(r => r.needsAuth);
        if (resolversToAuth.length === 0) {
            console.log('\n🎉 All resolvers are already authorized!');
            return;
        }
        
        console.log(`\n🔐 Authorizing ${resolversToAuth.length} resolvers...`);
        
        for (const resolver of resolversToAuth) {
            try {
                console.log(`\n📝 Authorizing ${resolver.name}...`);
                
                // Try different authorization function names
                let authTx;
                try {
                    // Try setResolverAuthorization first
                    authTx = await lopContract.setResolverAuthorization(resolver.address, true, {
                        gasLimit: 100000,
                        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                    });
                } catch (error1) {
                    try {
                        // Try authorizeResolver
                        authTx = await lopContract.authorizeResolver(resolver.address, {
                            gasLimit: 100000,
                            maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                        });
                    } catch (error2) {
                        console.log(`❌ Could not authorize ${resolver.name}:`);
                        console.log(`   setResolverAuthorization: ${error1.message}`);
                        console.log(`   authorizeResolver: ${error2.message}`);
                        continue;
                    }
                }
                
                console.log(`🔗 Transaction: ${authTx.hash}`);
                console.log('⏳ Waiting for confirmation...');
                
                const receipt = await authTx.wait();
                console.log(`✅ ${resolver.name} authorized in block ${receipt.blockNumber}`);
                
            } catch (error) {
                console.log(`❌ Failed to authorize ${resolver.name}: ${error.message}`);
            }
        }
        
        // Verify final authorization status
        console.log('\n🔍 Final authorization status:');
        for (const resolver of resolvers) {
            try {
                const isAuthorized = await lopContract.authorizedResolvers(resolver.address);
                console.log(`   ${resolver.name}: ${isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}`);
            } catch (error) {
                console.log(`   ${resolver.name}: ⚠️  Could not verify status`);
            }
        }
        
        console.log('\n🎉 Resolver authorization complete!');
        console.log('Now you can run: node scripts/multiResolverRelayer.cjs');
        
    } catch (error) {
        console.error('❌ Authorization failed:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 Solution: Add ETH to your account for gas fees');
        } else if (error.message.includes('execution reverted')) {
            console.log('\n💡 Possible causes:');
            console.log('   - Not contract owner');
            console.log('   - Contract has different authorization function');
            console.log('   - Contract access restrictions');
        }
    }
}

authorizeResolvers().catch(console.error);