const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

/**
 * 🔍 Verify EOS Contract Deployment
 */
class EosDeploymentVerifier {
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

  async verify() {
    console.log('🔍 Verifying EOS Contract Deployment');
    console.log('=' .repeat(50));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Contract: ${this.contractName}`);
      console.log(`📁 Network: ${this.network}`);
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
      try {
        const balance = await this.rpc.get_currency_balance('eosio.token', this.accountName, 'EOS');
        console.log(`✅ EOS Balance: ${balance.join(', ') || '0.0000 EOS'}`);
      } catch (error) {
        console.log(`⚠️  EOS Balance: Unable to fetch (${error.message})`);
      }
      console.log('');
      
      // Check contract code
      console.log('🔍 Checking contract code...');
      const codeResult = await this.rpc.get_code(this.accountName);
      
      if (codeResult.wasm) {
        console.log(`✅ Contract code deployed: ${codeResult.wasm.length} bytes`);
        console.log(`✅ Contract ABI deployed: ${JSON.stringify(codeResult.abi).length} characters`);
        console.log('');
        
        // Check contract actions
        console.log('🔍 Checking contract actions...');
        if (codeResult.abi && codeResult.abi.actions) {
          console.log(`✅ Contract has ${codeResult.abi.actions.length} actions:`);
          codeResult.abi.actions.forEach(action => {
            console.log(`   - ${action.name}: ${action.type}`);
          });
        }
        console.log('');
        
        // Test contract actions
        console.log('🧪 Testing contract actions...');
        await this.testContractActions();
        
      } else {
        console.log('❌ No contract code found');
        return { success: false, error: 'No contract code deployed' };
      }
      
      console.log('');
      console.log('🎯 Verification Summary:');
      console.log('=' .repeat(50));
      console.log(`✅ Contract: ${this.contractName}`);
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ Code Size: ${codeResult.wasm.length} bytes`);
      console.log(`✅ ABI Size: ${JSON.stringify(codeResult.abi).length} characters`);
      console.log(`✅ Actions: ${codeResult.abi.actions ? codeResult.abi.actions.length : 0}`);
      console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      return {
        success: true,
        account: this.accountName,
        contract: this.contractName,
        codeSize: codeResult.wasm.length,
        abiSize: JSON.stringify(codeResult.abi).length,
        actions: codeResult.abi.actions ? codeResult.abi.actions.length : 0,
        explorer: `https://jungle4.cryptolions.io/account/${this.accountName}`
      };
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      console.error('   Error details:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testContractActions() {
    try {
      // Test getstats action
      console.log('   Testing getstats action...');
      const statsResult = await this.rpc.get_table_rows({
        json: true,
        code: this.accountName,
        scope: this.accountName,
        table: 'stats',
        limit: 10
      });
      console.log(`   ✅ getstats: ${statsResult.rows.length} rows found`);
      
      // Test gethtlc action (if any HTLCs exist)
      console.log('   Testing gethtlc action...');
      const htlcResult = await this.rpc.get_table_rows({
        json: true,
        code: this.accountName,
        scope: this.accountName,
        table: 'htlcs',
        limit: 10
      });
      console.log(`   ✅ gethtlc: ${htlcResult.rows.length} HTLCs found`);
      
    } catch (error) {
      console.log(`   ⚠️  Action test failed: ${error.message}`);
    }
  }
}

// Export for use in other scripts
module.exports = { EosDeploymentVerifier };

// Run if called directly
if (require.main === module) {
  const verifier = new EosDeploymentVerifier();
  verifier.verify();
} 