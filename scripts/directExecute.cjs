const { ethers } = require('ethers');
require('dotenv').config();

async function directExecute() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
  const resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
  
  const swapId = '0x3f4ac6275c15850b338c86f3c6af2bc7804a7ae395b896995255fe8a13937de5';
  const amount = ethers.parseEther('0.001');
  
  console.log('🚀 Direct Intent Execution');
  console.log('=' .repeat(40));
  console.log(`Swap ID: ${swapId}`);
  console.log(`Amount: ${ethers.formatEther(amount)} ETH`);
  
  try {
    // Encode the function call
    const iface = new ethers.Interface(resolverArtifact.abi);
    const data = iface.encodeFunctionData('executeIntent', [swapId]);
    console.log(`📋 Encoded data: ${data}`);
    
    // Send transaction directly
    const tx = await wallet.sendTransaction({
      to: resolverAddress,
      data: data,
      value: amount,
      gasLimit: 500000
    });
    
    console.log(`📝 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`📋 Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
    
    if (receipt.status === 1) {
      console.log('🎉 Intent executed successfully!');
      
      // Check the result
      const resolver = new ethers.Contract(resolverAddress, resolverArtifact.abi, wallet);
      const intent = await resolver.getIntent(swapId);
      console.log(`✅ Intent executed: ${intent.executed}`);
      console.log(`🏠 Escrow created: ${intent.escrowAddress}`);
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    
    if (error.receipt) {
      console.log('📋 Transaction receipt:');
      console.log(`   Status: ${error.receipt.status}`);
      console.log(`   Gas used: ${error.receipt.gasUsed}`);
      console.log(`   Block: ${error.receipt.blockNumber}`);
    }
  }
}

directExecute().catch(console.error); 