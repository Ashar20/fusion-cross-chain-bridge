const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');
const path = require('path');

/**
 * 🔧 Fix EOS ABI Deployment
 */
class EosABIFixer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractName = 'fusionbridge';
    this.network = 'Jungle4 Testnet';
    this.rpcUrl = 'https://jungle4.greymass.com';
    
    // File paths
    this.abiPath = path.join(__dirname, '../contracts/eos/fusionbridge.abi');
    
    // Initialize EOS connection
    this.signatureProvider = new JsSignatureProvider([this.privateKey]);
    this.rpc = new JsonRpc(this.rpcUrl);
    this.api = new Api({ rpc: this.rpc, signatureProvider: this.signatureProvider });
  }

  async fixABI() {
    console.log('🔧 Fixing EOS ABI Deployment');
    console.log('=' .repeat(50));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Contract: ${this.contractName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log(`📁 ABI: ${this.abiPath}`);
      console.log('');
      
      // Check if ABI file exists
      if (!fs.existsSync(this.abiPath)) {
        throw new Error(`ABI file not found: ${this.abiPath}`);
      }
      
      // Read and validate ABI
      console.log('📖 Reading and validating ABI...');
      const abiBuffer = fs.readFileSync(this.abiPath);
      const abiData = JSON.parse(abiBuffer.toString());
      
      console.log(`✅ ABI version: ${abiData.version}`);
      console.log(`✅ ABI size: ${abiBuffer.length} bytes`);
      console.log(`✅ Actions: ${abiData.actions ? abiData.actions.length : 0}`);
      console.log(`✅ Tables: ${abiData.tables ? abiData.tables.length : 0}`);
      console.log('');
      
      // Validate ABI structure
      console.log('🔍 Validating ABI structure...');
      if (!abiData.version) {
        throw new Error('ABI missing version field');
      }
      if (!abiData.actions || !Array.isArray(abiData.actions)) {
        throw new Error('ABI missing or invalid actions array');
      }
      if (!abiData.tables || !Array.isArray(abiData.tables)) {
        throw new Error('ABI missing or invalid tables array');
      }
      console.log('✅ ABI structure is valid');
      console.log('');
      
      // Try to deploy ABI with error handling
      console.log('📄 Deploying corrected ABI...');
      
      // Serialize ABI to hex string
      const abiHex = Buffer.from(JSON.stringify(abiData)).toString('hex');
      console.log(`✅ ABI serialized to hex: ${abiHex.length} characters`);
      
      const setabiResult = await this.api.transact({
        actions: [{
          account: 'eosio',
          name: 'setabi',
          authorization: [{
            actor: this.accountName,
            permission: 'active'
          }],
          data: {
            account: this.accountName,
            abi: abiHex
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log(`✅ ABI deployed successfully!`);
      console.log(`📋 Transaction ID: ${setabiResult.transaction_id}`);
      console.log('');
      
      // Wait for blockchain to process
      console.log('⏳ Waiting for blockchain to process...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify ABI deployment
      console.log('🔍 Verifying ABI deployment...');
      try {
        const codeResult = await this.rpc.get_code(this.accountName);
        
        if (codeResult.abi) {
          console.log(`✅ ABI verified: ${JSON.stringify(codeResult.abi).length} characters`);
          
          if (codeResult.abi.actions) {
            console.log(`✅ Contract has ${codeResult.abi.actions.length} actions:`);
            codeResult.abi.actions.forEach(action => {
              console.log(`   - ${action.name}: ${action.type}`);
            });
          }
          
          if (codeResult.abi.tables) {
            console.log(`✅ Contract has ${codeResult.abi.tables.length} tables:`);
            codeResult.abi.tables.forEach(table => {
              console.log(`   - ${table.name}: ${table.type}`);
            });
          }
        } else {
          console.log('❌ ABI verification failed - no ABI found');
        }
      } catch (error) {
        console.log(`❌ ABI verification failed: ${error.message}`);
      }
      
      console.log('');
      console.log('🎯 ABI Fix Summary:');
      console.log('=' .repeat(50));
      console.log(`✅ Contract: ${this.contractName}`);
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ ABI Transaction: ${setabiResult.transaction_id}`);
      console.log(`🌐 Explorer: https://jungle4.greymass.com/account/${this.accountName}`);
      console.log('');
      
      return {
        success: true,
        account: this.accountName,
        contract: this.contractName,
        transaction: setabiResult.transaction_id,
        explorer: `https://jungle4.greymass.com/account/${this.accountName}`
      };
      
    } catch (error) {
      console.error('❌ ABI fix failed:', error.message);
      console.error('   Error details:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other scripts
module.exports = { EosABIFixer };

// Run if called directly
if (require.main === module) {
  const fixer = new EosABIFixer();
  fixer.fixABI();
} 