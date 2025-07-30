const fs = require('fs');
const path = require('path');

/**
 * 🔧 EOS Mainnet Setup Script
 * Helps set up environment for mainnet deployment
 */
class MainnetSetup {
  constructor() {
    this.envPath = path.join(__dirname, '../.env');
  }

  async setup() {
    console.log(`🔧 EOS Mainnet Setup`);
    console.log(`============================================================`);
    console.log(`⚠️  WARNING: Mainnet deployment requires real EOS tokens!`);
    console.log(`⚠️  Make sure you have sufficient EOS balance for deployment costs`);
    console.log(``);
    
    // Check if .env file exists
    if (!fs.existsSync(this.envPath)) {
      console.log(`📁 Creating .env file...`);
      fs.writeFileSync(this.envPath, '');
    }
    
    // Read current .env
    let envContent = fs.readFileSync(this.envPath, 'utf8');
    
    // Check for mainnet private key
    if (!envContent.includes('EOS_MAINNET_PRIVATE_KEY=')) {
      console.log(`🔑 Mainnet private key not found in .env`);
      console.log(`📝 Please add your mainnet private key to .env file:`);
      console.log(`   EOS_MAINNET_PRIVATE_KEY=your_private_key_here`);
      console.log(``);
      console.log(`⚠️  IMPORTANT: Keep your private key secure!`);
      console.log(`   - Never share your private key`);
      console.log(`   - Use a dedicated account for deployment`);
      console.log(`   - Ensure sufficient EOS balance for deployment costs`);
      console.log(``);
    } else {
      console.log(`✅ Mainnet private key found in .env`);
    }
    
    // Check for mainnet account
    if (!envContent.includes('EOS_MAINNET_ACCOUNT=')) {
      console.log(`👤 Mainnet account not specified`);
      console.log(`📝 Please add your mainnet account to .env file:`);
      console.log(`   EOS_MAINNET_ACCOUNT=your_account_name`);
      console.log(``);
    } else {
      console.log(`✅ Mainnet account specified`);
    }
    
    // Check for mainnet RPC
    if (!envContent.includes('EOS_MAINNET_RPC=')) {
      console.log(`🌐 Mainnet RPC not specified`);
      console.log(`📝 Please add mainnet RPC to .env file:`);
      console.log(`   EOS_MAINNET_RPC=https://eos.greymass.com`);
      console.log(``);
    } else {
      console.log(`✅ Mainnet RPC specified`);
    }
    
    console.log(`📋 Required Environment Variables:`);
    console.log(`   EOS_MAINNET_PRIVATE_KEY=your_private_key_here`);
    console.log(`   EOS_MAINNET_ACCOUNT=your_account_name`);
    console.log(`   EOS_MAINNET_RPC=https://eos.greymass.com`);
    console.log(``);
    
    console.log(`🚀 Deployment Commands:`);
    console.log(`   npm run deploy-eos-mainnet    # Deploy to mainnet`);
    console.log(`   npm run verify-eos-mainnet    # Verify mainnet deployment`);
    console.log(``);
    
    console.log(`⚠️  Mainnet Deployment Checklist:`);
    console.log(`   ✅ Compiled contract files exist`);
    console.log(`   ✅ Mainnet private key in .env`);
    console.log(`   ✅ Mainnet account has sufficient EOS balance`);
    console.log(`   ✅ Mainnet account has active permission`);
    console.log(`   ✅ Tested on testnet first`);
    console.log(``);
    
    console.log(`🔗 Useful Links:`);
    console.log(`   EOS Mainnet Explorer: https://eos.eosq.eosnation.io`);
    console.log(`   EOS Account Creation: https://eos-account-creator.com`);
    console.log(`   EOS Resource Calculator: https://eosresource.io`);
    console.log(``);
  }

  async checkRequirements() {
    console.log(`🔍 Checking Mainnet Requirements...`);
    console.log(`============================================================`);
    
    // Check compiled files
    const wasmPath = path.join(__dirname, '../contracts/eos/fusionbridge.wasm');
    const abiPath = path.join(__dirname, '../contracts/eos/fusionbridge.abi');
    
    if (fs.existsSync(wasmPath) && fs.existsSync(abiPath)) {
      console.log(`✅ Compiled contract files found`);
    } else {
      console.log(`❌ Compiled contract files missing`);
      console.log(`   Run: npm run compile-eos`);
    }
    
    // Check environment variables
    const envContent = fs.readFileSync(this.envPath, 'utf8');
    
    if (envContent.includes('EOS_MAINNET_PRIVATE_KEY=')) {
      console.log(`✅ Mainnet private key configured`);
    } else {
      console.log(`❌ Mainnet private key not configured`);
    }
    
    if (envContent.includes('EOS_MAINNET_ACCOUNT=')) {
      console.log(`✅ Mainnet account configured`);
    } else {
      console.log(`❌ Mainnet account not configured`);
    }
    
    console.log(``);
  }
}

if (require.main === module) {
  const setup = new MainnetSetup();
  setup.setup().then(() => setup.checkRequirements()).catch(console.error);
}

module.exports = { MainnetSetup }; 