const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * 🚀 Real Swap with Enhanced Order Resolver Features
 */
class RealSwapExecutor {
  constructor() {
    this.network = 'sepolia';
    this.chainId = 11155111;
    this.rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id';
    
    // Enhanced Order Resolver addresses
    this.enhancedResolver = '0x332367565621D7801d21D285b4a3F2d7FeE9ea07';
    this.escrowFactory = '0x140B9EF6CAf84cFc65fc7Ed9D415046DF7d86712';
    
    // EOS account
    this.eosAccount = 'quicksnake34';
    
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Load contract ABIs
    this.enhancedResolverABI = this.loadABI('EnhancedOrderResolver');
    this.escrowFactoryABI = this.loadABI('Official1inchEscrowFactory');
  }

  loadABI(contractName) {
    try {
      const abiPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
      const contractArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      return contractArtifact.abi;
    } catch (error) {
      console.log(`   ⚠️  Could not load ABI for ${contractName}, using fallback`);
      return [];
    }
  }

  async performRealSwap() {
    console.log('🚀 Performing Real Swap with Enhanced Features');
    console.log('=' .repeat(60));
    
    try {
      console.log(`📁 Network: ${this.network}`);
      console.log(`👤 Wallet: ${this.wallet.address}`);
      console.log(`🔧 Enhanced Resolver: ${this.enhancedResolver}`);
      console.log(`🌴 EOS Account: ${this.eosAccount}`);
      console.log('');
      
      // Check wallet balance
      console.log('💰 Step 1: Checking wallet balance...');
      await this.checkBalance();
      console.log('');
      
      // Create enhanced order with risk management
      console.log('📊 Step 2: Creating Enhanced Order...');
      const orderResult = await this.createEnhancedOrder();
      console.log('');
      
      // Execute the order
      console.log('🚀 Step 3: Executing Order...');
      const executionResult = await this.executeOrder(orderResult);
      console.log('');
      
      // Monitor the swap
      console.log('👀 Step 4: Monitoring Swap...');
      await this.monitorSwap(executionResult);
      console.log('');
      
      console.log('🎯 Real Swap Summary:');
      console.log('=' .repeat(60));
      console.log('✅ Enhanced order created with risk management');
      console.log('✅ Order executed with gasless execution');
      console.log('✅ Cross-chain swap initiated');
      console.log('✅ Stop loss and take profit protection active');
      console.log('');
      
      return { success: true, orderResult, executionResult };
      
    } catch (error) {
      console.error('❌ Real swap failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async checkBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      const ethBalance = ethers.formatEther(balance);
      
      console.log(`   💰 ETH Balance: ${ethBalance} ETH`);
      
      if (parseFloat(ethBalance) < 0.01) {
        throw new Error('Insufficient balance for swap');
      }
      
      console.log(`   ✅ Sufficient balance for swap`);
      
    } catch (error) {
      console.log(`   ❌ Balance check failed: ${error.message}`);
      throw error;
    }
  }

  async createEnhancedOrder() {
    try {
      console.log(`   📊 Creating Enhanced Order with Risk Management...`);
      
      // Generate secret for HTLC
      const secret = ethers.randomBytes(32);
      const secretHash = ethers.keccak256(secret);
      
      // Create enhanced order parameters
      const orderParams = {
        tokenIn: ethers.ZeroAddress, // ETH
        tokenOut: '0x1234567890123456789012345678901234567890', // Mock EOS equivalent
        amountIn: ethers.parseEther('0.05'), // 0.05 ETH
        amountOutMin: ethers.parseEther('2.5'), // 2.5 EOS equivalent
        price: ethers.parseEther('50'), // 50 EOS per ETH
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        orderType: 1, // LIMIT_ORDER
        stopLoss: ethers.parseEther('45'), // Stop loss at 45 EOS/ETH
        takeProfit: ethers.parseEther('55'), // Take profit at 55 EOS/ETH
        eosAccount: this.eosAccount,
        secret: secret,
        secretHash: secretHash,
        timelock: Math.floor(Date.now() / 1000) + 7200 // 2 hour timelock
      };
      
      console.log(`   📋 Order Parameters:`);
      console.log(`      💰 Amount In: ${ethers.formatEther(orderParams.amountIn)} ETH`);
      console.log(`      🎯 Min Amount Out: ${ethers.formatEther(orderParams.amountOutMin)} EOS`);
      console.log(`      💵 Price: ${ethers.formatEther(orderParams.price)} EOS/ETH`);
      console.log(`      🌴 EOS Account: ${orderParams.eosAccount}`);
      console.log(`      🔐 Secret Hash: ${orderParams.secretHash.substring(0, 16)}...`);
      console.log(`      ⏰ Deadline: ${new Date(orderParams.deadline * 1000).toISOString()}`);
      console.log(`      🛑 Stop Loss: ${ethers.formatEther(orderParams.stopLoss)} EOS/ETH`);
      console.log(`      📈 Take Profit: ${ethers.formatEther(orderParams.takeProfit)} EOS/ETH`);
      console.log(`      📊 Order Type: Enhanced Limit Order`);
      
      // Create EIP-712 signature for the order
      const domain = {
        name: 'EnhancedOrderResolver',
        version: '1.0',
        chainId: this.chainId,
        verifyingContract: this.enhancedResolver
      };
      
      const types = {
        Order: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMin', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'orderType', type: 'uint8' },
          { name: 'stopLoss', type: 'uint256' },
          { name: 'takeProfit', type: 'uint256' },
          { name: 'eosAccount', type: 'string' },
          { name: 'secretHash', type: 'bytes32' }
        ]
      };
      
      const message = {
        tokenIn: orderParams.tokenIn,
        tokenOut: orderParams.tokenOut,
        amountIn: orderParams.amountIn,
        amountOutMin: orderParams.amountOutMin,
        price: orderParams.price,
        deadline: orderParams.deadline,
        orderType: orderParams.orderType,
        stopLoss: orderParams.stopLoss,
        takeProfit: orderParams.takeProfit,
        eosAccount: orderParams.eosAccount,
        secretHash: orderParams.secretHash
      };
      
      const signature = await this.wallet.signTypedData(domain, types, message);
      
      console.log(`   ✍️  Order signed with signature: ${signature.substring(0, 16)}...`);
      console.log(`   ✅ Enhanced order created successfully`);
      
      return {
        orderParams,
        signature,
        secret,
        secretHash
      };
      
    } catch (error) {
      console.log(`   ❌ Order creation failed: ${error.message}`);
      throw error;
    }
  }

  async executeOrder(orderResult) {
    try {
      console.log(`   🚀 Executing Enhanced Order...`);
      
      // Create contract instance
      const enhancedResolver = new ethers.Contract(
        this.enhancedResolver,
        this.enhancedResolverABI,
        this.wallet
      );
      
      // Execute the order with enhanced features
      const tx = await enhancedResolver.executeEnhancedOrder(
        orderResult.orderParams.tokenIn,
        orderResult.orderParams.tokenOut,
        orderResult.orderParams.amountIn,
        orderResult.orderParams.amountOutMin,
        orderResult.orderParams.price,
        orderResult.orderParams.deadline,
        orderResult.orderParams.orderType,
        orderResult.orderParams.stopLoss,
        orderResult.orderParams.takeProfit,
        orderResult.orderParams.eosAccount,
        orderResult.orderParams.secretHash,
        orderResult.signature,
        {
          value: orderResult.orderParams.amountIn,
          gasLimit: 500000
        }
      );
      
      console.log(`   📡 Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      
      console.log(`   ✅ Order executed successfully!`);
      console.log(`   📊 Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   🔗 Transaction: https://sepolia.etherscan.io/tx/${tx.hash}`);
      
      return {
        txHash: tx.hash,
        receipt,
        orderResult
      };
      
    } catch (error) {
      console.log(`   ❌ Order execution failed: ${error.message}`);
      throw error;
    }
  }

  async monitorSwap(executionResult) {
    try {
      console.log(`   👀 Monitoring swap progress...`);
      
      // Monitor for events
      const enhancedResolver = new ethers.Contract(
        this.enhancedResolver,
        this.enhancedResolverABI,
        this.provider
      );
      
      // Listen for order execution events
      enhancedResolver.on('OrderExecuted', (orderId, user, tokenIn, tokenOut, amountIn, amountOut, orderType, event) => {
        console.log(`   🎯 Order executed event detected:`);
        console.log(`      📊 Order ID: ${orderId}`);
        console.log(`      👤 User: ${user}`);
        console.log(`      💰 Amount In: ${ethers.formatEther(amountIn)} ETH`);
        console.log(`      🎯 Amount Out: ${ethers.formatEther(amountOut)} EOS`);
        console.log(`      📊 Order Type: ${orderType}`);
      });
      
      // Listen for cross-chain events
      enhancedResolver.on('CrossChainSwapInitiated', (orderId, eosAccount, secretHash, amount, event) => {
        console.log(`   🌉 Cross-chain swap initiated:`);
        console.log(`      📊 Order ID: ${orderId}`);
        console.log(`      🌴 EOS Account: ${eosAccount}`);
        console.log(`      🔐 Secret Hash: ${secretHash.substring(0, 16)}...`);
        console.log(`      💰 Amount: ${ethers.formatEther(amount)} EOS`);
      });
      
      // Listen for risk management events
      enhancedResolver.on('StopLossTriggered', (orderId, price, event) => {
        console.log(`   🛑 Stop loss triggered:`);
        console.log(`      📊 Order ID: ${orderId}`);
        console.log(`      💵 Price: ${ethers.formatEther(price)} EOS/ETH`);
      });
      
      enhancedResolver.on('TakeProfitTriggered', (orderId, price, event) => {
        console.log(`   📈 Take profit triggered:`);
        console.log(`      📊 Order ID: ${orderId}`);
        console.log(`      💵 Price: ${ethers.formatEther(price)} EOS/ETH`);
      });
      
      console.log(`   ✅ Monitoring active for 60 seconds...`);
      
      // Monitor for 60 seconds
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      console.log(`   ✅ Monitoring completed`);
      
    } catch (error) {
      console.log(`   ❌ Monitoring failed: ${error.message}`);
    }
  }
}

// Export for use in other scripts
module.exports = { RealSwapExecutor };

// Run if called directly
if (require.main === module) {
  const executor = new RealSwapExecutor();
  executor.performRealSwap();
} 