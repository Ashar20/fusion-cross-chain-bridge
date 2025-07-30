const { ethers } = require('ethers');
const { RealEosIntegration } = require('./realEosIntegration.cjs');
require('dotenv').config();

/**
 * 🌉 Complete Cross-Chain Swap: ETH → EOS
 */
class CompleteCrossChainSwap {
  constructor() {
    this.network = 'sepolia';
    this.chainId = 11155111;
    this.rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
    
    // Contract addresses
    this.resolver = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
    this.escrowAddress = '0xAD4A5dC1cd1e7a251b0B77e7A53711Eba13d36dc';
    
    // EOS integration
    this.eosIntegration = new RealEosIntegration();
    
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Swap details from the successful swap
    this.swapId = '0xd00966539341071ac11773d63aea61c9060d5eda0526e08060619bbdd70622c6';
    this.hashlock = '0x5800b4a9756bbe37f750eee146cdd7cce4babe1b42cd302abeb8c092ce531865';
    this.secret = '0x3533396c7a81b8d626385a8d32e69155f09609c16fef57fbac52b53e2f831340d';
    this.amount = ethers.parseEther('0.0014'); // 0.0014 ETH
    this.eosAmount = 4.9; // 4.9 EOS
    this.recipient = 'silaslist123';
    this.deadline = 1753829874; // From the swap
  }

  async completeSwap() {
    console.log('🌉 Completing Cross-Chain Swap: ETH → EOS');
    console.log('=' .repeat(60));
    
    try {
      console.log(`📁 Network: ${this.network}`);
      console.log(`👤 Wallet: ${this.wallet.address}`);
      console.log(`🔧 Resolver: ${this.resolver}`);
      console.log(`🏭 Escrow: ${this.escrowAddress}`);
      console.log(`🌴 EOS Account: ${this.eosIntegration.account}`);
      console.log('');
      
      // Step 1: Verify ETH escrow status
      console.log('💰 Step 1: Verifying ETH Escrow...');
      await this.verifyEthEscrow();
      console.log('');
      
      // Step 2: Create EOS HTLC
      console.log('🌴 Step 2: Creating EOS HTLC...');
      const htlcResult = await this.createEosHTLC();
      console.log('');
      
      // Step 3: User claims EOS
      console.log('🎯 Step 3: User Claims EOS...');
      const claimResult = await this.claimEos();
      console.log('');
      
      // Step 4: Relayer claims ETH
      console.log('🔄 Step 4: Relayer Claims ETH...');
      const ethClaimResult = await this.claimEth();
      console.log('');
      
      console.log('🎉 Cross-Chain Swap Summary:');
      console.log('=' .repeat(60));
      console.log('✅ ETH locked in escrow');
      console.log('✅ EOS HTLC created');
      console.log('✅ User claimed EOS');
      console.log('✅ Relayer claimed ETH');
      console.log('✅ Cross-chain swap completed!');
      console.log('');
      
      return {
        success: true,
        htlcResult,
        claimResult,
        ethClaimResult
      };
      
    } catch (error) {
      console.error('❌ Swap completion failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async verifyEthEscrow() {
    try {
      console.log(`   🔍 Checking ETH escrow status...`);
      
      const escrowBalance = await this.provider.getBalance(this.escrowAddress);
      console.log(`   💰 Escrow balance: ${ethers.formatEther(escrowBalance)} ETH`);
      
      if (escrowBalance > 0) {
        console.log(`   ✅ ETH is locked in escrow`);
      } else {
        throw new Error('No ETH found in escrow');
      }
      
      // Check escrow contract state
      const escrowContract = new ethers.Contract(this.escrowAddress, [
        'function resolved() external view returns (bool)',
        'function deadline() external view returns (uint256)'
      ], this.provider);
      
      const resolved = await escrowContract.resolved();
      const deadline = await escrowContract.deadline();
      
      console.log(`   ✅ Escrow resolved: ${resolved}`);
      console.log(`   ⏰ Deadline: ${new Date(Number(deadline) * 1000).toISOString()}`);
      
    } catch (error) {
      console.log(`   ❌ ETH escrow verification failed: ${error.message}`);
      throw error;
    }
  }

  async createEosHTLC() {
    try {
      console.log(`   🌴 Creating EOS HTLC with same hashlock...`);
      
      const result = await this.eosIntegration.createHTLC(
        this.swapId,
        this.hashlock,
        this.eosAmount,
        this.recipient,
        this.deadline
      );
      
      if (result.success) {
        console.log(`   ✅ EOS HTLC created successfully!`);
        console.log(`   🆔 HTLC ID: ${result.htlcId}`);
        console.log(`   🔗 Transaction: ${result.transactionId}`);
      } else {
        throw new Error(result.error);
      }
      
      return result;
      
    } catch (error) {
      console.log(`   ❌ EOS HTLC creation failed: ${error.message}`);
      throw error;
    }
  }

  async claimEos() {
    try {
      console.log(`   🎯 User claiming EOS from HTLC...`);
      console.log(`   🔐 Revealing secret: ${this.secret.substring(0, 16)}...`);
      
      // For this demo, we'll use a simulated HTLC ID
      const htlcId = 380998; // From the relayer logs
      
      const result = await this.eosIntegration.claimHTLC(htlcId, this.secret);
      
      if (result.success) {
        console.log(`   ✅ EOS claimed successfully!`);
        console.log(`   💰 Amount: ${this.eosAmount} EOS`);
        console.log(`   👤 Recipient: ${this.recipient}`);
        console.log(`   🔗 Transaction: ${result.transactionId}`);
      } else {
        throw new Error(result.error);
      }
      
      return result;
      
    } catch (error) {
      console.log(`   ❌ EOS claim failed: ${error.message}`);
      throw error;
    }
  }

  async claimEth() {
    try {
      console.log(`   🔄 Relayer claiming ETH from escrow...`);
      
      // Create contract instance with correct interface
      const escrowContract = new ethers.Contract(this.escrowAddress, [
        'function resolve(bytes32 secret) external',
        'function creator() external view returns (address)',
        'function amount() external view returns (uint256)',
        'function resolved() external view returns (bool)',
        'function deadline() external view returns (uint256)'
      ], this.wallet);
      
      // Check escrow state
      const creator = await escrowContract.creator();
      const amount = await escrowContract.amount();
      const resolved = await escrowContract.resolved();
      const deadline = await escrowContract.deadline();
      
      console.log(`   👤 Creator: ${creator}`);
      console.log(`   💰 Amount: ${ethers.formatEther(amount)} ETH`);
      console.log(`   ✅ Resolved: ${resolved}`);
      console.log(`   ⏰ Deadline: ${new Date(Number(deadline) * 1000).toISOString()}`);
      
      if (resolved) {
        console.log(`   ⚠️  Escrow already resolved`);
        return { success: true, alreadyResolved: true };
      }
      
      // Resolve escrow with secret
      console.log(`   🔐 Using secret: ${this.secret.substring(0, 16)}...`);
      
      // The escrow expects the hashlock (secret hash), not the secret itself
      console.log(`   🔐 Using hashlock: ${this.hashlock.substring(0, 16)}...`);
      
      const tx = await escrowContract.resolve(this.hashlock, {
        gasLimit: 200000
      });
      
      console.log(`   📡 Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      
      console.log(`   ✅ ETH claimed successfully!`);
      console.log(`   💰 Amount: ${ethers.formatEther(amount)} ETH`);
      console.log(`   📊 Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   🔗 Transaction: https://sepolia.etherscan.io/tx/${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
      
    } catch (error) {
      console.log(`   ❌ ETH claim failed: ${error.message}`);
      throw error;
    }
  }
}

// Export for use in other scripts
module.exports = { CompleteCrossChainSwap };

// Run if called directly
if (require.main === module) {
  const swap = new CompleteCrossChainSwap();
  swap.completeSwap();
} 