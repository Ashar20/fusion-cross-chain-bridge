const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🔍 Debugging Signature Creation...');
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log('Using account:', deployer.address);
  
  // Test data
  const swapId = ethers.keccak256(ethers.randomBytes(32));
  const beneficiary = deployer.address;
  const amount = ethers.parseEther('0.001');
  const orderHash = ethers.keccak256(ethers.randomBytes(32));
  const hashlock = ethers.keccak256(ethers.randomBytes(32));
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  
  console.log('Test Data:');
  console.log('SwapId:', swapId);
  console.log('Beneficiary:', beneficiary);
  console.log('Amount:', ethers.formatEther(amount), 'ETH');
  console.log('OrderHash:', orderHash);
  console.log('Hashlock:', hashlock);
  console.log('Deadline:', deadline);
  
  // Create EIP-712 signature
  const domain = {
    name: 'Gasless1inchResolver',
    version: '1.0.0',
    chainId: 11155111, // Sepolia
    verifyingContract: '0x5574FE78CF4B787BF5FBD6f333C444f69baFAAA8'
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
    nonce: 0 // We'll need to get this from the contract
  };
  
  console.log('\nEIP-712 Domain:');
  console.log(JSON.stringify(domain, null, 2));
  
  console.log('\nEIP-712 Types:');
  console.log(JSON.stringify(types, null, 2));
  
  console.log('\nEIP-712 Message:');
  console.log(JSON.stringify({
    swapId: swapId,
    user: beneficiary,
    beneficiary: beneficiary,
    amount: amount.toString(),
    orderHash: orderHash,
    hashlock: hashlock,
    deadline: deadline.toString(),
    nonce: '0'
  }, null, 2));
  
  // Sign the message
  const signature = await deployer.signTypedData(domain, types, message);
  console.log('\nSignature:', signature);
  
  // Verify the signature
  const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
  console.log('\nRecovered Address:', recoveredAddress);
  console.log('Original Address:', deployer.address);
  console.log('Match:', recoveredAddress === deployer.address);
  
  // Test claim signature
  const secret = 'mysecret123';
  const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secret));
  
  const claimTypes = {
    Claim: [
      { name: 'swapId', type: 'bytes32' },
      { name: 'secret', type: 'bytes32' }
    ]
  };
  
  const claimMessage = {
    swapId: swapId,
    secret: secretHash
  };
  
  const claimSignature = await deployer.signTypedData(domain, claimTypes, claimMessage);
  console.log('\nClaim Signature:', claimSignature);
  
  const recoveredClaimAddress = ethers.verifyTypedData(domain, claimTypes, claimMessage, claimSignature);
  console.log('Recovered Claim Address:', recoveredClaimAddress);
  console.log('Claim Match:', recoveredClaimAddress === deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }); 