const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🔍 Debugging Signature Issue...');
  
  // Use the same private key as the UI (you'll need to set this in .env)
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Please set PRIVATE_KEY in .env file');
    return;
  }
  
  const wallet = new ethers.Wallet(privateKey);
  console.log('👤 Wallet address:', wallet.address);
  
  // Use the same contract address as the UI
  const resolverAddress = '0x5574FE78CF4B787BF5FBD6f333C444f69baFAAA8';
  
  // Create the same data as the UI
  const swapId = ethers.keccak256(ethers.randomBytes(32));
  const beneficiary = wallet.address;
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
  
  // Create the same domain and types as the UI
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
    nonce: 0 // Will be incremented by contract
  };
  
  console.log('\n📝 Message to sign:');
  console.log(JSON.stringify(message, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
  
  // Now test with the contract
  console.log('\n🧪 Testing with contract...');
  
  const GaslessResolver = await ethers.getContractFactory('Gasless1inchResolver');
  const resolver = GaslessResolver.attach(resolverAddress);
  
  // Get the current nonce from the contract
  const currentNonce = await resolver.userNonces(beneficiary);
  console.log('🔢 Current nonce for beneficiary:', currentNonce.toString());
  
  // Update message with actual nonce
  message.nonce = currentNonce;
  
  console.log('\n📝 Updated message with actual nonce:');
  console.log(JSON.stringify(message, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
  
  // Sign the message with actual nonce
  const signature = await wallet.signTypedData(domain, types, message);
  console.log('\n✍️ Signature:', signature);
  
  // Verify the signature manually
  const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
  console.log('🔍 Recovered address:', recoveredAddress);
  console.log('✅ Signature valid:', recoveredAddress === beneficiary);
  
  try {
    const tx = await resolver.createIntent(
      swapId,
      beneficiary,
      amount,
      orderHash,
      hashlock,
      deadline,
      signature
    );
    const receipt = await tx.wait();
    console.log('✅ createIntent successful!');
    console.log('Transaction hash:', receipt.hash);
  } catch (error) {
    console.error('❌ createIntent failed:', error.message);
    
    // Try to get more details about the error
    if (error.data) {
      console.log('Error data:', error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 