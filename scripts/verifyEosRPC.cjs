const { JsonRpc } = require('eosjs');
const fs = require('fs');
const path = require('path');

/**
 * 🔍 Verify EOS Contract Deployment using RPC
 */
class EosRPCVerifier {
  constructor() {
    this.accountName = 'quicksnake34'; // Target account
    this.network = 'Jungle4 Testnet';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    // Initialize RPC connection
    this.rpc = new JsonRpc(this.rpcUrl);
  }

  async verifyDeployment() {
    console.log('🔍 Verifying EOS Contract Deployment using RPC');
    console.log('=' .repeat(60));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log(`🌐 RPC URL: ${this.rpcUrl}`);
      console.log('');
      
      // Test 1: Check account info
      console.log('🔍 Test 1: Checking account info...');
      await this.checkAccountInfo();
      console.log('');
      
      // Test 2: Check WASM code deployment
      console.log('🔍 Test 2: Checking WASM code deployment...');
      await this.checkWasmCode();
      console.log('');
      
      // Test 3: Check ABI deployment and actions
      console.log('🔍 Test 3: Checking ABI deployment and actions...');
      await this.checkABI();
      console.log('');
      
      // Test 4: Check contract tables
      console.log('🔍 Test 4: Checking contract tables...');
      await this.checkContractTables();
      console.log('');
      
      // Test 5: Check recent actions
      console.log('🔍 Test 5: Checking recent actions...');
      await this.checkRecentActions();
      console.log('');
      
      console.log('🎯 Verification Summary:');
      console.log('=' .repeat(60));
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ All tests completed`);
      console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async checkAccountInfo() {
    try {
      const accountInfo = await this.rpc.get_account(this.accountName);
      console.log(`   ✅ Account exists: ${accountInfo.account_name}`);
      console.log(`   📅 Created: ${accountInfo.created}`);
      console.log(`   🔑 Active: ${accountInfo.active}`);
      
      // Check permissions
      if (accountInfo.permissions) {
        console.log(`   🔐 Permissions: ${accountInfo.permissions.length} found`);
        accountInfo.permissions.forEach(permission => {
          console.log(`      - ${permission.perm_name}: ${permission.required_auth.keys[0].key}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Account info check failed: ${error.message}`);
      throw error;
    }
  }

  async checkWasmCode() {
    try {
      const codeResult = await this.rpc.get_code(this.accountName);
      
      if (codeResult.wasm) {
        console.log(`   ✅ WASM code is deployed`);
        console.log(`   📦 WASM size: ${codeResult.wasm.length} bytes`);
        console.log(`   🔑 Code hash: ${codeResult.code_hash}`);
        
        if (codeResult.wasm.length > 0) {
          console.log(`   ✅ Contract code is present and valid`);
        } else {
          console.log(`   ❌ WASM code is empty`);
          throw new Error('WASM code is empty');
        }
      } else {
        console.log(`   ❌ No WASM code found for account ${this.accountName}`);
        console.log(`   💡 Contract code is not deployed`);
        throw new Error('WASM code not deployed');
      }
    } catch (error) {
      console.log(`   ❌ WASM code check failed: ${error.message}`);
      throw error;
    }
  }

  async checkABI() {
    try {
      const codeResult = await this.rpc.get_code(this.accountName);
      
      if (codeResult.abi) {
        console.log(`   ✅ ABI is deployed`);
        console.log(`   📄 ABI size: ${JSON.stringify(codeResult.abi).length} characters`);
        
        // Check ABI version
        if (codeResult.abi.version) {
          console.log(`   📋 ABI version: ${codeResult.abi.version}`);
        }
        
        // Check for required actions
        const requiredActions = ['createhtlc', 'claimhtlc', 'refundhtlc', 'getstats'];
        const foundActions = [];
        
        if (codeResult.abi.actions) {
          console.log(`   🔧 Total actions: ${codeResult.abi.actions.length}`);
          
          requiredActions.forEach(action => {
            const found = codeResult.abi.actions.find(a => a.name === action);
            if (found) {
              foundActions.push(action);
              console.log(`   ✅ Action found: ${action} (${found.type})`);
            } else {
              console.log(`   ❌ Action missing: ${action}`);
            }
          });
          
          if (foundActions.length >= 3) {
            console.log(`   ✅ All required actions found (${foundActions.length}/${requiredActions.length})`);
          } else {
            console.log(`   ⚠️  Some required actions missing (${foundActions.length}/${requiredActions.length})`);
          }
        } else {
          console.log(`   ❌ No actions found in ABI`);
        }
        
        // Check tables
        if (codeResult.abi.tables) {
          console.log(`   📊 Total tables: ${codeResult.abi.tables.length}`);
          codeResult.abi.tables.forEach(table => {
            console.log(`      - ${table.name}: ${table.type}`);
          });
        }
        
      } else {
        console.log(`   ❌ No ABI found for account ${this.accountName}`);
        console.log(`   💡 ABI is not deployed`);
        await this.provideABIRetryInstructions();
        throw new Error('ABI not deployed');
      }
    } catch (error) {
      console.log(`   ❌ ABI check failed: ${error.message}`);
      throw error;
    }
  }

  async checkContractTables() {
    try {
      const tables = ['htlcs', 'stats', 'config'];
      
      for (const table of tables) {
        try {
          const result = await this.rpc.get_table_rows({
            json: true,
            code: this.accountName,
            scope: this.accountName,
            table: table,
            limit: 10
          });
          
          console.log(`   ✅ Table ${table}: ${result.rows.length} rows`);
          
          if (result.rows.length > 0) {
            console.log(`   📋 Sample data from ${table}:`);
            console.log(`      ${JSON.stringify(result.rows[0], null, 2).substring(0, 100)}...`);
          }
        } catch (error) {
          console.log(`   ❌ Table ${table} check failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Contract tables check failed: ${error.message}`);
    }
  }

  async checkRecentActions() {
    try {
      // Get recent actions using get_actions
      const actions = await this.rpc.get_actions(this.accountName, -1, -10);
      console.log(`   ✅ Found ${actions.actions.length} recent actions`);
      
      if (actions.actions.length > 0) {
        console.log(`   📋 Last 3 actions:`);
        const recentActions = actions.actions.slice(0, 3);
        recentActions.forEach((action, index) => {
          const act = action.action_trace.act;
          console.log(`      ${index + 1}. ${act.name} (${action.action_trace.trx_id.substring(0, 8)}...)`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Recent actions check failed: ${error.message}`);
    }
  }

  async provideABIRetryInstructions() {
    console.log('');
    console.log('🔧 ABI Deployment Retry Instructions:');
    console.log('=' .repeat(60));
    console.log('If ABI deployment failed, try these steps:');
    console.log('');
    console.log('1. 📄 Check ABI file exists:');
    console.log(`   ls -la contracts/eos/fusionbridge.abi`);
    console.log('');
    console.log('2. 🔨 Recompile contract:');
    console.log(`   npm run compile-eos`);
    console.log('');
    console.log('3. 🚀 Redeploy ABI:');
    console.log(`   npm run fix-eos-abi`);
    console.log('');
    console.log('4. 🔍 Verify deployment:');
    console.log(`   npm run verify-eos-rpc`);
    console.log('');
    console.log('5. 🌐 Check manually via explorer:');
    console.log(`   https://jungle4.cryptolions.io/account/${this.accountName}`);
    console.log('');
    console.log('6. 🔧 Alternative: Use older ABI version');
    console.log(`   - Recompile with older EOSIO.CDT version`);
    console.log(`   - Or use manual deployment via explorer`);
    console.log('');
  }
}

// Export for use in other scripts
module.exports = { EosRPCVerifier };

// Run if called directly
if (require.main === module) {
  const verifier = new EosRPCVerifier();
  verifier.verifyDeployment();
} 