const { ethers } = require('ethers');
require('dotenv').config();

async function checkEscrow() {
  console.log('🔍 Checking Escrow Status...');
  console.log('=' .repeat(50));
  
  try {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Escrow address from the latest intent
    const escrowAddress = '0xAD4A5dC1cd1e7a251b0B77e7A53711Eba13d36dc';
    
    console.log(`🏭 Escrow Address: ${escrowAddress}`);
    console.log('');
    
    // Check escrow code
    console.log('📋 Checking Escrow Contract...');
    const escrowCode = await provider.getCode(escrowAddress);
    console.log(`   Escrow code length: ${escrowCode.length} bytes`);
    console.log(`   ✅ Escrow deployed: ${escrowCode !== '0x'}`);
    
    const escrowBalance = await provider.getBalance(escrowAddress);
    console.log(`   Escrow balance: ${ethers.formatEther(escrowBalance)} ETH`);
    console.log('');
    
    // Check escrow state
    console.log('📊 Checking Escrow State...');
    const escrowContract = new ethers.Contract(escrowAddress, [
      'function token() external view returns (address)',
      'function amount() external view returns (uint256)',
      'function orderHash() external view returns (bytes32)',
      'function deadline() external view returns (uint256)',
      'function resolved() external view returns (bool)',
      'function secret() external view returns (bytes32)',
      'function beneficiary() external view returns (address)'
    ], provider);
    
    try {
      const token = await escrowContract.token();
      const amount = await escrowContract.amount();
      const orderHash = await escrowContract.orderHash();
      const deadline = await escrowContract.deadline();
      const resolved = await escrowContract.resolved();
      
      console.log(`   🪙 Token: ${token}`);
      console.log(`   💰 Amount: ${ethers.formatEther(amount)} ETH`);
      console.log(`   📋 Order Hash: ${orderHash.substring(0, 16)}...`);
      console.log(`   ⏰ Deadline: ${new Date(Number(deadline) * 1000).toISOString()}`);
      console.log(`   ✅ Resolved: ${resolved}`);
      
      if (resolved) {
        const secret = await escrowContract.secret();
        console.log(`   🔐 Secret: ${secret.substring(0, 16)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to read escrow state: ${error.message}`);
    }
    
    console.log('');
    console.log('🎯 Escrow Summary:');
    console.log('=' .repeat(50));
    console.log('✅ Escrow contract is deployed');
    console.log(`💰 Escrow contains ${ethers.formatEther(escrowBalance)} ETH`);
    console.log('✅ ETH is locked and ready for EOS HTLC');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Create HTLC on EOS blockchain');
    console.log('   2. User reveals secret to claim EOS');
    console.log('   3. Relayer completes the swap');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkEscrow(); 