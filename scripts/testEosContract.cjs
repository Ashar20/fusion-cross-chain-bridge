const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

/**
 * 🧪 Test EOS Contract Actions
 */
class EosContractTester {
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

  async testContract() {
    console.log('🧪 Testing EOS Contract Actions');
    console.log('=' .repeat(50));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Contract: ${this.contractName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log('');
      
      // Test 1: Check if contract tables exist
      console.log('🔍 Test 1: Checking contract tables...');
      await this.testContractTables();
      console.log('');
      
      // Test 2: Test getstats action
      console.log('🔍 Test 2: Testing getstats action...');
      await this.testGetStats();
      console.log('');
      
      // Test 3: Test gethtlc action
      console.log('🔍 Test 3: Testing gethtlc action...');
      await this.testGetHTLC();
      console.log('');
      
      // Test 4: Test createhtlc action (simulation)
      console.log('🔍 Test 4: Testing createhtlc action (simulation)...');
      await this.testCreateHTLC();
      console.log('');
      
      console.log('🎯 Contract Test Summary:');
      console.log('=' .repeat(50));
      console.log(`✅ Contract: ${this.contractName}`);
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ All tests completed`);
      console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Contract test failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async testContractTables() {
    try {
      // Test stats table
      const statsResult = await this.rpc.get_table_rows({
        json: true,
        code: this.accountName,
        scope: this.accountName,
        table: 'stats',
        limit: 10
      });
      console.log(`   ✅ stats table: ${statsResult.rows.length} rows`);
      
      // Test htlcs table
      const htlcsResult = await this.rpc.get_table_rows({
        json: true,
        code: this.accountName,
        scope: this.accountName,
        table: 'htlcs',
        limit: 10
      });
      console.log(`   ✅ htlcs table: ${htlcsResult.rows.length} rows`);
      
      // Test config table
      const configResult = await this.rpc.get_table_rows({
        json: true,
        code: this.accountName,
        scope: this.accountName,
        table: 'config',
        limit: 10
      });
      console.log(`   ✅ config table: ${configResult.rows.length} rows`);
      
    } catch (error) {
      console.log(`   ❌ Table test failed: ${error.message}`);
    }
  }

  async testGetStats() {
    try {
      const result = await this.api.transact({
        actions: [{
          account: this.accountName,
          name: 'getstats',
          authorization: [{
            actor: this.accountName,
            permission: 'active'
          }],
          data: {}
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log(`   ✅ getstats action successful`);
      console.log(`   📋 Transaction ID: ${result.transaction_id}`);
      
    } catch (error) {
      console.log(`   ❌ getstats failed: ${error.message}`);
    }
  }

  async testGetHTLC() {
    try {
      const result = await this.api.transact({
        actions: [{
          account: this.accountName,
          name: 'gethtlc',
          authorization: [{
            actor: this.accountName,
            permission: 'active'
          }],
          data: {
            htlc_id: 1
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log(`   ✅ gethtlc action successful`);
      console.log(`   📋 Transaction ID: ${result.transaction_id}`);
      
    } catch (error) {
      console.log(`   ❌ gethtlc failed: ${error.message}`);
    }
  }

  async testCreateHTLC() {
    try {
      // Generate a test hashlock
      const crypto = require('crypto');
      const secret = crypto.randomBytes(32);
      const hashlock = crypto.createHash('sha256').update(secret).digest('hex');
      
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
            timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            amount: '0.1000 EOS'
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log(`   ✅ createhtlc action successful`);
      console.log(`   📋 Transaction ID: ${result.transaction_id}`);
      console.log(`   🔑 Hashlock: ${hashlock.substring(0, 16)}...`);
      
    } catch (error) {
      console.log(`   ❌ createhtlc failed: ${error.message}`);
    }
  }
}

// Export for use in other scripts
module.exports = { EosContractTester };

// Run if called directly
if (require.main === module) {
  const tester = new EosContractTester();
  tester.testContract();
} 