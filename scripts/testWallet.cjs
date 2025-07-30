const { ethers } = require('ethers');
require('dotenv').config();

async function testWallet() {
  console.log('🔍 Testing Wallet Connection...');
  console.log('=' .repeat(40));
  
  try {
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`   SEPOLIA_RPC_URL: ${process.env.SEPOLIA_RPC_URL ? process.env.SEPOLIA_RPC_URL.substring(0, 30) + '...' : 'NOT SET'}`);
    console.log('');
    
    // Test provider
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
    console.log(`🌐 Testing RPC: ${rpcUrl.substring(0, 30)}...`);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    console.log(`   ✅ Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Test wallet
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }
    
    console.log(`🔑 Testing Private Key: ${process.env.PRIVATE_KEY.substring(0, 10)}...`);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`   ✅ Wallet Address: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const ethBalance = ethers.formatEther(balance);
    console.log(`   💰 Balance: ${ethBalance} ETH`);
    
    console.log('');
    console.log('✅ Wallet test successful!');
    console.log('🚀 Ready for real swap execution');
    
  } catch (error) {
    console.error('❌ Wallet test failed:', error.message);
    console.error('   Error details:', error.stack);
  }
}

testWallet(); 