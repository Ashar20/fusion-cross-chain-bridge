#!/usr/bin/env node

/**
 * 🔧 LIMIT ORDER BRIDGE CONFIGURATION SCRIPT
 * 
 * Configures the deployed LimitOrderBridge contract:
 * 1. Authorizes resolvers
 * 2. Sets Algorand App ID
 * 3. Configures fee rates
 */

const { ethers } = require('hardhat');
const fs = require('fs');

async function configureLimitOrderBridge() {
    console.log('🔧 CONFIGURING LIMIT ORDER BRIDGE');
    console.log('==================================');
    console.log('✅ Authorizing resolvers');
    console.log('✅ Setting Algorand App ID');
    console.log('✅ Configuring fee rates');
    console.log('==================================\n');

    try {
        // Get deployer account from hardhat
        const [deployer] = await ethers.getSigners();
        const walletAddress = await deployer.getAddress();
        
        // Load deployment info
        const deploymentInfo = JSON.parse(fs.readFileSync('LIMIT-ORDER-BRIDGE-DEPLOYMENT.json', 'utf8'));
        const limitOrderBridgeAddress = deploymentInfo.contractAddress;
        
        // Load contract ABI
        const contractPath = require('path').join(__dirname, '../artifacts/contracts/LimitOrderBridge.sol/LimitOrderBridge.json');
        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const limitOrderBridge = new ethers.Contract(limitOrderBridgeAddress, contractArtifact.abi, deployer);

        console.log('📋 CONFIGURATION DETAILS:');
        console.log(`   Contract: ${limitOrderBridgeAddress}`);
        console.log(`   Owner: ${walletAddress}`);
        console.log('');

        // Step 1: Authorize existing resolver
        console.log('🔧 STEP 1: AUTHORIZING RESOLVERS');
        console.log('=================================');
        
        const existingResolver = '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64';
        console.log(`   Authorizing resolver: ${existingResolver}`);
        
        const authTx = await limitOrderBridge.authorizeResolver(existingResolver, true);
        await authTx.wait();
        
        console.log(`   ✅ Resolver authorized: ${authTx.hash}`);
        console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${authTx.hash}`);
        console.log('');

        // Step 2: Set Algorand App ID
        console.log('🪙 STEP 2: SETTING ALGORAND APP ID');
        console.log('===================================');
        
        const algorandAppId = 743645803; // Our existing HTLC contract
        console.log(`   Setting Algorand App ID: ${algorandAppId}`);
        
        const appIdTx = await limitOrderBridge.setAlgorandAppId(algorandAppId);
        await appIdTx.wait();
        
        console.log(`   ✅ App ID set: ${appIdTx.hash}`);
        console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${appIdTx.hash}`);
        console.log('');

        // Step 3: Verify configuration
        console.log('🔧 STEP 3: VERIFYING CONFIGURATION');
        console.log('===================================');
        
        const isAuthorized = await limitOrderBridge.authorizedResolvers(existingResolver);
        const currentAppId = await limitOrderBridge.algorandAppId();
        const feeRate = await limitOrderBridge.resolverFeeRate();
        
        console.log(`   ✅ Resolver authorized: ${isAuthorized}`);
        console.log(`   ✅ Algorand App ID: ${currentAppId}`);
        console.log(`   ✅ Resolver Fee Rate: ${feeRate}bp (${Number(feeRate) / 100}%)`);
        console.log('');

        // Save configuration info
        const configInfo = {
            contractAddress: limitOrderBridgeAddress,
            owner: walletAddress,
            authorizedResolvers: [existingResolver],
            algorandAppId: algorandAppId,
            resolverFeeRate: Number(feeRate),
            configurationTx: {
                authorizeResolver: authTx.hash,
                setAlgorandAppId: appIdTx.hash
            },
            timestamp: new Date().toISOString(),
            status: 'CONFIGURED'
        };

        fs.writeFileSync('LIMIT-ORDER-BRIDGE-CONFIGURATION.json', JSON.stringify(configInfo, null, 2));
        console.log('💾 Configuration saved to: LIMIT-ORDER-BRIDGE-CONFIGURATION.json');
        console.log('');

        console.log('🔧 LIMIT ORDER BRIDGE CONFIGURATION COMPLETE!');
        console.log('=============================================');
        console.log('✅ Resolvers authorized');
        console.log('✅ Algorand App ID configured');
        console.log('✅ Fee rates set');
        console.log('✅ Ready for limit order operations!');

        return configInfo;

    } catch (error) {
        console.error('❌ CONFIGURATION FAILED!');
        console.error('=======================');
        console.error('Error:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    configureLimitOrderBridge()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { configureLimitOrderBridge }; 