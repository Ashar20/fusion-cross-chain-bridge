const { ethers } = require('ethers');

async function testSecretGeneration() {
  console.log('🧪 Testing Secret Generation and Verification...\n');

  // Generate a secret
  const secret = ethers.randomBytes(32);
  const secretHex = ethers.hexlify(secret);
  
  // Generate hashlock from secret
  const hashlock = ethers.keccak256(secret);
  
  console.log('🔐 Generated Secret:', {
    secretHex,
    hashlock
  });

  // Test contract-style verification (this is what the contract does)
  const contractHashlock = ethers.keccak256(ethers.solidityPacked(['bytes32'], [secret]));
  
  console.log('\n🔍 Verification Test:');
  console.log('Original hashlock:', hashlock);
  console.log('Contract-style hashlock:', contractHashlock);
  console.log('Match:', hashlock === contractHashlock);

  // Test with different methods
  const method1 = ethers.keccak256(secret);
  const method2 = ethers.keccak256(ethers.solidityPacked(['bytes32'], [secret]));
  const method3 = ethers.keccak256(ethers.solidityPacked(['bytes'], [secret]));
  
  console.log('\n🔬 Different Hashing Methods:');
  console.log('Method 1 (keccak256(secret)):', method1);
  console.log('Method 2 (keccak256(abi.encodePacked(bytes32)))', method2);
  console.log('Method 3 (keccak256(abi.encodePacked(bytes)))', method3);
  
  console.log('\n✅ Test completed!');
}

testSecretGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 