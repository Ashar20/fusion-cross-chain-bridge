const { JsonRpc } = require('eosjs');
const crypto = require('crypto');

/**
 * 🧪 Simple EOS Contract Test (No ABI)
 */
class EosSimpleTester {
  constructor() {
    this.accountName = 'quicksnake34';
    this.network = 'Jungle4 Testnet';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    // Initialize RPC connection
    this.rpc = new JsonRpc(this.rpcUrl);
  }

  async testSimple() {
    console.log('🧪 Simple EOS Contract Test (No ABI)');
    console.log('=' .repeat(50));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log('');
      
      // Test 1: Check account info
      console.log('🔍 Test 1: Checking account info...');
      const accountInfo = await this.rpc.get_account(this.accountName);
      console.log(`✅ Account exists: ${accountInfo.account_name}`);
      console.log(`✅ Created: ${accountInfo.created}`);
      console.log(`✅ Active: ${accountInfo.active}`);
      console.log('');
      
      // Test 2: Check account balance
      console.log('💰 Test 2: Checking account balance...');
      const balance = await this.rpc.get_currency_balance('eosio.token', this.accountName, 'EOS');
      console.log(`✅ EOS Balance: ${balance.join(', ') || '0.0000 EOS'}`);
      console.log('');
      
      // Test 3: Check contract tables directly
      console.log('🔍 Test 3: Checking contract tables...');
      await this.testTables();
      console.log('');
      
      // Test 4: Check recent actions
      console.log('🔍 Test 4: Checking recent actions...');
      await this.checkRecentActions();
      console.log('');
      
      // Test 5: Check contract code
      console.log('🔍 Test 5: Checking contract code...');
      await this.checkContractCode();
      console.log('');
      
      console.log('🎯 Simple Test Summary:');
      console.log('=' .repeat(50));
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ All basic tests completed`);
      console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Simple test failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async testTables() {
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
      
      // Show table contents if any
      if (htlcsResult.rows.length > 0) {
        console.log(`   📋 HTLCs found:`);
        htlcsResult.rows.forEach((htlc, index) => {
          console.log(`      ${index + 1}. ID: ${htlc.id}, Amount: ${htlc.amount}, Status: ${htlc.status}`);
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Table test failed: ${error.message}`);
    }
  }

  async checkRecentActions() {
    try {
      const actions = await this.rpc.get_actions(this.accountName, -1, -20);
      console.log(`   ✅ Found ${actions.actions.length} recent actions`);
      
      // Show last 5 actions
      const recentActions = actions.actions.slice(0, 5);
      console.log(`   📋 Last 5 actions:`);
      recentActions.forEach((action, index) => {
        console.log(`      ${index + 1}. ${action.action_trace.act.name} (${action.action_trace.trx_id.substring(0, 8)}...)`);
      });
      
    } catch (error) {
      console.log(`   ❌ Actions check failed: ${error.message}`);
    }
  }

  async checkContractCode() {
    try {
      const codeResult = await this.rpc.get_code(this.accountName);
      
      if (codeResult.wasm) {
        console.log(`   ✅ Contract code exists: ${codeResult.wasm.length} bytes`);
        
        if (codeResult.abi) {
          console.log(`   ✅ Contract ABI exists: ${JSON.stringify(codeResult.abi).length} characters`);
          
          if (codeResult.abi.actions) {
            console.log(`   ✅ Contract has ${codeResult.abi.actions.length} actions:`);
            codeResult.abi.actions.forEach(action => {
              console.log(`      - ${action.name}: ${action.type}`);
            });
          }
        } else {
          console.log(`   ⚠️  No ABI found`);
        }
      } else {
        console.log(`   ❌ No contract code found`);
      }
      
    } catch (error) {
      console.log(`   ❌ Contract code check failed: ${error.message}`);
    }
  }
}

// Export for use in other scripts
module.exports = { EosSimpleTester };

// Run if called directly
if (require.main === module) {
  const tester = new EosSimpleTester();
  tester.testSimple();
} 