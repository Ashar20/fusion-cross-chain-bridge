const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Final Docker EOS Contract Deployment
 * Handles architecture issues and uses alternative methods
 */
class DockerEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'fusionbridge.wasm';
    this.abiPath = 'fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
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
   * 🐳 Try to build a custom Docker image with cleos
   */
  buildCustomDockerImage() {
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

# Try to install cleos from source
RUN git clone https://github.com/EOSIO/eos.git /tmp/eos \\
    && cd /tmp/eos \\
    && git checkout v2.1.0 \\
    && ./scripts/eosio_build.sh -y \\
    && cp build/bin/cleos /usr/local/bin/ \\
    && rm -rf /tmp/eos

WORKDIR /work
`;
    
    try {
      // Create temporary Dockerfile
      const tempDockerfile = 'temp.Dockerfile';
      fs.writeFileSync(tempDockerfile, dockerfile);
      
      console.log('📋 Building custom image (this may take a while)...');
      execSync('docker build -t eos-custom -f temp.Dockerfile .', { stdio: 'inherit' });
      
      // Clean up
      fs.unlinkSync(tempDockerfile);
      
      console.log('✅ Custom Docker image built successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to build custom Docker image:', error.message);
      return false;
    }
  }
  
  /**
   * 🐳 Try to use platform emulation
   */
  tryPlatformEmulation() {
    console.log('🐳 Trying platform emulation...');
    
    try {
      // Check if Docker supports platform emulation
      const testCommand = 'docker run --rm --platform linux/amd64 ubuntu:20.04 echo "Platform emulation works"';
      execSync(testCommand, { stdio: 'pipe' });
      console.log('✅ Platform emulation is available');
      return true;
    } catch (error) {
      console.log('❌ Platform emulation not available:', error.message);
      return false;
    }
  }
  
  /**
   * 🐳 Deploy using platform emulation
   */
  deployWithEmulation() {
    console.log('🐳 Deploying with platform emulation...');
    
    try {
      const absoluteWasmPath = path.resolve(this.wasmPath);
      const absoluteAbiPath = path.resolve(this.abiPath);
      
      // Try to use a different EOS image with platform emulation
      const codeCommand = `docker run --rm --platform linux/amd64 -v "${absoluteWasmPath}:/contract.wasm" eosio/eos:latest cleos -u ${this.rpcUrl} set code ${this.accountName} /contract.wasm`;
      console.log('📋 Deploying contract code...');
      execSync(codeCommand, { stdio: 'inherit' });
      console.log('✅ Contract code deployed');
      
      const abiCommand = `docker run --rm --platform linux/amd64 -v "${absoluteAbiPath}:/contract.abi" eosio/eos:latest cleos -u ${this.rpcUrl} set abi ${this.accountName} /contract.abi`;
      console.log('📋 Deploying contract ABI...');
      execSync(abiCommand, { stdio: 'inherit' });
      console.log('✅ Contract ABI deployed');
      
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy with emulation:', error.message);
      return false;
    }
  }
  
  /**
   * 🐳 Try to use a different approach with existing images
   */
  tryAlternativeDockerApproach() {
    console.log('🐳 Trying alternative Docker approach...');
    
    try {
      // Check what Docker images are available
      console.log('📋 Available Docker images:');
      execSync('docker images | grep eos', { stdio: 'inherit' });
      
      // Try to use a different approach
      console.log('📋 Trying to use existing EOSIO.CDT image differently...');
      
      const absoluteWasmPath = path.resolve(this.wasmPath);
      const absoluteAbiPath = path.resolve(this.abiPath);
      
      // Try to install cleos in the existing image
      const installCommand = `docker run --rm -v "${absoluteWasmPath}:/contract.wasm" -v "${absoluteAbiPath}:/contract.abi" eosio/eosio.cdt:v1.8.1 bash -c "apt-get update && apt-get install -y wget && wget https://github.com/EOSIO/eos/releases/download/v2.1.0/cleos && chmod +x cleos && ./cleos -u ${this.rpcUrl} set code ${this.accountName} /contract.wasm && ./cleos -u ${this.rpcUrl} set abi ${this.accountName} /contract.abi"`;
      
      execSync(installCommand, { stdio: 'inherit' });
      console.log('✅ Alternative Docker deployment successful');
      return true;
    } catch (error) {
      console.log('❌ Alternative Docker approach failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 Final Docker EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    console.log('\n🔍 Docker Deployment Analysis:');
    console.log('=' .repeat(60));
    console.log('❌ Issue 1: Architecture mismatch (ARM64 vs AMD64)');
    console.log('❌ Issue 2: Missing cleos in EOSIO.CDT image');
    console.log('❌ Issue 3: EOSIO packages not available');
    console.log('💡 Trying alternative approaches...');
    
    // Try platform emulation
    const hasEmulation = this.tryPlatformEmulation();
    
    if (hasEmulation) {
      const deploySuccess = this.deployWithEmulation();
      
      if (deploySuccess) {
        console.log('\n🎉 DOCKER DEPLOYMENT SUCCESSFUL!');
        console.log('=' .repeat(60));
        console.log('✅ Contract code deployed');
        console.log('✅ Contract ABI deployed');
        console.log('✅ Ready for real EOS HTLC creation');
        
        console.log('\n🚀 Your relayer can now create real EOS HTLCs!');
        console.log('📋 Next steps:');
        console.log('   1. Start the relayer service: npm run start-relayer');
        console.log('   2. Test cross-chain swap: npm run bidirectional');
        console.log('   3. Monitor HTLC creation and claiming');
        
        return true;
      }
    }
    
    // Try alternative approach
    const altSuccess = this.tryAlternativeDockerApproach();
    
    if (altSuccess) {
      console.log('\n🎉 ALTERNATIVE DOCKER DEPLOYMENT SUCCESSFUL!');
      console.log('=' .repeat(60));
      console.log('✅ Contract code deployed');
      console.log('✅ Contract ABI deployed');
      console.log('✅ Ready for real EOS HTLC creation');
      
      return true;
    }
    
    // All Docker methods failed
    console.log('\n❌ All Docker deployment methods failed');
    console.log('=' .repeat(60));
    console.log('📋 Summary of issues:');
    console.log('   • Apple Silicon (ARM64) vs Intel (AMD64) architecture mismatch');
    console.log('   • EOSIO Docker images don\'t include cleos');
    console.log('   • EOSIO packages are not available for download');
    console.log('   • Platform emulation may not be enabled');
    
    console.log('\n💡 Alternative deployment methods:');
    console.log('   1. Use EOS Studio (web-based)');
    console.log('   2. Use Anchor Wallet');
    console.log('   3. Use the transaction data I generated earlier');
    console.log('   4. Install cleos locally (if possible)');
    
    console.log('\n📁 Files ready for manual deployment:');
    console.log(`   📦 WASM: ${this.wasmPath}`);
    console.log(`   📋 ABI: ${this.abiPath}`);
    
    return false;
  }
}

// Export for use in other scripts
module.exports = { DockerEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DockerEosDeployer();
  deployer.deploy();
} 
 
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Final Docker EOS Contract Deployment
 * Handles architecture issues and uses alternative methods
 */
class DockerEosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    this.wasmPath = 'fusionbridge.wasm';
    this.abiPath = 'fusionbridge.abi';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
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
   * 🐳 Try to build a custom Docker image with cleos
   */
  buildCustomDockerImage() {
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

# Try to install cleos from source
RUN git clone https://github.com/EOSIO/eos.git /tmp/eos \\
    && cd /tmp/eos \\
    && git checkout v2.1.0 \\
    && ./scripts/eosio_build.sh -y \\
    && cp build/bin/cleos /usr/local/bin/ \\
    && rm -rf /tmp/eos

WORKDIR /work
`;
    
    try {
      // Create temporary Dockerfile
      const tempDockerfile = 'temp.Dockerfile';
      fs.writeFileSync(tempDockerfile, dockerfile);
      
      console.log('📋 Building custom image (this may take a while)...');
      execSync('docker build -t eos-custom -f temp.Dockerfile .', { stdio: 'inherit' });
      
      // Clean up
      fs.unlinkSync(tempDockerfile);
      
      console.log('✅ Custom Docker image built successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to build custom Docker image:', error.message);
      return false;
    }
  }
  
  /**
   * 🐳 Try to use platform emulation
   */
  tryPlatformEmulation() {
    console.log('🐳 Trying platform emulation...');
    
    try {
      // Check if Docker supports platform emulation
      const testCommand = 'docker run --rm --platform linux/amd64 ubuntu:20.04 echo "Platform emulation works"';
      execSync(testCommand, { stdio: 'pipe' });
      console.log('✅ Platform emulation is available');
      return true;
    } catch (error) {
      console.log('❌ Platform emulation not available:', error.message);
      return false;
    }
  }
  
  /**
   * 🐳 Deploy using platform emulation
   */
  deployWithEmulation() {
    console.log('🐳 Deploying with platform emulation...');
    
    try {
      const absoluteWasmPath = path.resolve(this.wasmPath);
      const absoluteAbiPath = path.resolve(this.abiPath);
      
      // Try to use a different EOS image with platform emulation
      const codeCommand = `docker run --rm --platform linux/amd64 -v "${absoluteWasmPath}:/contract.wasm" eosio/eos:latest cleos -u ${this.rpcUrl} set code ${this.accountName} /contract.wasm`;
      console.log('📋 Deploying contract code...');
      execSync(codeCommand, { stdio: 'inherit' });
      console.log('✅ Contract code deployed');
      
      const abiCommand = `docker run --rm --platform linux/amd64 -v "${absoluteAbiPath}:/contract.abi" eosio/eos:latest cleos -u ${this.rpcUrl} set abi ${this.accountName} /contract.abi`;
      console.log('📋 Deploying contract ABI...');
      execSync(abiCommand, { stdio: 'inherit' });
      console.log('✅ Contract ABI deployed');
      
      return true;
    } catch (error) {
      console.log('❌ Failed to deploy with emulation:', error.message);
      return false;
    }
  }
  
  /**
   * 🐳 Try to use a different approach with existing images
   */
  tryAlternativeDockerApproach() {
    console.log('🐳 Trying alternative Docker approach...');
    
    try {
      // Check what Docker images are available
      console.log('📋 Available Docker images:');
      execSync('docker images | grep eos', { stdio: 'inherit' });
      
      // Try to use a different approach
      console.log('📋 Trying to use existing EOSIO.CDT image differently...');
      
      const absoluteWasmPath = path.resolve(this.wasmPath);
      const absoluteAbiPath = path.resolve(this.abiPath);
      
      // Try to install cleos in the existing image
      const installCommand = `docker run --rm -v "${absoluteWasmPath}:/contract.wasm" -v "${absoluteAbiPath}:/contract.abi" eosio/eosio.cdt:v1.8.1 bash -c "apt-get update && apt-get install -y wget && wget https://github.com/EOSIO/eos/releases/download/v2.1.0/cleos && chmod +x cleos && ./cleos -u ${this.rpcUrl} set code ${this.accountName} /contract.wasm && ./cleos -u ${this.rpcUrl} set abi ${this.accountName} /contract.abi"`;
      
      execSync(installCommand, { stdio: 'inherit' });
      console.log('✅ Alternative Docker deployment successful');
      return true;
    } catch (error) {
      console.log('❌ Alternative Docker approach failed:', error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Deploy contract
   */
  async deploy() {
    console.log('🚀 Final Docker EOS Contract Deployment');
    console.log('=' .repeat(60));
    
    // Check files
    if (!this.checkFiles()) {
      return false;
    }
    
    // Check account
    if (!this.checkAccount()) {
      console.log('❌ Cannot proceed without valid account');
      return false;
    }
    
    console.log('\n🔍 Docker Deployment Analysis:');
    console.log('=' .repeat(60));
    console.log('❌ Issue 1: Architecture mismatch (ARM64 vs AMD64)');
    console.log('❌ Issue 2: Missing cleos in EOSIO.CDT image');
    console.log('❌ Issue 3: EOSIO packages not available');
    console.log('💡 Trying alternative approaches...');
    
    // Try platform emulation
    const hasEmulation = this.tryPlatformEmulation();
    
    if (hasEmulation) {
      const deploySuccess = this.deployWithEmulation();
      
      if (deploySuccess) {
        console.log('\n🎉 DOCKER DEPLOYMENT SUCCESSFUL!');
        console.log('=' .repeat(60));
        console.log('✅ Contract code deployed');
        console.log('✅ Contract ABI deployed');
        console.log('✅ Ready for real EOS HTLC creation');
        
        console.log('\n🚀 Your relayer can now create real EOS HTLCs!');
        console.log('📋 Next steps:');
        console.log('   1. Start the relayer service: npm run start-relayer');
        console.log('   2. Test cross-chain swap: npm run bidirectional');
        console.log('   3. Monitor HTLC creation and claiming');
        
        return true;
      }
    }
    
    // Try alternative approach
    const altSuccess = this.tryAlternativeDockerApproach();
    
    if (altSuccess) {
      console.log('\n🎉 ALTERNATIVE DOCKER DEPLOYMENT SUCCESSFUL!');
      console.log('=' .repeat(60));
      console.log('✅ Contract code deployed');
      console.log('✅ Contract ABI deployed');
      console.log('✅ Ready for real EOS HTLC creation');
      
      return true;
    }
    
    // All Docker methods failed
    console.log('\n❌ All Docker deployment methods failed');
    console.log('=' .repeat(60));
    console.log('📋 Summary of issues:');
    console.log('   • Apple Silicon (ARM64) vs Intel (AMD64) architecture mismatch');
    console.log('   • EOSIO Docker images don\'t include cleos');
    console.log('   • EOSIO packages are not available for download');
    console.log('   • Platform emulation may not be enabled');
    
    console.log('\n💡 Alternative deployment methods:');
    console.log('   1. Use EOS Studio (web-based)');
    console.log('   2. Use Anchor Wallet');
    console.log('   3. Use the transaction data I generated earlier');
    console.log('   4. Install cleos locally (if possible)');
    
    console.log('\n📁 Files ready for manual deployment:');
    console.log(`   📦 WASM: ${this.wasmPath}`);
    console.log(`   📋 ABI: ${this.abiPath}`);
    
    return false;
  }
}

// Export for use in other scripts
module.exports = { DockerEosDeployer };

// Run deployment if called directly
if (require.main === module) {
  const deployer = new DockerEosDeployer();
  deployer.deploy();
} 