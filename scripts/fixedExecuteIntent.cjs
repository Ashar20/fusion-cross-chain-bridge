const { ethers } = require('ethers');
require('dotenv').config();

async function fixedExecuteIntent() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
  const resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
  const resolver = new ethers.Contract(resolverAddress, resolverArtifact.abi, wallet);
  
  console.log('🔧 Fixed Intent Execution Test');
  console.log('=' .repeat(40));
  
  try {
    // Step 1: Create a fresh intent
    console.log('📝 Step 1: Creating fresh intent...');
    
    const swapId = ethers.keccak256(ethers.randomBytes(32));
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(secret);
    const orderHash = ethers.keccak256(ethers.toUtf8Bytes(`FRESH_TEST_${swapId}`));
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const amount = ethers.parseEther('0.001');
    
    console.log(`   Swap ID: ${swapId}`);
    console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
    console.log(`   Deadline: ${new Date(deadline * 1000).toISOString()}`);
    
    // Create EIP-712 signature
    const domain = {
      name: 'Gasless1inchResolver',
      version: '1.0.0',
      chainId: 11155111,
      verifyingContract: resolverAddress
    };
    
    const types = {
      Intent: [
        { name: 'swapId', type: 'bytes32' },
        { name: 'user', type: 'address' },
        { name: 'beneficiary', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'orderHash', type: 'bytes32' },
        { name: 'hashlock', type: 'bytes32' },
        { name: 'deadline', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
      ]
    };
    
    const nonce = await resolver.userNonces(wallet.address);
    
    const message = {
      swapId: swapId,
      user: wallet.address,
      beneficiary: wallet.address,
      amount: amount,
      orderHash: orderHash,
      hashlock: hashlock,
      deadline: deadline,
      nonce: nonce
    };
    
    const signature = await wallet.signTypedData(domain, types, message);
    
    // Create intent
    const createTx = await resolver.createIntent(
      swapId,
      wallet.address,
      amount,
      orderHash,
      hashlock,
      deadline,
      signature
    );
    
    console.log(`   📝 Intent creation: ${createTx.hash}`);
    const createReceipt = await createTx.wait();
    console.log(`   ✅ Intent created in block: ${createReceipt.blockNumber}`);
    
    // Step 2: Verify intent was created correctly
    console.log('\n🔍 Step 2: Verifying intent...');
    const intent = await resolver.getIntent(swapId);
    console.log(`   User: ${intent.user}`);
    console.log(`   Amount: ${ethers.formatEther(intent.amount)} ETH`);
    console.log(`   Executed: ${intent.executed}`);
    console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
    
    // Step 3: Execute intent with detailed error handling
    console.log('\n🚀 Step 3: Executing intent...');
    
    // Check if intent is valid
    const now = Math.floor(Date.now() / 1000);
    if (intent.executed) {
      console.log('❌ Intent already executed');
      return;
    }
    if (Number(intent.deadline) <= now) {
      console.log('❌ Intent expired');
      return;
    }
    
    console.log('✅ Intent is valid for execution');
    
    // Try to execute with proper gas estimation
    try {
      // Estimate gas first
      const gasEstimate = await resolver.executeIntent.estimateGas(swapId, {
        value: amount
      });
      console.log(`   ⛽ Gas estimate: ${gasEstimate} gas`);
      
      // Add 20% buffer for safety
      const gasLimit = Math.floor(Number(gasEstimate) * 1.2);
      console.log(`   ⛽ Gas limit: ${gasLimit} gas`);
      
      // Execute with proper parameters
      const executeTx = await resolver.executeIntent(swapId, {
        value: amount,
        gasLimit: gasLimit
      });
      
      console.log(`   📝 Execution tx: ${executeTx.hash}`);
      console.log('   ⏳ Waiting for confirmation...');
      
      const executeReceipt = await executeTx.wait();
      console.log(`   ✅ Executed in block: ${executeReceipt.blockNumber}`);
      console.log(`   📊 Gas used: ${executeReceipt.gasUsed}`);
      console.log(`   📊 Status: ${executeReceipt.status === 1 ? 'Success' : 'Failed'}`);
      
      if (executeReceipt.status === 1) {
        // Check the result
        const updatedIntent = await resolver.getIntent(swapId);
        console.log(`   🏠 Escrow created: ${updatedIntent.escrowAddress}`);
        console.log(`   ✅ Intent executed: ${updatedIntent.executed}`);
        
        console.log('\n🎉 SUCCESS! Intent executed successfully!');
        return {
          success: true,
          swapId,
          escrowAddress: updatedIntent.escrowAddress,
          txHash: executeTx.hash
        };
      } else {
        console.log('❌ Transaction failed');
        return { success: false, error: 'Transaction failed' };
      }
      
    } catch (error) {
      console.log(`❌ Execution failed: ${error.message}`);
      
      // Try to get more details
      if (error.receipt) {
        console.log(`   📊 Receipt status: ${error.receipt.status}`);
        console.log(`   📊 Gas used: ${error.receipt.gasUsed}`);
        console.log(`   📊 Block: ${error.receipt.blockNumber}`);
      }
      
      // Try to decode the error if possible
      if (error.data) {
        console.log(`   📊 Error data: ${error.data}`);
      }
      
      return { success: false, error: error.message };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  fixedExecuteIntent().catch(console.error);
}

module.exports = { fixedExecuteIntent }; 