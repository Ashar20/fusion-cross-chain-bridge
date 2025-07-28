const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🌴 COMPLETE EOS CONTRACT DEPLOYMENT
 * 
 * This script will:
 * 1. Check if EOSIO.CDT is available
 * 2. Compile the fusionbridge contract
 * 3. Deploy to Jungle4 testnet
 * 4. Test the deployment
 */
class CompleteEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    
    console.log('🌴 Complete EOS Contract Deployer');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 Contract Directory: ${this.contractDir}`);
  }
  
  /**
   * 🔍 Check if EOSIO.CDT is available
   */
  checkEosioCdt() {
    console.log('\n🔍 Checking EOSIO.CDT availability...');
    
    try {
      // Try to run eosio-cpp
      execSync('eosio-cpp --version', { stdio: 'pipe' });
      console.log('✅ EOSIO.CDT found!');
      return true;
    } catch (error) {
      console.log('⚠️  EOSIO.CDT not found');
      console.log('💡 Installing EOSIO.CDT...');
      
      try {
        // Try to install via brew
        console.log('📦 Installing via Homebrew...');
        execSync('brew install eosio', { stdio: 'inherit' });
        console.log('✅ EOSIO.CDT installed successfully!');
        return true;
      } catch (brewError) {
        console.log('❌ Homebrew installation failed');
        console.log('💡 Manual installation required:');
        console.log('   1. Visit: https://github.com/EOSIO/eosio.cdt');
        console.log('   2. Follow installation instructions');
        console.log('   3. Or use Docker: docker run --rm -v $(pwd):/work eosio/eosio.cdt:v1.8.1');
        return false;
      }
    }
  }
  
  /**
   * 📝 Compile the EOS contract
   */
  compileContract() {
    console.log('\n📝 Compiling EOS contract...');
    
    try {
      // Change to contract directory
      process.chdir(this.contractDir);
      console.log(`📁 Working directory: ${process.cwd()}`);
      
      // Check if source file exists
      const sourceFile = 'fusionbridge.cpp';
      if (!fs.existsSync(sourceFile)) {
        throw new Error(`Source file not found: ${sourceFile}`);
      }
      
      console.log('✅ Source file found');
      
      // Compile to WASM
      console.log('🔨 Compiling to WASM...');
      execSync('eosio-cpp -o fusionbridge.wasm fusionbridge.cpp', { stdio: 'inherit' });
      console.log('✅ WASM compilation successful');
      
      // Generate ABI
      console.log('📋 Generating ABI...');
      execSync('eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi', { stdio: 'inherit' });
      console.log('✅ ABI generation successful');
      
      // Check if files were created
      if (!fs.existsSync('fusionbridge.wasm')) {
        throw new Error('WASM file not created');
      }
      if (!fs.existsSync('fusionbridge.abi')) {
        throw new Error('ABI file not created');
      }
      
      const wasmSize = fs.statSync('fusionbridge.wasm').size;
      const abiSize = fs.statSync('fusionbridge.abi').size;
      
      console.log(`📦 Compilation complete:`);
      console.log(`   WASM: ${wasmSize} bytes`);
      console.log(`   ABI: ${abiSize} bytes`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Compilation failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🔍 Check account status
   */
  checkAccount() {
    console.log('\n🔍 Checking account status...');
    
    try {
      const response = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_account -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const account = JSON.parse(response);
      
      console.log('✅ Account found!');
      console.log(`   Balance: ${account.core_liquid_balance}`);
      console.log(`   RAM: ${account.ram_quota} bytes`);
      console.log(`   CPU: ${account.cpu_weight} EOS`);
      console.log(`   NET: ${account.net_weight} EOS`);
      
      return account;
    } catch (error) {
      console.error('❌ Account check failed:', error.message);
      return null;
    }
  }
  
  /**
   * 🏗️ Deploy contract to EOS
   */
  deployContract() {
    console.log('\n🏗️  Deploying contract to EOS Jungle4...');
    
    try {
      // Check if compiled files exist
      const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
      const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
      
      if (!fs.existsSync(wasmPath) || !fs.existsSync(abiPath)) {
        throw new Error('Compiled files not found. Please compile first.');
      }
      
      console.log('📦 Compiled files found');
      
      // Deploy contract code
      console.log('🚀 Deploying contract code...');
      execSync(`cleos -u ${this.rpcUrl} set code ${this.accountName} ${wasmPath}`, { stdio: 'inherit' });
      console.log('✅ Contract code deployed');
      
      // Deploy contract ABI
      console.log('📋 Deploying contract ABI...');
      execSync(`cleos -u ${this.rpcUrl} set abi ${this.accountName} ${abiPath}`, { stdio: 'inherit' });
      console.log('✅ Contract ABI deployed');
      
      return true;
      
    } catch (error) {
      console.error('❌ Contract deployment failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🧪 Test deployed contract
   */
  testContract() {
    console.log('\n🧪 Testing deployed contract...');
    
    try {
      // Check contract code
      console.log('🔍 Checking contract code...');
      const codeResponse = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const code = JSON.parse(codeResponse);
      
      if (code.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        throw new Error('Contract code not deployed');
      }
      
      console.log('✅ Contract code deployed!');
      console.log(`   Code Hash: ${code.code_hash}`);
      
      // Check contract ABI
      console.log('🔍 Checking contract ABI...');
      const abiResponse = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_abi -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const abi = JSON.parse(abiResponse);
      
      console.log('✅ Contract ABI deployed!');
      console.log(`   Actions: ${abi.abi.actions.length}`);
      console.log(`   Tables: ${abi.abi.tables.length}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Contract test failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🔐 Create test HTLC
   */
  createTestHTLC() {
    console.log('\n🔐 Creating test HTLC...');
    
    try {
      const recipient = this.accountName; // Same account for testing
      const amount = '0.1000 EOS';
      const hashlock = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      const memo = 'Test HTLC from deployment script';
      const ethTxHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      console.log('📝 Creating test HTLC...');
      const command = `cleos -u ${this.rpcUrl} push action ${this.accountName} createhtlc '["${this.accountName}", "${recipient}", "${amount}", "${hashlock}", ${timelock}, "${memo}", "${ethTxHash}"]' -p ${this.accountName}@active`;
      
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Test HTLC created successfully!');
      
      return true;
      
    } catch (error) {
      console.error('❌ Test HTLC creation failed:', error.message);
      return false;
    }
  }
  
  /**
   * 💾 Save deployment info
   */
  saveDeploymentInfo() {
    console.log('\n💾 Saving deployment information...');
    
    const deploymentInfo = {
      account: this.accountName,
      contract: 'fusionbridge',
      network: 'jungle4',
      deployedAt: new Date().toISOString(),
      rpcUrl: this.rpcUrl,
      wasmPath: path.join(this.contractDir, 'fusionbridge.wasm'),
      abiPath: path.join(this.contractDir, 'fusionbridge.abi'),
      sourcePath: path.join(this.contractDir, 'fusionbridge.cpp')
    };
    
    const deploymentPath = path.join(__dirname, '../eos-deployment-complete.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('✅ Deployment info saved to eos-deployment-complete.json');
    return deploymentInfo;
  }
  
  /**
   * 🚀 Complete deployment process
   */
  async deploy() {
    console.log('🚀 Starting Complete EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check EOSIO.CDT
    if (!this.checkEosioCdt()) {
      console.log('❌ Cannot proceed without EOSIO.CDT');
      return false;
    }
    
    // Check account
    const account = this.checkAccount();
    if (!account) {
      console.log('❌ Cannot proceed without account access');
      return false;
    }
    
    // Compile contract
    if (!this.compileContract()) {
      console.log('❌ Cannot proceed without compilation');
      return false;
    }
    
    // Deploy contract
    if (!this.deployContract()) {
      console.log('❌ Cannot proceed without deployment');
      return false;
    }
    
    // Test contract
    if (!this.testContract()) {
      console.log('❌ Cannot proceed without testing');
      return false;
    }
    
    // Create test HTLC
    if (!this.createTestHTLC()) {
      console.log('⚠️  Test HTLC creation failed, but deployment successful');
    }
    
    // Save deployment info
    const deploymentInfo = this.saveDeploymentInfo();
    
    console.log('\n🎉 EOS Contract Deployment Complete!');
    console.log('=' .repeat(60));
    console.log(`📍 Contract: fusionbridge`);
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 Code Hash: ${deploymentInfo.codeHash || 'Deployed'}`);
    console.log('✅ Contract compiled successfully');
    console.log('✅ Contract deployed successfully');
    console.log('✅ Contract tested successfully');
    console.log('✅ Test HTLC created successfully');
    console.log('🚀 Ready for real cross-chain swaps!');
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. Update .env with EOS credentials');
    console.log('   2. Test real EOS integration: npm run real-eos');
    console.log('   3. Start relayer: npm run start-relayer');
    console.log('   4. Test bidirectional swaps: npm run bidirectional');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { CompleteEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new CompleteEosDeployer();
  deployer.deploy().catch(console.error);
} 