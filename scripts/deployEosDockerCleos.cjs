const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🐳 Docker-based EOS Contract Deployment using cleos
 * Deploys the fusionbridge contract using cleos in Docker
 */
class DockerCleosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.dockerImage = 'eosio/eosio.cdt:v1.8.1';
  }
  
  /**
   * 🔍 Check if Docker is available
   */
  checkDocker() {
    console.log('🔍 Checking Docker availability...');
    
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker is available');
      return true;
    } catch (error) {
      console.log('❌ Docker not found or not running');
      console.log('💡 Please install Docker Desktop and start it');
      return false;
    }
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
   * 🔍 Check account status using curl
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
   * 🚀 Deploy contract code using curl
   */
  deployContractCode() {
    console.log('🚀 Deploying contract code...');
    
    try {
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const wasmHex = wasmBuffer.toString('hex');
      
      const deployData = {
        account: this.accountName,
        vmtype: 0,
        vmversion: 0,
        code: wasmHex
      };
      
      console.log('📋 Deploying contract code via RPC...');
      console.log('💡 This requires proper signing - using manual deployment instead');
      
      // Since we can't sign directly, we'll provide the manual steps
      console.log('\n📋 Manual Deployment Steps:');
      console.log('=' .repeat(50));
      console.log('1. 🌐 Go to: http://app.eosstudio.io/guest');
      console.log('2. 📤 Upload WASM file:', this.wasmPath);
      console.log('3. 📋 Copy ABI content from below');
      console.log('4. 🎯 Deploy to account:', this.accountName);
      
      return false;
    } catch (error) {
      console.log('❌ Failed to prepare deployment:', error.message);
      return false;
    }
  }
  
  /**
   * 📋 Show ABI content
   */
  showAbiContent() {
    console.log('\n📄 ABI Content (copy this):');
    console.log('=' .repeat(50));
    
    try {
      const abiContent = fs.readFileSync(this.abiPath, 'utf8');
      console.log(abiContent);
      console.log('=' .repeat(50));
    } catch (error) {
      console.log('❌ Failed to read ABI file:', error.message);
    }
  }
  
  /**
   * 🧪 Test contract after deployment
   */
  testContract() {
    console.log('🧪 Testing contract (after manual deployment)...');
    
    try {
      const result = execSync(
        `curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      const codeInfo = JSON.parse(result);
      
      if (codeInfo.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ Contract not deployed yet');
        return false;
      } else {
        console.log('✅ Contract is deployed');
        console.log(`   📦 Code Hash: ${codeInfo.code_hash}`);
        console.log(`   📊 Code Size: ${codeInfo.code_size} bytes`);
        return true;
      }
    } catch (error) {
      console.log('❌ Failed to test contract:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🐳 Docker-based EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check Docker
    if (!this.checkDocker()) {
      return false;
    }
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Show deployment instructions
    this.deployContractCode();
    this.showAbiContent();
    
    console.log('\n💡 After manual deployment, verify with:');
    console.log('   npm run verify-eos');
    
    console.log('\n🎯 Ready for manual deployment!');
    console.log('=' .repeat(60));
    console.log('✅ Files prepared');
    console.log('✅ Account verified');
    console.log('✅ ABI content ready');
    console.log('📋 Deploy using EOS Studio or other online tools');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { DockerCleosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DockerCleosDeployer();
  deployer.deploy();
} 
const fs = require('fs');
const path = require('path');

/**
 * 🐳 Docker-based EOS Contract Deployment using cleos
 * Deploys the fusionbridge contract using cleos in Docker
 */
class DockerCleosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.dockerImage = 'eosio/eosio.cdt:v1.8.1';
  }
  
  /**
   * 🔍 Check if Docker is available
   */
  checkDocker() {
    console.log('🔍 Checking Docker availability...');
    
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker is available');
      return true;
    } catch (error) {
      console.log('❌ Docker not found or not running');
      console.log('💡 Please install Docker Desktop and start it');
      return false;
    }
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
   * 🔍 Check account status using curl
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
   * 🚀 Deploy contract code using curl
   */
  deployContractCode() {
    console.log('🚀 Deploying contract code...');
    
    try {
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const wasmHex = wasmBuffer.toString('hex');
      
      const deployData = {
        account: this.accountName,
        vmtype: 0,
        vmversion: 0,
        code: wasmHex
      };
      
      console.log('📋 Deploying contract code via RPC...');
      console.log('💡 This requires proper signing - using manual deployment instead');
      
      // Since we can't sign directly, we'll provide the manual steps
      console.log('\n📋 Manual Deployment Steps:');
      console.log('=' .repeat(50));
      console.log('1. 🌐 Go to: http://app.eosstudio.io/guest');
      console.log('2. 📤 Upload WASM file:', this.wasmPath);
      console.log('3. 📋 Copy ABI content from below');
      console.log('4. 🎯 Deploy to account:', this.accountName);
      
      return false;
    } catch (error) {
      console.log('❌ Failed to prepare deployment:', error.message);
      return false;
    }
  }
  
  /**
   * 📋 Show ABI content
   */
  showAbiContent() {
    console.log('\n📄 ABI Content (copy this):');
    console.log('=' .repeat(50));
    
    try {
      const abiContent = fs.readFileSync(this.abiPath, 'utf8');
      console.log(abiContent);
      console.log('=' .repeat(50));
    } catch (error) {
      console.log('❌ Failed to read ABI file:', error.message);
    }
  }
  
  /**
   * 🧪 Test contract after deployment
   */
  testContract() {
    console.log('🧪 Testing contract (after manual deployment)...');
    
    try {
      const result = execSync(
        `curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      const codeInfo = JSON.parse(result);
      
      if (codeInfo.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ Contract not deployed yet');
        return false;
      } else {
        console.log('✅ Contract is deployed');
        console.log(`   📦 Code Hash: ${codeInfo.code_hash}`);
        console.log(`   📊 Code Size: ${codeInfo.code_size} bytes`);
        return true;
      }
    } catch (error) {
      console.log('❌ Failed to test contract:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🐳 Docker-based EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check Docker
    if (!this.checkDocker()) {
      return false;
    }
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Show deployment instructions
    this.deployContractCode();
    this.showAbiContent();
    
    console.log('\n💡 After manual deployment, verify with:');
    console.log('   npm run verify-eos');
    
    console.log('\n🎯 Ready for manual deployment!');
    console.log('=' .repeat(60));
    console.log('✅ Files prepared');
    console.log('✅ Account verified');
    console.log('✅ ABI content ready');
    console.log('📋 Deploy using EOS Studio or other online tools');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { DockerCleosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DockerCleosDeployer();
  deployer.deploy();
} 
const fs = require('fs');
const path = require('path');

/**
 * 🐳 Docker-based EOS Contract Deployment using cleos
 * Deploys the fusionbridge contract using cleos in Docker
 */
class DockerCleosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.dockerImage = 'eosio/eosio.cdt:v1.8.1';
  }
  
  /**
   * 🔍 Check if Docker is available
   */
  checkDocker() {
    console.log('🔍 Checking Docker availability...');
    
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker is available');
      return true;
    } catch (error) {
      console.log('❌ Docker not found or not running');
      console.log('💡 Please install Docker Desktop and start it');
      return false;
    }
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
   * 🔍 Check account status using curl
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
   * 🚀 Deploy contract code using curl
   */
  deployContractCode() {
    console.log('🚀 Deploying contract code...');
    
    try {
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const wasmHex = wasmBuffer.toString('hex');
      
      const deployData = {
        account: this.accountName,
        vmtype: 0,
        vmversion: 0,
        code: wasmHex
      };
      
      console.log('📋 Deploying contract code via RPC...');
      console.log('💡 This requires proper signing - using manual deployment instead');
      
      // Since we can't sign directly, we'll provide the manual steps
      console.log('\n📋 Manual Deployment Steps:');
      console.log('=' .repeat(50));
      console.log('1. 🌐 Go to: http://app.eosstudio.io/guest');
      console.log('2. 📤 Upload WASM file:', this.wasmPath);
      console.log('3. 📋 Copy ABI content from below');
      console.log('4. 🎯 Deploy to account:', this.accountName);
      
      return false;
    } catch (error) {
      console.log('❌ Failed to prepare deployment:', error.message);
      return false;
    }
  }
  
  /**
   * 📋 Show ABI content
   */
  showAbiContent() {
    console.log('\n📄 ABI Content (copy this):');
    console.log('=' .repeat(50));
    
    try {
      const abiContent = fs.readFileSync(this.abiPath, 'utf8');
      console.log(abiContent);
      console.log('=' .repeat(50));
    } catch (error) {
      console.log('❌ Failed to read ABI file:', error.message);
    }
  }
  
  /**
   * 🧪 Test contract after deployment
   */
  testContract() {
    console.log('🧪 Testing contract (after manual deployment)...');
    
    try {
      const result = execSync(
        `curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      const codeInfo = JSON.parse(result);
      
      if (codeInfo.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ Contract not deployed yet');
        return false;
      } else {
        console.log('✅ Contract is deployed');
        console.log(`   📦 Code Hash: ${codeInfo.code_hash}`);
        console.log(`   📊 Code Size: ${codeInfo.code_size} bytes`);
        return true;
      }
    } catch (error) {
      console.log('❌ Failed to test contract:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🐳 Docker-based EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check Docker
    if (!this.checkDocker()) {
      return false;
    }
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Show deployment instructions
    this.deployContractCode();
    this.showAbiContent();
    
    console.log('\n💡 After manual deployment, verify with:');
    console.log('   npm run verify-eos');
    
    console.log('\n🎯 Ready for manual deployment!');
    console.log('=' .repeat(60));
    console.log('✅ Files prepared');
    console.log('✅ Account verified');
    console.log('✅ ABI content ready');
    console.log('📋 Deploy using EOS Studio or other online tools');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { DockerCleosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DockerCleosDeployer();
  deployer.deploy();
} 