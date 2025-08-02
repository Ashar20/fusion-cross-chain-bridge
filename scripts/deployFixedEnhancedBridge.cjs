#!/usr/bin/env node

/**
 * 🚀 DEPLOY FIXED ENHANCED1INCHSTYLEBRIDGE
 * With complete bidding mechanism for auction resolution
 */

const { ethers } = require('hardhat');
const fs = require('fs');

async function deployFixedBridge() {
    console.log('🚀 DEPLOYING FIXED ENHANCED1INCHSTYLEBRIDGE');
    console.log('============================================');
    
    require('dotenv').config();
    
    const [deployer] = await ethers.getSigners();
    console.log('Deployer:', deployer.address);
    
    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Deployer balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.01')) {
        throw new Error('Insufficient balance for deployment');
    }
    
    // Deploy the contract
    console.log('\n📦 Deploying Enhanced1inchStyleBridge contract...');
    const Enhanced1inchStyleBridge = await ethers.getContractFactory('Enhanced1inchStyleBridge');
    const bridge = await Enhanced1inchStyleBridge.deploy();
    await bridge.waitForDeployment();
    
    const contractAddress = await bridge.getAddress();
    console.log('✅ Contract deployed at:', contractAddress);
    
    // Wait for confirmations
    console.log('⏳ Waiting for block confirmations...');
    const deployTx = bridge.deploymentTransaction();
    const receipt = await deployTx.wait(2);
    
    console.log('✅ Contract confirmed in block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Gas price:', ethers.formatUnits(receipt.gasPrice, 'gwei'), 'gwei');
    
    // Verify contract features
    console.log('\n🔧 Verifying contract features...');
    
    // Check constants
    const defaultDuration = await bridge.DEFAULT_AUCTION_DURATION();
    const initialGasPrice = await bridge.INITIAL_GAS_PRICE();
    const minGasPrice = await bridge.MIN_GAS_PRICE();
    
    console.log('Default auction duration:', defaultDuration.toString(), 'seconds');
    console.log('Initial gas price:', ethers.formatUnits(initialGasPrice, 'gwei'), 'gwei');
    console.log('Min gas price:', ethers.formatUnits(minGasPrice, 'gwei'), 'gwei');
    
    // Save deployment info
    const deploymentInfo = {
        contractAddress: contractAddress,
        deploymentTxHash: deployTx.hash,
        network: 'sepolia',
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
        features: [
            'Complete bidding mechanism',
            'Auction-based resolver selection',
            '1inch-style price decay',
            'Cross-chain HTLC support',
            'Gasless user experience',
            'Atomic swap guarantees'
        ],
        functions: [
            'createFusionHTLC',
            'startSimpleAuction', 
            'placeBid',
            'executeFusionHTLCWithInteraction',
            'getCurrentAuctionPrice',
            'setResolverAuthorization'
        ]
    };
    
    fs.writeFileSync(
        'fixed-enhanced-bridge-deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('✅ Fixed Enhanced1inchStyleBridge deployed');
    console.log('✅ Complete bidding mechanism included');
    console.log('✅ Ready for atomic swaps');
    console.log('✅ Deployment info saved to fixed-enhanced-bridge-deployment.json');
    
    return {
        contractAddress: contractAddress,
        deploymentTx: deployTx.hash,
        deployer: deployer.address
    };
}

// Execute deployment
deployFixedBridge().then(result => {
    console.log('\n🌟 READY FOR ATOMIC SWAP!');
    console.log('==========================');
    console.log('Contract:', result.contractAddress);
    console.log('Use this address for atomic swaps');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ DEPLOYMENT FAILED');
    console.error('====================');
    console.error('Error:', error.message);
    process.exit(1);
}); 
 
 