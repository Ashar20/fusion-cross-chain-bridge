const { ethers } = require('ethers');
require('dotenv').config();

/**
 * 🚀 Manual Intent Execution Script
 * 
 * This script allows you to manually execute an intent when the relayer isn't running.
 * Useful for testing and development.
 */
class ManualIntentExecutor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Contract addresses
    this.resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
    
    // Load contract ABI
    const resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
    this.resolver = new ethers.Contract(this.resolverAddress, resolverArtifact.abi, this.wallet);
    
    console.log('🚀 Manual Intent Executor Initialized');
    console.log(`📍 Resolver: ${this.resolverAddress}`);
    console.log(`🔑 Wallet: ${this.wallet.address}`);
  }
  
  /**
   * 🎯 Execute a specific intent
   */
  async executeIntent(swapId, amount) {
    try {
      console.log(`\n🎯 Executing intent: ${swapId}`);
      console.log(`💰 Amount: ${ethers.formatEther(amount)} ETH`);
      
      // Get intent details first
      const intent = await this.resolver.getIntent(swapId);
      console.log(`📋 Intent details:`, {
        user: intent.user,
        beneficiary: intent.beneficiary,
        amount: ethers.formatEther(intent.amount),
        executed: intent.executed,
        claimed: intent.claimed,
        escrowAddress: intent.escrowAddress
      });
      
      if (intent.executed) {
        console.log('✅ Intent already executed');
        return { success: true, escrowAddress: intent.escrowAddress };
      }
      
      // Execute the intent
      const tx = await this.resolver.executeIntent(swapId, {
        value: amount,
        gasLimit: 300000
      });
      
      console.log(`📍 Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Get updated intent details
      const updatedIntent = await this.resolver.getIntent(swapId);
      console.log(`🏠 Escrow created: ${updatedIntent.escrowAddress}`);
      
      return {
        success: true,
        transactionHash: tx.hash,
        escrowAddress: updatedIntent.escrowAddress
      };
      
    } catch (error) {
      console.error('❌ Failed to execute intent:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 📋 List all intents for a user
   */
  async listUserIntents(userAddress) {
    try {
      console.log(`\n📋 Listing intents for user: ${userAddress}`);
      
      // Note: This is a simplified approach. In production, you'd need to track intent IDs
      // For now, we'll just show the user's nonce
      const nonce = await this.resolver.userNonces(userAddress);
      console.log(`📊 User nonce: ${nonce}`);
      
      return { nonce };
      
    } catch (error) {
      console.error('❌ Failed to list intents:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 🔍 Get intent details
   */
  async getIntentDetails(swapId) {
    try {
      console.log(`\n🔍 Getting details for intent: ${swapId}`);
      
      const intent = await this.resolver.getIntent(swapId);
      
      console.log(`📋 Intent Details:`);
      console.log(`   User: ${intent.user}`);
      console.log(`   Beneficiary: ${intent.beneficiary}`);
      console.log(`   Amount: ${ethers.formatEther(intent.amount)} ETH`);
      console.log(`   Order Hash: ${intent.orderHash}`);
      console.log(`   Hashlock: ${intent.hashlock}`);
      console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
      console.log(`   Nonce: ${intent.nonce}`);
      console.log(`   Executed: ${intent.executed}`);
      console.log(`   Claimed: ${intent.claimed}`);
      console.log(`   Escrow Address: ${intent.escrowAddress}`);
      
      return intent;
      
    } catch (error) {
      console.error('❌ Failed to get intent details:', error.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * 🚀 Main execution function
 */
async function main() {
  const executor = new ManualIntentExecutor();
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'execute':
      if (args.length < 3) {
        console.log('Usage: node manualExecuteIntent.js execute <swapId> <amountInEth>');
        return;
      }
      const swapId = args[1];
      const amount = ethers.parseEther(args[2]);
      await executor.executeIntent(swapId, amount);
      break;
      
    case 'details':
      if (args.length < 2) {
        console.log('Usage: node manualExecuteIntent.js details <swapId>');
        return;
      }
      await executor.getIntentDetails(args[1]);
      break;
      
    case 'list':
      if (args.length < 2) {
        console.log('Usage: node manualExecuteIntent.js list <userAddress>');
        return;
      }
      await executor.listUserIntents(args[1]);
      break;
      
    default:
      console.log('🚀 Manual Intent Executor');
      console.log('');
      console.log('Usage:');
      console.log('  node manualExecuteIntent.js execute <swapId> <amountInEth>');
      console.log('  node manualExecuteIntent.js details <swapId>');
      console.log('  node manualExecuteIntent.js list <userAddress>');
      console.log('');
      console.log('Examples:');
      console.log('  node manualExecuteIntent.js execute 0x123... 0.001');
      console.log('  node manualExecuteIntent.js details 0x123...');
      console.log('  node manualExecuteIntent.js list 0x456...');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ManualIntentExecutor; 