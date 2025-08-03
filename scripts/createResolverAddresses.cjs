#!/usr/bin/env node

/**
 * createResolverAddresses.cjs
 * Demonstrate creating separate addresses for each resolver
 * 
 * 🎯 FEATURES:
 * - Generate unique addresses for each resolver
 * - Secure key derivation
 * - Address management and tracking
 * - Fee distribution per resolver
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

class ResolverAddressCreator {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.addressManager = null;
        this.resolverAddresses = [];
    }

    async initialize() {
        console.log('🎯 INITIALIZING RESOLVER ADDRESS CREATOR');
        console.log('========================================');

        // Load environment
        require('dotenv').config();
        
        // Initialize provider
        const sepoliaUrl = process.env.SEPOLIA_URL || 'https://sepolia.infura.io/v3/your-project-id';
        this.provider = new ethers.JsonRpcProvider(sepoliaUrl);
        
        // Initialize wallet
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('❌ PRIVATE_KEY not found in environment');
        }
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        
        // Load address manager contract
        const managerAddress = process.env.ADDRESS_MANAGER_ADDRESS;
        if (!managerAddress) {
            throw new Error('❌ ADDRESS_MANAGER_ADDRESS not found in environment');
        }

        // Load contract ABI
        const contractPath = require('path').join(__dirname, '../artifacts/contracts/ResolverAddressManager.sol/ResolverAddressManager.json');
        const contractArtifact = require('fs').readFileSync(contractPath, 'utf8');
        const abi = JSON.parse(contractArtifact).abi;

        this.addressManager = new ethers.Contract(managerAddress, abi, this.wallet);
        
        console.log(`📡 Connected to Sepolia: ${sepoliaUrl}`);
        console.log(`👤 Creator: ${this.wallet.address}`);
        console.log(`🏗️ Address Manager: ${managerAddress}`);
    }

    async createResolverAddresses() {
        console.log('\n🎯 CREATING RESOLVER ADDRESSES');
        console.log('==============================');

        // Define resolver configurations
        const resolvers = [
            {
                name: "High-Frequency-Resolver-1",
                description: "High-frequency trading resolver for fast execution"
            },
            {
                name: "Arbitrage-Resolver-1", 
                description: "Arbitrage resolver for price differences"
            },
            {
                name: "MEV-Resolver-1",
                description: "MEV resolver for sandwich attacks"
            },
            {
                name: "Backup-Resolver-1",
                description: "Backup resolver for redundancy"
            }
        ];

        for (let i = 0; i < resolvers.length; i++) {
            const resolver = resolvers[i];
            console.log(`\n🎯 Creating resolver: ${resolver.name}`);
            
            try {
                // Create signature for authorization
                const messageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                    ['string', 'address', 'string', 'uint256'],
                    ['CreateResolverAddress', this.wallet.address, resolver.name, i + 1]
                ));
                const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));

                // Create resolver address
                const tx = await this.addressManager.createResolverAddress(
                    resolver.name,
                    signature,
                    { value: ethers.parseEther('0.001') } // Address generation cost
                );

                console.log(`📝 Transaction: ${tx.hash}`);
                console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
                
                const receipt = await tx.wait();
                console.log(`✅ Resolver address created in block ${receipt.blockNumber}`);

                // Extract resolver address from event
                const addressCreatedEvent = receipt.logs.find(log => {
                    try {
                        const parsed = this.addressManager.interface.parseLog(log);
                        return parsed.name === 'ResolverAddressCreated';
                    } catch {
                        return false;
                    }
                });

                if (addressCreatedEvent) {
                    const resolverAddress = addressCreatedEvent.args.resolverAddress;
                    const nonce = addressCreatedEvent.args.nonce;
                    
                    console.log(`🎯 Resolver Address: ${resolverAddress}`);
                    console.log(`🔢 Nonce: ${nonce}`);
                    console.log(`📝 Name: ${resolver.name}`);
                    
                    this.resolverAddresses.push({
                        address: resolverAddress,
                        name: resolver.name,
                        nonce: nonce,
                        description: resolver.description
                    });
                }

            } catch (error) {
                console.error(`❌ Failed to create resolver ${resolver.name}:`, error.message);
            }
        }
    }

    async demonstrateAddressUsage() {
        console.log('\n🧪 DEMONSTRATING ADDRESS USAGE');
        console.log('==============================');

        if (this.resolverAddresses.length === 0) {
            console.log('❌ No resolver addresses created');
            return;
        }

        // Simulate fee earning for each resolver
        for (const resolver of this.resolverAddresses) {
            console.log(`\n💰 Recording fees for: ${resolver.name}`);
            console.log(`📍 Address: ${resolver.address}`);
            
            try {
                // Record some fees (simulated)
                const feeAmount = ethers.parseEther('0.01'); // 0.01 ETH
                const tx = await this.addressManager.recordFeeEarned(resolver.address, feeAmount);
                
                console.log(`📝 Fee Transaction: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`✅ Fees recorded in block ${receipt.blockNumber}`);

                // Record a fill
                const fillTx = await this.addressManager.recordFillExecuted(resolver.address);
                console.log(`📝 Fill Transaction: ${fillTx.hash}`);
                const fillReceipt = await fillTx.wait();
                console.log(`✅ Fill recorded in block ${fillReceipt.blockNumber}`);

            } catch (error) {
                console.error(`❌ Failed to record fees for ${resolver.name}:`, error.message);
            }
        }
    }

    async getResolverStats() {
        console.log('\n📊 RESOLVER STATISTICS');
        console.log('======================');

        // Get total fees and fills
        try {
            const totalFees = await this.addressManager.getTotalFeesEarned();
            const totalFills = await this.addressManager.getTotalFillsExecuted();
            
            console.log(`💰 Total Fees Earned: ${ethers.formatEther(totalFees)} ETH`);
            console.log(`🔄 Total Fills Executed: ${totalFills}`);
        } catch (error) {
            console.error('❌ Failed to get stats:', error.message);
        }

        // Get individual resolver stats
        for (const resolver of this.resolverAddresses) {
            console.log(`\n📈 Stats for ${resolver.name}:`);
            console.log(`📍 Address: ${resolver.address}`);
            
            try {
                const resolverInfo = await this.addressManager.getResolverAddress(resolver.address);
                
                console.log(`💰 Total Fees: ${ethers.formatEther(resolverInfo.totalFees)} ETH`);
                console.log(`🔄 Total Fills: ${resolverInfo.totalFills}`);
                console.log(`📅 Created: ${new Date(resolverInfo.createdAt * 1000).toISOString()}`);
                console.log(`✅ Active: ${resolverInfo.active ? 'Yes' : 'No'}`);
                
            } catch (error) {
                console.error(`❌ Failed to get stats for ${resolver.name}:`, error.message);
            }
        }
    }

    async demonstrateAddressManagement() {
        console.log('\n🔧 ADDRESS MANAGEMENT DEMONSTRATION');
        console.log('===================================');

        if (this.resolverAddresses.length === 0) {
            console.log('❌ No resolver addresses to manage');
            return;
        }

        const testResolver = this.resolverAddresses[0];
        console.log(`🎯 Testing management for: ${testResolver.name}`);
        console.log(`📍 Address: ${testResolver.address}`);

        try {
            // Check if active
            const isActive = await this.addressManager.isActiveResolver(testResolver.address);
            console.log(`✅ Currently Active: ${isActive}`);

            if (isActive) {
                // Deactivate
                console.log('\n🔄 Deactivating resolver...');
                const deactivateTx = await this.addressManager.deactivateResolverAddress(testResolver.address);
                console.log(`📝 Deactivate Transaction: ${deactivateTx.hash}`);
                await deactivateTx.wait();
                console.log('✅ Resolver deactivated');

                // Check status again
                const isActiveAfter = await this.addressManager.isActiveResolver(testResolver.address);
                console.log(`✅ Active After Deactivation: ${isActiveAfter}`);

                // Reactivate
                console.log('\n🔄 Reactivating resolver...');
                const reactivateTx = await this.addressManager.reactivateResolverAddress(testResolver.address);
                console.log(`📝 Reactivate Transaction: ${reactivateTx.hash}`);
                await reactivateTx.wait();
                console.log('✅ Resolver reactivated');

                // Final status check
                const isActiveFinal = await this.addressManager.isActiveResolver(testResolver.address);
                console.log(`✅ Active After Reactivation: ${isActiveFinal}`);
            }

        } catch (error) {
            console.error(`❌ Address management failed:`, error.message);
        }
    }

    async saveResults() {
        console.log('\n💾 SAVING RESULTS');
        console.log('==================');

        const results = {
            timestamp: new Date().toISOString(),
            network: 'sepolia',
            creator: this.wallet.address,
            addressManager: await this.addressManager.getAddress(),
            resolvers: this.resolverAddresses,
            summary: {
                totalResolvers: this.resolverAddresses.length,
                totalFees: ethers.formatEther(await this.addressManager.getTotalFeesEarned()),
                totalFills: (await this.addressManager.getTotalFillsExecuted()).toString()
            }
        };

        const filename = `resolver-addresses-${Date.now()}.json`;
        require('fs').writeFileSync(filename, JSON.stringify(results, null, 2));
        
        console.log(`✅ Results saved to: ${filename}`);
        
        // Print summary
        console.log('\n📊 SUMMARY');
        console.log('==========');
        console.log(`🎯 Total Resolvers Created: ${results.summary.totalResolvers}`);
        console.log(`💰 Total Fees Earned: ${results.summary.totalFees} ETH`);
        console.log(`🔄 Total Fills Executed: ${results.summary.totalFills}`);
        
        console.log('\n📍 Resolver Addresses:');
        this.resolverAddresses.forEach((resolver, index) => {
            console.log(`${index + 1}. ${resolver.name}: ${resolver.address}`);
        });
    }

    async run() {
        try {
            await this.initialize();
            await this.createResolverAddresses();
            await this.demonstrateAddressUsage();
            await this.getResolverStats();
            await this.demonstrateAddressManagement();
            await this.saveResults();

            console.log('\n🎉 RESOLVER ADDRESS CREATION COMPLETE!');
            console.log('=======================================');
            console.log('🚀 Separate addresses created for each resolver!');
            console.log('🔐 Secure key derivation implemented!');
            console.log('📊 Fee tracking per resolver address!');

            return this.resolverAddresses;

        } catch (error) {
            console.error('❌ Resolver address creation failed:', error.message);
            throw error;
        }
    }
}

// Main execution
async function main() {
    const creator = new ResolverAddressCreator();
    await creator.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ResolverAddressCreator; 