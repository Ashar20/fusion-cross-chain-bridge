// EOS Contract Deployment using Node.js and eosjs
// This script deploys the compiled contract to Jungle4 testnet

import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js';
import { TextEncoder, TextDecoder } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const config = {
  rpcUrl: 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d', // Jungle testnet
  account: 'quicksnake34',
  privateKey: '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN', // This is a test key
  contractName: 'fusionbridge'
};

class EOSDeployer {
  constructor() {
    this.rpc = null;
    this.api = null;
    this.signatureProvider = null;
  }

  async initialize() {
    console.log('🚀 EOS Contract Deployment using Node.js');
    console.log('📍 Account:', config.account);
    console.log('🌐 Network: Jungle4 Testnet');
    console.log('==================================================');

    // Initialize EOS.js components
    this.rpc = new JsonRpc(config.rpcUrl, { fetch });
    this.signatureProvider = new JsSignatureProvider([config.privateKey]);
    
    this.api = new Api({
      rpc: this.rpc,
      signatureProvider: this.signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
      chainId: config.chainId
    });

    console.log('✅ EOS.js initialized');
  }

  async checkAccount() {
    try {
      const accountInfo = await this.rpc.get_account(config.account);
      console.log('✅ Account found!');
      console.log('   Balance:', accountInfo.core_liquid);
      console.log('   RAM:', accountInfo.ram_quota, 'bytes');
      console.log('   CPU:', accountInfo.cpu_weight);
      console.log('   NET:', accountInfo.net_weight);
      return true;
    } catch (error) {
      console.log('❌ Account not found or error:', error.message);
      return false;
    }
  }

  async deployContract() {
    console.log('\n📦 Deploying contract...');
    
    try {
      // Read compiled files
      const wasmPath = path.join('contracts', 'eos', 'fusionbridge.wasm');
      const abiPath = path.join('contracts', 'eos', 'fusionbridge.abi');
      
      if (!fs.existsSync(wasmPath)) {
        throw new Error('WASM file not found: ' + wasmPath);
      }
      if (!fs.existsSync(abiPath)) {
        throw new Error('ABI file not found: ' + abiPath);
      }

      const wasmBuffer = fs.readFileSync(wasmPath);
      const abiBuffer = fs.readFileSync(abiPath);
      
      console.log('📁 Files loaded:');
      console.log('   WASM:', wasmBuffer.length, 'bytes');
      console.log('   ABI:', abiBuffer.length, 'bytes');

      // Deploy contract
      const result = await this.api.deployContract({
        account: config.account,
        contract: config.contractName,
        wasm: wasmBuffer,
        abi: JSON.parse(abiBuffer.toString())
      });

      console.log('✅ Contract deployed successfully!');
      console.log('   Transaction ID:', result.transaction_id);
      return result;
      
    } catch (error) {
      console.log('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  async testContract() {
    console.log('\n🧪 Testing contract...');
    
    try {
      const result = await this.api.transact({
        actions: [{
          account: config.account,
          name: 'createhtlc',
          authorization: [{
            actor: config.account,
            permission: 'active'
          }],
          data: {
            sender: config.account,
            recipient: config.account,
            amount: '0.1000 EOS',
            hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            timelock: 1753746959,
            memo: 'Test HTLC',
            eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
          }
        }]
      });

      console.log('✅ Contract test successful!');
      console.log('   Transaction ID:', result.transaction_id);
      return result;
      
    } catch (error) {
      console.log('⚠️  Test failed (this might be expected if account doesn\'t have enough EOS):', error.message);
      return null;
    }
  }
}

// Main deployment function
async function deployEOSContract() {
  const deployer = new EOSDeployer();
  
  try {
    await deployer.initialize();
    
    const accountExists = await deployer.checkAccount();
    if (!accountExists) {
      console.log('❌ Cannot proceed without valid account');
      return;
    }
    
    await deployer.deployContract();
    await deployer.testContract();
    
    console.log('\n🎉 Deployment complete!');
    console.log('🔍 View contract at: https://jungle4.cryptolions.io/account/' + config.account);
    
  } catch (error) {
    console.log('❌ Deployment failed:', error.message);
    console.log('💡 Try using online deployment instead:');
    console.log('   - EOS Studio: http://app.eosstudio.io/guest');
    console.log('   - Bloks.io: https://local.bloks.io/');
  }
}

// Run deployment
deployEOSContract().catch(console.error); 