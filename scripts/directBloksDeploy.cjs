const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🚀 Direct Bloks.io Deployment Script
 * Provides curl commands for direct contract deployment
 */
class DirectBloksDeploy {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    console.log('🚀 Direct Bloks.io Deployment Script');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
  }
  
  /**
   * 📋 Check deployment files
   */
  checkFiles() {
    console.log('\n📋 Checking Deployment Files:');
    
    const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
    const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
    
    if (fs.existsSync(wasmPath)) {
      const wasmSize = fs.statSync(wasmPath).size;
      console.log(`✅ WASM: ${wasmPath} (${wasmSize} bytes)`);
    } else {
      console.log('❌ WASM file not found');
      return false;
    }
    
    if (fs.existsSync(abiPath)) {
      const abiSize = fs.statSync(abiPath).size;
      console.log(`✅ ABI: ${abiPath} (${abiSize} bytes)`);
    } else {
      console.log('❌ ABI file not found');
      return false;
    }
    
    return true;
  }
  
  /**
   * 🔍 Check current contract status
   */
  checkCurrentStatus() {
    console.log('\n🔍 Checking Current Contract Status...');
    
    try {
      const response = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const code = JSON.parse(response);
      
      if (code.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ Contract not deployed yet');
        return false;
      } else {
        console.log('✅ Contract already deployed!');
        console.log(`   Code Hash: ${code.code_hash}`);
        return true;
      }
    } catch (error) {
      console.log('⚠️  Could not check status');
      return false;
    }
  }
  
  /**
   * 📝 Show manual deployment steps
   */
  showManualSteps() {
    console.log('\n📝 Manual Deployment Steps (if Bloks.io interface doesn\'t work):');
    console.log('=' .repeat(60));
    
    const steps = [
      '1. Install cleos CLI tool',
      '2. Set up cleos configuration:',
      '   cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts/eos/ fusionbridge.wasm fusionbridge.abi',
      '3. Or use online tools:',
      '   - https://jungle4.cryptolions.io/',
      '   - https://jungle4.bloks.io/',
      '   - https://jungle4.eosx.io/',
      '4. Look for "Smart Contracts" or "Deploy Contract" section',
      '5. Upload WASM and ABI files',
      '6. Set account to: quicksnake34',
      '7. Submit transaction'
    ];
    
    steps.forEach((step, index) => {
      console.log(`${step}`);
    });
  }
  
  /**
   * 🔗 Show alternative deployment URLs
   */
  showAlternativeUrls() {
    console.log('\n🔗 Alternative Deployment URLs:');
    console.log('=' .repeat(40));
    
    const urls = [
      'Jungle4 Cryptolions: https://jungle4.cryptolions.io/',
      'Bloks.io: https://jungle4.bloks.io/',
      'EOSX: https://jungle4.eosx.io/',
      'EOS Authority: https://jungle4.eosauthority.com/',
      'Direct Account: https://local.bloks.io/account/quicksnake34?nodeUrl=http%3A%2F%2Fjungle4.cryptolions.io'
    ];
    
    urls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
  }
  
  /**
   * 🧪 Show test parameters
   */
  showTestParameters() {
    console.log('\n🧪 Test HTLC Parameters (after deployment):');
    console.log('=' .repeat(50));
    
    const testParams = {
      sender: 'quicksnake34',
      recipient: 'quicksnake34',
      amount: '0.1000 EOS',
      hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timelock: Math.floor(Date.now() / 1000) + 3600,
      memo: 'Test HTLC',
      eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
    
    console.log('JSON Parameters:');
    console.log(JSON.stringify(testParams, null, 2));
  }
  
  /**
   * 🚀 Start deployment process
   */
  async deploy() {
    console.log('🚀 Starting Direct Bloks.io Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    const filesOk = this.checkFiles();
    if (!filesOk) {
      console.log('❌ Deployment files missing');
      return false;
    }
    
    // Check current status
    const isDeployed = this.checkCurrentStatus();
    if (isDeployed) {
      console.log('\n🎉 Contract is already deployed!');
      console.log('💡 Run: npm run verify-eos');
      return true;
    }
    
    // Show manual steps
    this.showManualSteps();
    
    // Show alternative URLs
    this.showAlternativeUrls();
    
    // Show test parameters
    this.showTestParameters();
    
    console.log('\n🎯 Deployment Options:');
    console.log('=' .repeat(60));
    console.log('💡 Option 1: Use Bloks.io interface (recommended)');
    console.log('💡 Option 2: Use other online tools');
    console.log('💡 Option 3: Use cleos CLI (if available)');
    console.log('💡 After deployment, run: npm run verify-eos');
    console.log('💡 Then test with: npm run real-eos');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { DirectBloksDeploy };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DirectBloksDeploy();
  deployer.deploy();
} 
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🚀 Direct Bloks.io Deployment Script
 * Provides curl commands for direct contract deployment
 */
class DirectBloksDeploy {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    console.log('🚀 Direct Bloks.io Deployment Script');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
  }
  
  /**
   * 📋 Check deployment files
   */
  checkFiles() {
    console.log('\n📋 Checking Deployment Files:');
    
    const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
    const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
    
    if (fs.existsSync(wasmPath)) {
      const wasmSize = fs.statSync(wasmPath).size;
      console.log(`✅ WASM: ${wasmPath} (${wasmSize} bytes)`);
    } else {
      console.log('❌ WASM file not found');
      return false;
    }
    
    if (fs.existsSync(abiPath)) {
      const abiSize = fs.statSync(abiPath).size;
      console.log(`✅ ABI: ${abiPath} (${abiSize} bytes)`);
    } else {
      console.log('❌ ABI file not found');
      return false;
    }
    
    return true;
  }
  
  /**
   * 🔍 Check current contract status
   */
  checkCurrentStatus() {
    console.log('\n🔍 Checking Current Contract Status...');
    
    try {
      const response = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const code = JSON.parse(response);
      
      if (code.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ Contract not deployed yet');
        return false;
      } else {
        console.log('✅ Contract already deployed!');
        console.log(`   Code Hash: ${code.code_hash}`);
        return true;
      }
    } catch (error) {
      console.log('⚠️  Could not check status');
      return false;
    }
  }
  
  /**
   * 📝 Show manual deployment steps
   */
  showManualSteps() {
    console.log('\n📝 Manual Deployment Steps (if Bloks.io interface doesn\'t work):');
    console.log('=' .repeat(60));
    
    const steps = [
      '1. Install cleos CLI tool',
      '2. Set up cleos configuration:',
      '   cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts/eos/ fusionbridge.wasm fusionbridge.abi',
      '3. Or use online tools:',
      '   - https://jungle4.cryptolions.io/',
      '   - https://jungle4.bloks.io/',
      '   - https://jungle4.eosx.io/',
      '4. Look for "Smart Contracts" or "Deploy Contract" section',
      '5. Upload WASM and ABI files',
      '6. Set account to: quicksnake34',
      '7. Submit transaction'
    ];
    
    steps.forEach((step, index) => {
      console.log(`${step}`);
    });
  }
  
  /**
   * 🔗 Show alternative deployment URLs
   */
  showAlternativeUrls() {
    console.log('\n🔗 Alternative Deployment URLs:');
    console.log('=' .repeat(40));
    
    const urls = [
      'Jungle4 Cryptolions: https://jungle4.cryptolions.io/',
      'Bloks.io: https://jungle4.bloks.io/',
      'EOSX: https://jungle4.eosx.io/',
      'EOS Authority: https://jungle4.eosauthority.com/',
      'Direct Account: https://local.bloks.io/account/quicksnake34?nodeUrl=http%3A%2F%2Fjungle4.cryptolions.io'
    ];
    
    urls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
  }
  
  /**
   * 🧪 Show test parameters
   */
  showTestParameters() {
    console.log('\n🧪 Test HTLC Parameters (after deployment):');
    console.log('=' .repeat(50));
    
    const testParams = {
      sender: 'quicksnake34',
      recipient: 'quicksnake34',
      amount: '0.1000 EOS',
      hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timelock: Math.floor(Date.now() / 1000) + 3600,
      memo: 'Test HTLC',
      eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
    
    console.log('JSON Parameters:');
    console.log(JSON.stringify(testParams, null, 2));
  }
  
  /**
   * 🚀 Start deployment process
   */
  async deploy() {
    console.log('🚀 Starting Direct Bloks.io Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    const filesOk = this.checkFiles();
    if (!filesOk) {
      console.log('❌ Deployment files missing');
      return false;
    }
    
    // Check current status
    const isDeployed = this.checkCurrentStatus();
    if (isDeployed) {
      console.log('\n🎉 Contract is already deployed!');
      console.log('💡 Run: npm run verify-eos');
      return true;
    }
    
    // Show manual steps
    this.showManualSteps();
    
    // Show alternative URLs
    this.showAlternativeUrls();
    
    // Show test parameters
    this.showTestParameters();
    
    console.log('\n🎯 Deployment Options:');
    console.log('=' .repeat(60));
    console.log('💡 Option 1: Use Bloks.io interface (recommended)');
    console.log('💡 Option 2: Use other online tools');
    console.log('💡 Option 3: Use cleos CLI (if available)');
    console.log('💡 After deployment, run: npm run verify-eos');
    console.log('💡 Then test with: npm run real-eos');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { DirectBloksDeploy };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DirectBloksDeploy();
  deployer.deploy();
} 
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🚀 Direct Bloks.io Deployment Script
 * Provides curl commands for direct contract deployment
 */
class DirectBloksDeploy {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    console.log('🚀 Direct Bloks.io Deployment Script');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
  }
  
  /**
   * 📋 Check deployment files
   */
  checkFiles() {
    console.log('\n📋 Checking Deployment Files:');
    
    const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
    const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
    
    if (fs.existsSync(wasmPath)) {
      const wasmSize = fs.statSync(wasmPath).size;
      console.log(`✅ WASM: ${wasmPath} (${wasmSize} bytes)`);
    } else {
      console.log('❌ WASM file not found');
      return false;
    }
    
    if (fs.existsSync(abiPath)) {
      const abiSize = fs.statSync(abiPath).size;
      console.log(`✅ ABI: ${abiPath} (${abiSize} bytes)`);
    } else {
      console.log('❌ ABI file not found');
      return false;
    }
    
    return true;
  }
  
  /**
   * 🔍 Check current contract status
   */
  checkCurrentStatus() {
    console.log('\n🔍 Checking Current Contract Status...');
    
    try {
      const response = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const code = JSON.parse(response);
      
      if (code.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ Contract not deployed yet');
        return false;
      } else {
        console.log('✅ Contract already deployed!');
        console.log(`   Code Hash: ${code.code_hash}`);
        return true;
      }
    } catch (error) {
      console.log('⚠️  Could not check status');
      return false;
    }
  }
  
  /**
   * 📝 Show manual deployment steps
   */
  showManualSteps() {
    console.log('\n📝 Manual Deployment Steps (if Bloks.io interface doesn\'t work):');
    console.log('=' .repeat(60));
    
    const steps = [
      '1. Install cleos CLI tool',
      '2. Set up cleos configuration:',
      '   cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts/eos/ fusionbridge.wasm fusionbridge.abi',
      '3. Or use online tools:',
      '   - https://jungle4.cryptolions.io/',
      '   - https://jungle4.bloks.io/',
      '   - https://jungle4.eosx.io/',
      '4. Look for "Smart Contracts" or "Deploy Contract" section',
      '5. Upload WASM and ABI files',
      '6. Set account to: quicksnake34',
      '7. Submit transaction'
    ];
    
    steps.forEach((step, index) => {
      console.log(`${step}`);
    });
  }
  
  /**
   * 🔗 Show alternative deployment URLs
   */
  showAlternativeUrls() {
    console.log('\n🔗 Alternative Deployment URLs:');
    console.log('=' .repeat(40));
    
    const urls = [
      'Jungle4 Cryptolions: https://jungle4.cryptolions.io/',
      'Bloks.io: https://jungle4.bloks.io/',
      'EOSX: https://jungle4.eosx.io/',
      'EOS Authority: https://jungle4.eosauthority.com/',
      'Direct Account: https://local.bloks.io/account/quicksnake34?nodeUrl=http%3A%2F%2Fjungle4.cryptolions.io'
    ];
    
    urls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
  }
  
  /**
   * 🧪 Show test parameters
   */
  showTestParameters() {
    console.log('\n🧪 Test HTLC Parameters (after deployment):');
    console.log('=' .repeat(50));
    
    const testParams = {
      sender: 'quicksnake34',
      recipient: 'quicksnake34',
      amount: '0.1000 EOS',
      hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timelock: Math.floor(Date.now() / 1000) + 3600,
      memo: 'Test HTLC',
      eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
    
    console.log('JSON Parameters:');
    console.log(JSON.stringify(testParams, null, 2));
  }
  
  /**
   * 🚀 Start deployment process
   */
  async deploy() {
    console.log('🚀 Starting Direct Bloks.io Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    const filesOk = this.checkFiles();
    if (!filesOk) {
      console.log('❌ Deployment files missing');
      return false;
    }
    
    // Check current status
    const isDeployed = this.checkCurrentStatus();
    if (isDeployed) {
      console.log('\n🎉 Contract is already deployed!');
      console.log('💡 Run: npm run verify-eos');
      return true;
    }
    
    // Show manual steps
    this.showManualSteps();
    
    // Show alternative URLs
    this.showAlternativeUrls();
    
    // Show test parameters
    this.showTestParameters();
    
    console.log('\n🎯 Deployment Options:');
    console.log('=' .repeat(60));
    console.log('💡 Option 1: Use Bloks.io interface (recommended)');
    console.log('💡 Option 2: Use other online tools');
    console.log('💡 Option 3: Use cleos CLI (if available)');
    console.log('💡 After deployment, run: npm run verify-eos');
    console.log('💡 Then test with: npm run real-eos');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { DirectBloksDeploy };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DirectBloksDeploy();
  deployer.deploy();
} 