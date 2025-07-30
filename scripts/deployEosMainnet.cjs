const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');
const path = require('path');

/**
 * 🚀 EOS Mainnet Contract Deployment
 * Deploys fusionbridge.cpp to EOS mainnet
 */
class EosMainnetDeployment {
  constructor() {
    this.network = 'mainnet';
    this.rpcUrl = 'https://api.eosauthority.com';
    this.account = 'quicksnake34';
    this.privateKey = process.env.EOS_MAINNET_PRIVATE_KEY;
    
    if (!this.privateKey) {
      throw new Error('EOS_MAINNET_PRIVATE_KEY environment variable is required for mainnet deployment');
    }
    
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
    console.log(`🚀 EOS Mainnet Contract Deployment`);
    console.log(`============================================================`);
    console.log(`📁 Account: ${this.account}`);
    console.log(`🌐 Network: ${this.network}`);
    console.log(`🌐 RPC: ${this.rpcUrl}`);
    console.log(`⚠️  WARNING: This will deploy to EOS MAINNET with real EOS tokens!`);
    console.log(`⚠️  Make sure you have sufficient EOS balance for deployment costs`);
    console.log(``);
    
    try {
      // Step 1: Check files
      console.log(`📁 Step 1: Checking compiled files...`);
      if (!fs.existsSync(this.wasmPath) || !fs.existsSync(this.abiPath)) {
        throw new Error('Compiled files not found. Run: npm run compile-eos');
      }
      
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const abiContent = JSON.parse(fs.readFileSync(this.abiPath, 'utf8'));
      
      console.log(`✅ WASM file: ${wasmBuffer.length} bytes`);
      console.log(`✅ ABI file: ${JSON.stringify(abiContent).length} bytes`);
      
      // Step 2: Check account balance
      console.log(`\n💰 Step 2: Checking account balance...`);
      const accountInfo = await this.rpc.get_account(this.account);
      console.log(`✅ Account exists: ${accountInfo.account_name}`);
      console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
      
      // Step 3: Deploy WASM
      console.log(`\n🚀 Step 3: Deploying WASM code to mainnet...`);
      console.log(`⚠️  This will cost real EOS for CPU/NET resources`);
      
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
      
      console.log(`✅ WASM deployed to mainnet! TX: ${setCodeResult.transaction_id}`);
      console.log(`🔗 Explorer: https://eos.eosq.eosnation.io/tx/${setCodeResult.transaction_id}`);
      
      // Step 4: Deploy ABI
      console.log(`\n📄 Step 4: Deploying ABI to mainnet...`);
      
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
      
      console.log(`✅ ABI deployed to mainnet! TX: ${setAbiResult.transaction_id}`);
      console.log(`🔗 Explorer: https://eos.eosq.eosnation.io/tx/${setAbiResult.transaction_id}`);
      
      // Step 5: Verify deployment
      console.log(`\n🔍 Step 5: Verifying mainnet deployment...`);
      await this.verifyDeployment();
      
      console.log(`\n🎉 Mainnet deployment completed successfully!`);
      console.log(`🌐 Contract: ${this.account} on EOS mainnet`);
      console.log(`🔗 Account: https://eos.eosq.eosnation.io/account/${this.account}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Mainnet deployment failed: ${error.message}`);
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
        console.log(`✅ Contract code deployed on mainnet`);
        console.log(`🔑 Code hash: ${codeInfo.code_hash}`);
      } else {
        console.log(`❌ Contract code not found on mainnet`);
      }
      
      // Check ABI
      const abiInfo = await this.rpc.get_abi(this.account);
      if (abiInfo.abi) {
        console.log(`✅ ABI deployed on mainnet with ${abiInfo.abi.actions.length} actions`);
        console.log(`   Actions: ${abiInfo.abi.actions.map(a => a.name).join(', ')}`);
      } else {
        console.log(`❌ ABI not found on mainnet`);
      }
      
    } catch (error) {
      console.error(`❌ Mainnet verification failed: ${error.message}`);
    }
  }
}

if (require.main === module) {
  const deployment = new EosMainnetDeployment();
  deployment.deploy().catch(console.error);
}

module.exports = { EosMainnetDeployment }; 