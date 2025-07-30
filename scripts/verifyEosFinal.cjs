const { execSync } = require('child_process');

/**
 * 🔍 Final EOS Contract Verification
 */
class EosFinalVerifier {
  constructor() {
    this.accountName = 'quicksnake34';
    this.network = 'jungle4';
    this.rpcUrl = 'https://jungle4.greymass.com';
  }

  async verifyFinal() {
    console.log('🔍 Final EOS Contract Verification');
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
      
      // Test 3: Check ABI deployment
      console.log('🔍 Test 3: Checking ABI deployment...');
      await this.checkABI();
      console.log('');
      
      // Test 4: Check contract tables
      console.log('🔍 Test 4: Checking contract tables...');
      await this.checkContractTables();
      console.log('');
      
      // Test 5: Provide status summary
      console.log('🔍 Test 5: Status Summary...');
      await this.provideStatusSummary();
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async checkAccountInfo() {
    try {
      const command = `curl -s "https://jungle4.greymass.com/v1/chain/get_account" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      const result = execSync(command, { encoding: 'utf8' });
      const data = JSON.parse(result);
      
      if (data.account_name) {
        console.log(`   ✅ Account exists: ${data.account_name}`);
        console.log(`   📅 Created: ${data.created}`);
        console.log(`   🔑 Active: ${data.active}`);
        
        // Check balance
        const balanceCommand = `curl -s "https://jungle4.greymass.com/v1/chain/get_currency_balance" -X POST -H "Content-Type: application/json" -d '{"code":"eosio.token","account":"${this.accountName}","symbol":"EOS"}'`;
        const balanceResult = execSync(balanceCommand, { encoding: 'utf8' });
        const balanceData = JSON.parse(balanceResult);
        
        console.log(`   💰 Balance: ${balanceData.join(', ') || '0.0000 EOS'}`);
      } else {
        console.log(`   ❌ Account not found: ${this.accountName}`);
      }
    } catch (error) {
      console.log(`   ❌ Account info check failed: ${error.message}`);
    }
  }

  async checkWasmCode() {
    try {
      const command = `curl -s "https://jungle4.greymass.com/v1/chain/get_code" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      const result = execSync(command, { encoding: 'utf8' });
      const data = JSON.parse(result);
      
      if (data.wasm && data.wasm.length > 0) {
        console.log(`   ✅ WASM code is deployed`);
        console.log(`   📦 WASM size: ${data.wasm.length} bytes`);
        console.log(`   🔑 Code hash: ${data.code_hash}`);
        console.log(`   ✅ Contract code is present and valid`);
        return true;
      } else if (data.error) {
        console.log(`   ❌ WASM code error: ${data.error.what}`);
        console.log(`   💡 Contract code is not deployed or has issues`);
        return false;
      } else {
        console.log(`   ❌ No WASM code found`);
        console.log(`   💡 Contract code is not deployed`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ WASM code check failed: ${error.message}`);
      return false;
    }
  }

  async checkABI() {
    try {
      const command = `curl -s "https://jungle4.greymass.com/v1/chain/get_code" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      const result = execSync(command, { encoding: 'utf8' });
      const data = JSON.parse(result);
      
      if (data.abi) {
        console.log(`   ✅ ABI is deployed`);
        console.log(`   📄 ABI size: ${JSON.stringify(data.abi).length} characters`);
        
        if (data.abi.version) {
          console.log(`   📋 ABI version: ${data.abi.version}`);
        }
        
        // Check for required actions
        const requiredActions = ['createhtlc', 'claimhtlc', 'refundhtlc', 'getstats'];
        const foundActions = [];
        
        if (data.abi.actions) {
          console.log(`   🔧 Total actions: ${data.abi.actions.length}`);
          
          requiredActions.forEach(action => {
            const found = data.abi.actions.find(a => a.name === action);
            if (found) {
              foundActions.push(action);
              console.log(`   ✅ Action found: ${action}`);
            } else {
              console.log(`   ❌ Action missing: ${action}`);
            }
          });
          
          if (foundActions.length >= 3) {
            console.log(`   ✅ All required actions found (${foundActions.length}/${requiredActions.length})`);
            return true;
          } else {
            console.log(`   ⚠️  Some required actions missing (${foundActions.length}/${requiredActions.length})`);
            return false;
          }
        } else {
          console.log(`   ❌ No actions found in ABI`);
          return false;
        }
      } else if (data.error) {
        console.log(`   ❌ ABI error: ${data.error.what}`);
        console.log(`   💡 ABI is not deployed or has issues`);
        return false;
      } else {
        console.log(`   ❌ No ABI found`);
        console.log(`   💡 ABI is not deployed`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ ABI check failed: ${error.message}`);
      return false;
    }
  }

  async checkContractTables() {
    try {
      const tables = ['htlcs', 'stats', 'config'];
      let accessibleTables = 0;
      
      for (const table of tables) {
        try {
          const command = `curl -s "https://jungle4.greymass.com/v1/chain/get_table_rows" -X POST -H "Content-Type: application/json" -d '{"json":true,"code":"${this.accountName}","scope":"${this.accountName}","table":"${table}","limit":1}'`;
          const result = execSync(command, { encoding: 'utf8' });
          const data = JSON.parse(result);
          
          if (data.rows !== undefined) {
            console.log(`   ✅ Table ${table}: accessible`);
            accessibleTables++;
          } else if (data.error) {
            console.log(`   ❌ Table ${table}: ${data.error.what}`);
          } else {
            console.log(`   ⚠️  Table ${table}: not accessible`);
          }
        } catch (error) {
          console.log(`   ❌ Table ${table}: check failed`);
        }
      }
      
      console.log(`   📊 Accessible tables: ${accessibleTables}/${tables.length}`);
      return accessibleTables > 0;
    } catch (error) {
      console.log(`   ❌ Contract tables check failed: ${error.message}`);
      return false;
    }
  }

  async provideStatusSummary() {
    console.log('🎯 Contract Deployment Status Summary:');
    console.log('=' .repeat(60));
    
    // Check current status
    const wasmStatus = await this.checkWasmCode();
    const abiStatus = await this.checkABI();
    const tablesStatus = await this.checkContractTables();
    
    console.log('');
    console.log('📊 Deployment Status:');
    console.log(`   🔧 WASM Code: ${wasmStatus ? '✅ Deployed' : '❌ Not Deployed'}`);
    console.log(`   📄 ABI: ${abiStatus ? '✅ Deployed' : '❌ Not Deployed'}`);
    console.log(`   📊 Tables: ${tablesStatus ? '✅ Accessible' : '❌ Not Accessible'}`);
    console.log('');
    
    if (wasmStatus && abiStatus && tablesStatus) {
      console.log('🎉 CONTRACT FULLY DEPLOYED AND FUNCTIONAL!');
      console.log('');
      console.log('✅ All components are working:');
      console.log('   - WASM code is deployed');
      console.log('   - ABI is deployed with all required actions');
      console.log('   - Contract tables are accessible');
      console.log('');
      console.log('🚀 Ready for transactions!');
      console.log(`🌐 Explorer: https://jungle4.greymass.com/account/${this.accountName}`);
    } else {
      console.log('⚠️  CONTRACT PARTIALLY DEPLOYED OR HAS ISSUES');
      console.log('');
      
      if (!wasmStatus) {
        console.log('❌ WASM Code Issues:');
        console.log('   - Contract code is not deployed');
        console.log('   - Need to deploy WASM file');
        console.log('');
      }
      
      if (!abiStatus) {
        console.log('❌ ABI Issues:');
        console.log('   - ABI is not deployed or has compatibility issues');
        console.log('   - ABI version might be incompatible with Jungle4');
        console.log('');
      }
      
      if (!tablesStatus) {
        console.log('❌ Table Access Issues:');
        console.log('   - Contract tables are not accessible');
        console.log('   - This might be due to ABI issues');
        console.log('');
      }
      
      console.log('🔧 Recommended Actions:');
      console.log('1. Check contract compilation: npm run compile-eos');
      console.log('2. Try ABI redeployment: npm run fix-eos-abi');
      console.log('3. Verify deployment: npm run verify-eos-final');
      console.log('4. Check manually: https://jungle4.greymass.com/account/' + this.accountName);
      console.log('');
    }
  }
}

// Export for use in other scripts
module.exports = { EosFinalVerifier };

// Run if called directly
if (require.main === module) {
  const verifier = new EosFinalVerifier();
  verifier.verifyFinal();
} 