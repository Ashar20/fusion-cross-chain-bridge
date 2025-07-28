const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('💰 Checking Resolver Balance...');
  
  const resolverAddress = '0x5574FE78CF4B787BF5FBD6f333C444f69baFAAA8';
  
  try {
    // Create a provider
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    
    // Get the balance
    const balance = await provider.getBalance(resolverAddress);
    const balanceEth = ethers.formatEther(balance);
    
    console.log('📊 Resolver Balance:');
    console.log('Address:', resolverAddress);
    console.log('Balance:', balanceEth, 'ETH');
    console.log('Balance (Wei):', balance.toString());
    console.log('Status:', balance > BigInt(0) ? '✅ Funded' : '❌ Not Funded');
    
    if (balance === BigInt(0)) {
      console.log('\n💡 To fund the resolver:');
      console.log('1. Send ETH to:', resolverAddress);
      console.log('2. Recommended amount: 0.1 ETH (for multiple gasless transactions)');
      console.log('3. You can send from any wallet (MetaMask, etc.)');
      console.log('4. Network: Sepolia Testnet');
      console.log('\n🔗 Sepolia Faucet: https://sepoliafaucet.com/');
      console.log('🔗 Alchemy Faucet: https://sepoliafaucet.com/');
    } else {
      console.log('\n✅ Resolver is funded and ready for gasless transactions!');
      console.log('Estimated transactions possible:', Math.floor(parseFloat(balanceEth) / 0.003), '(assuming ~0.003 ETH per transaction)');
    }
    
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 