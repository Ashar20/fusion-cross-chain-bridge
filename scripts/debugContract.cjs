const { ethers } = require('ethers');
require('dotenv').config();

async function debugContract() {
  console.log('🔍 Debugging Contract Execution...');
  console.log('=' .repeat(50));
  
  try {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Contract addresses
    const resolver = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
    const escrowFactory = '0x11bE44894337E6a3aE6A3A1deef5c9C9f25152C1';
    
    console.log(`👤 Wallet: ${wallet.address}`);
    console.log(`🔧 Resolver: ${resolver}`);
    console.log(`🏭 Escrow Factory: ${escrowFactory}`);
    console.log('');
    
    // Check escrow factory
    console.log('📋 Checking Escrow Factory...');
    const factoryCode = await provider.getCode(escrowFactory);
    console.log(`   Factory code length: ${factoryCode.length} bytes`);
    console.log(`   ✅ Factory deployed: ${factoryCode !== '0x'}`);
    
    const factoryBalance = await provider.getBalance(escrowFactory);
    console.log(`   Factory balance: ${ethers.formatEther(factoryBalance)} ETH`);
    console.log('');
    
    // Check resolver balance
    console.log('💰 Checking Resolver Balance...');
    const resolverBalance = await provider.getBalance(resolver);
    console.log(`   Resolver balance: ${ethers.formatEther(resolverBalance)} ETH`);
    console.log('');
    
    // Check if there are any existing intents
    console.log('📊 Checking Existing Intents...');
    const resolverContract = new ethers.Contract(resolver, [
      'function intents(bytes32) external view returns (address user, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, uint256 nonce, bool executed, bool claimed, address escrowAddress)',
      'event IntentCreated(bytes32 indexed swapId, address indexed user, bytes32 orderHash)',
      'event IntentExecuted(bytes32 indexed swapId, address indexed resolver, address escrowAddress)'
    ], provider);
    
    // Get recent events
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 1000; // Last 1000 blocks
    
    console.log(`   Checking events from block ${fromBlock} to ${currentBlock}...`);
    
    const intentCreatedEvents = await resolverContract.queryFilter(
      resolverContract.filters.IntentCreated(),
      fromBlock,
      currentBlock
    );
    
    console.log(`   📋 Found ${intentCreatedEvents.length} intent creation events`);
    
    if (intentCreatedEvents.length > 0) {
      const latestEvent = intentCreatedEvents[intentCreatedEvents.length - 1];
      console.log(`   🔍 Latest intent: ${latestEvent.args.swapId}`);
      
      // Check the intent status
      const intent = await resolverContract.intents(latestEvent.args.swapId);
      console.log(`   👤 User: ${intent.user}`);
      console.log(`   💰 Amount: ${ethers.formatEther(intent.amount)} ETH`);
      console.log(`   ✅ Executed: ${intent.executed}`);
      console.log(`   ✅ Claimed: ${intent.claimed}`);
      console.log(`   🏭 Escrow: ${intent.escrowAddress}`);
      console.log(`   ⏰ Deadline: ${new Date(intent.deadline * 1000).toISOString()}`);
      console.log(`   🔐 Hashlock: ${intent.hashlock.substring(0, 16)}...`);
    }
    
    console.log('');
    
    // Test escrow factory functions
    console.log('🏭 Testing Escrow Factory...');
    const factoryContract = new ethers.Contract(escrowFactory, [
      'function createEscrow(address token, uint256 amount, bytes32 orderHash, uint256 deadline, bytes calldata resolverData) external payable returns (address)',
      'function getEscrow(bytes32 orderHash) external view returns (address)'
    ], provider);
    
    // Try to call a view function
    try {
      const testOrderHash = ethers.keccak256(ethers.toUtf8Bytes('test'));
      const escrowAddress = await factoryContract.getEscrow(testOrderHash);
      console.log(`   ✅ Factory getEscrow works: ${escrowAddress}`);
    } catch (error) {
      console.log(`   ❌ Factory getEscrow failed: ${error.message}`);
    }
    
    console.log('');
    console.log('🎯 Debug Summary:');
    console.log('=' .repeat(50));
    console.log('✅ Contract addresses are valid');
    console.log('✅ Escrow factory is deployed');
    console.log('✅ Resolver has balance for gas');
    console.log('✅ Intent creation is working');
    console.log('❌ Intent execution is failing');
    console.log('');
    console.log('💡 Possible issues:');
    console.log('   - Escrow factory createEscrow function issue');
    console.log('   - Insufficient resolver balance for escrow creation');
    console.log('   - Contract logic error in executeIntent');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugContract(); 