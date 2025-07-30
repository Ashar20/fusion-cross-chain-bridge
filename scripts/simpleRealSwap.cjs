const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * 🚀 Simple Real Swap using Gasless1inchResolver
 */
class SimpleRealSwap {
  constructor() {
    this.network = 'sepolia';
    this.chainId = 11155111;
    this.rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
    
    // Contract addresses
    this.resolver = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a'; // Gasless1inchResolver
    this.escrowFactory = '0x140B9EF6CAf84cFc65fc7Ed9D415046DF7d86712';
    
    // EOS account
    this.eosAccount = 'quicksnake34';
    
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Load contract ABIs
    this.resolverABI = this.loadABI('Gasless1inchResolver');
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

  async performSwap() {
    console.log('🚀 Performing Real ETH → EOS Swap');
    console.log('=' .repeat(50));
    
    try {
      console.log(`📁 Network: ${this.network}`);
      console.log(`👤 Wallet: ${this.wallet.address}`);
      console.log(`🔧 Resolver: ${this.resolver}`);
      console.log(`🌴 EOS Account: ${this.eosAccount}`);
      console.log('');
      
      // Check wallet balance
      console.log('💰 Step 1: Checking wallet balance...');
      await this.checkBalance();
      console.log('');
      
      // Create intent
      console.log('📊 Step 2: Creating Intent...');
      const intentResult = await this.createIntent();
      console.log('');
      
      // Execute intent
      console.log('🚀 Step 3: Executing Intent...');
      const executionResult = await this.executeIntent(intentResult);
      console.log('');
      
      console.log('🎯 Real Swap Summary:');
      console.log('=' .repeat(50));
      console.log('✅ Intent created successfully');
      console.log('✅ Intent executed with gasless execution');
      console.log('✅ ETH locked in escrow');
      console.log('✅ Ready for EOS HTLC creation');
      console.log('');
      
      return { success: true, intentResult, executionResult };
      
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

  async createIntent() {
    try {
      console.log(`   📊 Creating Intent for ETH → EOS Swap...`);
      
      // Generate secret for HTLC
      const secret = ethers.randomBytes(32);
      const secretHash = ethers.keccak256(secret);
      
      // Generate swap ID and order hash
      const swapId = ethers.keccak256(ethers.toUtf8Bytes(`swap_${Date.now()}_${this.wallet.address}`));
      const orderHash = ethers.keccak256(ethers.toUtf8Bytes(`order_${Date.now()}_${this.wallet.address}`));
      
      // Create intent parameters
      const intentParams = {
        swapId: swapId,
        tokenIn: ethers.ZeroAddress, // ETH
        tokenOut: '0x1234567890123456789012345678901234567890', // Mock EOS equivalent
        amountIn: ethers.parseEther('0.05'), // 0.05 ETH
        amountOutMin: ethers.parseEther('2.5'), // 2.5 EOS equivalent
        beneficiary: this.wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        orderHash: orderHash,
        secret: secret,
        secretHash: secretHash,
        eosAccount: this.eosAccount
      };
      
      console.log(`   📋 Intent Parameters:`);
      console.log(`      🔑 Swap ID: ${intentParams.swapId.substring(0, 16)}...`);
      console.log(`      💰 Amount In: ${ethers.formatEther(intentParams.amountIn)} ETH`);
      console.log(`      🎯 Min Amount Out: ${ethers.formatEther(intentParams.amountOutMin)} EOS`);
      console.log(`      👤 Beneficiary: ${intentParams.beneficiary}`);
      console.log(`      🌴 EOS Account: ${intentParams.eosAccount}`);
      console.log(`      🔐 Secret Hash: ${intentParams.secretHash.substring(0, 16)}...`);
      console.log(`      📋 Order Hash: ${intentParams.orderHash.substring(0, 16)}...`);
      console.log(`      ⏰ Deadline: ${new Date(intentParams.deadline * 1000).toISOString()}`);
      
      // Create EIP-712 signature for the intent
      const domain = {
        name: 'Gasless1inchResolver',
        version: '1.0.0',
        chainId: this.chainId,
        verifyingContract: this.resolver
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
        swapId: intentParams.swapId,
        user: intentParams.beneficiary,
        beneficiary: intentParams.beneficiary,
        amount: intentParams.amountIn,
        orderHash: intentParams.orderHash,
        hashlock: intentParams.secretHash,
        deadline: intentParams.deadline,
        nonce: 0 // Will be incremented by contract
      };
      
      const signature = await this.wallet.signTypedData(domain, types, message);
      
      console.log(`   ✍️  Intent signed with signature: ${signature.substring(0, 16)}...`);
      console.log(`   ✅ Intent created successfully`);
      
      return {
        intentParams,
        signature,
        secret,
        secretHash
      };
      
    } catch (error) {
      console.log(`   ❌ Intent creation failed: ${error.message}`);
      throw error;
    }
  }

  async executeIntent(intentResult) {
    try {
      console.log(`   🚀 Executing Intent...`);
      
      // Create contract instance
      const resolver = new ethers.Contract(
        this.resolver,
        this.resolverABI,
        this.wallet
      );
      
      // First create the intent
      console.log(`   📝 Creating intent on-chain...`);
      const createTx = await resolver.createIntent(
        intentResult.intentParams.swapId,
        intentResult.intentParams.beneficiary,
        intentResult.intentParams.amountIn,
        intentResult.intentParams.orderHash,
        intentResult.intentParams.secretHash,
        intentResult.intentParams.deadline,
        intentResult.signature,
        {
          gasLimit: 300000
        }
      );
      
      console.log(`   📡 Create intent transaction sent: ${createTx.hash}`);
      await createTx.wait();
      console.log(`   ✅ Intent created on-chain`);
      
      // Then execute the intent
      console.log(`   🚀 Executing intent...`);
      const executeTx = await resolver.executeIntent(
        intentResult.intentParams.swapId,
        {
          value: intentResult.intentParams.amountIn,
          gasLimit: 500000
        }
      );
      
      console.log(`   📡 Execute intent transaction sent: ${executeTx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      const receipt = await executeTx.wait();
      
      console.log(`   ✅ Intent executed successfully!`);
      console.log(`   📊 Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   🔗 Transaction: https://sepolia.etherscan.io/tx/${executeTx.hash}`);
      
      return {
        createTxHash: createTx.hash,
        executeTxHash: executeTx.hash,
        receipt,
        intentResult
      };
      
    } catch (error) {
      console.log(`   ❌ Intent execution failed: ${error.message}`);
      throw error;
    }
  }
}

// Export for use in other scripts
module.exports = { SimpleRealSwap };

// Run if called directly
if (require.main === module) {
  const swap = new SimpleRealSwap();
  swap.performSwap();
} 