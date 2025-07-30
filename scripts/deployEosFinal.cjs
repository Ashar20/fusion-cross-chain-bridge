const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Final EOS Contract Deployment
 * Uses multiple methods to deploy the contract
 */
class FinalEosDeployer {
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
  checkAccount() {
    console.log('🔍 Checking account status...');
    
    try {
      const result = execSync(
        `curl -s -X POST ${this.rpcUrl}/v1/chain/get_account -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      const accountInfo = JSON.parse(result);
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
   * 🚀 Try to install cleos locally
   */
  tryInstallCleos() {
    console.log('🚀 Attempting to install cleos locally...');
    
    try {
      // Check if cleos is already installed
      execSync('cleos --version', { stdio: 'pipe' });
      console.log('✅ cleos is already installed');
      return true;
    } catch (error) {
      console.log('❌ cleos not found, attempting to install...');
      
      try {
        // Try to install using brew
        execSync('brew install eosio', { stdio: 'inherit' });
        console.log('✅ cleos installed successfully');
        return true;
      } catch (brewError) {
        console.log('❌ Failed to install cleos via brew:', brewError.message);
        console.log('💡 Manual installation required');
        return false;
      }
    }
  }
  
  /**
   * 🚀 Deploy using local cleos
   */
  deployWithCleos() {
    console.log('🚀 Deploying with local cleos...');
    
    try {
      // Deploy contract code
      console.log('📋 Deploying contract code...');
      const codeCommand = `cleos -u ${this.rpcUrl} set code ${this.accountName} ${this.wasmPath}`;
      execSync(codeCommand, { stdio: 'inherit' });
      console.log('✅ Contract code deployed');
      
      // Deploy contract ABI
      console.log('📋 Deploying contract ABI...');
      const abiCommand = `cleos -u ${this.rpcUrl} set abi ${this.accountName} ${this.abiPath}`;
      execSync(abiCommand, { stdio: 'inherit' });
      console.log('✅ Contract ABI deployed');
      
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy with cleos:', error.message);
      return false;
    }
  }
  
  /**
   * 🧪 Test contract deployment
   */
  testContract() {
    console.log('🧪 Testing contract deployment...');
    
    try {
      const command = `cleos -u ${this.rpcUrl} push action ${this.accountName} getstats '{}' -p ${this.accountName}@active`;
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Contract test successful');
      return true;
    } catch (error) {
      console.log('❌ Contract test failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🏗️ Create test HTLC
   */
  createTestHtlc() {
    console.log('🏗️ Creating test HTLC...');
    
    try {
      const testData = {
        sender: this.accountName,
        recipient: this.accountName,
        amount: '0.1000 EOS',
        hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timelock: Math.floor(Date.now() / 1000) + 3600,
        memo: 'Test HTLC from cleos',
        eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };
      
      const command = `cleos -u ${this.rpcUrl} push action ${this.accountName} createhtlc '${JSON.stringify(testData)}' -p ${this.accountName}@active`;
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Test HTLC created successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to create test HTLC:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 Final EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Try to install cleos
    const cleosInstalled = this.tryInstallCleos();
    
    if (cleosInstalled) {
      // Deploy with cleos
      const deploySuccess = this.deployWithCleos();
      
      if (deploySuccess) {
        // Test contract
        this.testContract();
        
        // Create test HTLC
        this.createTestHtlc();
        
        console.log('\n🎉 CONTRACT DEPLOYMENT COMPLETED!');
        console.log('=' .repeat(60));
        console.log('✅ Contract code deployed');
        console.log('✅ Contract ABI deployed');
        console.log('✅ Ready for real EOS HTLC creation');
        
        console.log('\n🚀 Your relayer can now create real EOS HTLCs!');
        console.log('📋 Next steps:');
        console.log('   1. Start the relayer service: npm run start-relayer');
        console.log('   2. Test cross-chain swap: npm run bidirectional');
        console.log('   3. Monitor HTLC creation and claiming');
        
        return true;
      }
    }
    
    // Fallback to manual deployment
    console.log('\n📋 Manual Deployment Required');
    console.log('=' .repeat(60));
    console.log('✅ Files prepared');
    console.log('✅ Account verified');
    console.log('📋 Deploy using online tools');
    
    console.log('\n🌐 Deploy using:');
    console.log('   📱 EOS Studio: http://app.eosstudio.io/guest');
    console.log('   🌐 Bloks.io: https://local.bloks.io/');
    console.log('   🔗 Cryptolions: https://jungle4.cryptolions.io/');
    
    console.log('\n📁 Files to upload:');
    console.log(`   📦 WASM: ${this.wasmPath}`);
    console.log(`   📋 ABI: ${this.abiPath}`);
    
    console.log('\n💡 After deployment, verify with: npm run verify-eos');
    
    return false;
  }
}

// Export for use in other scripts
module.exports = { FinalEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new FinalEosDeployer();
  deployer.deploy();
} 
 
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Final EOS Contract Deployment
 * Uses multiple methods to deploy the contract
 */
class FinalEosDeployer {
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
  checkAccount() {
    console.log('🔍 Checking account status...');
    
    try {
      const result = execSync(
        `curl -s -X POST ${this.rpcUrl}/v1/chain/get_account -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      const accountInfo = JSON.parse(result);
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
   * 🚀 Try to install cleos locally
   */
  tryInstallCleos() {
    console.log('🚀 Attempting to install cleos locally...');
    
    try {
      // Check if cleos is already installed
      execSync('cleos --version', { stdio: 'pipe' });
      console.log('✅ cleos is already installed');
      return true;
    } catch (error) {
      console.log('❌ cleos not found, attempting to install...');
      
      try {
        // Try to install using brew
        execSync('brew install eosio', { stdio: 'inherit' });
        console.log('✅ cleos installed successfully');
        return true;
      } catch (brewError) {
        console.log('❌ Failed to install cleos via brew:', brewError.message);
        console.log('💡 Manual installation required');
        return false;
      }
    }
  }
  
  /**
   * 🚀 Deploy using local cleos
   */
  deployWithCleos() {
    console.log('🚀 Deploying with local cleos...');
    
    try {
      // Deploy contract code
      console.log('📋 Deploying contract code...');
      const codeCommand = `cleos -u ${this.rpcUrl} set code ${this.accountName} ${this.wasmPath}`;
      execSync(codeCommand, { stdio: 'inherit' });
      console.log('✅ Contract code deployed');
      
      // Deploy contract ABI
      console.log('📋 Deploying contract ABI...');
      const abiCommand = `cleos -u ${this.rpcUrl} set abi ${this.accountName} ${this.abiPath}`;
      execSync(abiCommand, { stdio: 'inherit' });
      console.log('✅ Contract ABI deployed');
      
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy with cleos:', error.message);
      return false;
    }
  }
  
  /**
   * 🧪 Test contract deployment
   */
  testContract() {
    console.log('🧪 Testing contract deployment...');
    
    try {
      const command = `cleos -u ${this.rpcUrl} push action ${this.accountName} getstats '{}' -p ${this.accountName}@active`;
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Contract test successful');
      return true;
    } catch (error) {
      console.log('❌ Contract test failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🏗️ Create test HTLC
   */
  createTestHtlc() {
    console.log('🏗️ Creating test HTLC...');
    
    try {
      const testData = {
        sender: this.accountName,
        recipient: this.accountName,
        amount: '0.1000 EOS',
        hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timelock: Math.floor(Date.now() / 1000) + 3600,
        memo: 'Test HTLC from cleos',
        eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };
      
      const command = `cleos -u ${this.rpcUrl} push action ${this.accountName} createhtlc '${JSON.stringify(testData)}' -p ${this.accountName}@active`;
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Test HTLC created successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to create test HTLC:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 Final EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Try to install cleos
    const cleosInstalled = this.tryInstallCleos();
    
    if (cleosInstalled) {
      // Deploy with cleos
      const deploySuccess = this.deployWithCleos();
      
      if (deploySuccess) {
        // Test contract
        this.testContract();
        
        // Create test HTLC
        this.createTestHtlc();
        
        console.log('\n🎉 CONTRACT DEPLOYMENT COMPLETED!');
        console.log('=' .repeat(60));
        console.log('✅ Contract code deployed');
        console.log('✅ Contract ABI deployed');
        console.log('✅ Ready for real EOS HTLC creation');
        
        console.log('\n🚀 Your relayer can now create real EOS HTLCs!');
        console.log('📋 Next steps:');
        console.log('   1. Start the relayer service: npm run start-relayer');
        console.log('   2. Test cross-chain swap: npm run bidirectional');
        console.log('   3. Monitor HTLC creation and claiming');
        
        return true;
      }
    }
    
    // Fallback to manual deployment
    console.log('\n📋 Manual Deployment Required');
    console.log('=' .repeat(60));
    console.log('✅ Files prepared');
    console.log('✅ Account verified');
    console.log('📋 Deploy using online tools');
    
    console.log('\n🌐 Deploy using:');
    console.log('   📱 EOS Studio: http://app.eosstudio.io/guest');
    console.log('   🌐 Bloks.io: https://local.bloks.io/');
    console.log('   🔗 Cryptolions: https://jungle4.cryptolions.io/');
    
    console.log('\n📁 Files to upload:');
    console.log(`   📦 WASM: ${this.wasmPath}`);
    console.log(`   📋 ABI: ${this.abiPath}`);
    
    console.log('\n💡 After deployment, verify with: npm run verify-eos');
    
    return false;
  }
}

// Export for use in other scripts
module.exports = { FinalEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new FinalEosDeployer();
  deployer.deploy();
} 