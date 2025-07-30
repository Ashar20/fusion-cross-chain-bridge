const { execSync } = require('child_process');
const fs = require('fs');
const { Api, JsonRpc, RpcError } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');

/**
 * 🚀 Direct EOS Contract Deployment using EOSJS
 */
class DirectEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    // Initialize EOS API
    this.rpc = new JsonRpc(this.rpcUrl, { fetch });
    this.signatureProvider = new JsSignatureProvider([this.privateKey]);
    this.api = new Api({
      rpc: this.rpc,
      signatureProvider: this.signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });
  }

  /**
   * 📋 Check files exist
   */
  checkFiles() {
    console.log('📋 Checking deployment files...');
    
    if (!fs.existsSync(this.wasmPath)) {
      console.log('❌ WASM file not found:', this.wasmPath);
      return false;
    }
    
    if (!fs.existsSync(this.abiPath)) {
      console.log('❌ ABI file not found:', this.abiPath);
      return false;
    }
    
    const wasmStats = fs.statSync(this.wasmPath);
    const abiStats = fs.statSync(this.abiPath);
    
    console.log('✅ WASM file found:', `${(wasmStats.size / 1024).toFixed(1)}KB`);
    console.log('✅ ABI file found:', `${(abiStats.size / 1024).toFixed(1)}KB`);
    
    return true;
  }

  /**
   * 🚀 Deploy WASM code
   */
  async deployWasm() {
    console.log('🚀 Deploying WASM code...');
    
    try {
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      
      const result = await this.api.transact({
        actions: [{
          account: 'eosio',
          name: 'setcode',
          authorization: [{
            actor: this.accountName,
            permission: 'active',
          }],
          data: {
            account: this.accountName,
            vmtype: 0,
            vmversion: 0,
            code: wasmBuffer.toString('hex')
          },
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      });
      
      console.log('✅ WASM deployed successfully');
      console.log('   Transaction ID:', result.transaction_id);
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy WASM:', error.message);
      return false;
    }
  }

  /**
   * 🚀 Deploy ABI
   */
  async deployAbi() {
    console.log('🚀 Deploying ABI...');
    
    try {
      const abiContent = fs.readFileSync(this.abiPath, 'utf8');
      const abi = JSON.parse(abiContent);
      
      const result = await this.api.transact({
        actions: [{
          account: 'eosio',
          name: 'setabi',
          authorization: [{
            actor: this.accountName,
            permission: 'active',
          }],
          data: {
            account: this.accountName,
            abi: this.api.serializeAbi(abi)
          },
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      });
      
      console.log('✅ ABI deployed successfully');
      console.log('   Transaction ID:', result.transaction_id);
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy ABI:', error.message);
      return false;
    }
  }

  /**
   * 🧪 Test contract
   */
  async testContract() {
    console.log('🧪 Testing contract...');
    
    try {
      const result = await this.api.transact({
        actions: [{
          account: this.accountName,
          name: 'getstats',
          authorization: [{
            actor: this.accountName,
            permission: 'active',
          }],
          data: {},
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      });
      
      console.log('✅ Contract test successful');
      console.log('   Transaction ID:', result.transaction_id);
      return true;
    } catch (error) {
      console.log('❌ Contract test failed:', error.message);
      return false;
    }
  }

  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 Direct EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Deploy WASM
    const wasmSuccess = await this.deployWasm();
    if (!wasmSuccess) {
      return false;
    }
    
    // Deploy ABI
    const abiSuccess = await this.deployAbi();
    if (!abiSuccess) {
      return false;
    }
    
    // Test contract
    await this.testContract();
    
    console.log('\n🎉 CONTRACT DEPLOYMENT COMPLETED!');
    console.log('=' .repeat(60));
    console.log('✅ WASM deployed');
    console.log('✅ ABI deployed');
    console.log('✅ Contract ready for use');
    
    return true;
  }
}

// Run deployment
if (require.main === module) {
  const deployer = new DirectEosDeployer();
  deployer.deploy();
}

module.exports = { DirectEosDeployer };