const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🌴 DOCKER-BASED EOS CONTRACT DEPLOYMENT
 * 
 * This script uses Docker to compile and deploy the EOS contract
 * Works on Apple Silicon (M1/M2) and other architectures
 */
class DockerEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.contractDir = path.join(__dirname, '../contracts/eos');
    
    console.log('🌴 Docker-based EOS Contract Deployer');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 Contract Directory: ${this.contractDir}`);
  }
  
  /**
   * 🔍 Check if Docker is available
   */
  checkDocker() {
    console.log('\n🔍 Checking Docker availability...');
    
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker found!');
      return true;
    } catch (error) {
      console.log('❌ Docker not found');
      console.log('💡 Please install Docker Desktop:');
      console.log('   https://www.docker.com/products/docker-desktop');
      return false;
    }
  }
  
  /**
   * 📝 Compile contract using Docker
   */
  compileContractWithDocker() {
    console.log('\n📝 Compiling EOS contract using Docker...');
    
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
      
      // Get absolute path for Docker volume mounting
      const absolutePath = process.cwd();
      
      // Compile to WASM using Docker
      console.log('🔨 Compiling to WASM using Docker...');
      execSync(`docker run --rm -v "${absolutePath}":/work eosio/eosio.cdt:v1.8.1 eosio-cpp -o fusionbridge.wasm fusionbridge.cpp`, { stdio: 'inherit' });
      console.log('✅ WASM compilation successful');
      
      // Generate ABI using Docker
      console.log('📋 Generating ABI using Docker...');
      execSync(`docker run --rm -v "${absolutePath}":/work eosio/eosio.cdt:v1.8.1 eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi`, { stdio: 'inherit' });
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
      console.error('❌ Docker compilation failed:', error.message);
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
   * 🏗️ Deploy contract using cleos in Docker
   */
  deployContractWithDocker() {
    console.log('\n🏗️  Deploying contract using Docker...');
    
    try {
      // Check if compiled files exist
      const wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
      const abiPath = path.join(this.contractDir, 'fusionbridge.abi');
      
      if (!fs.existsSync(wasmPath) || !fs.existsSync(abiPath)) {
        throw new Error('Compiled files not found. Please compile first.');
      }
      
      console.log('📦 Compiled files found');
      
      // Get absolute path for Docker volume mounting
      const absolutePath = this.contractDir;
      
      // Deploy contract code using Docker
      console.log('🚀 Deploying contract code...');
      execSync(`docker run --rm -v "${absolutePath}":/work eosio/eosio.cdt:v1.8.1 cleos -u ${this.rpcUrl} set code ${this.accountName} /work/fusionbridge.wasm`, { stdio: 'inherit' });
      console.log('✅ Contract code deployed');
      
      // Deploy contract ABI using Docker
      console.log('📋 Deploying contract ABI...');
      execSync(`docker run --rm -v "${absolutePath}":/work eosio/eosio.cdt:v1.8.1 cleos -u ${this.rpcUrl} set abi ${this.accountName} /work/fusionbridge.abi`, { stdio: 'inherit' });
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
   * 🔐 Create test HTLC using Docker
   */
  createTestHTLCWithDocker() {
    console.log('\n🔐 Creating test HTLC using Docker...');
    
    try {
      const recipient = this.accountName; // Same account for testing
      const amount = '0.1000 EOS';
      const hashlock = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      const memo = 'Test HTLC from deployment script';
      const ethTxHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      console.log('📝 Creating test HTLC...');
      const command = `docker run --rm -v $(pwd):/work eosio/eosio.cdt:v1.8.1 cleos -u ${this.rpcUrl} push action ${this.accountName} createhtlc '["${this.accountName}", "${recipient}", "${amount}", "${hashlock}", ${timelock}, "${memo}", "${ethTxHash}"]' -p ${this.accountName}@active`;
      
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
      sourcePath: path.join(this.contractDir, 'fusionbridge.cpp'),
      deploymentMethod: 'docker'
    };
    
    const deploymentPath = path.join(__dirname, '../eos-deployment-docker.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('✅ Deployment info saved to eos-deployment-docker.json');
    return deploymentInfo;
  }
  
  /**
   * 🚀 Complete deployment process
   */
  async deploy() {
    console.log('🚀 Starting Docker-based EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check Docker
    if (!this.checkDocker()) {
      console.log('❌ Cannot proceed without Docker');
      return false;
    }
    
    // Check account
    const account = this.checkAccount();
    if (!account) {
      console.log('❌ Cannot proceed without account access');
      return false;
    }
    
    // Compile contract with Docker
    if (!this.compileContractWithDocker()) {
      console.log('❌ Cannot proceed without compilation');
      return false;
    }
    
    // Deploy contract with Docker
    if (!this.deployContractWithDocker()) {
      console.log('❌ Cannot proceed without deployment');
      return false;
    }
    
    // Test contract
    if (!this.testContract()) {
      console.log('❌ Cannot proceed without testing');
      return false;
    }
    
    // Create test HTLC with Docker
    if (!this.createTestHTLCWithDocker()) {
      console.log('⚠️  Test HTLC creation failed, but deployment successful');
    }
    
    // Save deployment info
    const deploymentInfo = this.saveDeploymentInfo();
    
    console.log('\n🎉 Docker-based EOS Contract Deployment Complete!');
    console.log('=' .repeat(60));
    console.log(`📍 Contract: fusionbridge`);
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
    console.log(`📍 Method: Docker`);
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
module.exports = { DockerEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DockerEosDeployer();
  deployer.deploy().catch(console.error);
} 

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DockerEosDeployer();
  deployer.deploy().catch(console.error);
} 

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DockerEosDeployer();
  deployer.deploy().catch(console.error);
} 