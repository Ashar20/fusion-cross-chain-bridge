const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

/**
 * 🔑 Get EOS Account Keys
 */
class EosKeyManager {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
  }

  async getAccountInfo() {
    console.log('🔑 EOS ACCOUNT KEYS');
    console.log('=' .repeat(50));
    
    try {
      // Create signature provider
      const signatureProvider = new JsSignatureProvider([this.privateKey]);
      
      // Create RPC connection
      const rpc = new JsonRpc('https://jungle4.cryptolions.io');
      
      // Create API instance
      const api = new Api({ rpc, signatureProvider });
      
      console.log('📋 Account Details:');
      console.log(`   Account Name: ${this.accountName}`);
      console.log(`   Private Key: ${this.privateKey}`);
      console.log('');
      
      // Get account info from blockchain
      console.log('🔍 Fetching account info from blockchain...');
      const accountInfo = await rpc.get_account(this.accountName);
      
      console.log('✅ Account Status:');
      console.log(`   Account: ${accountInfo.account_name}`);
      console.log(`   Created: ${accountInfo.created}`);
      console.log(`   Active: ${accountInfo.active}`);
      console.log(`   Owner: ${accountInfo.owner}`);
      console.log('');
      
      // Get permissions
      console.log('🔐 Permissions:');
      accountInfo.permissions.forEach(permission => {
        console.log(`   ${permission.perm_name}: ${permission.required_auth.keys[0].key}`);
      });
      console.log('');
      
      // Get account balance
      console.log('💰 Account Balance:');
      try {
        const balance = await rpc.get_currency_balance('eosio.token', this.accountName, 'EOS');
        console.log(`   EOS Balance: ${balance.join(', ') || '0.0000 EOS'}`);
      } catch (error) {
        console.log('   EOS Balance: Unable to fetch (may not have EOS tokens)');
      }
      console.log('');
      
      // Check if contract is deployed
      console.log('📦 Contract Status:');
      try {
        const code = await rpc.get_code(this.accountName);
        if (code.wasm) {
          console.log('   ✅ Contract code is deployed');
          console.log(`   WASM Size: ${code.wasm.length} bytes`);
        } else {
          console.log('   ❌ No contract code deployed');
        }
      } catch (error) {
        console.log('   ❌ Error checking contract code');
      }
      console.log('');
      
      // Summary
      console.log('🎯 SUMMARY:');
      console.log('=' .repeat(50));
      console.log(`📍 Account: ${this.accountName}`);
      console.log(`🔑 Private Key: ${this.privateKey}`);
      console.log(`🔑 Public Key: ${accountInfo.permissions[0].required_auth.keys[0].key}`);
      console.log(`🌐 Network: Jungle4 Testnet`);
      console.log(`🔗 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      return {
        accountName: this.accountName,
        privateKey: this.privateKey,
        publicKey: accountInfo.permissions[0].required_auth.keys[0].key,
        network: 'Jungle4 Testnet',
        explorer: `https://jungle4.cryptolions.io/account/${this.accountName}`
      };
      
    } catch (error) {
      console.error('❌ Error fetching account info:', error.message);
      return null;
    }
  }
}

// Export for use in other scripts
module.exports = { EosKeyManager };

// Run if called directly
if (require.main === module) {
  const keyManager = new EosKeyManager();
  keyManager.getAccountInfo();
} 