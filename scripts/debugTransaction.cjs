const { ethers } = require('ethers');
require('dotenv').config();

async function debugTransaction() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
  const resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
  const resolver = new ethers.Contract(resolverAddress, resolverArtifact.abi, wallet);
  
  const swapId = '0xfc8bf7244527dc7e60819f6af9bbf4c68305992194e8f659694502d4b3f8e6af';
  const amount = ethers.parseEther('0.001');
  
  console.log('🔍 Debugging Transaction');
  console.log('=' .repeat(40));
  console.log(`Swap ID: ${swapId}`);
  console.log(`Amount: ${ethers.formatEther(amount)} ETH`);
  console.log(`Amount (wei): ${amount}`);
  
  // Get intent details
  const intent = await resolver.getIntent(swapId);
  console.log(`Intent Amount: ${intent.amount}`);
  console.log(`Intent Amount (wei): ${intent.amount}`);
  console.log(`Amounts match: ${amount === intent.amount}`);
  
  // Check if intent exists and is not executed
  console.log(`Intent exists: ${intent.user !== '0x0000000000000000000000000000000000000000'}`);
  console.log(`Intent executed: ${intent.executed}`);
  console.log(`Intent deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
  console.log(`Current time: ${new Date().toISOString()}`);
  console.log(`Deadline passed: ${Number(intent.deadline) < Math.floor(Date.now() / 1000)}`);
  
  // Try to estimate gas
  try {
    const gasEstimate = await resolver.executeIntent.estimateGas(swapId, {
      value: amount
    });
    console.log(`Gas estimate: ${gasEstimate}`);
  } catch (error) {
    console.log(`Gas estimation failed: ${error.message}`);
  }
  
  // Check resolver balance
  const balance = await provider.getBalance(resolverAddress);
  console.log(`Resolver balance: ${ethers.formatEther(balance)} ETH`);
  
  // Check escrow factory
  const escrowFactoryAddress = await resolver.escrowFactory();
  console.log(`Escrow Factory: ${escrowFactoryAddress}`);
  
  // Check if escrow factory is valid
  const code = await provider.getCode(escrowFactoryAddress);
  console.log(`Escrow Factory has code: ${code !== '0x'}`);
  
  // Check wallet balance
  const walletBalance = await provider.getBalance(wallet.address);
  console.log(`Wallet balance: ${ethers.formatEther(walletBalance)} ETH`);
  
  // Check if wallet has enough ETH
  console.log(`Wallet has enough ETH: ${walletBalance >= amount}`);
  
  // Try to get the transaction data
  try {
    const data = resolver.executeIntent.interface.encodeFunctionData('executeIntent', [swapId]);
    console.log(`Transaction data: ${data}`);
  } catch (error) {
    console.log(`Failed to encode transaction data: ${error.message}`);
  }
}

debugTransaction().catch(console.error); 