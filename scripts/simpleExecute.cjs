const { ethers } = require('ethers');
require('dotenv').config();

async function simpleExecute() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
  const resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
  const resolver = new ethers.Contract(resolverAddress, resolverArtifact.abi, wallet);
  
  const swapId = '0x3f4ac6275c15850b338c86f3c6af2bc7804a7ae395b896995255fe8a13937de5';
  const amount = ethers.parseEther('0.001');
  
  console.log('🚀 Simple Intent Execution');
  console.log('=' .repeat(40));
  console.log(`Swap ID: ${swapId}`);
  console.log(`Amount: ${ethers.formatEther(amount)} ETH`);
  
  try {
    // Get intent details first
    const intent = await resolver.getIntent(swapId);
    console.log(`Intent executed: ${intent.executed}`);
    console.log(`Intent amount: ${ethers.formatEther(intent.amount)} ETH`);
    
    if (intent.executed) {
      console.log('✅ Intent already executed');
      return;
    }
    
    // Execute intent with minimal parameters
    console.log('💸 Executing intent...');
    const tx = await resolver.executeIntent(swapId, {
      value: amount,
      gasLimit: 500000
    });
    
    console.log(`📝 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Check result
    const updatedIntent = await resolver.getIntent(swapId);
    console.log(`✅ Intent executed: ${updatedIntent.executed}`);
    console.log(`🏠 Escrow created: ${updatedIntent.escrowAddress}`);
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    
    // Try to get more details about the error
    if (error.receipt) {
      console.log('📋 Transaction receipt:');
      console.log(`   Status: ${error.receipt.status}`);
      console.log(`   Gas used: ${error.receipt.gasUsed}`);
      console.log(`   Block: ${error.receipt.blockNumber}`);
    }
  }
}

simpleExecute().catch(console.error); 