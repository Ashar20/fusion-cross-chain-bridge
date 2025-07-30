const { ethers } = require('ethers');
require('dotenv').config();

async function workingSwap() {
  console.log('🚀 Performing Working ETH → EOS Swap');
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
    
    // Generate swap parameters
    const swapId = ethers.keccak256(ethers.toUtf8Bytes(`swap_${Date.now()}_${wallet.address}`));
    const orderHash = ethers.keccak256(ethers.toUtf8Bytes(`order_${Date.now()}_${wallet.address}`));
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(secret);
    const amount = ethers.parseEther('0.01'); // 0.01 ETH
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    
    console.log('📋 Swap Parameters:');
    console.log(`   🔑 Swap ID: ${swapId.substring(0, 16)}...`);
    console.log(`   💰 Amount: ${ethers.formatEther(amount)} ETH`);
    console.log(`   🔐 Hashlock: ${hashlock.substring(0, 16)}...`);
    console.log(`   📋 Order Hash: ${orderHash.substring(0, 16)}...`);
    console.log(`   ⏰ Deadline: ${new Date(deadline * 1000).toISOString()}`);
    console.log('');
    
    // Create EIP-712 signature
    const domain = {
      name: 'Gasless1inchResolver',
      version: '1.0.0',
      chainId: 11155111, // Sepolia
      verifyingContract: resolver
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
    
    const message = {
      swapId: swapId,
      user: wallet.address,
      beneficiary: wallet.address,
      amount: amount,
      orderHash: orderHash,
      hashlock: hashlock,
      deadline: deadline,
      nonce: 0
    };
    
    console.log('✍️  Creating signature...');
    const signature = await wallet.signTypedData(domain, types, message);
    console.log(`   Signature: ${signature.substring(0, 16)}...`);
    console.log('');
    
    // Create contract instance
    const resolverContract = new ethers.Contract(resolver, [
      'function createIntent(bytes32 swapId, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, bytes calldata signature) external',
      'function executeIntent(bytes32 swapId) external payable',
      'function intents(bytes32) external view returns (address user, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, uint256 nonce, bool executed, bool claimed, address escrowAddress)'
    ], wallet);
    
    // Step 1: Create intent
    console.log('📝 Step 1: Creating intent...');
    const createTx = await resolverContract.createIntent(
      swapId,
      wallet.address,
      amount,
      orderHash,
      hashlock,
      deadline,
      signature,
      {
        gasLimit: 300000
      }
    );
    
    console.log(`   📡 Transaction sent: ${createTx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);
    
    const createReceipt = await createTx.wait();
    console.log(`   ✅ Intent created! Gas used: ${createReceipt.gasUsed.toString()}`);
    console.log('');
    
    // Step 2: Execute intent
    console.log('🚀 Step 2: Executing intent...');
    const executeTx = await resolverContract.executeIntent(
      swapId,
      {
        value: amount,
        gasLimit: 500000
      }
    );
    
    console.log(`   📡 Transaction sent: ${executeTx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);
    
    const executeReceipt = await executeTx.wait();
    console.log(`   ✅ Intent executed! Gas used: ${executeReceipt.gasUsed.toString()}`);
    console.log('');
    
    // Step 3: Check intent status
    console.log('🔍 Step 3: Checking intent status...');
    const intent = await resolverContract.intents(swapId);
    console.log(`   👤 User: ${intent.user}`);
    console.log(`   💰 Amount: ${ethers.formatEther(intent.amount)} ETH`);
    console.log(`   ✅ Executed: ${intent.executed}`);
    console.log(`   ✅ Claimed: ${intent.claimed}`);
    console.log(`   🏭 Escrow: ${intent.escrowAddress}`);
    console.log('');
    
    console.log('🎯 Swap Summary:');
    console.log('=' .repeat(50));
    console.log('✅ Intent created successfully');
    console.log('✅ Intent executed with ETH');
    console.log('✅ ETH locked in escrow');
    console.log('✅ Ready for EOS HTLC creation');
    console.log('');
    console.log(`🔗 Create Intent: https://sepolia.etherscan.io/tx/${createTx.hash}`);
    console.log(`🔗 Execute Intent: https://sepolia.etherscan.io/tx/${executeTx.hash}`);
    
  } catch (error) {
    console.error('❌ Swap failed:', error.message);
    console.error('   Error details:', error.stack);
  }
}

workingSwap(); 