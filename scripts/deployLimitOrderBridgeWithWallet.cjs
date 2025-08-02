#!/usr/bin/env node

/**
 * 🚀 LIMIT ORDER BRIDGE DEPLOYMENT SCRIPT
 * 
 * Deploys LimitOrderBridge.sol to Sepolia testnet
 * This contract enables gasless cross-chain limit orders following 1inch Fusion+ patterns
 */

const { ethers } = require('hardhat');
const fs = require('fs');

async function deployLimitOrderBridgeWithWallet() {
    console.log('🚀 DEPLOYING LIMIT ORDER BRIDGE CONTRACT');
    console.log('=======================================');
    console.log('✅ Target Network: Sepolia Testnet');
    console.log('✅ Contract: LimitOrderBridge.sol');
    console.log('✅ Features: submitLimitOrder(), fillLimitOrder(), EIP-712 intents');
    console.log('=======================================\n');

    try {
        // Get deployer account from hardhat
        const [deployer] = await ethers.getSigners();
        const walletAddress = await deployer.getAddress();
        
        const balance = await ethers.provider.getBalance(walletAddress);

        console.log('📋 DEPLOYMENT DETAILS:');
        console.log(`   Deployer: ${walletAddress}`);
        console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
        console.log('');

        // Check minimum balance
        const minBalance = ethers.parseEther('0.05');
        if (balance < minBalance) {
            console.log('❌ INSUFFICIENT BALANCE!');
            console.log(`   Required: 0.05 ETH minimum`);
            console.log(`   Current: ${ethers.formatEther(balance)} ETH`);
            console.log('   Please fund your account and try again.');
            console.log(`   🔗 Fund at: https://sepoliafaucet.com/`);
            console.log(`   📱 Address to fund: ${walletAddress}`);
            return;
        }

        // Get contract factory
        console.log('🔧 COMPILING CONTRACT...');
        const LimitOrderBridge = await ethers.getContractFactory('LimitOrderBridge');

        // Use much higher gas limit for complex contract
        console.log('⛽ SETTING GAS PARAMETERS...');
        const gasPrice = (await ethers.provider.getFeeData()).gasPrice;
        const gasLimit = 2000000n; // Use 2M gas limit for complex contract
        const estimatedCost = gasLimit * gasPrice;

        console.log(`   Gas Limit: ${gasLimit.toString()} (high limit for complex contract)`);
        console.log(`   Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
        console.log(`   Estimated Cost: ${ethers.formatEther(estimatedCost)} ETH`);
        console.log('');

        // Deploy contract with high gas limit
        console.log('🚀 DEPLOYING CONTRACT...');
        const limitOrderBridge = await LimitOrderBridge.deploy({
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });

        console.log('⏳ WAITING FOR DEPLOYMENT...');
        await limitOrderBridge.waitForDeployment();

        const contractAddress = await limitOrderBridge.getAddress();
        const deploymentTx = limitOrderBridge.deploymentTransaction();

        console.log('');
        console.log('✅ DEPLOYMENT SUCCESSFUL!');
        console.log('=========================');
        console.log(`📍 Contract Address: ${contractAddress}`);
        console.log(`📄 Transaction Hash: ${deploymentTx.hash}`);
        console.log(`⛽ Gas Used: ${deploymentTx.gasLimit?.toString() || 'Pending'}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
        console.log('');

        // Save deployment info
        const deploymentInfo = {
            contractName: 'LimitOrderBridge',
            contractAddress: contractAddress,
            deployerAddress: walletAddress,
            network: 'sepolia',
            chainId: 11155111,
            transactionHash: deploymentTx.hash,
            gasLimit: deploymentTx.gasLimit?.toString(),
            gasPrice: deploymentTx.gasPrice?.toString(),
            blockNumber: deploymentTx.blockNumber,
            timestamp: new Date().toISOString(),
            etherscanUrl: `https://sepolia.etherscan.io/address/${contractAddress}`,
            features: [
                'submitLimitOrder() - Intent-based order submission',
                'fillLimitOrder() - Resolver execution',
                'EIP-712 signature verification',
                'Cross-chain HTLC coordination',
                'Gasless user experience'
            ]
        };

        fs.writeFileSync('LIMIT-ORDER-BRIDGE-DEPLOYMENT.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('💾 Deployment info saved to: LIMIT-ORDER-BRIDGE-DEPLOYMENT.json');
        console.log('');

        // Test basic contract functions
        console.log('🧪 TESTING CONTRACT FUNCTIONS...');
        
        try {
            // Test owner
            const owner = await limitOrderBridge.owner();
            console.log(`   ✅ Owner: ${owner}`);

            // Test resolver fee rate
            const feeRate = await limitOrderBridge.resolverFeeRate();
            console.log(`   ✅ Resolver Fee Rate: ${feeRate}bp (${Number(feeRate) / 100}%)`);

            // Test minimum order value
            const minOrder = await limitOrderBridge.MIN_ORDER_VALUE();
            console.log(`   ✅ Min Order Value: ${ethers.formatEther(minOrder)} ETH`);

            // Test default timelock
            const defaultTimelock = await limitOrderBridge.DEFAULT_TIMELOCK();
            console.log(`   ✅ Default Timelock: ${Number(defaultTimelock) / 3600} hours`);

        } catch (error) {
            console.log('   ⚠️ Contract testing failed:', error.message);
        }

        console.log('');
        console.log('🎯 NEXT STEPS:');
        console.log('==============');
        console.log('1. 🔧 Authorize resolvers:');
        console.log(`   limitOrderBridge.authorizeResolver(resolverAddress, true)`);
        console.log('');
        console.log('2. 🪙 Set Algorand App ID:');
        console.log(`   limitOrderBridge.setAlgorandAppId(743645803)`);
        console.log('');
        console.log('3. 🧪 Test limit order workflow:');
        console.log('   node scripts/testLimitOrderFlow.cjs');
        console.log('');
        console.log('🚀 LIMIT ORDER BRIDGE IS NOW DEPLOYED AND READY!');
        console.log('💡 Users can now submit gasless limit orders for cross-chain swaps!');

        return {
            contractAddress,
            deploymentTx: deploymentTx.hash,
            deploymentInfo
        };

    } catch (error) {
        console.error('❌ DEPLOYMENT FAILED!');
        console.error('===================');
        console.error('Error:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.error('💰 Solution: Add more ETH to your account');
        } else if (error.message.includes('gas')) {
            console.error('⛽ Solution: Try again with higher gas settings');
        } else if (error.message.includes('nonce')) {
            console.error('🔄 Solution: Wait and try again (nonce conflict)');
        }
        
        throw error;
    }
}

// Export for use in other modules
module.exports = { deployLimitOrderBridgeWithWallet };

// Run if called directly
if (require.main === module) {
    deployLimitOrderBridgeWithWallet()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
} 