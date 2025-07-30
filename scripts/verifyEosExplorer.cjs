const { JsonRpc } = require('eosjs');

/**
 * 🔍 Verify EOS Contract Through Explorer
 */
class EosExplorerVerifier {
  constructor() {
    this.accountName = 'quicksnake34';
    this.network = 'Jungle4 Testnet';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.explorerUrl = 'https://jungle4.cryptolions.io';
    
    // Initialize RPC connection
    this.rpc = new JsonRpc(this.rpcUrl);
  }

  async verify() {
    console.log('🔍 Verifying EOS Contract Through Explorer');
    console.log('=' .repeat(60));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log(`🌐 Explorer: ${this.explorerUrl}/account/${this.accountName}`);
      console.log('');
      
      // Check account info
      console.log('🔍 Checking account info...');
      const accountInfo = await this.rpc.get_account(this.accountName);
      console.log(`✅ Account exists: ${accountInfo.account_name}`);
      console.log(`✅ Created: ${accountInfo.created}`);
      console.log(`✅ Active: ${accountInfo.active}`);
      console.log('');
      
      // Check account balance
      console.log('💰 Checking account balance...');
      const balance = await this.rpc.get_currency_balance('eosio.token', this.accountName, 'EOS');
      console.log(`✅ EOS Balance: ${balance.join(', ') || '0.0000 EOS'}`);
      console.log('');
      
      // Check account permissions
      console.log('🔐 Checking account permissions...');
      if (accountInfo.permissions) {
        accountInfo.permissions.forEach(permission => {
          console.log(`   - ${permission.perm_name}: ${permission.required_auth.keys[0].key}`);
        });
      }
      console.log('');
      
      // Manual verification steps
      console.log('📋 Manual Verification Steps:');
      console.log('=' .repeat(60));
      console.log('1. 🌐 Open Explorer:');
      console.log(`   ${this.explorerUrl}/account/${this.accountName}`);
      console.log('');
      console.log('2. 🔍 Check Contract Tab:');
      console.log('   - Look for "Contract" tab in the explorer');
      console.log('   - Verify contract code is deployed');
      console.log('   - Check contract actions (createhtlc, claimhtlc, etc.)');
      console.log('');
      console.log('3. 📊 Check Tables:');
      console.log('   - Look for "Tables" tab');
      console.log('   - Check "htlcs" table for any existing HTLCs');
      console.log('   - Check "stats" table for contract statistics');
      console.log('');
      console.log('4. 🔄 Check Actions:');
      console.log('   - Look for "Actions" tab');
      console.log('   - Check recent contract actions');
      console.log('   - Verify contract is responding to transactions');
      console.log('');
      
      // Test contract with curl
      console.log('🧪 Testing Contract with curl...');
      await this.testWithCurl();
      console.log('');
      
      console.log('🎯 Verification Summary:');
      console.log('=' .repeat(60));
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ Balance: ${balance.join(', ') || '0.0000 EOS'}`);
      console.log(`🌐 Explorer: ${this.explorerUrl}/account/${this.accountName}`);
      console.log('');
      console.log('📝 Next Steps:');
      console.log('1. Check the explorer manually');
      console.log('2. If contract is not working, try redeployment');
      console.log('3. Test with a simple transaction');
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async testWithCurl() {
    try {
      const { execSync } = require('child_process');
      
      // Test 1: Get account info via curl
      console.log('   Testing account info via curl...');
      const accountCmd = `curl -s "https://jungle4.cryptolions.io/v1/chain/get_account" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      
      try {
        const accountResult = execSync(accountCmd, { encoding: 'utf8' });
        const accountData = JSON.parse(accountResult);
        console.log(`   ✅ Account info retrieved via curl`);
        console.log(`   📋 Account: ${accountData.account_name}`);
        console.log(`   📋 Created: ${accountData.created}`);
      } catch (error) {
        console.log(`   ❌ Account curl failed: ${error.message}`);
      }
      
      // Test 2: Get contract code via curl
      console.log('   Testing contract code via curl...');
      const codeCmd = `curl -s "https://jungle4.cryptolions.io/v1/chain/get_code" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      
      try {
        const codeResult = execSync(codeCmd, { encoding: 'utf8' });
        const codeData = JSON.parse(codeResult);
        if (codeData.wasm) {
          console.log(`   ✅ Contract code retrieved via curl`);
          console.log(`   📋 WASM size: ${codeData.wasm.length} bytes`);
          if (codeData.abi) {
            console.log(`   📋 ABI size: ${JSON.stringify(codeData.abi).length} characters`);
          }
        } else {
          console.log(`   ❌ No contract code found via curl`);
        }
      } catch (error) {
        console.log(`   ❌ Contract code curl failed: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Curl tests failed: ${error.message}`);
    }
  }
}

// Export for use in other scripts
module.exports = { EosExplorerVerifier };

// Run if called directly
if (require.main === module) {
  const verifier = new EosExplorerVerifier();
  verifier.verify();
} 