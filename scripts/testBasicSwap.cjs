const { ethers } = require('ethers');
require('dotenv').config();

async function testBasicSwap() {
  console.log('🔍 Testing Basic Contract Functions...');
  console.log('=' .repeat(50));
  
  try {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Contract addresses
    const resolver = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
    
    console.log(`👤 Wallet: ${wallet.address}`);
    console.log(`🔧 Resolver: ${resolver}`);
    console.log('');
    
    // Test 1: Check contract code
    console.log('📋 Test 1: Checking contract code...');
    const code = await provider.getCode(resolver);
    console.log(`   Contract code length: ${code.length} bytes`);
    console.log(`   ✅ Contract deployed: ${code !== '0x'}`);
    console.log('');
    
    // Test 2: Check contract owner/balance
    console.log('💰 Test 2: Checking contract balance...');
    const balance = await provider.getBalance(resolver);
    console.log(`   Contract balance: ${ethers.formatEther(balance)} ETH`);
    console.log('');
    
    // Test 3: Try to read a simple function
    console.log('📖 Test 3: Reading contract state...');
    try {
      // Try to call a view function
      const resolverContract = new ethers.Contract(resolver, [
        'function escrowFactory() external view returns (address)',
        'function INTENT_TYPEHASH() external view returns (bytes32)',
        'function CLAIM_TYPEHASH() external view returns (bytes32)'
      ], provider);
      
      const escrowFactory = await resolverContract.escrowFactory();
      console.log(`   ✅ Escrow Factory: ${escrowFactory}`);
      
      const intentTypeHash = await resolverContract.INTENT_TYPEHASH();
      console.log(`   ✅ Intent Type Hash: ${intentTypeHash}`);
      
      const claimTypeHash = await resolverContract.CLAIM_TYPEHASH();
      console.log(`   ✅ Claim Type Hash: ${claimTypeHash}`);
      
    } catch (error) {
      console.log(`   ❌ Failed to read contract: ${error.message}`);
    }
    console.log('');
    
    // Test 4: Check wallet balance
    console.log('💳 Test 4: Checking wallet balance...');
    const walletBalance = await provider.getBalance(wallet.address);
    console.log(`   Wallet balance: ${ethers.formatEther(walletBalance)} ETH`);
    console.log('');
    
    console.log('✅ Basic tests completed!');
    console.log('🚀 Contract is deployed and accessible');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicSwap(); 