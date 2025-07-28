const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🧪 Testing Contract Execution...');
  
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
  const [deployer] = await ethers.getSigners();
  
  console.log('👤 Testing with account:', deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');
  
  // Contract ABI
  const abi = [
    "function createIntent(bytes32 swapId, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, bytes calldata signature) external",
    "function executeIntent(bytes32 swapId) external payable",
    "function getIntent(bytes32 swapId) external view returns (tuple(address user, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, uint256 nonce, bool executed, bool claimed, address escrowAddress))",
    "function userNonces(address user) external view returns (uint256)"
  ];
  
  const resolver = new ethers.Contract(resolverAddress, abi, deployer);
  
  console.log('🔧 Contract address:', resolver.target);
  
  // Test data
  const swapId = ethers.keccak256(ethers.randomBytes(32));
  const beneficiary = deployer.address;
  const amount = ethers.parseEther('0.001');
  const orderHash = ethers.keccak256(ethers.randomBytes(32));
  const hashlock = ethers.keccak256(ethers.randomBytes(32));
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  
  console.log('📋 Test Data:');
  console.log('SwapId:', swapId);
  console.log('Beneficiary:', beneficiary);
  console.log('Amount:', ethers.formatEther(amount), 'ETH');
  console.log('OrderHash:', orderHash);
  console.log('Hashlock:', hashlock);
  console.log('Deadline:', deadline);
  
  try {
    // Get current nonce
    const currentNonce = await resolver.userNonces(beneficiary);
    console.log('🔢 Current nonce:', currentNonce.toString());
    
    // Create EIP-712 signature
    const domain = {
      name: 'Gasless1inchResolver',
      version: '1.0.0',
      chainId: 11155111, // Sepolia
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
    
    const message = {
      swapId: swapId,
      user: beneficiary,
      beneficiary: beneficiary,
      amount: amount,
      orderHash: orderHash,
      hashlock: hashlock,
      deadline: deadline,
      nonce: currentNonce
    };
    
    const signature = await deployer.signTypedData(domain, types, message);
    console.log('✍️ Signature created:', signature);
    
    // Create intent
    console.log('📝 Creating intent...');
    const createTx = await resolver.createIntent(
      swapId,
      beneficiary,
      amount,
      orderHash,
      hashlock,
      deadline,
      signature
    );
    const createReceipt = await createTx.wait();
    console.log('✅ Intent created! TX:', createReceipt.hash);
    
    // Get intent details
    const intent = await resolver.getIntent(swapId);
    console.log('📋 Intent details:', {
      user: intent.user,
      beneficiary: intent.beneficiary,
      amount: ethers.formatEther(intent.amount),
      executed: intent.executed,
      claimed: intent.claimed
    });
    
    // Execute intent
    console.log('🎯 Executing intent...');
    const executeTx = await resolver.executeIntent(swapId, { 
      value: amount 
    });
    const executeReceipt = await executeTx.wait();
    console.log('✅ Intent executed! TX:', executeReceipt.hash);
    
    // Check final status
    const finalIntent = await resolver.getIntent(swapId);
    console.log('📋 Final intent status:', {
      executed: finalIntent.executed,
      claimed: finalIntent.claimed,
      escrowAddress: finalIntent.escrowAddress
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Try to get more details about the error
    if (error.data) {
      console.log('Error data:', error.data);
    }
    if (error.reason) {
      console.log('Error reason:', error.reason);
    }
    if (error.transaction) {
      console.log('Transaction:', error.transaction);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 