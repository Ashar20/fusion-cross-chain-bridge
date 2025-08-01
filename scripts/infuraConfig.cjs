#!/usr/bin/env node

/**
 * 🌐 Infura Configuration for Fusion Cross-Chain Bridge
 * 
 * Your Infura Status: 697 of 3M requests used ✅
 * Quota Available: 2,999,303 requests (plenty for production!)
 */

const { ethers } = require('ethers');

class InfuraConfig {
    constructor() {
        this.setupInfuraEndpoints();
    }

    setupInfuraEndpoints() {
        console.log('🌐 Configuring Infura for Cross-Chain Bridge...');
        console.log('📊 Your Infura Status: 697 of 3M used (99.98% available!)');
        
        // Your actual Infura Project ID (697 of 3M used - excellent!)
        this.infuraProjectId = '116078ce3b154dd0b21e372e9626f104';
        
        this.networks = {
            // Ethereum Mainnet (for production)
            mainnet: {
                rpc: `https://mainnet.infura.io/v3/${this.infuraProjectId}`,
                chainId: 1,
                name: 'Ethereum Mainnet'
            },
            
            // Ethereum Sepolia (for testing - recommended)
            sepolia: {
                rpc: `https://sepolia.infura.io/v3/${this.infuraProjectId}`,
                chainId: 11155111,
                name: 'Sepolia Testnet'
            },
            
            // Algorand networks (free, no Infura needed)
            algorandTestnet: {
                rpc: 'https://testnet-api.algonode.cloud',
                chainId: 416002,
                name: 'Algorand Testnet'
            },
            
            algorandMainnet: {
                rpc: 'https://mainnet-api.algonode.cloud', 
                chainId: 416001,
                name: 'Algorand Mainnet'
            }
        };
        
        console.log('✅ Infura endpoints configured');
    }

    /**
     * Get Ethereum provider with your Infura endpoint
     */
    getEthereumProvider(network = 'sepolia') {
        const networkConfig = this.networks[network];
        
        if (!networkConfig) {
            throw new Error(`Unsupported network: ${network}`);
        }
        
        if (this.infuraProjectId === 'YOUR_INFURA_PROJECT_ID_HERE') {
            console.log('⚠️  Please set your actual Infura Project ID in infuraConfig.cjs');
            console.log('   You can find it at: https://infura.io/dashboard');
            console.log('   You have 2.999M requests available!');
            
            // Fallback to free RPC for now
            return new ethers.JsonRpcProvider('https://eth-sepolia.public.blastapi.io');
        }
        
        console.log(`🌐 Connecting to ${networkConfig.name} via Infura...`);
        console.log(`📡 RPC: ${networkConfig.rpc}`);
        
        return new ethers.JsonRpcProvider(networkConfig.rpc);
    }

    /**
     * Get Algorand client (free, no Infura needed)
     */
    getAlgorandClient(network = 'testnet') {
        const algosdk = require('algosdk');
        
        const networkConfig = network === 'mainnet' 
            ? this.networks.algorandMainnet 
            : this.networks.algorandTestnet;
            
        console.log(`🏗️ Connecting to ${networkConfig.name}...`);
        console.log(`📡 RPC: ${networkConfig.rpc}`);
        
        return new algosdk.Algodv2('', networkConfig.rpc, '');
    }

    /**
     * Setup instructions for your Infura integration
     */
    showSetupInstructions() {
        console.log('\n🚀 INFURA SETUP INSTRUCTIONS:');
        console.log('═══════════════════════════════════════════════════════');
        
        console.log('\n1️⃣ Get your Infura Project ID:');
        console.log('   • Visit: https://infura.io/dashboard');
        console.log('   • Copy your Project ID');
        console.log('   • You have 2,999,303 requests available! 🎉');
        
        console.log('\n2️⃣ Update infuraConfig.cjs:');
        console.log('   • Replace: YOUR_INFURA_PROJECT_ID_HERE');
        console.log('   • With: your-actual-project-id');
        
        console.log('\n3️⃣ Update your scripts to use Infura:');
        console.log('   • Import: const { InfuraConfig } = require("./infuraConfig.cjs")');
        console.log('   • Use: const provider = config.getEthereumProvider("sepolia")');
        
        console.log('\n4️⃣ Benefits of using your Infura endpoint:');
        console.log('   ✅ Higher rate limits (3M requests vs 100/day)');
        console.log('   ✅ Better reliability and uptime');
        console.log('   ✅ Advanced analytics and monitoring');
        console.log('   ✅ Priority support');
        
        console.log('\n📊 Your Current Usage:');
        console.log('   • Used: 697 requests');
        console.log('   • Available: 2,999,303 requests');
        console.log('   • Utilization: 0.02% (excellent!)');
        
        return this;
    }

    /**
     * Test connection to all networks
     */
    async testConnections() {
        console.log('\n🧪 Testing Network Connections...');
        console.log('═══════════════════════════════════════════════════');
        
        try {
            // Test Ethereum Sepolia
            const ethProvider = this.getEthereumProvider('sepolia');
            const ethNetwork = await ethProvider.getNetwork();
            console.log(`✅ Ethereum Sepolia: Chain ID ${ethNetwork.chainId}`);
            
            // Test Algorand Testnet
            const algoClient = this.getAlgorandClient('testnet');
            const algoStatus = await algoClient.status().do();
            console.log(`✅ Algorand Testnet: Round ${algoStatus['last-round']}`);
            
            console.log('\n🎯 All connections successful!');
            console.log('Your bridge is ready for cross-chain swaps! 🌉');
            
        } catch (error) {
            console.error(`❌ Connection test failed: ${error.message}`);
            
            if (error.message.includes('project ID')) {
                console.log('\n💡 Tip: Make sure to set your Infura Project ID');
                console.log('   You have 2.999M requests available to use!');
            }
        }
    }

    /**
     * Estimate Infura usage for cross-chain operations
     */
    estimateInfuraUsage() {
        console.log('\n📊 INFURA USAGE ESTIMATION:');
        console.log('═══════════════════════════════════════════════════');
        
        const operations = {
            'HTLC Creation': 3,           // Deploy + setup + confirmation
            'Event Monitoring': 2,        // getTransactionReceipt + getLogs  
            'Secret Revelation': 2,       // executeHTLCWithSecret + confirmation
            'Auction Operations': 5,      // Dutch auction lifecycle
            'Balance Checks': 1,          // getBalance
            'Network Status': 1           // getNetwork/getBlockNumber
        };
        
        console.log('Per Cross-Chain Swap:');
        let totalPerSwap = 0;
        for (const [operation, requests] of Object.entries(operations)) {
            console.log(`   ${operation}: ${requests} requests`);
            totalPerSwap += requests;
        }
        
        console.log(`\n🎯 Total per swap: ${totalPerSwap} requests`);
        console.log(`💰 Possible swaps with your quota: ${Math.floor(2999303 / totalPerSwap).toLocaleString()}`);
        
        console.log('\n📈 Volume Projections:');
        console.log(`   • Daily (100 swaps): ${(totalPerSwap * 100).toLocaleString()} requests`);
        console.log(`   • Monthly (3000 swaps): ${(totalPerSwap * 3000).toLocaleString()} requests`);
        console.log(`   • Your quota supports: ${Math.floor(2999303 / (totalPerSwap * 30))} swaps/day for 30 days`);
        
        return totalPerSwap;
    }
}

// Create instance and show setup
const infuraConfig = new InfuraConfig();

if (require.main === module) {
    console.log('🌉 Fusion Cross-Chain Bridge - Infura Integration');
    console.log('═══════════════════════════════════════════════════════════');
    
    infuraConfig.showSetupInstructions();
    infuraConfig.estimateInfuraUsage();
    infuraConfig.testConnections();
}

module.exports = { InfuraConfig }; 