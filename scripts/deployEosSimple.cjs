const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🌴 Simple EOS Contract Deployment
 * Uses the already compiled WASM and ABI files
 */
class SimpleEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    
    console.log('🌴 Simple EOS Contract Deployer');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
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
   * 📝 Check compiled files
   */
  checkCompiledFiles() {
    console.log('\n📝 Checking compiled files...');
    
    const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
    const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
    
    if (!fs.existsSync(wasmPath)) {
      console.error('❌ WASM file not found:', wasmPath);
      return false;
    }
    
    if (!fs.existsSync(abiPath)) {
      console.error('❌ ABI file not found:', abiPath);
      return false;
    }
    
    const wasmSize = fs.statSync(wasmPath).size;
    const abiSize = fs.statSync(abiPath).size;
    
    console.log('✅ Compiled files found:');
    console.log(`   WASM: ${wasmSize} bytes`);
    console.log(`   ABI: ${abiSize} bytes`);
    
    return { wasmPath, abiPath, wasmSize, abiSize };
  }
  
  /**
   * 🏗️ Deploy contract using manual commands
   */
  deployContract() {
    console.log('\n🏗️  Deploying contract...');
    console.log('💡 Since Docker cleos is not available, we\'ll use manual deployment');
    console.log('💡 Please run these commands manually:');
    
    const commands = [
      `# 1. Deploy contract code`,
      `cleos -u ${this.rpcUrl} set code ${this.accountName} ${this.contractDir}/fusionbridge.wasm`,
      ``,
      `# 2. Deploy contract ABI`,
      `cleos -u ${this.rpcUrl} set abi ${this.accountName} ${this.contractDir}/fusionbridge.abi`,
      ``,
      `# 3. Test deployment`,
      `cleos -u ${this.rpcUrl} get code ${this.accountName}`,
      `cleos -u ${this.rpcUrl} get abi ${this.accountName}`,
      ``,
      `# 4. Create test HTLC`,
      `cleos -u ${this.rpcUrl} push action ${this.accountName} createhtlc '["${this.accountName}", "${this.accountName}", "0.1000 EOS", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", 1234567890, "Test HTLC", "0x0000000000000000000000000000000000000000000000000000000000000000"]' -p ${this.accountName}@active`
    ];
    
    console.log('\n📋 Manual Deployment Commands:');
    commands.forEach(cmd => console.log(cmd));
    
    console.log('\n💡 To install cleos manually:');
    console.log('   1. Install EOSIO: brew install eosio');
    console.log('   2. Or use online deployment tools');
    console.log('   3. Or use Anchor wallet for deployment');
    
    return true;
  }
  
  /**
   * 🧪 Test contract deployment
   */
  testContract() {
    console.log('\n🧪 Testing contract deployment...');
    
    try {
      // Check if contract is deployed
      const response = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const code = JSON.parse(response);
      
      if (code.code_hash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('✅ Contract deployed!');
        console.log(`   Code Hash: ${code.code_hash}`);
        return true;
      } else {
        console.log('⚠️  No contract deployed yet');
        console.log('💡 Run the deployment commands to deploy the contract');
        return false;
      }
    } catch (error) {
      console.error('❌ Contract test failed:', error.message);
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
      sourcePath: path.join(this.contractDir, 'fusionbridge.cpp'),
      deploymentMethod: 'manual',
      status: 'compiled_ready_for_deployment'
    };
    
    const deploymentPath = path.join(__dirname, '../eos-deployment-simple.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('✅ Deployment info saved to eos-deployment-simple.json');
    return deploymentInfo;
  }
  
  /**
   * 🚀 Complete deployment process
   */
  async deploy() {
    console.log('🚀 Starting Simple EOS Contract Deployment');
    console.log('=' .repeat(50));
    
    // Check account
    const account = this.checkAccount();
    if (!account) {
      return false;
    }
    
    // Check compiled files
    const files = this.checkCompiledFiles();
    if (!files) {
      return false;
    }
    
    // Deploy contract
    this.deployContract();
    
    // Test contract
    this.testContract();
    
    // Save deployment info
    const deploymentInfo = this.saveDeploymentInfo();
    
    console.log('\n🎉 Simple EOS Deployment Complete!');
    console.log('=' .repeat(50));
    console.log('✅ Account verified');
    console.log('✅ Contract compiled successfully');
    console.log('📋 Manual deployment commands provided');
    console.log('💡 Next: Run the deployment commands manually');
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. Install cleos or use online tools');
    console.log('   2. Run the deployment commands above');
    console.log('   3. Test the deployment');
    console.log('   4. Update .env with EOS credentials');
    console.log('   5. Test real EOS integration: npm run real-eos');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { SimpleEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new SimpleEosDeployer();
  deployer.deploy();
} 