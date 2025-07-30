const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Deploy EOS Contract to Jungle4 Testnet
 */
class EosContractDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractName = 'fusionbridge';
    this.network = 'Jungle4 Testnet';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    // File paths
    this.wasmPath = path.join(__dirname, '../contracts/eos/fusionbridge.wasm');
    this.abiPath = path.join(__dirname, '../contracts/eos/fusionbridge.abi');
    
    // Initialize EOS connection
    this.signatureProvider = new JsSignatureProvider([this.privateKey]);
    this.rpc = new JsonRpc(this.rpcUrl);
    this.api = new Api({ rpc: this.rpc, signatureProvider: this.signatureProvider });
  }

  async deploy() {
    console.log('🚀 Deploying EOS Contract to Jungle4 Testnet');
    console.log('=' .repeat(60));
    
    try {
      // Check if compiled files exist
      if (!fs.existsSync(this.wasmPath)) {
        throw new Error(`WASM file not found: ${this.wasmPath}`);
      }
      if (!fs.existsSync(this.abiPath)) {
        throw new Error(`ABI file not found: ${this.abiPath}`);
      }
      
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Contract: ${this.contractName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log(`📁 WASM: ${this.wasmPath}`);
      console.log(`📁 ABI: ${this.abiPath}`);
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
      
      // Read compiled files
      console.log('📖 Reading compiled files...');
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const abiBuffer = fs.readFileSync(this.abiPath);
      
      console.log(`✅ WASM size: ${wasmBuffer.length} bytes`);
      console.log(`✅ ABI size: ${abiBuffer.length} bytes`);
      console.log('');
      
      // Deploy contract code (WASM)
      console.log('🔨 Deploying contract code (WASM)...');
      const setcodeResult = await this.api.transact({
        actions: [{
          account: 'eosio',
          name: 'setcode',
          authorization: [{
            actor: this.accountName,
            permission: 'active'
          }],
          data: {
            account: this.accountName,
            vmtype: 0,
            vmversion: 0,
            code: wasmBuffer.toString('hex')
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log(`✅ Contract code deployed successfully!`);
      console.log(`📋 Transaction ID: ${setcodeResult.transaction_id}`);
      console.log('');
      
      // Deploy contract ABI
      console.log('📄 Deploying contract ABI...');
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
            abi: JSON.parse(abiBuffer.toString())
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log(`✅ Contract ABI deployed successfully!`);
      console.log(`📋 Transaction ID: ${setabiResult.transaction_id}`);
      console.log('');
      
      // Verify deployment
      console.log('🔍 Verifying deployment...');
      const codeResult = await this.rpc.get_code(this.accountName);
      
      if (codeResult.wasm) {
        console.log(`✅ Contract code verified: ${codeResult.wasm.length} bytes`);
        console.log(`✅ Contract ABI verified: ${JSON.stringify(codeResult.abi).length} characters`);
      } else {
        throw new Error('Contract deployment verification failed');
      }
      
      console.log('');
      console.log('🎯 Deployment Summary:');
      console.log('=' .repeat(60));
      console.log(`✅ Contract: ${this.contractName}`);
      console.log(`✅ Account: ${this.accountName}`);
      console.log(`✅ Network: ${this.network}`);
      console.log(`✅ WASM: ${wasmBuffer.length} bytes`);
      console.log(`✅ ABI: ${JSON.stringify(codeResult.abi).length} characters`);
      console.log(`✅ Code Transaction: ${setcodeResult.transaction_id}`);
      console.log(`✅ ABI Transaction: ${setabiResult.transaction_id}`);
      console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
      console.log('');
      
      // Save deployment info
      const deploymentInfo = {
        network: this.network,
        account: this.accountName,
        contract: this.contractName,
        deploymentTime: new Date().toISOString(),
        transactions: {
          setcode: setcodeResult.transaction_id,
          setabi: setabiResult.transaction_id
        },
        files: {
          wasm: this.wasmPath,
          abi: this.abiPath,
          wasmSize: wasmBuffer.length,
          abiSize: JSON.stringify(codeResult.abi).length
        },
        explorer: `https://jungle4.cryptolions.io/account/${this.accountName}`
      };
      
      const deploymentPath = path.join(__dirname, '../eos-contract-deployment.json');
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
      console.log(`📄 Deployment info saved to: ${deploymentPath}`);
      console.log('');
      
      return {
        success: true,
        account: this.accountName,
        contract: this.contractName,
        transactions: deploymentInfo.transactions,
        explorer: deploymentInfo.explorer
      };
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      console.error('   Error details:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other scripts
module.exports = { EosContractDeployer };

// Run if called directly
if (require.main === module) {
  const deployer = new EosContractDeployer();
  deployer.deploy();
} 