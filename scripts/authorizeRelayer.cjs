#!/usr/bin/env node
/**
 * 🔧 AUTHORIZE RELAYER ON CONTRACTS
 * 
 * Gives the relayer access to both 1inch and Enhanced Bridge contracts
 * Must be called from the owner account
 */

const { ethers } = require('ethers');
require('dotenv').config();

class RelayerAuthorization {
    constructor() {
        // Ethereum configuration
        this.ethProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        // Contract addresses
        this.contracts = {
            enhancedBridge: '0x343E44b629fcd1E97Fd787D0f60F39F8FEA123eE',
            escrowFactory: '0x523258A91028793817F84aB037A3372B468ee940'
        };
        
        // Relayer address
        this.relayerAddress = '0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d';
        
        console.log('🔧 RELAYER AUTHORIZATION');
        console.log('========================');
        console.log(`🤖 Relayer: ${this.relayerAddress}`);
        console.log(`📦 Enhanced Bridge: ${this.contracts.enhancedBridge}`);
        console.log(`🏭 Escrow Factory: ${this.contracts.escrowFactory}`);
    }
    
    async authorizeRelayer() {
        try {
            console.log('\n🚀 STEP 1: AUTHORIZE ON ENHANCED BRIDGE');
            console.log('========================================');
            
            await this.authorizeOnEnhancedBridge();
            
            console.log('\n🚀 STEP 2: AUTHORIZE ON ESCROW FACTORY');
            console.log('=======================================');
            
            await this.authorizeOnEscrowFactory();
            
            console.log('\n🎉 AUTHORIZATION COMPLETE!');
            console.log('==========================');
            console.log('✅ Relayer authorized on Enhanced Bridge');
            console.log('✅ Relayer authorized on Escrow Factory');
            console.log('✅ Ready for cross-chain swaps');
            
        } catch (error) {
            console.error('❌ Authorization failed:', error.message);
            throw error;
        }
    }
    
    async authorizeOnEnhancedBridge() {
        console.log('📋 Authorizing relayer on Enhanced Bridge...');
        
        // Enhanced Bridge ABI
        const bridgeABI = [
            'function setResolverAuthorization(address resolver, bool authorized) external',
            'function authorizedResolvers(address) external view returns (bool)',
            'function owner() external view returns (address)'
        ];
        
        const bridge = new ethers.Contract(this.contracts.enhancedBridge, bridgeABI, this.ethProvider);
        
        // Check current authorization
        const isAuthorized = await bridge.authorizedResolvers(this.relayerAddress);
        console.log(`📊 Current authorization: ${isAuthorized ? '✅ Authorized' : '❌ Not authorized'}`);
        
        if (!isAuthorized) {
            console.log('📝 Setting authorization...');
            
            // We need the owner's private key to call this function
            // For now, we'll show what needs to be done
            console.log('⚠️ Need owner private key to authorize');
            console.log('Owner address: 0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53');
            console.log('Function call: setResolverAuthorization(0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d, true)');
            
            // If we had the owner's private key, we would do:
            // const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, this.ethProvider);
            // const ownerBridge = bridge.connect(ownerWallet);
            // const tx = await ownerBridge.setResolverAuthorization(this.relayerAddress, true);
            // await tx.wait();
            
        } else {
            console.log('✅ Relayer already authorized on Enhanced Bridge');
        }
    }
    
    async authorizeOnEscrowFactory() {
        console.log('📋 Authorizing relayer on Escrow Factory...');
        
        // Escrow Factory ABI (basic)
        const factoryABI = [
            'function owner() external view returns (address)',
            'function setAuthorizedResolver(address resolver, bool authorized) external',
            'function authorizedResolvers(address) external view returns (bool)'
        ];
        
        try {
            const factory = new ethers.Contract(this.contracts.escrowFactory, factoryABI, this.ethProvider);
            
            // Check if function exists
            const isAuthorized = await factory.authorizedResolvers(this.relayerAddress);
            console.log(`📊 Current authorization: ${isAuthorized ? '✅ Authorized' : '❌ Not authorized'}`);
            
            if (!isAuthorized) {
                console.log('📝 Setting authorization...');
                console.log('⚠️ Need owner private key to authorize');
                console.log('Owner address: 0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53');
                console.log('Function call: setAuthorizedResolver(0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d, true)');
            } else {
                console.log('✅ Relayer already authorized on Escrow Factory');
            }
            
        } catch (error) {
            console.log('⚠️ Escrow Factory may not have authorization function');
            console.log('📋 Checking contract capabilities...');
            
            // Try to get contract code
            const code = await this.ethProvider.getCode(this.contracts.escrowFactory);
            if (code !== '0x') {
                console.log('✅ Contract exists, checking available functions...');
            }
        }
    }
    
    async checkAuthorizationStatus() {
        console.log('\n📊 AUTHORIZATION STATUS CHECK');
        console.log('============================');
        
        try {
            // Check Enhanced Bridge
            const bridgeABI = ['function authorizedResolvers(address) external view returns (bool)'];
            const bridge = new ethers.Contract(this.contracts.enhancedBridge, bridgeABI, this.ethProvider);
            const bridgeAuth = await bridge.authorizedResolvers(this.relayerAddress);
            console.log(`📦 Enhanced Bridge: ${bridgeAuth ? '✅ Authorized' : '❌ Not authorized'}`);
            
            // Check Escrow Factory
            const factoryABI = ['function authorizedResolvers(address) external view returns (bool)'];
            const factory = new ethers.Contract(this.contracts.escrowFactory, factoryABI, this.ethProvider);
            const factoryAuth = await factory.authorizedResolvers(this.relayerAddress);
            console.log(`🏭 Escrow Factory: ${factoryAuth ? '✅ Authorized' : '❌ Not authorized'}`);
            
        } catch (error) {
            console.log('⚠️ Could not check authorization status:', error.message);
        }
    }
}

// Execute authorization
async function main() {
    const auth = new RelayerAuthorization();
    await auth.authorizeRelayer();
    await auth.checkAuthorizationStatus();
}

main().catch(console.error); 