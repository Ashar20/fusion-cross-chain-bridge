const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🧪 Testing Contract ABI...');
  
  const resolverAddress = '0x5574FE78CF4B787BF5FBD6f333C444f69baFAAA8';
  
  // Create the same ABI as used in the UI
  const abi = [
    "function createIntent(bytes32 swapId, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, bytes calldata signature) external",
    "function executeIntent(bytes32 swapId) external payable",
    "function claimTokens(bytes32 swapId, bytes32 secret, bytes calldata claimSignature) external",
    "function getIntent(bytes32 swapId) external view returns (tuple(address user, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, uint256 nonce, bool executed, bool claimed, address escrowAddress))",
    "function userNonces(address user) external view returns (uint256)"
  ];
  
  // Create a provider
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // Create contract instance
  const resolver = new ethers.Contract(resolverAddress, abi, provider);
  
  console.log('✅ Contract instance created');
  console.log('🔍 Contract address:', resolver.target);
  
  // Check if userNonces function exists
  console.log('🔍 userNonces function type:', typeof resolver.userNonces);
  console.log('🔍 userNonces function:', resolver.userNonces);
  
  // Test calling userNonces
  const testAddress = '0xeb636Cf3a27AbF02D75Cd2FA253ac09af0FE1f90';
  
  try {
    const nonce = await resolver.userNonces(testAddress);
    console.log('✅ userNonces call successful!');
    console.log('Address:', testAddress);
    console.log('Nonce:', nonce.toString());
  } catch (error) {
    console.error('❌ userNonces call failed:', error.message);
  }
  
  // Test other functions
  try {
    const intent = await resolver.getIntent('0x0000000000000000000000000000000000000000000000000000000000000000');
    console.log('✅ getIntent call successful!');
  } catch (error) {
    console.log('ℹ️ getIntent call failed (expected for non-existent intent):', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 