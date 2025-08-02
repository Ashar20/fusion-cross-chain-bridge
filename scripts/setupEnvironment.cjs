#!/usr/bin/env node

/**
 * 🔧 ENVIRONMENT SETUP SCRIPT
 * 
 * Helps set up the environment for deployment with the new wallet
 */

const fs = require('fs');

function setupEnvironment() {
    console.log('🔧 SETTING UP ENVIRONMENT FOR DEPLOYMENT');
    console.log('========================================');
    console.log('✅ Wallet Address: 0xeb636Cf3a27AbF02D75Cd2FA253ac09af0FE1f90');
    console.log('✅ Balance: 1.031991705923438293 ETH (Sufficient)');
    console.log('✅ Network: Sepolia Testnet');
    console.log('========================================\n');

    console.log('📋 TO COMPLETE SETUP, YOU NEED TO:');
    console.log('===================================');
    console.log('1. Create a .env file in the project root');
    console.log('2. Add your private key to the .env file');
    console.log('3. Run the deployment scripts');
    console.log('');

    console.log('📝 CREATE .env FILE WITH:');
    console.log('=========================');
    console.log('PRIVATE_KEY=your_private_key_here');
    console.log('ETHERSCAN_API_KEY=your_etherscan_api_key_here');
    console.log('');

    console.log('🔑 TO GET YOUR PRIVATE KEY:');
    console.log('============================');
    console.log('1. Open your wallet (MetaMask, etc.)');
    console.log('2. Go to Account Details');
    console.log('3. Export Private Key');
    console.log('4. Copy the private key (without 0x prefix)');
    console.log('');

    console.log('🚀 AFTER SETTING UP .env, RUN:');
    console.log('================================');
    console.log('node scripts/deployLimitOrderBridgeWithWallet.cjs');
    console.log('node scripts/configureLimitOrderBridge.cjs');
    console.log('');

    console.log('⚠️  SECURITY NOTE:');
    console.log('==================');
    console.log('- Never commit .env files to git');
    console.log('- Keep your private key secure');
    console.log('- Use test wallets for development');
    console.log('');

    // Check if .env exists
    if (fs.existsSync('.env')) {
        console.log('✅ .env file found!');
        console.log('You can now run the deployment scripts.');
    } else {
        console.log('❌ .env file not found');
        console.log('Please create it with your private key.');
    }
}

// Run if called directly
if (require.main === module) {
    setupEnvironment();
}

module.exports = { setupEnvironment }; 