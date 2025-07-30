const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

/**
 * 🧪 Test EOS Contract Transaction
 */
class EosTransactionTester {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractName = 'fusionbridge';
    this.network = 'Jungle4 Testnet';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    // Initialize EOS connection
    this.signatureProvider = new JsSignatureProvider([this.privateKey]);
    this.rpc = new JsonRpc(this.rpcUrl);
    this.api = new Api({ rpc: this.rpc, signatureProvider: this.signatureProvider });
  }

  async testTransaction() {
    console.log('🧪 Testing EOS Contract Transaction');
    console.log('=' .repeat(50));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Contract: ${this.contractName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log('');
      
      // Check account balance before
      console.log('💰 Checking account balance before transaction...');
      const balanceBefore = await this.rpc.get_currency_balance('eosio.token', this.accountName, 'EOS');
      console.log(`✅ Balance before: ${balanceBefore.join(', ') || '0.0000 EOS'}`);
      console.log('');
      
      // Generate test data
      console.log('🔑 Generating test data...');
      const secret = crypto.randomBytes(32);
      const hashlock = crypto.createHash('sha256').update(secret).digest('hex');
      const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const amount = '0.0100 EOS'; // Small amount for testing
      
      console.log(`✅ Secret: ${secret.toString('hex').substring(0, 16)}...`);
      console.log(`✅ Hashlock: ${hashlock.substring(0, 16)}...`);
      console.log(`✅ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
      console.log(`✅ Amount: ${amount}`);
      console.log('');
      
      // Test 1: Create HTLC
      console.log('🔨 Test 1: Creating HTLC...');
      const createResult = await this.createHTLC(amount, hashlock, timelock);
      
      if (createResult.success) {
        console.log(`✅ HTLC created successfully!`);
        console.log(`📋 Transaction ID: ${createResult.transaction_id}`);
        console.log(`📋 HTLC ID: ${createResult.htlc_id}`);
        console.log('');
        
        // Test 2: Get HTLC details
        console.log('🔍 Test 2: Getting HTLC details...');
        const htlcDetails = await this.getHTLC(createResult.htlc_id);
        if (htlcDetails.success) {
          console.log(`✅ HTLC details retrieved:`);
          console.log(`   - ID: ${htlcDetails.htlc.id}`);
          console.log(`   - Recipient: ${htlcDetails.htlc.recipient}`);
          console.log(`   - Amount: ${htlcDetails.htlc.amount}`);
          console.log(`   - Hashlock: ${htlcDetails.htlc.hashlock.substring(0, 16)}...`);
          console.log(`   - Timelock: ${htlcDetails.htlc.timelock}`);
          console.log(`   - Status: ${htlcDetails.htlc.status}`);
          console.log('');
          
          // Test 3: Claim HTLC with secret
          console.log('🔓 Test 3: Claiming HTLC with secret...');
          const claimResult = await this.claimHTLC(createResult.htlc_id, secret.toString('hex'));
          
          if (claimResult.success) {
            console.log(`✅ HTLC claimed successfully!`);
            console.log(`📋 Transaction ID: ${claimResult.transaction_id}`);
            console.log('');
            
            // Check balance after
            console.log('💰 Checking account balance after transaction...');
            const balanceAfter = await this.rpc.get_currency_balance('eosio.token', this.accountName, 'EOS');
            console.log(`✅ Balance after: ${balanceAfter.join(', ') || '0.0000 EOS'}`);
            console.log('');
            
          } else {
            console.log(`❌ HTLC claim failed: ${claimResult.error}`);
          }
        } else {
          console.log(`❌ Get HTLC failed: ${htlcDetails.error}`);
        }
      } else {
        console.log(`❌ HTLC creation failed: ${createResult.error}`);
      }
      
      console.log('');
      console.log('🎯 Transaction Test Summary:');
      console.log('=' .repeat(50));
      console.log(`✅ Contract: ${this.contractName}`);
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ Test completed`);
      console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Transaction test failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async createHTLC(amount, hashlock, timelock) {
    try {
      const result = await this.api.transact({
        actions: [{
          account: this.accountName,
          name: 'createhtlc',
          authorization: [{
            actor: this.accountName,
            permission: 'active'
          }],
          data: {
            recipient: this.accountName,
            hashlock: hashlock,
            timelock: timelock,
            amount: amount
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      // Extract HTLC ID from transaction
      let htlc_id = null;
      if (result.processed && result.processed.action_traces) {
        for (const trace of result.processed.action_traces) {
          if (trace.act.name === 'createhtlc' && trace.console) {
            // Parse console output to get HTLC ID
            const match = trace.console.match(/HTLC created with ID: (\d+)/);
            if (match) {
              htlc_id = parseInt(match[1]);
            }
          }
        }
      }
      
      return {
        success: true,
        transaction_id: result.transaction_id,
        htlc_id: htlc_id
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getHTLC(htlc_id) {
    try {
      const result = await this.rpc.get_table_rows({
        json: true,
        code: this.accountName,
        scope: this.accountName,
        table: 'htlcs',
        lower_bound: htlc_id,
        upper_bound: htlc_id,
        limit: 1
      });
      
      if (result.rows && result.rows.length > 0) {
        return {
          success: true,
          htlc: result.rows[0]
        };
      } else {
        return {
          success: false,
          error: 'HTLC not found'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async claimHTLC(htlc_id, secret) {
    try {
      const result = await this.api.transact({
        actions: [{
          account: this.accountName,
          name: 'claimhtlc',
          authorization: [{
            actor: this.accountName,
            permission: 'active'
          }],
          data: {
            htlc_id: htlc_id,
            secret: secret
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      return {
        success: true,
        transaction_id: result.transaction_id
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other scripts
module.exports = { EosTransactionTester };

// Run if called directly
if (require.main === module) {
  const tester = new EosTransactionTester();
  tester.testTransaction();
} 