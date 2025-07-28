const { ethers } = require('ethers');
require('dotenv').config();

async function simpleFunctionTest() {
  console.log('🧪 Simple Function Test');
  console.log('=' .repeat(30));
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
  const resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
  
  console.log('📋 Contract Info:');
  console.log(`   Address: ${resolverAddress}`);
  console.log(`   ABI functions: ${resolverArtifact.abi.filter(f => f.type === 'function').length}`);
  
  // Check if executeIntent function exists
  const executeIntentFunction = resolverArtifact.abi.find(f => f.name === 'executeIntent');
  if (executeIntentFunction) {
    console.log('✅ executeIntent function found in ABI');
    console.log(`   Inputs: ${executeIntentFunction.inputs.map(i => i.type).join(', ')}`);
    console.log(`   StateMutability: ${executeIntentFunction.stateMutability}`);
  } else {
    console.log('❌ executeIntent function NOT found in ABI');
    return;
  }
  
  // Create contract instance
  const resolver = new ethers.Contract(resolverAddress, resolverArtifact.abi, wallet);
  
  // Test function encoding
  const testSwapId = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const testAmount = ethers.parseEther('0.001');
  
  try {
    console.log('\n🔧 Testing function encoding...');
    
    // Test gas estimation
    const gasEstimate = await resolver.executeIntent.estimateGas(testSwapId, {
      value: testAmount
    });
    console.log(`✅ Gas estimation works: ${gasEstimate} gas`);
    
    // Test function encoding
    const iface = new ethers.Interface(resolverArtifact.abi);
    const encodedData = iface.encodeFunctionData('executeIntent', [testSwapId]);
    console.log(`✅ Function encoding works: ${encodedData.slice(0, 20)}...`);
    
    // Test with a real swap ID that exists
    const realSwapId = '0x442297a6eca94d912a729674c977437ee5c48c0d7922ceb077ff57b16d950abf';
    
    // Check if intent exists
    const intent = await resolver.getIntent(realSwapId);
    console.log(`\n📋 Intent Status:`);
    console.log(`   User: ${intent.user}`);
    console.log(`   Amount: ${ethers.formatEther(intent.amount)} ETH`);
    console.log(`   Executed: ${intent.executed}`);
    console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
    
    if (!intent.executed) {
      console.log('\n🚀 Testing execution with real intent...');
      
      const realGasEstimate = await resolver.executeIntent.estimateGas(realSwapId, {
        value: intent.amount
      });
      console.log(`✅ Real gas estimate: ${realGasEstimate} gas`);
      
      const gasLimit = Math.floor(Number(realGasEstimate) * 1.2);
      console.log(`⛽ Using gas limit: ${gasLimit}`);
      
      const tx = await resolver.executeIntent(realSwapId, {
        value: intent.amount,
        gasLimit: gasLimit
      });
      
      console.log(`📝 Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      
      if (receipt.status === 1) {
        const updatedIntent = await resolver.getIntent(realSwapId);
        console.log(`🏠 Escrow created: ${updatedIntent.escrowAddress}`);
        console.log('🎉 SUCCESS! Intent executed successfully!');
      }
    } else {
      console.log('⚠️ Intent already executed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.data) {
      console.log(`   Error data: ${error.data}`);
    }
    
    if (error.receipt) {
      console.log(`   Receipt status: ${error.receipt.status}`);
      console.log(`   Gas used: ${error.receipt.gasUsed}`);
    }
  }
}

simpleFunctionTest().catch(console.error); 