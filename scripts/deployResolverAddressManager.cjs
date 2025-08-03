const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class ResolverAddressManagerDeployer {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.addressManager = null;
        this.deploymentResult = {
            timestamp: new Date().toISOString(),
            network: 'sepolia',
            deployer: '',
            contractAddress: '',
            deploymentTxHash: '',
            features: [
                'Deterministic address generation',
                'Resolver wallet management',
                'Fee tracking per resolver',
                'Fill count tracking',
                'Address activation/deactivation',
                'Statistics and analytics'
            ]
        };
    }

    async initialize() {
        console.log('🚀 INITIALIZING RESOLVER ADDRESS MANAGER DEPLOYMENT');
        console.log('==================================================');

        // Load environment
        require('dotenv').config();
        
        // Initialize provider
        const infuraProjectId = process.env.INFURA_PROJECT_ID;
        const sepoliaUrl = process.env.SEPOLIA_URL || `https://sepolia.infura.io/v3/${infuraProjectId}`;
        this.provider = new ethers.JsonRpcProvider(sepoliaUrl);
        
        // Initialize wallet
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('❌ PRIVATE_KEY not found in environment');
        }
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        
        console.log(`📡 Connected to Sepolia: ${sepoliaUrl}`);
        console.log(`👤 Deployer: ${this.wallet.address}`);
        
        // Check balance
        const balance = await this.provider.getBalance(this.wallet.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance < ethers.parseEther('0.01')) {
            throw new Error('❌ Insufficient balance for deployment');
        }
    }

    async deployResolverAddressManager() {
        console.log('\n🏗️ DEPLOYING RESOLVER ADDRESS MANAGER');
        console.log('=====================================');

        // Read contract artifact
        const contractPath = path.join(__dirname, '../artifacts/contracts/ResolverAddressManager.sol/ResolverAddressManager.json');
        
        if (!fs.existsSync(contractPath)) {
            throw new Error('❌ Contract artifact not found. Please compile with: npx hardhat compile');
        }

        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const contractFactory = new ethers.ContractFactory(
            contractArtifact.abi,
            contractArtifact.bytecode,
            this.wallet
        );

        console.log('🚀 Deploying ResolverAddressManager...');
        
        // Deploy contract
        this.addressManager = await contractFactory.deploy();
        
        console.log(`📝 Transaction: ${this.addressManager.deploymentTransaction().hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${this.addressManager.deploymentTransaction().hash}`);
        
        console.log('⏳ Waiting for deployment confirmation...');
        await this.addressManager.waitForDeployment();
        
        const address = await this.addressManager.getAddress();
        console.log(`✅ ResolverAddressManager deployed at: ${address}`);
        
        this.deploymentResult.contractAddress = address;
        this.deploymentResult.deploymentTxHash = this.addressManager.deploymentTransaction().hash;
        this.deploymentResult.deployer = this.wallet.address;
        
        return address;
    }

    async verifyDeployment() {
        console.log('\n🔍 VERIFYING DEPLOYMENT');
        console.log('=======================');

        try {
            // Verify contract code
            const code = await this.provider.getCode(this.deploymentResult.contractAddress);
            if (code === '0x') {
                throw new Error('Contract code not found');
            }
            console.log('✅ Contract code verified');

            // Verify owner
            const owner = await this.addressManager.owner();
            if (owner !== this.wallet.address) {
                throw new Error('Owner verification failed');
            }
            console.log('✅ Owner verified');

            // Verify constants
            const addressGenerationCost = await this.addressManager.ADDRESS_GENERATION_COST();
            const maxResolvers = await this.addressManager.MAX_RESOLVERS();
            const nextNonce = await this.addressManager.nextNonce();

            console.log(`✅ ADDRESS_GENERATION_COST: ${ethers.formatEther(addressGenerationCost)} ETH`);
            console.log(`✅ MAX_RESOLVERS: ${maxResolvers}`);
            console.log(`✅ nextNonce: ${nextNonce}`);

            console.log('✅ All verifications passed');
            return true;
        } catch (error) {
            console.log(`❌ Verification failed: ${error.message}`);
            return false;
        }
    }

    async demonstrateAddressGeneration() {
        console.log('\n🎯 DEMONSTRATING ADDRESS GENERATION');
        console.log('===================================');

        try {
            // Create example resolver addresses
            const resolvers = [
                { name: "High-Frequency-Resolver-1", description: "High-frequency trading resolver" },
                { name: "Arbitrage-Resolver-1", description: "Arbitrage resolver" },
                { name: "MEV-Resolver-1", description: "MEV resolver" }
            ];

            for (let i = 0; i < resolvers.length; i++) {
                const resolver = resolvers[i];
                console.log(`\n📝 Creating resolver: ${resolver.name}`);
                
                // Generate signature (simplified for demo)
                const message = `CreateResolverAddress${this.wallet.address}${resolver.name}${i}`;
                const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
                const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));
                
                // Create resolver address
                const tx = await this.addressManager.createResolverAddress(
                    resolver.name,
                    signature,
                    { value: ethers.parseEther('0.001') }
                );
                
                console.log(`📝 Transaction: ${tx.hash}`);
                await tx.wait();
                
                // Get the created address
                const nonce = await this.addressManager.nextNonce();
                const resolverAddress = await this.addressManager.getResolverAddress(nonce - 1);
                
                console.log(`✅ Resolver address created: ${resolverAddress.resolverAddress}`);
                console.log(`📊 Name: ${resolverAddress.resolverName}`);
                console.log(`💰 Total fees: ${ethers.formatEther(resolverAddress.totalFees)} ETH`);
                console.log(`📈 Total fills: ${resolverAddress.totalFills}`);
            }

            console.log('\n✅ Address generation demonstration completed');
        } catch (error) {
            console.log(`❌ Address generation failed: ${error.message}`);
        }
    }

    async getStatistics() {
        console.log('\n📊 GETTING STATISTICS');
        console.log('=====================');

        try {
            const totalResolvers = await this.addressManager.getTotalResolvers();
            const totalFees = await this.addressManager.getTotalFees();
            const totalFills = await this.addressManager.getTotalFills();
            const nextNonce = await this.addressManager.nextNonce();

            console.log(`📈 Total resolvers: ${totalResolvers}`);
            console.log(`💰 Total fees earned: ${ethers.formatEther(totalFees)} ETH`);
            console.log(`📊 Total fills executed: ${totalFills}`);
            console.log(`🔢 Next nonce: ${nextNonce}`);

            // Get individual resolver stats
            for (let i = 0; i < Math.min(totalResolvers, 3); i++) {
                const resolver = await this.addressManager.getResolverAddress(i);
                console.log(`\n👤 Resolver ${i + 1}:`);
                console.log(`   Address: ${resolver.resolverAddress}`);
                console.log(`   Name: ${resolver.resolverName}`);
                console.log(`   Active: ${resolver.active}`);
                console.log(`   Fees: ${ethers.formatEther(resolver.totalFees)} ETH`);
                console.log(`   Fills: ${resolver.totalFills}`);
            }

            console.log('✅ Statistics retrieved successfully');
        } catch (error) {
            console.log(`❌ Statistics retrieval failed: ${error.message}`);
        }
    }

    async saveDeploymentResult() {
        console.log('\n💾 SAVING DEPLOYMENT RESULT');
        console.log('============================');

        const filename = `resolver-address-manager-deployment-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(this.deploymentResult, null, 2));
        console.log(`✅ Deployment result saved to: ${filename}`);
        
        return filename;
    }

    async generateIntegrationGuide() {
        console.log('\n📚 GENERATING INTEGRATION GUIDE');
        console.log('===============================');

        const guide = `# 🔧 ResolverAddressManager Integration Guide

## 📋 Contract Information
- **Address**: ${this.deploymentResult.contractAddress}
- **Network**: ${this.deploymentResult.network}
- **Deployer**: ${this.deploymentResult.deployer}

## 🚀 Quick Start

### 1. Initialize Contract
\`\`\`javascript
const { ethers } = require('ethers');

const addressManager = new ethers.Contract(
    '${this.deploymentResult.contractAddress}',
    ['function createResolverAddress(string name, bytes signature) payable returns (address)'],
    wallet
);
\`\`\`

### 2. Create Resolver Address
\`\`\`javascript
// Generate signature
const message = \`CreateResolverAddress\${wallet.address}\${resolverName}\${nonce}\`;
const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
const signature = await wallet.signMessage(ethers.getBytes(messageHash));

// Create address
const tx = await addressManager.createResolverAddress(
    resolverName,
    signature,
    { value: ethers.parseEther('0.001') }
);
\`\`\`

### 3. Get Resolver Statistics
\`\`\`javascript
const totalResolvers = await addressManager.getTotalResolvers();
const totalFees = await addressManager.getTotalFees();
const resolver = await addressManager.getResolverAddress(nonce);
\`\`\`

## 🎯 Features
${this.deploymentResult.features.map(feature => `- ${feature}`).join('\n')}

## 🔗 Links
- **Etherscan**: https://sepolia.etherscan.io/address/${this.deploymentResult.contractAddress}
- **Deployment TX**: https://sepolia.etherscan.io/tx/${this.deploymentResult.deploymentTxHash}
`;

        const filename = `resolver-address-manager-integration-guide-${Date.now()}.md`;
        fs.writeFileSync(filename, guide);
        console.log(`✅ Integration guide saved to: ${filename}`);
        
        return filename;
    }

    async deploy() {
        try {
            await this.initialize();
            await this.deployResolverAddressManager();
            await this.verifyDeployment();
            await this.demonstrateAddressGeneration();
            await this.getStatistics();
            
            const resultFile = await this.saveDeploymentResult();
            const guideFile = await this.generateIntegrationGuide();

            console.log('\n🎉 RESOLVER ADDRESS MANAGER DEPLOYMENT COMPLETE!');
            console.log('================================================');
            console.log(`📍 Contract: ${this.deploymentResult.contractAddress}`);
            console.log(`📄 Deployment: ${resultFile}`);
            console.log(`📚 Guide: ${guideFile}`);
            console.log('\n🚀 Ready for resolver address management!');

        } catch (error) {
            console.log(`❌ Deployment failed: ${error.message}`);
            throw error;
        }
    }
}

// Execute deployment
if (require.main === module) {
    const deployer = new ResolverAddressManagerDeployer();
    deployer.deploy().catch(console.error);
}

module.exports = ResolverAddressManagerDeployer; 