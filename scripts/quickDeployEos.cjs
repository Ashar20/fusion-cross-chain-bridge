const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🚀 Quick EOS Contract Deployment Guide
 * Provides step-by-step instructions for immediate deployment
 */
class QuickEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    
    console.log('🚀 Quick EOS Contract Deployment');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
  }
  
  /**
   * 📋 Show deployment files
   */
  showDeploymentFiles() {
    console.log('\n📋 Deployment Files Ready:');
    
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
   * 🔗 Open deployment tools
   */
  openDeploymentTools() {
    console.log('\n🔗 Opening Deployment Tools...');
    
    const tools = [
      'https://jungle4.cryptolions.io/',
      'https://jungle4.bloks.io/',
      'https://jungle4.eosx.io/'
    ];
    
    tools.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    
    console.log('\n💡 Choose one of the above tools for deployment');
  }
  
  /**
   * 📝 Show deployment steps
   */
  showDeploymentSteps() {
    console.log('\n📝 Quick Deployment Steps:');
    console.log('=' .repeat(50));
    
    const steps = [
      '1. Go to https://jungle4.cryptolions.io/',
      '2. Look for "Tools" → "Smart Contracts" or "Contract Deployment"',
      '3. Click "Connect Wallet" or "Import Account"',
      '4. Enter account: quicksnake34',
      '5. Enter private key: 5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN',
      '6. Upload WASM file: contracts/eos/fusionbridge.wasm',
      '7. Upload ABI file: contracts/eos/fusionbridge.abi',
      '8. Set contract account: quicksnake34',
      '9. Click "Deploy" or "Set Contract"',
      '10. Wait for confirmation',
      '11. Run: npm run verify-eos'
    ];
    
    steps.forEach(step => {
      console.log(step);
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
      timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      memo: 'Test HTLC',
      eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
    
    console.log('JSON Parameters:');
    console.log(JSON.stringify(testParams, null, 2));
  }
  
  /**
   * 🔍 Check current status
   */
  checkCurrentStatus() {
    console.log('\n🔍 Checking Current Status...');
    
    try {
      const response = execSync(`curl -s -X POST https://jungle4.cryptolions.io/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const code = JSON.parse(response);
      
      if (code.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ Contract not deployed yet');
        console.log('💡 Follow the deployment steps above');
        return false;
      } else {
        console.log('✅ Contract already deployed!');
        console.log(`   Code Hash: ${code.code_hash}`);
        return true;
      }
    } catch (error) {
      console.log('⚠️  Could not check status, proceeding with deployment guide');
      return false;
    }
  }
  
  /**
   * 🚀 Start deployment process
   */
  async deploy() {
    console.log('🚀 Starting Quick EOS Deployment Process');
    console.log('=' .repeat(60));
    
    // Show deployment files
    this.showDeploymentFiles();
    
    // Check current status
    const isDeployed = this.checkCurrentStatus();
    
    if (isDeployed) {
      console.log('\n🎉 Contract is already deployed!');
      console.log('💡 Run: npm run verify-eos');
      return true;
    }
    
    // Show deployment steps
    this.showDeploymentSteps();
    
    // Show test parameters
    this.showTestParameters();
    
    // Open deployment tools
    this.openDeploymentTools();
    
    console.log('\n🎯 Ready to Deploy!');
    console.log('=' .repeat(60));
    console.log('💡 Follow the steps above to deploy your contract');
    console.log('💡 After deployment, run: npm run verify-eos');
    console.log('💡 Then test with: npm run real-eos');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { QuickEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new QuickEosDeployer();
  deployer.deploy();
} 