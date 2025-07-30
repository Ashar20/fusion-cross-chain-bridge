const { JsonRpc } = require('eosjs');

/**
 * 🔍 Simple EOS Contract Status Check
 */
class EosContractChecker {
  constructor() {
    this.accountName = 'quicksnake34';
    this.network = 'Jungle4 Testnet';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    // Initialize RPC connection
    this.rpc = new JsonRpc(this.rpcUrl);
  }

  async checkContract() {
    console.log('🔍 Checking EOS Contract Status');
    console.log('=' .repeat(50));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
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
      try {
        const codeResult = await this.rpc.get_code(this.accountName);
        
        if (codeResult.wasm) {
          console.log(`✅ Contract code deployed: ${codeResult.wasm.length} bytes`);
          console.log(`✅ Contract ABI deployed: ${JSON.stringify(codeResult.abi).length} characters`);
          
          // Check contract actions
          if (codeResult.abi && codeResult.abi.actions) {
            console.log(`✅ Contract has ${codeResult.abi.actions.length} actions:`);
            codeResult.abi.actions.forEach(action => {
              console.log(`   - ${action.name}: ${action.type}`);
            });
          }
          
          // Check contract tables
          if (codeResult.abi && codeResult.abi.tables) {
            console.log(`✅ Contract has ${codeResult.abi.tables.length} tables:`);
            codeResult.abi.tables.forEach(table => {
              console.log(`   - ${table.name}: ${table.type}`);
            });
          }
          
        } else {
          console.log('❌ No contract code found');
        }
      } catch (error) {
        console.log(`❌ Contract check failed: ${error.message}`);
      }
      console.log('');
      
      // Test contract tables
      console.log('🔍 Testing contract tables...');
      await this.testTables();
      console.log('');
      
      console.log('🎯 Contract Status Summary:');
      console.log('=' .repeat(50));
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ Contract: fusionbridge`);
      console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Contract check failed:', error.message);
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
      
    } catch (error) {
      console.log(`   ❌ Table test failed: ${error.message}`);
    }
  }
}

// Export for use in other scripts
module.exports = { EosContractChecker };

// Run if called directly
if (require.main === module) {
  const checker = new EosContractChecker();
  checker.checkContract();
} 