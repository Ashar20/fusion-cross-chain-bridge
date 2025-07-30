const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

/**
 * 🧪 Direct EOS Contract Test
 */
class EosDirectTester {
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

  async testDirect() {
    console.log('🧪 Direct EOS Contract Test');
    console.log('=' .repeat(50));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Contract: ${this.contractName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log('');
      
      // Check account balance before
      console.log('💰 Checking account balance before...');
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
      
      // Test 1: Try to create HTLC with raw transaction
      console.log('🔨 Test 1: Creating HTLC with raw transaction...');
      const createResult = await this.createHTLCRaw(amount, hashlock, timelock);
      
      if (createResult.success) {
        console.log(`✅ HTLC created successfully!`);
        console.log(`📋 Transaction ID: ${createResult.transaction_id}`);
        console.log('');
        
        // Test 2: Check HTLC in table
        console.log('🔍 Test 2: Checking HTLC in table...');
        await this.checkHTLCTable();
        console.log('');
        
        // Test 3: Try to claim HTLC
        console.log('🔓 Test 3: Claiming HTLC...');
        const claimResult = await this.claimHTLCRaw(createResult.htlc_id, secret.toString('hex'));
        
        if (claimResult.success) {
          console.log(`✅ HTLC claimed successfully!`);
          console.log(`📋 Transaction ID: ${claimResult.transaction_id}`);
          console.log('');
          
          // Check balance after
          console.log('💰 Checking account balance after...');
          const balanceAfter = await this.rpc.get_currency_balance('eosio.token', this.accountName, 'EOS');
          console.log(`✅ Balance after: ${balanceAfter.join(', ') || '0.0000 EOS'}`);
          console.log('');
        } else {
          console.log(`❌ HTLC claim failed: ${claimResult.error}`);
        }
      } else {
        console.log(`❌ HTLC creation failed: ${createResult.error}`);
      }
      
      console.log('');
      console.log('🎯 Direct Test Summary:');
      console.log('=' .repeat(50));
      console.log(`✅ Contract: ${this.contractName}`);
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ Test completed`);
      console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Direct test failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async createHTLCRaw(amount, hashlock, timelock) {
    try {
      // Create raw transaction without ABI
      const transaction = {
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
      };
      
      const result = await this.api.transact(transaction, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      // Try to extract HTLC ID from console output
      let htlc_id = null;
      if (result.processed && result.processed.action_traces) {
        for (const trace of result.processed.action_traces) {
          if (trace.act.name === 'createhtlc' && trace.console) {
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

  async claimHTLCRaw(htlc_id, secret) {
    try {
      const transaction = {
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
      };
      
      const result = await this.api.transact(transaction, {
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

  async checkHTLCTable() {
    try {
      const result = await this.rpc.get_table_rows({
        json: true,
        code: this.accountName,
        scope: this.accountName,
        table: 'htlcs',
        limit: 10
      });
      
      console.log(`   ✅ HTLC table: ${result.rows.length} rows found`);
      
      if (result.rows.length > 0) {
        console.log(`   📋 HTLCs:`);
        result.rows.forEach((htlc, index) => {
          console.log(`      ${index + 1}. ID: ${htlc.id}, Amount: ${htlc.amount}, Status: ${htlc.status}`);
        });
      }
      
    } catch (error) {
      console.log(`   ❌ HTLC table check failed: ${error.message}`);
    }
  }
}

// Export for use in other scripts
module.exports = { EosDirectTester };

// Run if called directly
if (require.main === module) {
  const tester = new EosDirectTester();
  tester.testDirect();
} 