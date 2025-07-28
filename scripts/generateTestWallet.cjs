const { ethers } = require('ethers');

/**
 * 🚀 Generate Test Wallet Script
 * 
 * This script generates a new test wallet with private key for the relayer.
 * Use this for testing purposes only.
 */
function generateTestWallet() {
  console.log('🚀 Generating Test Wallet for Relayer');
  console.log('=' .repeat(50));
  
  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✅ New Test Wallet Generated:');
  console.log('');
  console.log('🔑 Private Key:');
  console.log(wallet.privateKey);
  console.log('');
  console.log('📍 Address:');
  console.log(wallet.address);
  console.log('');
  console.log('📋 Add to your .env file:');
  console.log(`RELAYER_PRIVATE_KEY=${wallet.privateKey}`);
  console.log('');
  console.log('⚠️  IMPORTANT:');
  console.log('- This is a TEST wallet only');
  console.log('- Do NOT use for mainnet');
  console.log('- Fund this address with test ETH for relayer operations');
  console.log('');
  console.log('💰 To fund this wallet:');
  console.log('1. Copy the address above');
  console.log('2. Send some test ETH from your main wallet');
  console.log('3. Use a Sepolia faucet if needed');
  console.log('');
  console.log('🔗 Sepolia Faucets:');
  console.log('- https://sepoliafaucet.com/');
  console.log('- https://faucet.sepolia.dev/');
  console.log('- https://sepolia-faucet.pk910.de/');
}

// Run the script
if (require.main === module) {
  generateTestWallet();
}

module.exports = { generateTestWallet }; 