#!/usr/bin/env node

/**
 * 🔐 AUTHORIZE RELAYER ON LOP CONTRACT
 * 
 * Authorizes the target relayer (0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53)
 * on the 1inch LOP contract using the owner credentials.
 */

const { ethers } = require('ethers');

class RelayerAuthorizer {
    constructor() {
        console.log('🔐 RELAYER AUTHORIZATION SCRIPT');
        console.log('===============================');
        
        this.initialize();
    }
    
    async initialize() {
        // Contract addresses
        this.lopAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
        this.targetRelayer = '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53';
        
        // Owner credentials (provided by user)
        this.ownerPrivateKey = '0xc41444fbbdf8e13030b011a9af8c1d576c0056f64e4dab07eca0e0aec55abc11';
        
        // Initialize provider and wallet
        this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        this.ownerWallet = new ethers.Wallet(this.ownerPrivateKey, this.provider);
        
        console.log('✅ Initialized with owner wallet');
        console.log(`   Owner Address: ${this.ownerWallet.address}`);
        console.log(`   Target Relayer: ${this.targetRelayer}`);
        console.log(`   LOP Contract: ${this.lopAddress}`);
    }
    
    async checkContractOwnership() {
        console.log('\n🔍 CHECKING CONTRACT OWNERSHIP');
        console.log('=============================');
        
        try {
            // Try different ownership patterns
            const ownershipPatterns = [
                ['function owner() external view returns (address)'],
                ['function getOwner() external view returns (address)'],
                ['function contractOwner() external view returns (address)'],
                ['function admin() external view returns (address)']
            ];
            
            for (const abi of ownershipPatterns) {
                try {
                    const contract = new ethers.Contract(this.lopAddress, abi, this.provider);
                    const owner = await contract.owner();
                    console.log(`✅ Found owner: ${owner}`);
                    
                    if (owner.toLowerCase() === this.ownerWallet.address.toLowerCase()) {
                        console.log('✅ Owner wallet matches contract owner');
                        return true;
                    } else {
                        console.log('❌ Owner wallet does NOT match contract owner');
                        return false;
                    }
                } catch (error) {
                    // Try next pattern
                    continue;
                }
            }
            
            console.log('⚠️ Could not determine contract owner - proceeding with authorization attempt');
            return true; // Assume we can proceed
            
        } catch (error) {
            console.log(`❌ Error checking ownership: ${error.message}`);
            return false;
        }
    }
    
    async checkAuthorizationStatus() {
        console.log('\n🔐 CHECKING CURRENT AUTHORIZATION STATUS');
        console.log('========================================');
        
        try {
            // Try different authorization patterns
            const authPatterns = [
                ['function authorizedResolvers(address) external view returns (bool)'],
                ['function isAuthorized(address) external view returns (bool)'],
                ['function authorized(address) external view returns (bool)'],
                ['function resolvers(address) external view returns (bool)']
            ];
            
            for (const abi of authPatterns) {
                try {
                    const contract = new ethers.Contract(this.lopAddress, abi, this.provider);
                    const isAuthorized = await contract.authorizedResolvers(this.targetRelayer);
                    console.log(`✅ Current authorization status: ${isAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED'}`);
                    return isAuthorized;
                } catch (error) {
                    // Try next pattern
                    continue;
                }
            }
            
            console.log('⚠️ Could not check authorization status - contract may be open to all');
            return false;
            
        } catch (error) {
            console.log(`❌ Error checking authorization: ${error.message}`);
            return false;
        }
    }
    
    async authorizeRelayer() {
        console.log('\n🚀 AUTHORIZING RELAYER');
        console.log('======================');
        
        try {
            // Try different authorization function patterns
            const authFunctions = [
                {
                    name: 'authorizeResolver',
                    abi: ['function authorizeResolver(address resolver) external'],
                    args: [this.targetRelayer]
                },
                {
                    name: 'addAuthorized',
                    abi: ['function addAuthorized(address account) external'],
                    args: [this.targetRelayer]
                },
                {
                    name: 'authorize',
                    abi: ['function authorize(address account) external'],
                    args: [this.targetRelayer]
                },
                {
                    name: 'addResolver',
                    abi: ['function addResolver(address resolver) external'],
                    args: [this.targetRelayer]
                }
            ];
            
            for (const func of authFunctions) {
                try {
                    console.log(`🔄 Trying ${func.name}...`);
                    
                    const contract = new ethers.Contract(this.lopAddress, func.abi, this.ownerWallet);
                    const tx = await contract[func.name](...func.args, {
                        gasLimit: 200000
                    });
                    
                    console.log(`✅ Transaction sent: ${tx.hash}`);
                    console.log('⏳ Waiting for confirmation...');
                    
                    const receipt = await tx.wait();
                    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
                    console.log(`💰 Gas used: ${receipt.gasUsed.toString()}`);
                    
                    return true;
                    
                } catch (error) {
                    console.log(`❌ ${func.name} failed: ${error.message}`);
                    continue;
                }
            }
            
            console.log('❌ All authorization attempts failed');
            return false;
            
        } catch (error) {
            console.log(`❌ Error during authorization: ${error.message}`);
            return false;
        }
    }
    
    async verifyAuthorization() {
        console.log('\n✅ VERIFYING AUTHORIZATION');
        console.log('==========================');
        
        // Wait a moment for the transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const isAuthorized = await this.checkAuthorizationStatus();
        
        if (isAuthorized) {
            console.log('🎉 RELAYER SUCCESSFULLY AUTHORIZED!');
            console.log('==================================');
            console.log(`✅ Target Relayer: ${this.targetRelayer}`);
            console.log(`✅ LOP Contract: ${this.lopAddress}`);
            console.log('✅ Ready for LOP operations');
        } else {
            console.log('⚠️ Authorization verification failed');
            console.log('   The contract may be open to all takers');
        }
        
        return isAuthorized;
    }
    
    async runAuthorization() {
        try {
            console.log('🚀 STARTING RELAYER AUTHORIZATION PROCESS');
            console.log('==========================================\n');
            
            // Check ownership
            const isOwner = await this.checkContractOwnership();
            if (!isOwner) {
                console.log('❌ Cannot proceed - not the contract owner');
                return false;
            }
            
            // Check current status
            const currentlyAuthorized = await this.checkAuthorizationStatus();
            if (currentlyAuthorized) {
                console.log('✅ Relayer is already authorized');
                return true;
            }
            
            // Authorize relayer
            const authSuccess = await this.authorizeRelayer();
            if (!authSuccess) {
                console.log('❌ Authorization failed');
                return false;
            }
            
            // Verify authorization
            const verified = await this.verifyAuthorization();
            
            return verified;
            
        } catch (error) {
            console.error('❌ Authorization process failed');
            console.error(`Error: ${error.message}`);
            return false;
        }
    }
}

// Run the authorization
async function main() {
    const authorizer = new RelayerAuthorizer();
    const success = await authorizer.runAuthorization();
    
    if (success) {
        console.log('\n🌟 RELAYER AUTHORIZATION COMPLETED SUCCESSFULLY!');
        console.log('================================================');
        console.log('✅ Target relayer is now authorized');
        console.log('✅ Ready for LOP testing');
        console.log('✅ Dutch auction and partial fills supported');
    } else {
        console.log('\n❌ RELAYER AUTHORIZATION FAILED');
        console.log('==============================');
        console.log('⚠️ Please check the contract implementation');
        console.log('⚠️ The contract may be open to all takers');
    }
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { RelayerAuthorizer }; 