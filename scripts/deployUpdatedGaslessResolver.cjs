const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🚀 Deploying Updated Gasless1inchResolver...');
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');

  // Deploy the EscrowFactory first
  console.log('📦 Deploying Official1inchEscrowFactory...');
  const EscrowFactory = await ethers.getContractFactory('Official1inchEscrowFactory');
  const escrowFactory = await EscrowFactory.deploy();
  await escrowFactory.waitForDeployment();
  console.log('✅ EscrowFactory deployed to:', escrowFactory.target);

  // Deploy the updated Gasless1inchResolver
  console.log('🔧 Deploying Updated Gasless1inchResolver...');
  const GaslessResolver = await ethers.getContractFactory('Gasless1inchResolver');
  const gaslessResolver = await GaslessResolver.deploy(escrowFactory.target);
  await gaslessResolver.waitForDeployment();
  console.log('✅ Gasless1inchResolver deployed to:', gaslessResolver.target);

  // Save deployment info
  const deploymentInfo = {
    network: 'sepolia',
    timestamp: new Date().toISOString(),
    escrowFactory: {
      address: escrowFactory.target,
      transactionHash: escrowFactory.deploymentTransaction().hash
    },
    gaslessResolver: {
      address: gaslessResolver.target,
      transactionHash: gaslessResolver.deploymentTransaction().hash
    }
  };

  const fs = require('fs');
  fs.writeFileSync(
    'updated-gasless-resolver-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('📄 Deployment info saved to: updated-gasless-resolver-deployment.json');
  console.log('\n🎉 Deployment Complete!');
  console.log('EscrowFactory:', escrowFactory.target);
  console.log('GaslessResolver:', gaslessResolver.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }); 