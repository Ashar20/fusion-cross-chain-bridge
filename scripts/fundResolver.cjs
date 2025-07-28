const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('💰 Resolver Funding Instructions');
  console.log('================================');
  
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
  
  console.log('\n📋 Resolver Details:');
  console.log('Address:', resolverAddress);
  console.log('Network: Sepolia Testnet');
  console.log('Purpose: Pay gas fees for gasless transactions');
  
  console.log('\n💡 How to Fund the Resolver:');
  console.log('1. Open your MetaMask wallet');
  console.log('2. Switch to Sepolia Testnet');
  console.log('3. Click "Send" or "Transfer"');
  console.log('4. Enter the resolver address:', resolverAddress);
  console.log('5. Send 0.1 ETH (recommended amount)');
  console.log('6. Confirm the transaction');
  
  console.log('\n🔗 Get Sepolia ETH (Free):');
  console.log('• Sepolia Faucet: https://sepoliafaucet.com/');
  console.log('• Alchemy Faucet: https://sepoliafaucet.com/');
  console.log('• Infura Faucet: https://www.infura.io/faucet/sepolia');
  
  console.log('\n📊 Recommended Funding Amounts:');
  console.log('• 0.01 ETH: ~3 gasless transactions');
  console.log('• 0.05 ETH: ~16 gasless transactions');
  console.log('• 0.1 ETH: ~33 gasless transactions (recommended)');
  console.log('• 0.5 ETH: ~166 gasless transactions');
  
  console.log('\n⚠️ Important Notes:');
  console.log('• Only send to this address on Sepolia Testnet');
  console.log('• Never send real ETH (mainnet) to this address');
  console.log('• The resolver will automatically pay gas fees for your transactions');
  console.log('• You only need to fund it once (unless you run out)');
  
  console.log('\n✅ After Funding:');
  console.log('• The UI will show "✅ Funded" status');
  console.log('• You can create gasless intents');
  console.log('• The resolver will pay gas fees automatically');
  
  // Try to check current balance if possible
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const balance = await provider.getBalance(resolverAddress);
    const balanceEth = ethers.formatEther(balance);
    
    console.log('\n📊 Current Balance:');
    console.log('Balance:', balanceEth, 'ETH');
    console.log('Status:', balance > BigInt(0) ? '✅ Funded' : '❌ Not Funded');
    
    if (balance > BigInt(0)) {
      console.log('🎉 Resolver is funded! You can now use gasless transactions.');
    } else {
      console.log('💸 Please fund the resolver using the instructions above.');
    }
  } catch (error) {
    console.log('\n❌ Could not check current balance (RPC issue)');
    console.log('Please check the balance manually or proceed with funding.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 