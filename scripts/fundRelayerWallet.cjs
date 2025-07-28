const { ethers } = require('ethers');
require('dotenv').config();

/**
 * 🚀 Fund Relayer Wallet Script
 * 
 * This script helps you fund the relayer wallet with test ETH.
 * You need to have some test ETH in your main wallet first.
 */
async function fundRelayerWallet() {
  console.log('🚀 Fund Relayer Wallet');
  console.log('=' .repeat(40));
  
  if (!process.env.PRIVATE_KEY) {
    console.log('❌ Error: PRIVATE_KEY not found in .env file');
    console.log('📋 Add your main wallet private key to .env:');
    console.log('PRIVATE_KEY=0xYOUR_MAIN_WALLET_PRIVATE_KEY');
    return;
  }
  
  if (!process.env.RELAYER_PRIVATE_KEY) {
    console.log('❌ Error: RELAYER_PRIVATE_KEY not found in .env file');
    console.log('📋 Run: npm run generate-wallet');
    return;
  }
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
  
  console.log('📍 Main Wallet Address:', mainWallet.address);
  console.log('📍 Relayer Wallet Address:', relayerWallet.address);
  console.log('');
  
  // Check balances
  const mainBalance = await provider.getBalance(mainWallet.address);
  const relayerBalance = await provider.getBalance(relayerWallet.address);
  
  console.log('💰 Balances:');
  console.log(`   Main Wallet: ${ethers.formatEther(mainBalance)} ETH`);
  console.log(`   Relayer Wallet: ${ethers.formatEther(relayerBalance)} ETH`);
  console.log('');
  
  if (mainBalance === 0n) {
    console.log('❌ Main wallet has no ETH');
    console.log('🔗 Get test ETH from:');
    console.log('   https://sepoliafaucet.com/');
    console.log('   https://faucet.sepolia.dev/');
    return;
  }
  
  if (relayerBalance > ethers.parseEther('0.01')) {
    console.log('✅ Relayer wallet already has sufficient funds');
    return;
  }
  
  // Calculate amount to send (0.01 ETH)
  const amountToSend = ethers.parseEther('0.01');
  
  if (mainBalance < amountToSend) {
    console.log('❌ Main wallet has insufficient funds');
    console.log(`   Need: ${ethers.formatEther(amountToSend)} ETH`);
    console.log(`   Have: ${ethers.formatEther(mainBalance)} ETH`);
    return;
  }
  
  console.log(`💸 Sending ${ethers.formatEther(amountToSend)} ETH to relayer wallet...`);
  
  try {
    const tx = await mainWallet.sendTransaction({
      to: relayerWallet.address,
      value: amountToSend,
      gasLimit: 21000
    });
    
    console.log('📝 Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Check new balances
    const newRelayerBalance = await provider.getBalance(relayerWallet.address);
    console.log('💰 New Relayer Balance:', ethers.formatEther(newRelayerBalance), 'ETH');
    
  } catch (error) {
    console.error('❌ Failed to send transaction:', error.message);
  }
}

// Run the script
if (require.main === module) {
  fundRelayerWallet().catch(console.error);
}

module.exports = { fundRelayerWallet }; 