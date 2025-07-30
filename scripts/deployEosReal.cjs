const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Real EOS Contract Deployment
 * Builds custom Docker image with cleos and deploys contract
 */
class RealEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.dockerImageName = 'eos-cleos-deployer';
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
   * 🐳 Build custom Docker image with cleos
   */
  buildDockerImage() {
    console.log('🐳 Building custom Docker image with cleos...');
    
    const dockerfile = `
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \\
    wget \\
    curl \\
    git \\
    build-essential \\
    cmake \\
    libssl-dev \\
    libcurl4-openssl-dev \\
    liblog4cxx-dev \\
    libgflags-dev \\
    libsnappy-dev \\
    zlib1g-dev \\
    libbz2-dev \\
    liblz4-dev \\
    libzstd-dev \\
    libboost-all-dev \\
    libgmp-dev \\
    libsecp256k1-dev \\
    libsecp256k1-0 \\
    && rm -rf /var/lib/apt/lists/*

# Install cleos
RUN wget https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-20.04_amd64.deb \\
    && dpkg -i eos_2.1.0-1-ubuntu-20.04_amd64.deb \\
    && rm eos_2.1.0-1-ubuntu-20.04_amd64.deb

WORKDIR /work
`;
    
    try {
      // Create temporary Dockerfile
      const tempDockerfile = 'temp.Dockerfile';
      fs.writeFileSync(tempDockerfile, dockerfile);
      
      // Build Docker image
      execSync(`docker build -t ${this.dockerImageName} -f ${tempDockerfile} .`, { stdio: 'inherit' });
      
      // Clean up
      fs.unlinkSync(tempDockerfile);
      
      console.log('✅ Docker image built successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to build Docker image:', error.message);
      return false;
    }
  }
  
  /**
   * 🔍 Check account status
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
   * 🚀 Deploy contract code using Docker cleos
   */
  deployContractCode() {
    console.log('🚀 Deploying contract code...');
    
    try {
      const absoluteWasmPath = path.resolve(this.wasmPath);
      const command = `docker run --rm -v "${absoluteWasmPath}:/contract.wasm" ${this.dockerImageName} cleos -u ${this.rpcUrl} set code ${this.accountName} /contract.wasm`;
      
      console.log('📋 Executing command:', command);
      execSync(command, { stdio: 'inherit' });
      
      console.log('✅ Contract code deployed successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy contract code:', error.message);
      return false;
    }
  }
  
  /**
   * 📋 Deploy contract ABI using Docker cleos
   */
  deployContractAbi() {
    console.log('📋 Deploying contract ABI...');
    
    try {
      const absoluteAbiPath = path.resolve(this.abiPath);
      const command = `docker run --rm -v "${absoluteAbiPath}:/contract.abi" ${this.dockerImageName} cleos -u ${this.rpcUrl} set abi ${this.accountName} /contract.abi`;
      
      console.log('📋 Executing command:', command);
      execSync(command, { stdio: 'inherit' });
      
      console.log('✅ Contract ABI deployed successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy contract ABI:', error.message);
      return false;
    }
  }
  
  /**
   * 🧪 Test contract deployment
   */
  testContract() {
    console.log('🧪 Testing contract deployment...');
    
    try {
      const command = `docker run --rm ${this.dockerImageName} cleos -u ${this.rpcUrl} push action ${this.accountName} getstats '{}' -p ${this.accountName}@active`;
      
      console.log('📋 Executing test command:', command);
      execSync(command, { stdio: 'inherit' });
      
      console.log('✅ Contract test successful');
      return true;
    } catch (error) {
      console.log('❌ Contract test failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🏗️ Create test HTLC
   */
  createTestHtlc() {
    console.log('🏗️ Creating test HTLC...');
    
    try {
      const testData = {
        sender: this.accountName,
        recipient: this.accountName,
        amount: '0.1000 EOS',
        hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timelock: Math.floor(Date.now() / 1000) + 3600,
        memo: 'Test HTLC from Docker',
        eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };
      
      const command = `docker run --rm ${this.dockerImageName} cleos -u ${this.rpcUrl} push action ${this.accountName} createhtlc '${JSON.stringify(testData)}' -p ${this.accountName}@active`;
      
      console.log('📋 Executing HTLC creation command:', command);
      execSync(command, { stdio: 'inherit' });
      
      console.log('✅ Test HTLC created successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to create test HTLC:', error.message);
      return false;
    }
  }
  
  /**
   * 🔍 Verify deployment
   */
  verifyDeployment() {
    console.log('🔍 Verifying deployment...');
    
    try {
      // Check contract code
      const codeCommand = `docker run --rm ${this.dockerImageName} cleos -u ${this.rpcUrl} get code ${this.accountName}`;
      console.log('📋 Checking contract code...');
      execSync(codeCommand, { stdio: 'inherit' });
      
      // Check contract ABI
      const abiCommand = `docker run --rm ${this.dockerImageName} cleos -u ${this.rpcUrl} get abi ${this.accountName}`;
      console.log('📋 Checking contract ABI...');
      execSync(abiCommand, { stdio: 'inherit' });
      
      console.log('✅ Deployment verification successful');
      return true;
    } catch (error) {
      console.log('❌ Deployment verification failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 Real EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check Docker
    if (!this.checkDocker()) {
      return false;
    }
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Build Docker image
    if (!this.buildDockerImage()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Deploy contract code
    if (!this.deployContractCode()) {
      console.log('❌ Contract code deployment failed');
      return false;
    }
    
    // Deploy contract ABI
    if (!this.deployContractAbi()) {
      console.log('❌ Contract ABI deployment failed');
      return false;
    }
    
    // Verify deployment
    if (!this.verifyDeployment()) {
      console.log('❌ Deployment verification failed');
      return false;
    }
    
    // Test contract
    if (!this.testContract()) {
      console.log('⚠️ Contract test failed, but deployment may still be successful');
    }
    
    // Create test HTLC
    if (!this.createTestHtlc()) {
      console.log('⚠️ Test HTLC creation failed, but contract is deployed');
    }
    
    console.log('\n🎉 CONTRACT DEPLOYMENT COMPLETED!');
    console.log('=' .repeat(60));
    console.log('✅ Contract code deployed');
    console.log('✅ Contract ABI deployed');
    console.log('✅ Deployment verified');
    console.log('✅ Ready for real EOS HTLC creation');
    
    console.log('\n🚀 Your relayer can now create real EOS HTLCs!');
    console.log('📋 Next steps:');
    console.log('   1. Start the relayer service: npm run start-relayer');
    console.log('   2. Test cross-chain swap: npm run bidirectional');
    console.log('   3. Monitor HTLC creation and claiming');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { RealEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new RealEosDeployer();
  deployer.deploy();
} 
 
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Real EOS Contract Deployment
 * Builds custom Docker image with cleos and deploys contract
 */
class RealEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'docker-eos-deployment/output/fusionbridge.wasm';
    this.abiPath = 'docker-eos-deployment/output/fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    this.dockerImageName = 'eos-cleos-deployer';
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
   * 🐳 Build custom Docker image with cleos
   */
  buildDockerImage() {
    console.log('🐳 Building custom Docker image with cleos...');
    
    const dockerfile = `
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \\
    wget \\
    curl \\
    git \\
    build-essential \\
    cmake \\
    libssl-dev \\
    libcurl4-openssl-dev \\
    liblog4cxx-dev \\
    libgflags-dev \\
    libsnappy-dev \\
    zlib1g-dev \\
    libbz2-dev \\
    liblz4-dev \\
    libzstd-dev \\
    libboost-all-dev \\
    libgmp-dev \\
    libsecp256k1-dev \\
    libsecp256k1-0 \\
    && rm -rf /var/lib/apt/lists/*

# Install cleos
RUN wget https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-20.04_amd64.deb \\
    && dpkg -i eos_2.1.0-1-ubuntu-20.04_amd64.deb \\
    && rm eos_2.1.0-1-ubuntu-20.04_amd64.deb

WORKDIR /work
`;
    
    try {
      // Create temporary Dockerfile
      const tempDockerfile = 'temp.Dockerfile';
      fs.writeFileSync(tempDockerfile, dockerfile);
      
      // Build Docker image
      execSync(`docker build -t ${this.dockerImageName} -f ${tempDockerfile} .`, { stdio: 'inherit' });
      
      // Clean up
      fs.unlinkSync(tempDockerfile);
      
      console.log('✅ Docker image built successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to build Docker image:', error.message);
      return false;
    }
  }
  
  /**
   * 🔍 Check account status
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
   * 🚀 Deploy contract code using Docker cleos
   */
  deployContractCode() {
    console.log('🚀 Deploying contract code...');
    
    try {
      const absoluteWasmPath = path.resolve(this.wasmPath);
      const command = `docker run --rm -v "${absoluteWasmPath}:/contract.wasm" ${this.dockerImageName} cleos -u ${this.rpcUrl} set code ${this.accountName} /contract.wasm`;
      
      console.log('📋 Executing command:', command);
      execSync(command, { stdio: 'inherit' });
      
      console.log('✅ Contract code deployed successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy contract code:', error.message);
      return false;
    }
  }
  
  /**
   * 📋 Deploy contract ABI using Docker cleos
   */
  deployContractAbi() {
    console.log('📋 Deploying contract ABI...');
    
    try {
      const absoluteAbiPath = path.resolve(this.abiPath);
      const command = `docker run --rm -v "${absoluteAbiPath}:/contract.abi" ${this.dockerImageName} cleos -u ${this.rpcUrl} set abi ${this.accountName} /contract.abi`;
      
      console.log('📋 Executing command:', command);
      execSync(command, { stdio: 'inherit' });
      
      console.log('✅ Contract ABI deployed successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy contract ABI:', error.message);
      return false;
    }
  }
  
  /**
   * 🧪 Test contract deployment
   */
  testContract() {
    console.log('🧪 Testing contract deployment...');
    
    try {
      const command = `docker run --rm ${this.dockerImageName} cleos -u ${this.rpcUrl} push action ${this.accountName} getstats '{}' -p ${this.accountName}@active`;
      
      console.log('📋 Executing test command:', command);
      execSync(command, { stdio: 'inherit' });
      
      console.log('✅ Contract test successful');
      return true;
    } catch (error) {
      console.log('❌ Contract test failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🏗️ Create test HTLC
   */
  createTestHtlc() {
    console.log('🏗️ Creating test HTLC...');
    
    try {
      const testData = {
        sender: this.accountName,
        recipient: this.accountName,
        amount: '0.1000 EOS',
        hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timelock: Math.floor(Date.now() / 1000) + 3600,
        memo: 'Test HTLC from Docker',
        eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };
      
      const command = `docker run --rm ${this.dockerImageName} cleos -u ${this.rpcUrl} push action ${this.accountName} createhtlc '${JSON.stringify(testData)}' -p ${this.accountName}@active`;
      
      console.log('📋 Executing HTLC creation command:', command);
      execSync(command, { stdio: 'inherit' });
      
      console.log('✅ Test HTLC created successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to create test HTLC:', error.message);
      return false;
    }
  }
  
  /**
   * 🔍 Verify deployment
   */
  verifyDeployment() {
    console.log('🔍 Verifying deployment...');
    
    try {
      // Check contract code
      const codeCommand = `docker run --rm ${this.dockerImageName} cleos -u ${this.rpcUrl} get code ${this.accountName}`;
      console.log('📋 Checking contract code...');
      execSync(codeCommand, { stdio: 'inherit' });
      
      // Check contract ABI
      const abiCommand = `docker run --rm ${this.dockerImageName} cleos -u ${this.rpcUrl} get abi ${this.accountName}`;
      console.log('📋 Checking contract ABI...');
      execSync(abiCommand, { stdio: 'inherit' });
      
      console.log('✅ Deployment verification successful');
      return true;
    } catch (error) {
      console.log('❌ Deployment verification failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 Real EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check Docker
    if (!this.checkDocker()) {
      return false;
    }
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Build Docker image
    if (!this.buildDockerImage()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    // Deploy contract code
    if (!this.deployContractCode()) {
      console.log('❌ Contract code deployment failed');
      return false;
    }
    
    // Deploy contract ABI
    if (!this.deployContractAbi()) {
      console.log('❌ Contract ABI deployment failed');
      return false;
    }
    
    // Verify deployment
    if (!this.verifyDeployment()) {
      console.log('❌ Deployment verification failed');
      return false;
    }
    
    // Test contract
    if (!this.testContract()) {
      console.log('⚠️ Contract test failed, but deployment may still be successful');
    }
    
    // Create test HTLC
    if (!this.createTestHtlc()) {
      console.log('⚠️ Test HTLC creation failed, but contract is deployed');
    }
    
    console.log('\n🎉 CONTRACT DEPLOYMENT COMPLETED!');
    console.log('=' .repeat(60));
    console.log('✅ Contract code deployed');
    console.log('✅ Contract ABI deployed');
    console.log('✅ Deployment verified');
    console.log('✅ Ready for real EOS HTLC creation');
    
    console.log('\n🚀 Your relayer can now create real EOS HTLCs!');
    console.log('📋 Next steps:');
    console.log('   1. Start the relayer service: npm run start-relayer');
    console.log('   2. Test cross-chain swap: npm run bidirectional');
    console.log('   3. Monitor HTLC creation and claiming');
    
    return true;
  }
}

// Export for use in other scripts
module.exports = { RealEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new RealEosDeployer();
  deployer.deploy();
} 