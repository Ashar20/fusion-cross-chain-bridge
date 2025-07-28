const fs = require('fs');
const path = require('path');

/**
 * 🚀 Bloks.io EOS Contract Deployment Guide
 * Specific instructions for deploying via Bloks.io interface
 */
class BloksDeploymentGuide {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    
    console.log('🚀 Bloks.io EOS Contract Deployment Guide');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 Interface: Bloks.io`);
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
   * 📝 Show Bloks.io specific deployment steps
   */
  showBloksDeploymentSteps() {
    console.log('\n📝 Bloks.io Deployment Steps:');
    console.log('=' .repeat(60));
    
    const steps = [
      '1. Open: https://local.bloks.io/account/quicksnake34',
      '2. Look for "Smart Contracts" or "Actions" tab',
      '3. Click "Set Contract" or "Deploy Contract"',
      '4. Upload WASM file: contracts/eos/fusionbridge.wasm',
      '5. Upload ABI file: contracts/eos/fusionbridge.abi',
      '6. Set contract account: quicksnake34',
      '7. Click "Submit" or "Deploy"',
      '8. Wait for transaction confirmation',
      '9. Verify deployment in "Actions" tab',
      '10. Run: npm run verify-eos'
    ];
    
    steps.forEach((step, index) => {
      console.log(`${step}`);
    });
  }
  
  /**
   * 🔗 Show Bloks.io URLs
   */
  showBloksUrls() {
    console.log('\n🔗 Bloks.io URLs:');
    console.log('=' .repeat(40));
    
    const urls = [
      'Main Account: https://local.bloks.io/account/quicksnake34',
      'Actions: https://local.bloks.io/account/quicksnake34?nodeUrl=http%3A%2F%2Fjungle4.cryptolions.io',
      'Smart Contracts: https://local.bloks.io/account/quicksnake34?nodeUrl=http%3A%2F%2Fjungle4.cryptolions.io&tab=contracts',
      'Tables: https://local.bloks.io/account/quicksnake34?nodeUrl=http%3A%2F%2Fjungle4.cryptolions.io&tab=tables'
    ];
    
    urls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
  }
  
  /**
   * 🧪 Show test HTLC creation steps
   */
  showTestHTLCCreation() {
    console.log('\n🧪 Test HTLC Creation (After Deployment):');
    console.log('=' .repeat(50));
    
    const testSteps = [
      '1. Go to Actions tab in Bloks.io',
      '2. Select "fusionbridge" contract',
      '3. Choose "createhtlc" action',
      '4. Fill parameters:',
      '   - sender: quicksnake34',
      '   - recipient: quicksnake34',
      '   - amount: "0.1000 EOS"',
      '   - hashlock: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"',
      '   - timelock: [current_timestamp + 3600]',
      '   - memo: "Test HTLC"',
      '   - eth_tx_hash: "0x0000000000000000000000000000000000000000000000000000000000000000"',
      '5. Click "Submit Transaction"',
      '6. Verify HTLC creation in Tables tab'
    ];
    
    testSteps.forEach((step, index) => {
      console.log(`${step}`);
    });
  }
  
  /**
   * 📊 Show contract verification steps
   */
  showVerificationSteps() {
    console.log('\n📊 Contract Verification Steps:');
    console.log('=' .repeat(40));
    
    const verificationSteps = [
      '1. Check contract code hash (should not be all zeros)',
      '2. Verify ABI contains: createhtlc, claimhtlc, refundhtlc',
      '3. Check htlcs table exists',
      '4. Test createhtlc action',
      '5. Verify HTLC appears in table',
      '6. Test claimhtlc action',
      '7. Test refundhtlc action'
    ];
    
    verificationSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
  }
  
  /**
   * 🚀 Start deployment guide
   */
  async deploy() {
    console.log('🚀 Starting Bloks.io EOS Deployment Guide');
    console.log('=' .repeat(60));
    
    // Show deployment files
    this.showDeploymentFiles();
    
    // Show Bloks.io URLs
    this.showBloksUrls();
    
    // Show deployment steps
    this.showBloksDeploymentSteps();
    
    // Show test HTLC creation
    this.showTestHTLCCreation();
    
    // Show verification steps
    this.showVerificationSteps();
    
    console.log('\n🎯 Ready to Deploy via Bloks.io!');
    console.log('=' .repeat(60));
    console.log('💡 Follow the steps above to deploy your contract');
    console.log('💡 After deployment, run: npm run verify-eos');
    console.log('💡 Then test with: npm run real-eos');
    console.log('💡 Start relayer: npm run start-relayer');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { BloksDeploymentGuide };

// Run deployment guide if called directly
if (require.main === module) {
  const guide = new BloksDeploymentGuide();
  guide.deploy();
} 