const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * 🌴 REAL EOS CONTRACT DEPLOYMENT
 * 
 * Deploys the fusionbridge contract to EOS Jungle4 testnet
 * Uses the provided account: quicksnake34
 */
class EosContractDeployer {
  constructor() {
    // EOS Jungle4 testnet configuration
    this.rpc = new JsonRpc('https://jungle4.cryptolions.io', { fetch });
    
    // Account credentials (provided by user)
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    
    this.signatureProvider = new JsSignatureProvider([this.privateKey]);
    this.api = new Api({
      rpc: this.rpc,
      signatureProvider: this.signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder()
    });
    
    this.contractName = 'fusionbridge';
    
    console.log('🌴 Real EOS Contract Deployer Initialized');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 Contract: ${this.contractName}`);
  }
  
  /**
   * 🔍 Check account info and balance
   */
  async checkAccount() {
    try {
      console.log('\n🔍 Checking account information...');
      
      // Use fetch directly for account info
      const response = await fetch('https://jungle4.cryptolions.io/v1/chain/get_account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_name: this.accountName })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const account = await response.json();
      console.log(`✅ Account found: ${account.account_name}`);
      console.log(`📊 RAM: ${account.ram_quota} bytes`);
      console.log(`⛽ CPU: ${account.cpu_weight} EOS`);
      console.log(`🌐 NET: ${account.net_weight} EOS`);
      
      // Get balance
      const balanceResponse = await fetch('https://jungle4.cryptolions.io/v1/chain/get_currency_balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'eosio.token',
          account: this.accountName,
          symbol: 'EOS'
        })
      });
      
      if (balanceResponse.ok) {
        const balance = await balanceResponse.json();
        console.log(`💰 EOS Balance: ${balance.join(', ')}`);
      } else {
        console.log('⚠️  Could not fetch balance');
      }
      
      return { account, balance: [] };
    } catch (error) {
      console.error('❌ Failed to get account info:', error.message);
      return null;
    }
  }
  
  /**
   * 📝 Compile contract (simulated - requires EOSIO.CDT)
   */
  async compileContract() {
    console.log('\n📝 Compiling EOS contract...');
    console.log('⚠️  This step requires EOSIO.CDT to be installed');
    console.log('💡 For now, we\'ll simulate the compilation');
    
    const contractPath = path.join(__dirname, '../contracts/eos/fusionbridge.cpp');
    const wasmPath = path.join(__dirname, '../contracts/eos/fusionbridge.wasm');
    const abiPath = path.join(__dirname, '../contracts/eos/fusionbridge.abi');
    
    // Check if contract source exists
    if (!fs.existsSync(contractPath)) {
      console.error('❌ Contract source not found:', contractPath);
      return false;
    }
    
    console.log('✅ Contract source found');
    console.log('📁 Source:', contractPath);
    
    // For real deployment, you would run:
    // eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
    // eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi
    
    console.log('💡 To compile manually:');
    console.log('   1. Install EOSIO.CDT');
    console.log('   2. cd contracts/eos/');
    console.log('   3. eosio-cpp -o fusionbridge.wasm fusionbridge.cpp');
    console.log('   4. eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi');
    
    return true;
  }
  
  /**
   * 🏗️ Deploy contract to EOS
   */
  async deployContract() {
    try {
      console.log('\n🏗️  Deploying fusionbridge contract to EOS Jungle4...');
      
      // Check if WASM and ABI files exist
      const wasmPath = path.join(__dirname, '../contracts/eos/fusionbridge.wasm');
      const abiPath = path.join(__dirname, '../contracts/eos/fusionbridge.abi');
      
      if (!fs.existsSync(wasmPath) || !fs.existsSync(abiPath)) {
        console.log('⚠️  WASM or ABI files not found');
        console.log('💡 Please compile the contract first:');
        console.log('   npm run compile-eos');
        return false;
      }
      
      // Read WASM and ABI files
      const wasmBuffer = fs.readFileSync(wasmPath);
      const abiBuffer = fs.readFileSync(abiPath);
      
      console.log('📦 Contract files loaded');
      console.log(`   WASM size: ${wasmBuffer.length} bytes`);
      console.log(`   ABI size: ${abiBuffer.length} bytes`);
      
      // Deploy contract
      const actions = [
        {
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
            code: Array.from(wasmBuffer)
          }
        },
        {
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
        }
      ];
      
      console.log('🚀 Deploying contract...');
      const result = await this.api.transact({
        actions: actions
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log('✅ Contract deployed successfully!');
      console.log(`📝 Transaction ID: ${result.transaction_id}`);
      console.log(`🔗 Block Explorer: https://jungle4.cryptolions.io/transaction/${result.transaction_id}`);
      
      // Save deployment info
      const deploymentInfo = {
        account: this.accountName,
        contract: this.contractName,
        network: 'jungle4',
        transactionId: result.transaction_id,
        deployedAt: new Date().toISOString(),
        wasmSize: wasmBuffer.length,
        abiSize: abiBuffer.length
      };
      
      fs.writeFileSync(
        path.join(__dirname, '../eos-contract-deployment.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      console.log('💾 Deployment info saved to eos-contract-deployment.json');
      
      return true;
      
    } catch (error) {
      console.error('❌ Contract deployment failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🧪 Test deployed contract
   */
  async testContract() {
    try {
      console.log('\n🧪 Testing deployed contract...');
      
      // Test contract info
      const code = await this.rpc.get_code(this.accountName);
      console.log('✅ Contract code deployed');
      console.log(`   Code hash: ${code.code_hash}`);
      
      // Test ABI
      const abi = await this.rpc.get_abi(this.accountName);
      console.log('✅ Contract ABI loaded');
      console.log(`   Actions: ${abi.abi.actions.length}`);
      
      // Test HTLC table
      const table = await this.rpc.get_table_rows({
        json: true,
        code: this.accountName,
        scope: this.accountName,
        table: 'htlcs',
        limit: 1
      });
      
      console.log('✅ HTLC table accessible');
      console.log(`   Current HTLCs: ${table.rows.length}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Contract test failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🔐 Create test HTLC
   */
  async createTestHTLC() {
    try {
      console.log('\n🔐 Creating test HTLC...');
      
      const recipient = 'quicksnake34'; // Same account for testing
      const amount = '0.1000 EOS';
      const hashlock = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      const memo = 'Test HTLC from deployment script';
      const ethTxHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      const action = {
        account: this.accountName,
        name: 'createhtlc',
        authorization: [{
          actor: this.accountName,
          permission: 'active'
        }],
        data: {
          sender: this.accountName,
          recipient: recipient,
          amount: amount,
          hashlock: hashlock,
          timelock: timelock,
          memo: memo,
          eth_tx_hash: ethTxHash
        }
      };
      
      console.log('📝 Creating test HTLC...');
      const result = await this.api.transact({
        actions: [action]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      });
      
      console.log('✅ Test HTLC created successfully!');
      console.log(`📝 Transaction ID: ${result.transaction_id}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Test HTLC creation failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Complete deployment process
   */
  async deploy() {
    console.log('🚀 Starting EOS Contract Deployment');
    console.log('=' .repeat(50));
    
    // Check account
    const accountInfo = await this.checkAccount();
    if (!accountInfo) {
      console.log('❌ Cannot proceed without account access');
      return false;
    }
    
    // Compile contract
    const compiled = await this.compileContract();
    if (!compiled) {
      console.log('❌ Contract compilation failed');
      return false;
    }
    
    // Deploy contract
    const deployed = await this.deployContract();
    if (!deployed) {
      console.log('❌ Contract deployment failed');
      return false;
    }
    
    // Test contract
    const tested = await this.testContract();
    if (!tested) {
      console.log('❌ Contract testing failed');
      return false;
    }
    
    // Create test HTLC
    const htlcCreated = await this.createTestHTLC();
    if (!htlcCreated) {
      console.log('❌ Test HTLC creation failed');
      return false;
    }
    
    console.log('\n🎉 EOS Contract Deployment Complete!');
    console.log('=' .repeat(50));
    console.log(`📍 Contract: ${this.contractName}`);
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log('✅ Contract deployed and tested successfully');
    console.log('✅ Test HTLC created successfully');
    console.log('🚀 Ready for real cross-chain swaps!');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { EosContractDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new EosContractDeployer();
  deployer.deploy().catch(console.error);
} 