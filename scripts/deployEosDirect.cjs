const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Direct EOS Contract Deployment
 * Bypasses compatibility issues with direct RPC calls
 */
class DirectEosDeployment {
  constructor() {
    this.network = 'jungle4';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.account = 'quicksnake34';
    this.privateKey = process.env.EOS_PRIVATE_KEY || '5HsTf9c2p94wpxhBisntpH7ZdpYC1TrTMhWgnXdUkiXMFghH7JM';
    
    // Initialize EOS connection
    this.signatureProvider = new JsSignatureProvider([this.privateKey]);
    this.rpc = new JsonRpc(this.rpcUrl);
    this.api = new Api({
      rpc: this.rpc,
      signatureProvider: this.signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder()
    });
    
    // Load compiled files
    this.wasmPath = path.join(__dirname, '../contracts/eos/fusionbridge.wasm');
    this.abiPath = path.join(__dirname, '../contracts/eos/fusionbridge.abi');
  }

  async deploy() {
    console.log(`🚀 Direct EOS Contract Deployment`);
    console.log(`============================================================`);
    console.log(`📁 Account: ${this.account}`);
    console.log(`🌐 Network: ${this.network}`);
    console.log(`🌐 RPC: ${this.rpcUrl}`);
    
    try {
      // Step 1: Check files
      console.log(`\n📁 Step 1: Checking compiled files...`);
      if (!fs.existsSync(this.wasmPath) || !fs.existsSync(this.abiPath)) {
        throw new Error('Compiled files not found. Run: npm run compile-eos');
      }
      
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const abiContent = JSON.parse(fs.readFileSync(this.abiPath, 'utf8'));
      
      console.log(`✅ WASM file: ${wasmBuffer.length} bytes`);
      console.log(`✅ ABI file: ${JSON.stringify(abiContent).length} bytes`);
      
      // Step 2: Deploy WASM
      console.log(`\n🚀 Step 2: Deploying WASM code...`);
      const setCodeResult = await this.api.transact({
        actions: [{
          account: 'eosio',
          name: 'setcode',
          authorization: [{
            actor: this.account,
            permission: 'active'
          }],
          data: {
            account: this.account,
            vmtype: 0,
            vmversion: 0,
            code: Array.from(wasmBuffer)
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log(`✅ WASM deployed! TX: ${setCodeResult.transaction_id}`);
      
      // Step 3: Deploy ABI
      console.log(`\n📄 Step 3: Deploying ABI...`);
      const setAbiResult = await this.api.transact({
        actions: [{
          account: 'eosio',
          name: 'setabi',
          authorization: [{
            actor: this.account,
            permission: 'active'
          }],
          data: {
            account: this.account,
            abi: abiContent
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log(`✅ ABI deployed! TX: ${setAbiResult.transaction_id}`);
      
      // Step 4: Verify deployment
      console.log(`\n🔍 Step 4: Verifying deployment...`);
      await this.verifyDeployment();
      
      console.log(`\n🎉 Deployment completed successfully!`);
      return true;
      
    } catch (error) {
      console.error(`❌ Deployment failed: ${error.message}`);
      return false;
    }
  }

  async verifyDeployment() {
    try {
      // Check account info
      const accountInfo = await this.rpc.get_account(this.account);
      console.log(`✅ Account verified: ${accountInfo.account_name}`);
      
      // Check contract code
      const codeInfo = await this.rpc.get_code(this.account);
      if (codeInfo.wasm) {
        console.log(`✅ Contract code deployed`);
      } else {
        console.log(`❌ Contract code not found`);
      }
      
      // Check ABI
      const abiInfo = await this.rpc.get_abi(this.account);
      if (abiInfo.abi) {
        console.log(`✅ ABI deployed with ${abiInfo.abi.actions.length} actions`);
        console.log(`   Actions: ${abiInfo.abi.actions.map(a => a.name).join(', ')}`);
      } else {
        console.log(`❌ ABI not found`);
      }
      
    } catch (error) {
      console.error(`❌ Verification failed: ${error.message}`);
    }
  }
}

if (require.main === module) {
  const deployment = new DirectEosDeployment();
  deployment.deploy().catch(console.error);
}

module.exports = { DirectEosDeployment }; 