#!/usr/bin/env node

const { ethers } = require('hardhat');

async function deployEnhanced1inchBridge() {
    console.log('🚀 DEPLOYING ENHANCED 1INCH STYLE BRIDGE');
    console.log('========================================');

    try {
        const [deployer] = await ethers.getSigners();
        console.log('Deploying with account:', await deployer.getAddress());

        const Enhanced1inchStyleBridge = await ethers.getContractFactory('Enhanced1inchStyleBridge');
        
        console.log('Deploying Enhanced1inchStyleBridge...');
        const contract = await Enhanced1inchStyleBridge.deploy({
            gasLimit: 3000000 // High gas limit
        });

        await contract.waitForDeployment();
        const address = await contract.getAddress();

        console.log('✅ Enhanced1inchStyleBridge deployed to:', address);
        console.log('🔗 Etherscan:', `https://sepolia.etherscan.io/address/${address}`);

        return { contractAddress: address };

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    deployEnhanced1inchBridge()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { deployEnhanced1inchBridge }; 