const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🚀 Deploying Fundable Gasless1inchResolver...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');

  console.log('📦 Deploying Official1inchEscrowFactory...');
  const EscrowFactory = await ethers.getContractFactory('Official1inchEscrowFactory');
  const escrowFactory = await EscrowFactory.deploy();
  await escrowFactory.waitForDeployment();
  console.log('✅ EscrowFactory deployed to:', escrowFactory.target);

  console.log('🔧 Deploying Fundable Gasless1inchResolver...');
  const GaslessResolver = await ethers.getContractFactory('Gasless1inchResolver');
  const gaslessResolver = await GaslessResolver.deploy(escrowFactory.target);
  await gaslessResolver.waitForDeployment();
  console.log('✅ Gasless1inchResolver deployed to:', gaslessResolver.target);

  // Test that the contract can receive ETH
  console.log('🧪 Testing ETH reception...');
  const testAmount = ethers.parseEther('0.001');
  const tx = await deployer.sendTransaction({
    to: gaslessResolver.target,
    value: testAmount
  });
  await tx.wait();
  console.log('✅ Contract received ETH successfully!');

  // Check contract balance
  const balance = await ethers.provider.getBalance(gaslessResolver.target);
  console.log('💰 Contract balance:', ethers.formatEther(balance), 'ETH');

  const deploymentInfo = {
    network: 'sepolia',
    timestamp: new Date().toISOString(),
    escrowFactory: {
      address: escrowFactory.target,
      transactionHash: escrowFactory.deploymentTransaction().hash
    },
    gaslessResolver: {
      address: gaslessResolver.target,
      transactionHash: gaslessResolver.deploymentTransaction().hash,
      balance: ethers.formatEther(balance)
    }
  };

  const fs = require('fs');
  fs.writeFileSync(
    'fundable-resolver-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('📄 Deployment info saved to: fundable-resolver-deployment.json');
  console.log('\n🎉 Deployment Complete!');
  console.log('EscrowFactory:', escrowFactory.target);
  console.log('GaslessResolver:', gaslessResolver.target);
  console.log('Contract Balance:', ethers.formatEther(balance), 'ETH');
  console.log('\n💡 Now you can send ETH to the resolver for gasless transactions!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }); 