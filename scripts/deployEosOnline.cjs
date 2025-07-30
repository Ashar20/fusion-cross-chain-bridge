const fs = require('fs');
const path = require('path');

/**
 * 🚀 Online EOS Contract Deployment
 * Deploys the fusionbridge contract using online tools
 */
class OnlineEosDeployer {
  constructor() {
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.accountName = 'quicksnake34';
    this.network = 'jungle4';
  }
  
  /**
   * 📋 Check if files exist
   */
  checkFiles() {
    console.log('🔍 Checking deployment files...');
    
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
   * 📄 Read ABI content
   */
  readAbi() {
    try {
      const abiContent = fs.readFileSync(this.abiPath, 'utf8');
      return JSON.parse(abiContent);
    } catch (error) {
      console.log('❌ Failed to read ABI file:', error.message);
      return null;
    }
  }
  
  /**
   * 🚀 Deploy using EOS Studio
   */
  deployWithEosStudio() {
    console.log('\n🚀 Deploying with EOS Studio...');
    console.log('=' .repeat(50));
    
    console.log('📋 Steps to deploy:');
    console.log('1. 🌐 Go to: http://app.eosstudio.io/guest');
    console.log('2. 📤 Click "Deploy Contract"');
    console.log('3. 📁 Upload WASM file:', this.wasmPath);
    console.log('4. 📋 Copy ABI content below');
    console.log('5. 🎯 Deploy to account:', this.accountName);
    
    const abi = this.readAbi();
    if (abi) {
      console.log('\n📄 ABI Content (copy this):');
      console.log('=' .repeat(50));
      console.log(JSON.stringify(abi, null, 2));
      console.log('=' .repeat(50));
    }
    
    console.log('\n💡 After deployment, verify with: npm run verify-eos');
  }
  
  /**
   * 🚀 Deploy using Bloks.io
   */
  deployWithBloks() {
    console.log('\n🚀 Deploying with Bloks.io...');
    console.log('=' .repeat(50));
    
    console.log('📋 Steps to deploy:');
    console.log('1. 🌐 Go to: https://local.bloks.io/');
    console.log('2. 🔗 Connect to Jungle4 testnet');
    console.log('3. 📁 Navigate to Smart Contracts');
    console.log('4. 📤 Upload both WASM and ABI files');
    console.log('5. 🎯 Deploy to account:', this.accountName);
    
    console.log('\n📁 Files to upload:');
    console.log(`   📦 WASM: ${this.wasmPath}`);
    console.log(`   📋 ABI: ${this.abiPath}`);
    
    console.log('\n💡 After deployment, verify with: npm run verify-eos');
  }
  
  /**
   * 🚀 Deploy using Cryptolions
   */
  deployWithCryptolions() {
    console.log('\n🚀 Deploying with Cryptolions...');
    console.log('=' .repeat(50));
    
    console.log('📋 Steps to deploy:');
    console.log('1. 🌐 Go to: https://jungle4.cryptolions.io/');
    console.log('2. 📁 Use contract deployment interface');
    console.log('3. 📤 Upload WASM and ABI files');
    console.log('4. 🎯 Deploy to account:', this.accountName);
    
    console.log('\n📁 Files to upload:');
    console.log(`   📦 WASM: ${this.wasmPath}`);
    console.log(`   📋 ABI: ${this.abiPath}`);
    
    console.log('\n💡 After deployment, verify with: npm run verify-eos');
  }
  
  /**
   * 🚀 Auto-deploy using curl (if possible)
   */
  async autoDeploy() {
    console.log('\n🚀 Attempting auto-deployment...');
    console.log('=' .repeat(50));
    
    try {
      // Read WASM file as base64
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const wasmBase64 = wasmBuffer.toString('base64');
      
      // Read ABI
      const abi = this.readAbi();
      
      console.log('✅ Files prepared for deployment');
      console.log(`   📦 WASM Size: ${(wasmBuffer.length / 1024).toFixed(1)}KB`);
      console.log(`   📋 ABI Actions: ${abi.actions.length}`);
      
      // Note: Direct deployment via API requires authentication
      // For now, we'll provide the manual steps
      console.log('\n💡 Manual deployment required due to authentication');
      console.log('   Use one of the online tools above');
      
      return false;
    } catch (error) {
      console.log('❌ Auto-deployment failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 EOS Contract Online Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      console.log('❌ Deployment files not found');
      return false;
    }
    
    // Try auto-deployment first
    const autoSuccess = await this.autoDeploy();
    
    if (!autoSuccess) {
      // Provide manual deployment options
      console.log('\n📋 Manual Deployment Options:');
      console.log('=' .repeat(60));
      
      this.deployWithEosStudio();
      this.deployWithBloks();
      this.deployWithCryptolions();
      
      console.log('\n🎯 Recommended: Use EOS Studio (easiest)');
      console.log('   🌐 http://app.eosstudio.io/guest');
    }
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { OnlineEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new OnlineEosDeployer();
  deployer.deploy();
} 
 
const path = require('path');

/**
 * 🚀 Online EOS Contract Deployment
 * Deploys the fusionbridge contract using online tools
 */
class OnlineEosDeployer {
  constructor() {
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.accountName = 'quicksnake34';
    this.network = 'jungle4';
  }
  
  /**
   * 📋 Check if files exist
   */
  checkFiles() {
    console.log('🔍 Checking deployment files...');
    
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
   * 📄 Read ABI content
   */
  readAbi() {
    try {
      const abiContent = fs.readFileSync(this.abiPath, 'utf8');
      return JSON.parse(abiContent);
    } catch (error) {
      console.log('❌ Failed to read ABI file:', error.message);
      return null;
    }
  }
  
  /**
   * 🚀 Deploy using EOS Studio
   */
  deployWithEosStudio() {
    console.log('\n🚀 Deploying with EOS Studio...');
    console.log('=' .repeat(50));
    
    console.log('📋 Steps to deploy:');
    console.log('1. 🌐 Go to: http://app.eosstudio.io/guest');
    console.log('2. 📤 Click "Deploy Contract"');
    console.log('3. 📁 Upload WASM file:', this.wasmPath);
    console.log('4. 📋 Copy ABI content below');
    console.log('5. 🎯 Deploy to account:', this.accountName);
    
    const abi = this.readAbi();
    if (abi) {
      console.log('\n📄 ABI Content (copy this):');
      console.log('=' .repeat(50));
      console.log(JSON.stringify(abi, null, 2));
      console.log('=' .repeat(50));
    }
    
    console.log('\n💡 After deployment, verify with: npm run verify-eos');
  }
  
  /**
   * 🚀 Deploy using Bloks.io
   */
  deployWithBloks() {
    console.log('\n🚀 Deploying with Bloks.io...');
    console.log('=' .repeat(50));
    
    console.log('📋 Steps to deploy:');
    console.log('1. 🌐 Go to: https://local.bloks.io/');
    console.log('2. 🔗 Connect to Jungle4 testnet');
    console.log('3. 📁 Navigate to Smart Contracts');
    console.log('4. 📤 Upload both WASM and ABI files');
    console.log('5. 🎯 Deploy to account:', this.accountName);
    
    console.log('\n📁 Files to upload:');
    console.log(`   📦 WASM: ${this.wasmPath}`);
    console.log(`   📋 ABI: ${this.abiPath}`);
    
    console.log('\n💡 After deployment, verify with: npm run verify-eos');
  }
  
  /**
   * 🚀 Deploy using Cryptolions
   */
  deployWithCryptolions() {
    console.log('\n🚀 Deploying with Cryptolions...');
    console.log('=' .repeat(50));
    
    console.log('📋 Steps to deploy:');
    console.log('1. 🌐 Go to: https://jungle4.cryptolions.io/');
    console.log('2. 📁 Use contract deployment interface');
    console.log('3. 📤 Upload WASM and ABI files');
    console.log('4. 🎯 Deploy to account:', this.accountName);
    
    console.log('\n📁 Files to upload:');
    console.log(`   📦 WASM: ${this.wasmPath}`);
    console.log(`   📋 ABI: ${this.abiPath}`);
    
    console.log('\n💡 After deployment, verify with: npm run verify-eos');
  }
  
  /**
   * 🚀 Auto-deploy using curl (if possible)
   */
  async autoDeploy() {
    console.log('\n🚀 Attempting auto-deployment...');
    console.log('=' .repeat(50));
    
    try {
      // Read WASM file as base64
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      const wasmBase64 = wasmBuffer.toString('base64');
      
      // Read ABI
      const abi = this.readAbi();
      
      console.log('✅ Files prepared for deployment');
      console.log(`   📦 WASM Size: ${(wasmBuffer.length / 1024).toFixed(1)}KB`);
      console.log(`   📋 ABI Actions: ${abi.actions.length}`);
      
      // Note: Direct deployment via API requires authentication
      // For now, we'll provide the manual steps
      console.log('\n💡 Manual deployment required due to authentication');
      console.log('   Use one of the online tools above');
      
      return false;
    } catch (error) {
      console.log('❌ Auto-deployment failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 EOS Contract Online Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      console.log('❌ Deployment files not found');
      return false;
    }
    
    // Try auto-deployment first
    const autoSuccess = await this.autoDeploy();
    
    if (!autoSuccess) {
      // Provide manual deployment options
      console.log('\n📋 Manual Deployment Options:');
      console.log('=' .repeat(60));
      
      this.deployWithEosStudio();
      this.deployWithBloks();
      this.deployWithCryptolions();
      
      console.log('\n🎯 Recommended: Use EOS Studio (easiest)');
      console.log('   🌐 http://app.eosstudio.io/guest');
    }
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { OnlineEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new OnlineEosDeployer();
  deployer.deploy();
} 