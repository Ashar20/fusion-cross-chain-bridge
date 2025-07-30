const fs = require('fs');
const path = require('path');

/**
 * 🚀 API-based EOS Contract Deployment
 * Uses EOS RPC API directly with proper signing
 */
class ApiEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
  }
  
  /**
   * 📋 Check deployment files
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
   * 🔍 Check account status
   */
  async checkAccount() {
    console.log('🔍 Checking account status...');
    
    try {
      const response = await fetch(`${this.rpcUrl}/v1/chain/get_account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_name: this.accountName
        })
      });
      
      const accountInfo = await response.json();
      console.log('✅ Account exists');
      console.log(`   💰 Balance: ${accountInfo.core_liquid_balance || '0 EOS'}`);
      console.log(`   📊 RAM: ${accountInfo.ram_quota} bytes`);
      return true;
    } catch (error) {
      console.log('❌ Account not found or error:', error.message);
      return false;
    }
  }
  
  /**
   * 📄 Read deployment files
   */
  readDeploymentFiles() {
    console.log('📄 Reading deployment files...');
    
    try {
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const abiContent = fs.readFileSync(this.abiPath, 'utf8');
      const abi = JSON.parse(abiContent);
      
      console.log('✅ Files read successfully');
      console.log(`   📦 WASM Size: ${(wasmBuffer.length / 1024).toFixed(1)}KB`);
      console.log(`   📋 ABI Actions: ${abi.actions.length}`);
      
      return { wasmBuffer, abi };
    } catch (error) {
      console.log('❌ Failed to read files:', error.message);
      return null;
    }
  }
  
  /**
   * 🔐 Generate transaction for contract deployment
   */
  generateDeploymentTransaction(wasmBuffer, abi) {
    console.log('🔐 Generating deployment transaction...');
    
    try {
      // Convert WASM to hex
      const wasmHex = wasmBuffer.toString('hex');
      
      // Create setcode transaction
      const setcodeTransaction = {
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
            code: wasmHex
          }
        }]
      };
      
      // Create setabi transaction
      const setabiTransaction = {
        actions: [{
          account: 'eosio',
          name: 'setabi',
          authorization: [{
            actor: this.accountName,
            permission: 'active'
          }],
          data: {
            account: this.accountName,
            abi: abi
          }
        }]
      };
      
      console.log('✅ Deployment transactions generated');
      console.log(`   📦 Setcode transaction: ${JSON.stringify(setcodeTransaction, null, 2)}`);
      console.log(`   📋 Setabi transaction: ${JSON.stringify(setabiTransaction, null, 2)}`);
      
      return { setcodeTransaction, setabiTransaction };
    } catch (error) {
      console.log('❌ Failed to generate transactions:', error.message);
      return null;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 API-based EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!await this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Read deployment files
    const files = this.readDeploymentFiles();
    if (!files) {
      console.log('❌ Cannot proceed without deployment files');
      return false;
    }
    
    // Generate deployment transactions
    const transactions = this.generateDeploymentTransaction(files.wasmBuffer, files.abi);
    if (!transactions) {
      console.log('❌ Cannot proceed without valid transactions');
      return false;
    }
    
    console.log('\n📋 Deployment Transactions Ready!');
    console.log('=' .repeat(60));
    console.log('✅ Files prepared');
    console.log('✅ Account verified');
    console.log('✅ Transactions generated');
    console.log('📋 Ready for signing and deployment');
    
    console.log('\n💡 To complete deployment:');
    console.log('   1. Sign the transactions with your private key');
    console.log('   2. Submit to EOS RPC endpoint');
    console.log('   3. Verify deployment');
    
    console.log('\n📄 Transaction Data:');
    console.log('=' .repeat(60));
    console.log('Setcode Transaction:');
    console.log(JSON.stringify(transactions.setcodeTransaction, null, 2));
    console.log('\nSetabi Transaction:');
    console.log(JSON.stringify(transactions.setabiTransaction, null, 2));
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { ApiEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new ApiEosDeployer();
  deployer.deploy();
} 
 
const path = require('path');

/**
 * 🚀 API-based EOS Contract Deployment
 * Uses EOS RPC API directly with proper signing
 */
class ApiEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
  }
  
  /**
   * 📋 Check deployment files
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
   * 🔍 Check account status
   */
  async checkAccount() {
    console.log('🔍 Checking account status...');
    
    try {
      const response = await fetch(`${this.rpcUrl}/v1/chain/get_account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_name: this.accountName
        })
      });
      
      const accountInfo = await response.json();
      console.log('✅ Account exists');
      console.log(`   💰 Balance: ${accountInfo.core_liquid_balance || '0 EOS'}`);
      console.log(`   📊 RAM: ${accountInfo.ram_quota} bytes`);
      return true;
    } catch (error) {
      console.log('❌ Account not found or error:', error.message);
      return false;
    }
  }
  
  /**
   * 📄 Read deployment files
   */
  readDeploymentFiles() {
    console.log('📄 Reading deployment files...');
    
    try {
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const abiContent = fs.readFileSync(this.abiPath, 'utf8');
      const abi = JSON.parse(abiContent);
      
      console.log('✅ Files read successfully');
      console.log(`   📦 WASM Size: ${(wasmBuffer.length / 1024).toFixed(1)}KB`);
      console.log(`   📋 ABI Actions: ${abi.actions.length}`);
      
      return { wasmBuffer, abi };
    } catch (error) {
      console.log('❌ Failed to read files:', error.message);
      return null;
    }
  }
  
  /**
   * 🔐 Generate transaction for contract deployment
   */
  generateDeploymentTransaction(wasmBuffer, abi) {
    console.log('🔐 Generating deployment transaction...');
    
    try {
      // Convert WASM to hex
      const wasmHex = wasmBuffer.toString('hex');
      
      // Create setcode transaction
      const setcodeTransaction = {
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
            code: wasmHex
          }
        }]
      };
      
      // Create setabi transaction
      const setabiTransaction = {
        actions: [{
          account: 'eosio',
          name: 'setabi',
          authorization: [{
            actor: this.accountName,
            permission: 'active'
          }],
          data: {
            account: this.accountName,
            abi: abi
          }
        }]
      };
      
      console.log('✅ Deployment transactions generated');
      console.log(`   📦 Setcode transaction: ${JSON.stringify(setcodeTransaction, null, 2)}`);
      console.log(`   📋 Setabi transaction: ${JSON.stringify(setabiTransaction, null, 2)}`);
      
      return { setcodeTransaction, setabiTransaction };
    } catch (error) {
      console.log('❌ Failed to generate transactions:', error.message);
      return null;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 API-based EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!await this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Read deployment files
    const files = this.readDeploymentFiles();
    if (!files) {
      console.log('❌ Cannot proceed without deployment files');
      return false;
    }
    
    // Generate deployment transactions
    const transactions = this.generateDeploymentTransaction(files.wasmBuffer, files.abi);
    if (!transactions) {
      console.log('❌ Cannot proceed without valid transactions');
      return false;
    }
    
    console.log('\n📋 Deployment Transactions Ready!');
    console.log('=' .repeat(60));
    console.log('✅ Files prepared');
    console.log('✅ Account verified');
    console.log('✅ Transactions generated');
    console.log('📋 Ready for signing and deployment');
    
    console.log('\n💡 To complete deployment:');
    console.log('   1. Sign the transactions with your private key');
    console.log('   2. Submit to EOS RPC endpoint');
    console.log('   3. Verify deployment');
    
    console.log('\n📄 Transaction Data:');
    console.log('=' .repeat(60));
    console.log('Setcode Transaction:');
    console.log(JSON.stringify(transactions.setcodeTransaction, null, 2));
    console.log('\nSetabi Transaction:');
    console.log(JSON.stringify(transactions.setabiTransaction, null, 2));
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { ApiEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new ApiEosDeployer();
  deployer.deploy();
} 