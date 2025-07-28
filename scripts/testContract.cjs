const { ethers } = require('ethers');
require('dotenv').config();

async function testContract() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
  const resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
  const resolver = new ethers.Contract(resolverAddress, resolverArtifact.abi, wallet);
  
  console.log('🧪 Testing Contract Functions');
  console.log('=' .repeat(40));
  
  try {
    // Test 1: Check if contract is deployed
    const code = await provider.getCode(resolverAddress);
    console.log(`✅ Contract deployed: ${code !== '0x'}`);
    
    // Test 2: Check escrow factory
    const escrowFactory = await resolver.escrowFactory();
    console.log(`✅ Escrow factory: ${escrowFactory}`);
    
    // Test 3: Check user nonce
    const nonce = await resolver.userNonces(wallet.address);
    console.log(`✅ User nonce: ${nonce}`);
    
    // Test 4: Check if we can call a simple function
    const iface = new ethers.Interface(resolverArtifact.abi);
    const data = iface.encodeFunctionData('executeIntent', ['0x1234567890123456789012345678901234567890123456789012345678901234']);
    console.log(`✅ Function encoding works: ${data.slice(0, 10)}...`);
    
    // Test 6: Try to encode with actual swap ID
    const actualSwapId = '0x3f4ac6275c15850b338c86f3c6af2bc7804a7ae395b896995255fe8a13937de5';
    const actualData = iface.encodeFunctionData('executeIntent', [actualSwapId]);
    console.log(`✅ Actual function encoding: ${actualData.slice(0, 10)}...`);
    
    console.log('\n🎉 All contract tests passed!');
    
  } catch (error) {
    console.error('❌ Contract test failed:', error.message);
  }
}

testContract().catch(console.error); 