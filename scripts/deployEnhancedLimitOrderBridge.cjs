#!/usr/bin/env node

const { ethers } = require('hardhat');
const fs = require('fs');

async function deployEnhancedLimitOrderBridge() {
    console.log('🚀 DEPLOYING ENHANCED LIMIT ORDER BRIDGE...\n');

    try {
        const [deployer] = await ethers.getSigners();
        console.log(`Deployer: ${deployer.address}`);

        // Check balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

        if (balance < ethers.parseEther('0.1')) {
            throw new Error('Insufficient balance for deployment');
        }

        // Deploy enhanced contract
        console.log('\n📦 Deploying EnhancedLimitOrderBridge...');
        const EnhancedLimitOrderBridge = await ethers.getContractFactory('EnhancedLimitOrderBridge');
        
        const gasPrice = (await ethers.provider.getFeeData()).gasPrice;
        const gasLimit = 5000000n; // Much higher gas limit for complex contract
        
        const enhancedBridge = await EnhancedLimitOrderBridge.deploy({
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });
        
        await enhancedBridge.waitForDeployment();

        const contractAddress = await enhancedBridge.getAddress();
        console.log(`✅ Enhanced Limit Order Bridge deployed: ${contractAddress}`);

        // Configure contract
        console.log('\n🔧 Configuring contract...');
        
        // Set Algorand App ID
        await enhancedBridge.setAlgorandAppId(743645803);
        console.log('✅ Algorand App ID set: 743645803');

        // Authorize existing resolvers from resolver environment
        const existingResolvers = [
            '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64' // From resolver environment
        ];

        for (const resolver of existingResolvers) {
            await enhancedBridge.authorizeResolver(resolver, true);
            console.log(`✅ Authorized resolver: ${resolver}`);
        }

        // Save deployment info
        const deploymentInfo = {
            contractAddress: contractAddress,
            deployer: deployer.address,
            algorandAppId: 743645803,
            authorizedResolvers: existingResolvers,
            deploymentTime: new Date().toISOString(),
            network: 'sepolia',
            features: [
                'Ethereum-only competitive bidding',
                'Partial fill support',
                'Bidirectional ETH ↔ ALGO swaps',
                'Automatic best-bid selection',
                '1inch Fusion+ integration'
            ],
            gasUsed: {
                deployment: gasLimit.toString(),
                gasPrice: gasPrice.toString()
            }
        };

        // Save to file
        fs.writeFileSync(
            'ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json',
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log('\n📄 Deployment info saved to: ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');

        // Display summary
        console.log('\n🎉 ENHANCED LIMIT ORDER BRIDGE DEPLOYMENT COMPLETE!');
        console.log('=' .repeat(60));
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Algorand App ID: 743645803`);
        console.log(`Authorized Resolvers: ${existingResolvers.length}`);
        console.log(`Features: ${deploymentInfo.features.length}`);
        console.log('=' .repeat(60));

        return {
            contractAddress,
            deploymentInfo
        };

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment
async function main() {
    await deployEnhancedLimitOrderBridge();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { deployEnhancedLimitOrderBridge }; 