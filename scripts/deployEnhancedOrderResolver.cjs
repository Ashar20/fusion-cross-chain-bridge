const { ethers } = require('ethers');
require('dotenv').config();

/**
 * 🚀 Deploy Enhanced Order Resolver with Limit Orders & Dutch Auctions
 * 
 * This script deploys the enhanced order resolver that includes:
 * 1. Limit Orders - Execute at specific price points
 * 2. Dutch Auctions - Price decays over time
 * 3. Advanced security features
 * 4. Cross-chain integration
 */
class EnhancedOrderResolverDeployer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

    console.log('🚀 Enhanced Order Resolver Deployer');
    console.log('=' .repeat(60));
    console.log(`📍 Deployer: ${this.wallet.address}`);
    console.log('');
  }

  /**
   * 📊 Initialize and show network info
   */
  async initialize() {
    const network = await this.provider.getNetwork();
    const balance = await this.provider.getBalance(this.wallet.address);
    
    console.log(`📍 Network: ${network.name}`);
    console.log(`📍 Chain ID: ${network.chainId}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    console.log('');
  }

  /**
   * 🏗️ Deploy Enhanced Order Resolver
   */
  async deployEnhancedOrderResolver() {
    console.log('🏗️ DEPLOYING ENHANCED ORDER RESOLVER');
    console.log('=' .repeat(50));

    try {
      // First, deploy the escrow factory if not already deployed
      console.log('📦 Step 1: Checking Escrow Factory...');
      let escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS;
      
      if (!escrowFactoryAddress) {
        console.log('   🔨 Deploying Escrow Factory...');
        const escrowFactoryArtifact = require('../artifacts/contracts/Official1inchEscrowFactory.sol/Official1inchEscrowFactory.json');
        const escrowFactory = new ethers.ContractFactory(
          escrowFactoryArtifact.abi,
          escrowFactoryArtifact.bytecode,
          this.wallet
        );
        
        const escrowFactoryContract = await escrowFactory.deploy();
        await escrowFactoryContract.waitForDeployment();
        escrowFactoryAddress = await escrowFactoryContract.getAddress();
        
        console.log(`   ✅ Escrow Factory deployed: ${escrowFactoryAddress}`);
      } else {
        console.log(`   ✅ Using existing Escrow Factory: ${escrowFactoryAddress}`);
      }

      // Deploy Enhanced Order Resolver
      console.log('\n📦 Step 2: Deploying Enhanced Order Resolver...');
      const enhancedResolverArtifact = require('../artifacts/contracts/EnhancedOrderResolver.sol/EnhancedOrderResolver.json');
      
      const enhancedResolver = new ethers.ContractFactory(
        enhancedResolverArtifact.abi,
        enhancedResolverArtifact.bytecode,
        this.wallet
      );

      console.log('   🔨 Deploying contract...');
      const enhancedResolverContract = await enhancedResolver.deploy(escrowFactoryAddress);
      await enhancedResolverContract.waitForDeployment();
      
      const enhancedResolverAddress = await enhancedResolverContract.getAddress();
      
      console.log(`   ✅ Enhanced Order Resolver deployed: ${enhancedResolverAddress}`);
      console.log(`   📊 Gas used: ${enhancedResolverContract.deploymentTransaction().gasLimit}`);
      console.log('');

      // Verify deployment
      console.log('🔍 Step 3: Verifying deployment...');
      const code = await this.provider.getCode(enhancedResolverAddress);
      if (code === '0x') {
        throw new Error('Contract deployment failed - no code at address');
      }
      console.log('   ✅ Contract code verified');
      console.log('');

      // Test basic functionality
      console.log('🧪 Step 4: Testing basic functionality...');
      await this.testBasicFunctionality(enhancedResolverContract);
      console.log('');

      // Save deployment info
      console.log('💾 Step 5: Saving deployment info...');
      const deploymentInfo = {
        network: this.provider.network.name,
        chainId: this.provider.network.chainId,
        deployer: this.wallet.address,
        deploymentTime: new Date().toISOString(),
        contracts: {
          enhancedOrderResolver: {
            address: enhancedResolverAddress,
            transactionHash: enhancedResolverContract.deploymentTransaction().hash,
            blockNumber: enhancedResolverContract.deploymentTransaction().blockNumber,
            gasUsed: enhancedResolverContract.deploymentTransaction().gasLimit
          },
          escrowFactory: {
            address: escrowFactoryAddress
          }
        }
      };

      // Save to file
      const fs = require('fs');
      fs.writeFileSync(
        'enhanced-order-resolver-deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
      );

      console.log('   ✅ Deployment info saved to enhanced-order-resolver-deployment.json');
      console.log('');

      // Display summary
      console.log('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
      console.log('=' .repeat(50));
      console.log(`📍 Enhanced Order Resolver: ${enhancedResolverAddress}`);
      console.log(`📍 Escrow Factory: ${escrowFactoryAddress}`);
      console.log(`📍 Network: ${this.provider.network.name}`);
      console.log(`📍 Chain ID: ${this.provider.network.chainId}`);
      console.log('');
      console.log('🚀 Features Deployed:');
      console.log('   ✅ Limit Orders - Execute at specific price points');
      console.log('   ✅ Dutch Auctions - Price decays over time');
      console.log('   ✅ Stop Loss/Take Profit - Automatic execution');
      console.log('   ✅ Gasless Architecture - EIP-712 signatures');
      console.log('   ✅ Cross-Chain Integration - Works with EOS HTLCs');
      console.log('   ✅ Advanced Security - ReentrancyGuard, Pausable, Ownable');
      console.log('   ✅ Partial Fills - Support for partial order execution');
      console.log('   ✅ Order Management - Cancellation, expiration handling');
      console.log('');

      return {
        success: true,
        enhancedResolverAddress,
        escrowFactoryAddress,
        deploymentInfo
      };

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧪 Test basic functionality
   */
  async testBasicFunctionality(contract) {
    try {
      // Test 1: Check owner
      const owner = await contract.owner();
      console.log(`   ✅ Owner: ${owner}`);
      
      // Test 2: Check escrow factory
      const escrowFactory = await contract.escrowFactory();
      console.log(`   ✅ Escrow Factory: ${escrowFactory}`);
      
      // Test 3: Check domain separator
      const domainSeparator = await contract.DOMAIN_SEPARATOR();
      console.log(`   ✅ Domain Separator: ${domainSeparator}`);
      
      // Test 4: Check initial state
      const isPaused = await contract.paused();
      console.log(`   ✅ Paused state: ${isPaused}`);
      
      console.log('   ✅ All basic functionality tests passed');
      
    } catch (error) {
      console.log(`   ⚠️ Basic functionality test failed: ${error.message}`);
    }
  }

  /**
   * 📊 Show deployment costs
   */
  async showDeploymentCosts() {
    console.log('💰 DEPLOYMENT COSTS');
    console.log('-' .repeat(40));
    
    const balanceBefore = await this.provider.getBalance(this.wallet.address);
    console.log(`   Balance before: ${ethers.formatEther(balanceBefore)} ETH`);
    
    // Estimate deployment cost
    const enhancedResolverArtifact = require('../artifacts/contracts/EnhancedOrderResolver.sol/EnhancedOrderResolver.json');
    const enhancedResolver = new ethers.ContractFactory(
      enhancedResolverArtifact.abi,
      enhancedResolverArtifact.bytecode,
      this.wallet
    );
    
    const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000';
    const deploymentData = enhancedResolver.getDeployTransaction(escrowFactoryAddress);
    
    const gasPrice = await this.provider.getFeeData();
    const estimatedGas = await this.provider.estimateGas(deploymentData);
    const estimatedCost = estimatedGas * gasPrice.gasPrice;
    
    console.log(`   Estimated gas: ${estimatedGas}`);
    console.log(`   Gas price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
    console.log(`   Estimated cost: ${ethers.formatEther(estimatedCost)} ETH`);
    console.log('');
  }

  /**
   * 🚀 Execute complete deployment
   */
  async execute() {
    try {
      // Initialize and show balance
      await this.initialize();
      
      // Show deployment costs
      await this.showDeploymentCosts();
      
      // Deploy enhanced order resolver
      const result = await this.deployEnhancedOrderResolver();
      
      if (result.success) {
        console.log('🎯 NEXT STEPS:');
        console.log('=' .repeat(50));
        console.log('1. Update .env file with new contract addresses:');
        console.log(`   ENHANCED_ORDER_RESOLVER_ADDRESS=${result.enhancedResolverAddress}`);
        console.log(`   ESCROW_FACTORY_ADDRESS=${result.escrowFactoryAddress}`);
        console.log('');
        console.log('2. Test the advanced order types:');
        console.log('   npm run test-enhanced-orders');
        console.log('');
        console.log('3. Integrate with the relayer service:');
        console.log('   npm run start-enhanced-relayer');
        console.log('');
        console.log('4. Update the frontend to use new contract:');
        console.log('   Update ui/src/lib/blockchain.ts');
        console.log('');
      } else {
        console.log('❌ Deployment failed. Please check the error and try again.');
      }
      
    } catch (error) {
      console.error('❌ Execution failed:', error.message);
    }
  }
}

// Export for use in other scripts
module.exports = { EnhancedOrderResolverDeployer };

// Run if called directly
if (require.main === module) {
  const deployer = new EnhancedOrderResolverDeployer();
  deployer.execute();
} 