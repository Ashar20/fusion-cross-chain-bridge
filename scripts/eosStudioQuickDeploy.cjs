const fs = require('fs');
const path = require('path');

/**
 * 🚀 EOS Studio Quick Deployment Guide
 * For deploying fusionbridge contract in EOS Studio
 */
class EosStudioQuickDeploy {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    
    console.log('🚀 EOS Studio Quick Deployment Guide');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 IDE: EOS Studio`);
  }
  
  /**
   * 📋 Show fusionbridge files
   */
  showFusionbridgeFiles() {
    console.log('\n📋 Fusionbridge Files (Need to Deploy):');
    
    const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
    const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
    
    if (fs.existsSync(wasmPath)) {
      const wasmSize = fs.statSync(wasmPath).size;
      console.log(`✅ WASM: ${wasmPath} (${wasmSize} bytes)`);
    } else {
      console.log('❌ WASM file not found');
    }
    
    if (fs.existsSync(abiPath)) {
      const abiSize = fs.statSync(abiPath).size;
      console.log(`✅ ABI: ${abiPath} (${abiSize} bytes)`);
    } else {
      console.log('❌ ABI file not found');
    }
  }
  
  /**
   * 📝 Show EOS Studio deployment steps
   */
  showDeploymentSteps() {
    console.log('\n📝 EOS Studio Deployment Steps:');
    console.log('=' .repeat(60));
    
    const steps = [
      '1. In EOS Studio, look for "Deploy" or "Contract" section',
      '2. Click "Set Contract" or "Deploy Contract"',
      '3. Upload WASM file: contracts/eos/fusionbridge.wasm',
      '4. Upload ABI file: contracts/eos/fusionbridge.abi',
      '5. Set contract account: quicksnake34',
      '6. Click "Deploy" or "Submit"',
      '7. Wait for transaction confirmation',
      '8. Verify deployment in "Contracts" tab'
    ];
    
    steps.forEach((step, index) => {
      console.log(`${step}`);
    });
  }
  
  /**
   * 🔍 Show where to find deployment section
   */
  showWhereToFindDeploy() {
    console.log('\n🔍 Where to Find Deployment Section:');
    console.log('=' .repeat(50));
    
    const locations = [
      '1. Look for "Deploy" tab in the top navigation',
      '2. Look for "Contract" section in the sidebar',
      '3. Look for "Set Contract" button',
      '4. Look for "Deploy Contract" option',
      '5. Look for "Actions" tab and find "setcode" action',
      '6. Look for "Smart Contracts" section'
    ];
    
    locations.forEach((location, index) => {
      console.log(`${location}`);
    });
  }
  
  /**
   * 🧪 Show test HTLC parameters
   */
  showTestParameters() {
    console.log('\n🧪 Test HTLC Parameters (After Deployment):');
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
   * 🚀 Start deployment guide
   */
  async deploy() {
    console.log('🚀 Starting EOS Studio Quick Deployment');
    console.log('=' .repeat(60));
    
    // Show fusionbridge files
    this.showFusionbridgeFiles();
    
    // Show where to find deploy section
    this.showWhereToFindDeploy();
    
    // Show deployment steps
    this.showDeploymentSteps();
    
    // Show test parameters
    this.showTestParameters();
    
    console.log('\n🎯 Ready to Deploy!');
    console.log('=' .repeat(60));
    console.log('💡 Look for the deployment section in EOS Studio');
    console.log('💡 Upload fusionbridge.wasm and fusionbridge.abi');
    console.log('💡 After deployment, run: npm run verify-eos');
    console.log('💡 Then test with: npm run real-eos');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { EosStudioQuickDeploy };

// Run deployment guide if called directly
if (require.main === module) {
  const guide = new EosStudioQuickDeploy();
  guide.deploy();
} 
const path = require('path');

/**
 * 🚀 EOS Studio Quick Deployment Guide
 * For deploying fusionbridge contract in EOS Studio
 */
class EosStudioQuickDeploy {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    
    console.log('🚀 EOS Studio Quick Deployment Guide');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 IDE: EOS Studio`);
  }
  
  /**
   * 📋 Show fusionbridge files
   */
  showFusionbridgeFiles() {
    console.log('\n📋 Fusionbridge Files (Need to Deploy):');
    
    const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
    const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
    
    if (fs.existsSync(wasmPath)) {
      const wasmSize = fs.statSync(wasmPath).size;
      console.log(`✅ WASM: ${wasmPath} (${wasmSize} bytes)`);
    } else {
      console.log('❌ WASM file not found');
    }
    
    if (fs.existsSync(abiPath)) {
      const abiSize = fs.statSync(abiPath).size;
      console.log(`✅ ABI: ${abiPath} (${abiSize} bytes)`);
    } else {
      console.log('❌ ABI file not found');
    }
  }
  
  /**
   * 📝 Show EOS Studio deployment steps
   */
  showDeploymentSteps() {
    console.log('\n📝 EOS Studio Deployment Steps:');
    console.log('=' .repeat(60));
    
    const steps = [
      '1. In EOS Studio, look for "Deploy" or "Contract" section',
      '2. Click "Set Contract" or "Deploy Contract"',
      '3. Upload WASM file: contracts/eos/fusionbridge.wasm',
      '4. Upload ABI file: contracts/eos/fusionbridge.abi',
      '5. Set contract account: quicksnake34',
      '6. Click "Deploy" or "Submit"',
      '7. Wait for transaction confirmation',
      '8. Verify deployment in "Contracts" tab'
    ];
    
    steps.forEach((step, index) => {
      console.log(`${step}`);
    });
  }
  
  /**
   * 🔍 Show where to find deployment section
   */
  showWhereToFindDeploy() {
    console.log('\n🔍 Where to Find Deployment Section:');
    console.log('=' .repeat(50));
    
    const locations = [
      '1. Look for "Deploy" tab in the top navigation',
      '2. Look for "Contract" section in the sidebar',
      '3. Look for "Set Contract" button',
      '4. Look for "Deploy Contract" option',
      '5. Look for "Actions" tab and find "setcode" action',
      '6. Look for "Smart Contracts" section'
    ];
    
    locations.forEach((location, index) => {
      console.log(`${location}`);
    });
  }
  
  /**
   * 🧪 Show test HTLC parameters
   */
  showTestParameters() {
    console.log('\n🧪 Test HTLC Parameters (After Deployment):');
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
   * 🚀 Start deployment guide
   */
  async deploy() {
    console.log('🚀 Starting EOS Studio Quick Deployment');
    console.log('=' .repeat(60));
    
    // Show fusionbridge files
    this.showFusionbridgeFiles();
    
    // Show where to find deploy section
    this.showWhereToFindDeploy();
    
    // Show deployment steps
    this.showDeploymentSteps();
    
    // Show test parameters
    this.showTestParameters();
    
    console.log('\n🎯 Ready to Deploy!');
    console.log('=' .repeat(60));
    console.log('💡 Look for the deployment section in EOS Studio');
    console.log('💡 Upload fusionbridge.wasm and fusionbridge.abi');
    console.log('💡 After deployment, run: npm run verify-eos');
    console.log('💡 Then test with: npm run real-eos');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { EosStudioQuickDeploy };

// Run deployment guide if called directly
if (require.main === module) {
  const guide = new EosStudioQuickDeploy();
  guide.deploy();
} 
const path = require('path');

/**
 * 🚀 EOS Studio Quick Deployment Guide
 * For deploying fusionbridge contract in EOS Studio
 */
class EosStudioQuickDeploy {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    
    console.log('🚀 EOS Studio Quick Deployment Guide');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 IDE: EOS Studio`);
  }
  
  /**
   * 📋 Show fusionbridge files
   */
  showFusionbridgeFiles() {
    console.log('\n📋 Fusionbridge Files (Need to Deploy):');
    
    const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
    const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
    
    if (fs.existsSync(wasmPath)) {
      const wasmSize = fs.statSync(wasmPath).size;
      console.log(`✅ WASM: ${wasmPath} (${wasmSize} bytes)`);
    } else {
      console.log('❌ WASM file not found');
    }
    
    if (fs.existsSync(abiPath)) {
      const abiSize = fs.statSync(abiPath).size;
      console.log(`✅ ABI: ${abiPath} (${abiSize} bytes)`);
    } else {
      console.log('❌ ABI file not found');
    }
  }
  
  /**
   * 📝 Show EOS Studio deployment steps
   */
  showDeploymentSteps() {
    console.log('\n📝 EOS Studio Deployment Steps:');
    console.log('=' .repeat(60));
    
    const steps = [
      '1. In EOS Studio, look for "Deploy" or "Contract" section',
      '2. Click "Set Contract" or "Deploy Contract"',
      '3. Upload WASM file: contracts/eos/fusionbridge.wasm',
      '4. Upload ABI file: contracts/eos/fusionbridge.abi',
      '5. Set contract account: quicksnake34',
      '6. Click "Deploy" or "Submit"',
      '7. Wait for transaction confirmation',
      '8. Verify deployment in "Contracts" tab'
    ];
    
    steps.forEach((step, index) => {
      console.log(`${step}`);
    });
  }
  
  /**
   * 🔍 Show where to find deployment section
   */
  showWhereToFindDeploy() {
    console.log('\n🔍 Where to Find Deployment Section:');
    console.log('=' .repeat(50));
    
    const locations = [
      '1. Look for "Deploy" tab in the top navigation',
      '2. Look for "Contract" section in the sidebar',
      '3. Look for "Set Contract" button',
      '4. Look for "Deploy Contract" option',
      '5. Look for "Actions" tab and find "setcode" action',
      '6. Look for "Smart Contracts" section'
    ];
    
    locations.forEach((location, index) => {
      console.log(`${location}`);
    });
  }
  
  /**
   * 🧪 Show test HTLC parameters
   */
  showTestParameters() {
    console.log('\n🧪 Test HTLC Parameters (After Deployment):');
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
   * 🚀 Start deployment guide
   */
  async deploy() {
    console.log('🚀 Starting EOS Studio Quick Deployment');
    console.log('=' .repeat(60));
    
    // Show fusionbridge files
    this.showFusionbridgeFiles();
    
    // Show where to find deploy section
    this.showWhereToFindDeploy();
    
    // Show deployment steps
    this.showDeploymentSteps();
    
    // Show test parameters
    this.showTestParameters();
    
    console.log('\n🎯 Ready to Deploy!');
    console.log('=' .repeat(60));
    console.log('💡 Look for the deployment section in EOS Studio');
    console.log('💡 Upload fusionbridge.wasm and fusionbridge.abi');
    console.log('💡 After deployment, run: npm run verify-eos');
    console.log('💡 Then test with: npm run real-eos');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { EosStudioQuickDeploy };

// Run deployment guide if called directly
if (require.main === module) {
  const guide = new EosStudioQuickDeploy();
  guide.deploy();
} 