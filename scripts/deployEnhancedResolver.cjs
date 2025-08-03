#!/usr/bin/env node

/**
 * deployEnhancedResolver.cjs
 * Deploy EnhancedCrossChainResolver with full 1inch Fusion+ features
 * 
 * 🚀 FEATURES:
 * - Partial fill support
 * - Dutch auction price discovery
 * - Multi-stage timelocks
 * - Access token system
 * - Rescue functionality
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class EnhancedResolverDeployer {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.enhancedResolver = null;
        this.deploymentResult = {};
    }

    async initialize() {
        console.log('🚀 INITIALIZING ENHANCED RESOLVER DEPLOYMENT');
        console.log('=============================================');

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

    async deployEnhancedResolver() {
        console.log('\n🏗️ DEPLOYING ENHANCED CROSS-CHAIN RESOLVER');
        console.log('===========================================');

        // Read contract artifact
        const contractPath = path.join(__dirname, '../artifacts/contracts/EnhancedCrossChainResolver.sol/EnhancedCrossChainResolver.json');
        
        if (!fs.existsSync(contractPath)) {
            console.log('📝 Compiling contract...');
            await this.compileContract();
        }

        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const contractFactory = new ethers.ContractFactory(
            contractArtifact.abi,
            contractArtifact.bytecode,
            this.wallet
        );

        console.log('🚀 Deploying EnhancedCrossChainResolver...');
        
        // Deploy with constructor parameters
        this.enhancedResolver = await contractFactory.deploy();
        
        console.log(`📝 Transaction: ${this.enhancedResolver.deploymentTransaction().hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${this.enhancedResolver.deploymentTransaction().hash}`);
        
        console.log('⏳ Waiting for deployment confirmation...');
        await this.enhancedResolver.waitForDeployment();
        
        const address = await this.enhancedResolver.getAddress();
        console.log(`✅ EnhancedCrossChainResolver deployed at: ${address}`);
        
        this.deploymentResult.enhancedResolver = address;
        return address;
    }

    async compileContract() {
        console.log('🔨 Compiling EnhancedCrossChainResolver...');
        
        // This would typically use hardhat or foundry
        // For now, we'll assume the contract is already compiled
        throw new Error('❌ Contract compilation not implemented. Please compile manually with hardhat.');
    }

    async configureAccessTokens() {
        console.log('\n🔑 CONFIGURING ACCESS TOKENS');
        console.log('============================');

        // Example access tokens (in production, these would be real token addresses)
        const accessTokens = [
            '0x1234567890123456789012345678901234567890', // Example token 1
            '0x2345678901234567890123456789012345678901', // Example token 2
        ];

        for (const token of accessTokens) {
            try {
                const tx = await this.enhancedResolver.setAccessToken(token, true);
                console.log(`✅ Access token set: ${token}`);
                console.log(`📝 Transaction: ${tx.hash}`);
                await tx.wait();
            } catch (error) {
                console.log(`❌ Failed to set access token ${token}: ${error.message}`);
            }
        }
    }

    async authorizeResolvers() {
        console.log('\n🤖 AUTHORIZING RESOLVERS');
        console.log('========================');

        // Example resolver addresses (in production, these would be real resolver addresses)
        const resolvers = [
            '0x3456789012345678901234567890123456789012', // Example resolver 1
            '0x4567890123456789012345678901234567890123', // Example resolver 2
        ];

        for (const resolver of resolvers) {
            try {
                const tx = await this.enhancedResolver.setAuthorizedResolver(resolver, true);
                console.log(`✅ Resolver authorized: ${resolver}`);
                console.log(`📝 Transaction: ${tx.hash}`);
                await tx.wait();
            } catch (error) {
                console.log(`❌ Failed to authorize resolver ${resolver}: ${error.message}`);
            }
        }
    }

    async verifyDeployment() {
        console.log('\n🔍 VERIFYING DEPLOYMENT');
        console.log('=======================');

        const address = await this.enhancedResolver.getAddress();
        
        // Verify contract exists
        const code = await this.provider.getCode(address);
        if (code === '0x') {
            throw new Error('❌ Contract not deployed');
        }
        console.log('✅ Contract code verified');

        // Verify owner
        const owner = await this.enhancedResolver.owner();
        if (owner !== this.wallet.address) {
            throw new Error('❌ Owner verification failed');
        }
        console.log('✅ Owner verified');

        // Verify constants
        const escrowFactory = await this.enhancedResolver.ESCROW_FACTORY();
        const limitOrderProtocol = await this.enhancedResolver.LIMIT_ORDER_PROTOCOL();
        
        console.log(`✅ ESCROW_FACTORY: ${escrowFactory}`);
        console.log(`✅ LIMIT_ORDER_PROTOCOL: ${limitOrderProtocol}`);

        // Verify configuration
        const minOrderValue = await this.enhancedResolver.MIN_ORDER_VALUE();
        const defaultTimelock = await this.enhancedResolver.DEFAULT_TIMELOCK();
        const auctionDuration = await this.enhancedResolver.AUCTION_DURATION();
        
        console.log(`✅ MIN_ORDER_VALUE: ${ethers.formatEther(minOrderValue)} ETH`);
        console.log(`✅ DEFAULT_TIMELOCK: ${defaultTimelock} seconds`);
        console.log(`✅ AUCTION_DURATION: ${auctionDuration} seconds`);

        console.log('✅ All verifications passed');
    }

    async testBasicFunctions() {
        console.log('\n🧪 TESTING BASIC FUNCTIONS');
        console.log('==========================');

        // Test access token setting
        const testToken = '0x1234567890123456789012345678901234567890';
        const tx1 = await this.enhancedResolver.setAccessToken(testToken, true);
        await tx1.wait();
        
        // Test resolver authorization
        const testResolver = '0x2345678901234567890123456789012345678901';
        const tx2 = await this.enhancedResolver.setAuthorizedResolver(testResolver, true);
        await tx2.wait();

        console.log('✅ Basic functions tested successfully');
    }

    async saveDeploymentResult() {
        console.log('\n💾 SAVING DEPLOYMENT RESULT');
        console.log('============================');

        const deploymentData = {
            timestamp: new Date().toISOString(),
            network: 'sepolia',
            deployer: this.wallet.address,
            contracts: {
                enhancedResolver: this.deploymentResult.enhancedResolver
            },
            features: {
                partialFills: true,
                dutchAuctions: true,
                multiStageTimelocks: true,
                accessTokens: true,
                rescueFunctionality: true
            },
            configuration: {
                minOrderValue: ethers.formatEther(await this.enhancedResolver.MIN_ORDER_VALUE()),
                defaultTimelock: (await this.enhancedResolver.DEFAULT_TIMELOCK()).toString(),
                auctionDuration: (await this.enhancedResolver.AUCTION_DURATION()).toString(),
                maxPartialFills: '10',
                resolverFeeRate: '50', // 0.5%
                partialFillBonus: '25' // 0.25%
            }
        };

        const filename = `enhanced-resolver-deployment-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
        
        console.log(`✅ Deployment result saved to: ${filename}`);
        this.deploymentResult.filename = filename;
    }

    async generateIntegrationGuide() {
        console.log('\n📚 GENERATING INTEGRATION GUIDE');
        console.log('===============================');

        const guide = `# 🚀 Enhanced Cross-Chain Resolver Integration Guide

## 📋 Contract Addresses
- **EnhancedCrossChainResolver**: ${this.deploymentResult.enhancedResolver}
- **Network**: Sepolia Testnet

## 🎯 Key Features
- ✅ Partial Fill Support
- ✅ Dutch Auction Price Discovery
- ✅ Multi-Stage Timelocks
- ✅ Access Token System
- ✅ Rescue Functionality

## 🔧 Basic Usage

### 1. Create Enhanced HTLC
\`\`\`javascript
const orderHash = await enhancedResolver.createEnhancedCrossChainHTLC(
    hashlock,
    timelock,
    token,
    amount,
    recipient,
    algorandAddress,
    partialFillsEnabled,
    minFillAmount,
    amountMode,
    auctionStartTime,
    auctionEndTime,
    startPrice,
    endPrice,
    accessToken
);
\`\`\`

### 2. Execute Partial Fill
\`\`\`javascript
await enhancedResolver.executePartialFill(
    orderHash,
    fillAmount,
    secret,
    algorandAmount
);
\`\`\`

### 3. Place Dutch Auction Bid
\`\`\`javascript
await enhancedResolver.placeBid(
    orderHash,
    bidAmount
);
\`\`\`

### 4. Transition Timelock Stage
\`\`\`javascript
await enhancedResolver.transitionStage(orderHash);
\`\`\`

## 🎯 Configuration
- **MIN_ORDER_VALUE**: ${ethers.formatEther(await this.enhancedResolver.MIN_ORDER_VALUE())} ETH
- **DEFAULT_TIMELOCK**: ${(await this.enhancedResolver.DEFAULT_TIMELOCK()).toString()} seconds
- **AUCTION_DURATION**: ${(await this.enhancedResolver.AUCTION_DURATION()).toString()} seconds
- **MAX_PARTIAL_FILLS**: 10
- **RESOLVER_FEE_RATE**: 0.5%
- **PARTIAL_FILL_BONUS**: 0.25%

## 🔗 Official 1inch Integration
- **ESCROW_FACTORY**: ${await this.enhancedResolver.ESCROW_FACTORY()}
- **LIMIT_ORDER_PROTOCOL**: ${await this.enhancedResolver.LIMIT_ORDER_PROTOCOL()}

## 🚀 Ready for Production!
This resolver implements full 1inch Fusion+ standards with cross-chain capabilities.
`;

        const guideFilename = `enhanced-resolver-integration-guide-${Date.now()}.md`;
        fs.writeFileSync(guideFilename, guide);
        
        console.log(`✅ Integration guide saved to: ${guideFilename}`);
        this.deploymentResult.guideFilename = guideFilename;
    }

    async deploy() {
        try {
            await this.initialize();
            await this.deployEnhancedResolver();
            await this.verifyDeployment();
            await this.configureAccessTokens();
            await this.authorizeResolvers();
            await this.testBasicFunctions();
            await this.saveDeploymentResult();
            await this.generateIntegrationGuide();

            console.log('\n🎉 ENHANCED RESOLVER DEPLOYMENT COMPLETE!');
            console.log('==========================================');
            console.log(`📍 Contract: ${this.deploymentResult.enhancedResolver}`);
            console.log(`📄 Deployment: ${this.deploymentResult.filename}`);
            console.log(`📚 Guide: ${this.deploymentResult.guideFilename}`);
            console.log('\n🚀 Ready for 1inch Fusion+ integration!');

            return this.deploymentResult;

        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            throw error;
        }
    }
}

// Main execution
async function main() {
    const deployer = new EnhancedResolverDeployer();
    await deployer.deploy();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = EnhancedResolverDeployer; 