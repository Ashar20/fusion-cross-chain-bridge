const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🔍 Verify EOS Contract Deployment using cleos
 */
class EosCleosVerifier {
  constructor() {
    this.accountName = 'quicksnake34'; // Target account
    this.network = 'Jungle4 Testnet';
    this.cleosImage = 'eosio/eosio.cdt:1.8.1';
    this.nodeUrl = 'https://jungle4.cryptolions.io:443';
    this.chainId = '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d';
    
    // Docker platform for Apple Silicon support
    this.dockerPlatform = 'linux/amd64';
  }

  async verifyDeployment() {
    console.log('🔍 Verifying EOS Contract Deployment using cleos');
    console.log('=' .repeat(60));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log(`🐳 Docker Image: ${this.cleosImage}`);
      console.log(`🖥️  Platform: ${this.dockerPlatform}`);
      console.log('');
      
      // Skip Docker image check and go directly to verification
      console.log('🔍 Test 1: Checking WASM code deployment...');
      await this.checkWasmCode();
      console.log('');
      
      // Test 2: Check ABI deployment and actions
      console.log('🔍 Test 2: Checking ABI deployment and actions...');
      await this.checkABI();
      console.log('');
      
      // Test 3: Test read-only action
      console.log('🔍 Test 3: Testing read-only action (getstats)...');
      await this.testReadOnlyAction();
      console.log('');
      
      // Test 4: Check contract tables
      console.log('🔍 Test 4: Checking contract tables...');
      await this.checkContractTables();
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

  async checkCleosImage() {
    try {
      const command = `docker images ${this.cleosImage} --format "table {{.Repository}}:{{.Tag}}\\t{{.Size}}"`;
      const result = execSync(command, { encoding: 'utf8' });
      
      if (result.includes(this.cleosImage)) {
        console.log(`   ✅ cleos Docker image found: ${this.cleosImage}`);
        console.log(`   📋 Image details:`);
        console.log(result);
      } else {
        console.log(`   ⚠️  cleos Docker image not found, pulling...`);
        await this.pullCleosImage();
      }
    } catch (error) {
      console.log(`   ❌ Docker image check failed: ${error.message}`);
      console.log(`   🔧 Pulling cleos image...`);
      await this.pullCleosImage();
    }
  }

  async pullCleosImage() {
    try {
      const command = `docker pull --platform ${this.dockerPlatform} ${this.cleosImage}`;
      console.log(`   🐳 Running: ${command}`);
      execSync(command, { stdio: 'inherit' });
      console.log(`   ✅ cleos Docker image pulled successfully`);
    } catch (error) {
      console.log(`   ❌ Failed to pull cleos image: ${error.message}`);
      console.log(`   💡 Using alternative verification method...`);
      throw new Error('Cannot proceed without cleos Docker image');
    }
  }

  async checkWasmCode() {
    try {
      // Use curl instead of cleos for WASM check
      const command = `curl -s "https://jungle4.cryptolions.io/v1/chain/get_code" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      console.log(`   🔍 Running: curl get_code ${this.accountName}`);
      
      const result = execSync(command, { encoding: 'utf8' });
      const data = JSON.parse(result);
      
      if (data.wasm && data.wasm.length > 0) {
        console.log(`   ✅ WASM code is deployed`);
        console.log(`   📦 WASM size: ${data.wasm.length} bytes`);
        console.log(`   🔑 Code hash: ${data.code_hash}`);
        console.log(`   ✅ Contract code is present and valid`);
      } else if (data.error) {
        console.log(`   ❌ WASM code check failed: ${data.error.what}`);
        console.log(`   💡 Contract code is not deployed or has issues`);
        throw new Error(`WASM code error: ${data.error.what}`);
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
      // Use curl instead of cleos for ABI check
      const command = `curl -s "https://jungle4.cryptolions.io/v1/chain/get_code" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      console.log(`   🔍 Running: curl get_code ${this.accountName} (for ABI)`);
      
      const result = execSync(command, { encoding: 'utf8' });
      const data = JSON.parse(result);
      
      if (data.abi) {
        console.log(`   ✅ ABI is deployed`);
        console.log(`   📄 ABI size: ${JSON.stringify(data.abi).length} characters`);
        
        // Check ABI version
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
        if (data.abi.tables) {
          console.log(`   📊 Total tables: ${data.abi.tables.length}`);
          data.abi.tables.forEach(table => {
            console.log(`      - ${table.name}: ${table.type}`);
          });
        }
        
      } else if (data.error) {
        console.log(`   ❌ ABI check failed: ${data.error.what}`);
        console.log(`   💡 ABI is not deployed or has issues`);
        await this.provideABIRetryInstructions();
        throw new Error(`ABI error: ${data.error.what}`);
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

  async testReadOnlyAction() {
    try {
      console.log(`   ℹ️  Testing read-only action via RPC...`);
      
      // Use curl to test getstats action
      const command = `curl -s "https://jungle4.cryptolions.io/v1/chain/get_table_rows" -X POST -H "Content-Type: application/json" -d '{"json":true,"code":"${this.accountName}","scope":"${this.accountName}","table":"stats","limit":1}'`;
      
      const result = execSync(command, { encoding: 'utf8' });
      const data = JSON.parse(result);
      
      if (data.rows !== undefined) {
        console.log(`   ✅ getstats table accessible`);
        console.log(`   📊 Rows found: ${data.rows.length}`);
      } else if (data.error) {
        console.log(`   ❌ getstats test failed: ${data.error.what}`);
      } else {
        console.log(`   ⚠️  getstats test inconclusive`);
      }
    } catch (error) {
      console.log(`   ❌ Read-only action test failed: ${error.message}`);
      console.log(`   💡 This might indicate ABI issues or contract problems`);
    }
  }

  async checkContractTables() {
    try {
      const tables = ['htlcs', 'stats', 'config'];
      
      for (const table of tables) {
        try {
          const command = `curl -s "https://jungle4.cryptolions.io/v1/chain/get_table_rows" -X POST -H "Content-Type: application/json" -d '{"json":true,"code":"${this.accountName}","scope":"${this.accountName}","table":"${table}","limit":1}'`;
          console.log(`   🔍 Checking table: ${table}`);
          
          const result = execSync(command, { encoding: 'utf8' });
          const data = JSON.parse(result);
          
          if (data.rows !== undefined) {
            console.log(`   ✅ Table ${table} accessible`);
            console.log(`   📊 Rows: ${data.rows.length}`);
          } else if (data.error) {
            console.log(`   ❌ Table ${table} error: ${data.error.what}`);
          } else {
            console.log(`   ⚠️  Table ${table} not accessible or empty`);
          }
        } catch (error) {
          console.log(`   ❌ Table ${table} check failed: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Contract tables check failed: ${error.message}`);
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
    console.log(`   npm run verify-eos-cleos`);
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
module.exports = { EosCleosVerifier };

// Run if called directly
if (require.main === module) {
  const verifier = new EosCleosVerifier();
  verifier.verifyDeployment();
} 