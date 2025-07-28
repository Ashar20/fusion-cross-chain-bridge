const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🧪 Testing userNonces function...');
  
  const resolverAddress = '0x5574FE78CF4B787BF5FBD6f333C444f69baFAAA8';
  const testAddress = '0xeb636Cf3a27AbF02D75Cd2FA253ac09af0FE1f90';
  
  // Create a provider
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // Create contract instance with minimal ABI
  const abi = [
    "function userNonces(address user) external view returns (uint256)"
  ];
  
  const resolver = new ethers.Contract(resolverAddress, abi, provider);
  
  try {
    const nonce = await resolver.userNonces(testAddress);
    console.log('✅ userNonces function works!');
    console.log('Address:', testAddress);
    console.log('Nonce:', nonce.toString());
  } catch (error) {
    console.error('❌ userNonces function failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 