const { ethers } = require('ethers');
require('dotenv').config();

/**
 * 🔍 Check Transaction Status and Intent Details
 */
class TransactionChecker {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
    
    // Load resolver ABI
    const resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
    this.resolver = new ethers.Contract(this.resolverAddress, resolverArtifact.abi, this.provider);
  }
  
  /**
   * 🔍 Check transaction status
   */
  async checkTransaction(txHash) {
    console.log(`🔍 Checking transaction: ${txHash}`);
    console.log('=' .repeat(60));
    
    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        console.log('❌ Transaction not found or not yet mined');
        return false;
      }
      
      console.log('📋 Transaction Details:');
      console.log(`   Block Number: ${receipt.blockNumber}`);
      console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
      console.log(`   Gas Used: ${receipt.gasUsed}`);
      console.log(`   From: ${receipt.from}`);
      console.log(`   To: ${receipt.to}`);
      
      if (receipt.status === 0) {
        console.log('❌ Transaction failed');
        return false;
      }
      
      console.log('✅ Transaction successful');
      return true;
      
    } catch (error) {
      console.log('❌ Error checking transaction:', error.message);
      return false;
    }
  }
  
  /**
   * 🔍 Check intent status
   */
  async checkIntent(swapId) {
    console.log(`\n🔍 Checking intent: ${swapId}`);
    console.log('=' .repeat(60));
    
    try {
      const intent = await this.resolver.getIntent(swapId);
      
      console.log('📋 Intent Details:');
      console.log(`   User: ${intent.user}`);
      console.log(`   Amount: ${ethers.formatEther(intent.amount)} ETH`);
      console.log(`   Executed: ${intent.executed ? '✅ Yes' : '❌ No'}`);
      console.log(`   Claimed: ${intent.claimed ? '✅ Yes' : '❌ No'}`);
      console.log(`   Escrow Address: ${intent.escrowAddress}`);
      console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
      console.log(`   Hashlock: ${intent.hashlock}`);
      
      return intent;
      
    } catch (error) {
      console.log('❌ Error checking intent:', error.message);
      return null;
    }
  }
  
  /**
   * 🔍 Check recent intents
   */
  async checkRecentIntents() {
    console.log('\n🔍 Checking recent intents...');
    console.log('=' .repeat(60));
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);
      
      const filter = {
        address: this.resolverAddress,
        topics: [ethers.id('IntentCreated(bytes32,address,bytes32)')],
        fromBlock: fromBlock,
        toBlock: 'latest'
      };
      
      const logs = await this.provider.getLogs(filter);
      console.log(`📋 Found ${logs.length} intent creation events`);
      
      for (const log of logs) {
        try {
          const iface = new ethers.Interface(this.resolver.interface);
          const parsedLog = iface.parseLog(log);
          
          if (parsedLog && parsedLog.name === 'IntentCreated') {
            const swapId = parsedLog.args[0];
            const user = parsedLog.args[1];
            const orderHash = parsedLog.args[2];
            
            console.log(`\n📋 Intent: ${swapId}`);
            console.log(`   User: ${user}`);
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Block: ${log.blockNumber}`);
            
            // Check intent status
            await this.checkIntent(swapId);
          }
        } catch (error) {
          console.log(`⚠️ Error parsing log: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Error checking recent intents:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new TransactionChecker();
  
  const txHash = process.argv[2];
  const swapId = process.argv[3];
  
  if (txHash) {
    checker.checkTransaction(txHash);
  }
  
  if (swapId) {
    checker.checkIntent(swapId);
  }
  
  if (!txHash && !swapId) {
    checker.checkRecentIntents();
  }
}

module.exports = { TransactionChecker }; 