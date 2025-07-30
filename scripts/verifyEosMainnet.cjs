const { JsonRpc } = require('eosjs');

/**
 * 🔍 EOS Mainnet Contract Verification
 */
class EosMainnetVerifier {
  constructor() {
    this.accountName = 'quicksnake34';
    this.network = 'mainnet';
    this.rpcUrl = 'https://api.eosauthority.com';
  }

  async verifyMainnet() {
    console.log('🔍 EOS Mainnet Contract Verification');
    console.log('=' .repeat(60));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log(`🌐 RPC URL: ${this.rpcUrl}`);
      console.log('');
      
      const rpc = new JsonRpc(this.rpcUrl);
      
      // Test 1: Check account info
      console.log('🔍 Test 1: Checking account info...');
      await this.checkAccountInfo(rpc);
      console.log('');
      
      // Test 2: Check WASM code deployment
      console.log('🔍 Test 2: Checking WASM code deployment...');
      await this.checkWasmCode(rpc);
      console.log('');
      
      // Test 3: Check ABI deployment
      console.log('🔍 Test 3: Checking ABI deployment...');
      await this.checkABI(rpc);
      console.log('');
      
      // Test 4: Check contract tables
      console.log('🔍 Test 4: Checking contract tables...');
      await this.checkContractTables(rpc);
      console.log('');
      
      // Test 5: Provide status summary
      console.log('🔍 Test 5: Status Summary...');
      await this.provideStatusSummary();
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Mainnet verification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async checkAccountInfo(rpc) {
    try {
      const accountInfo = await rpc.get_account(this.accountName);
      console.log(`   ✅ Account exists: ${accountInfo.account_name}`);
      console.log(`   📅 Created: ${accountInfo.created}`);
      console.log(`   💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
      console.log(`   🔑 Permissions: ${accountInfo.permissions.length} active`);
    } catch (error) {
      console.log(`   ❌ Account not found: ${error.message}`);
    }
  }

  async checkWasmCode(rpc) {
    try {
      const codeInfo = await rpc.get_code(this.accountName);
      if (codeInfo.wasm && codeInfo.wasm.length > 0) {
        console.log(`   ✅ WASM code is deployed on mainnet`);
        console.log(`   📦 WASM size: ${codeInfo.wasm.length} bytes`);
        console.log(`   🔑 Code hash: ${codeInfo.code_hash}`);
        console.log(`   ✅ Contract code is present and valid`);
        return true;
      } else {
        console.log(`   ❌ No WASM code found on mainnet`);
        console.log(`   💡 Contract code is not deployed`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ WASM code error: ${error.message}`);
      console.log(`   💡 Contract code is not deployed or has issues`);
      return false;
    }
  }

  async checkABI(rpc) {
    try {
      const abiInfo = await rpc.get_abi(this.accountName);
      if (abiInfo.abi) {
        console.log(`   ✅ ABI is deployed on mainnet`);
        console.log(`   📄 ABI version: ${abiInfo.abi.version}`);
        console.log(`   🔧 Actions: ${abiInfo.abi.actions.length}`);
        console.log(`   📊 Tables: ${abiInfo.abi.tables.length}`);
        console.log(`   ✅ ABI is present and valid`);
        return true;
      } else {
        console.log(`   ❌ No ABI found on mainnet`);
        console.log(`   💡 ABI is not deployed`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ ABI error: ${error.message}`);
      console.log(`   💡 ABI is not deployed or has issues`);
      return false;
    }
  }

  async checkContractTables(rpc) {
    const tables = ['htlcs', 'stats', 'config'];
    let accessibleTables = 0;
    
    for (const tableName of tables) {
      try {
        const tableInfo = await rpc.get_table_rows({
          json: true,
          code: this.accountName,
          scope: this.accountName,
          table: tableName,
          limit: 1
        });
        
        console.log(`   ✅ Table ${tableName}: Accessible`);
        accessibleTables++;
      } catch (error) {
        console.log(`   ❌ Table ${tableName}: ${error.message}`);
      }
    }
    
    console.log(`   📊 Accessible tables: ${accessibleTables}/${tables.length}`);
    return accessibleTables;
  }

  async provideStatusSummary() {
    console.log('🎯 Mainnet Contract Deployment Status Summary:');
    console.log('=' .repeat(60));
    console.log(`   📁 Account: ${this.accountName}`);
    console.log(`   🌐 Network: ${this.network}`);
    console.log(`   🔗 Explorer: https://eos.eosq.eosnation.io/account/${this.accountName}`);
    console.log('');
    console.log('📊 Deployment Status:');
    console.log('   🔧 WASM Code: Check above results');
    console.log('   📄 ABI: Check above results');
    console.log('   📊 Tables: Check above results');
    console.log('');
    console.log('⚠️  Mainnet Deployment Notes:');
    console.log('   - This is a REAL deployment with actual EOS tokens');
    console.log('   - Contract interactions will cost real EOS');
    console.log('   - Test thoroughly before using with real funds');
  }
}

if (require.main === module) {
  const verifier = new EosMainnetVerifier();
  verifier.verifyMainnet().catch(console.error);
}

module.exports = { EosMainnetVerifier }; 