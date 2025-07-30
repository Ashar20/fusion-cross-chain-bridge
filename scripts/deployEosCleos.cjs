const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 🚀 Deploy EOS Contract using cleos via Docker (Apple Silicon Compatible)
 */
class EosCleosDeployer {
  constructor() {
    this.accountName = 'quicksnake34';
    this.network = 'Jungle4 Testnet';
    this.apiEndpoint = 'https://jungle4.greymass.com';
    this.chainId = '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d';
    
    // Docker images
    this.cdtImage = 'eosio/eosio.cdt:1.8.1';
    this.cleosImage = 'eosio/eosio.cdt:1.8.1';
    
    // Docker platform for Apple Silicon support
    this.dockerPlatform = 'linux/amd64';
    
    // File paths
    this.contractDir = path.join(__dirname, '../contracts/eos');
    this.cppFile = path.join(this.contractDir, 'fusionbridge.cpp');
    this.wasmFile = path.join(this.contractDir, 'fusionbridge.wasm');
    this.abiFile = path.join(this.contractDir, 'fusionbridge.abi');
  }

  async deployContract() {
    console.log('🚀 Deploying EOS Contract using cleos via Docker');
    console.log('=' .repeat(60));
    
    try {
      console.log(`📁 Account: ${this.accountName}`);
      console.log(`📁 Network: ${this.network}`);
      console.log(`🌐 API Endpoint: ${this.apiEndpoint}`);
      console.log(`🐳 CDT Image: ${this.cdtImage}`);
      console.log(`🐳 Cleos Image: ${this.cleosImage}`);
      console.log(`🖥️  Platform: ${this.dockerPlatform}`);
      console.log('');
      
      // Step 1: Check if contract source exists
      console.log('🔍 Step 1: Checking contract source...');
      await this.checkContractSource();
      console.log('');
      
      // Step 2: Compile contract
      console.log('🔨 Step 2: Compiling contract...');
      await this.compileContract();
      console.log('');
      
      // Step 3: Deploy contract
      console.log('🚀 Step 3: Deploying contract...');
      await this.deployContractCode();
      console.log('');
      
      // Step 4: Verify deployment
      console.log('🔍 Step 4: Verifying deployment...');
      await this.verifyDeployment();
      console.log('');
      
      // Step 5: Final status
      console.log('🎯 Step 5: Final Status...');
      await this.finalStatus();
      console.log('');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      console.error('   Error details:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async checkContractSource() {
    try {
      if (!fs.existsSync(this.cppFile)) {
        throw new Error(`Contract source not found: ${this.cppFile}`);
      }
      
      const stats = fs.statSync(this.cppFile);
      console.log(`   ✅ Contract source found: ${this.cppFile}`);
      console.log(`   📦 File size: ${stats.size} bytes`);
      console.log(`   📅 Last modified: ${stats.mtime.toISOString()}`);
      
      // Check if WASM/ABI already exist
      if (fs.existsSync(this.wasmFile)) {
        const wasmStats = fs.statSync(this.wasmFile);
        console.log(`   ⚠️  WASM file already exists: ${wasmStats.size} bytes`);
      }
      
      if (fs.existsSync(this.abiFile)) {
        const abiStats = fs.statSync(this.abiFile);
        console.log(`   ⚠️  ABI file already exists: ${abiStats.size} bytes`);
      }
      
    } catch (error) {
      console.log(`   ❌ Contract source check failed: ${error.message}`);
      throw error;
    }
  }

  async compileContract() {
    try {
      console.log(`   🔨 Compiling ${path.basename(this.cppFile)}...`);
      
      // Check if compiled files already exist
      if (fs.existsSync(this.wasmFile) && fs.existsSync(this.abiFile)) {
        const wasmStats = fs.statSync(this.wasmFile);
        const abiStats = fs.statSync(this.abiFile);
        
        console.log(`   ✅ Using existing compiled files`);
        console.log(`   📦 WASM: ${wasmStats.size} bytes`);
        console.log(`   📄 ABI: ${abiStats.size} bytes`);
        return;
      }
      
      // Check if CDT Docker image exists
      const imageCheck = `docker images ${this.cdtImage} --format "{{.Repository}}:{{.Tag}}"`;
      let imageExists = false;
      
      try {
        const result = execSync(imageCheck, { encoding: 'utf8' });
        imageExists = result.includes(this.cdtImage);
      } catch (error) {
        imageExists = false;
      }
      
      if (!imageExists) {
        console.log(`   🐳 Pulling CDT Docker image: ${this.cdtImage}`);
        const pullCommand = `docker pull --platform ${this.dockerPlatform} ${this.cdtImage}`;
        execSync(pullCommand, { stdio: 'inherit' });
      }
      
      // Compile contract
      const compileCommand = `docker run --platform ${this.dockerPlatform} --rm -v "${this.contractDir}:/contract" -w /contract ${this.cdtImage} eosio-cpp -abigen fusionbridge.cpp -o fusionbridge.wasm`;
      
      console.log(`   🔨 Running: ${compileCommand}`);
      execSync(compileCommand, { stdio: 'inherit' });
      
      // Verify compilation output
      if (!fs.existsSync(this.wasmFile)) {
        throw new Error('WASM file not generated');
      }
      
      if (!fs.existsSync(this.abiFile)) {
        throw new Error('ABI file not generated');
      }
      
      const wasmStats = fs.statSync(this.wasmFile);
      const abiStats = fs.statSync(this.abiFile);
      
      console.log(`   ✅ Compilation successful!`);
      console.log(`   📦 WASM: ${wasmStats.size} bytes`);
      console.log(`   📄 ABI: ${abiStats.size} bytes`);
      
    } catch (error) {
      console.log(`   ❌ Compilation failed: ${error.message}`);
      throw error;
    }
  }

  async deployContractCode() {
    try {
      console.log(`   🚀 Deploying to account: ${this.accountName}`);
      
      // Use existing compilation if available
      if (!fs.existsSync(this.wasmFile) || !fs.existsSync(this.abiFile)) {
        throw new Error('Compiled files not found. Please run compilation first.');
      }
      
      console.log(`   📦 Using existing compiled files`);
      console.log(`   📦 WASM: ${fs.statSync(this.wasmFile).size} bytes`);
      console.log(`   📄 ABI: ${fs.statSync(this.abiFile).size} bytes`);
      
      // Deploy using direct RPC calls instead of cleos
      console.log(`   🔨 Deploying via RPC...`);
      
      // For now, we'll use the existing deployment method
      console.log(`   ℹ️  Using existing deployment method...`);
      
      // Check if contract is already deployed
      const checkCommand = `curl -s "${this.apiEndpoint}/v1/chain/get_code" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      
      try {
        const checkResult = execSync(checkCommand, { encoding: 'utf8' });
        const checkData = JSON.parse(checkResult);
        
        if (checkData.wasm && checkData.wasm.length > 0) {
          console.log(`   ✅ Contract already deployed`);
          console.log(`   📦 WASM size: ${checkData.wasm.length} bytes`);
          return;
        }
      } catch (error) {
        console.log(`   ℹ️  Contract not found, proceeding with deployment...`);
      }
      
      // Use the existing deployment script
      console.log(`   🔨 Running existing deployment script...`);
      const deployCommand = `npm run fresh-deploy-eos`;
      execSync(deployCommand, { stdio: 'inherit' });
      
      console.log(`   ✅ Contract deployment completed!`);
      
    } catch (error) {
      console.log(`   ❌ Deployment failed: ${error.message}`);
      throw error;
    }
  }

  async verifyDeployment() {
    try {
      console.log(`   🔍 Verifying WASM code deployment...`);
      
      // Check WASM code using RPC
      const getcodeCommand = `curl -s "${this.apiEndpoint}/v1/chain/get_code" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      const codeResult = execSync(getcodeCommand, { encoding: 'utf8' });
      const codeData = JSON.parse(codeResult);
      
      if (codeData.wasm && codeData.wasm.length > 0) {
        console.log(`   ✅ WASM code is deployed`);
        console.log(`   📦 WASM size: ${codeData.wasm.length} bytes`);
        console.log(`   🔑 Code hash: ${codeData.code_hash}`);
      } else if (codeData.error) {
        throw new Error(`WASM code error: ${codeData.error.what}`);
      } else {
        throw new Error('WASM code not found');
      }
      
      console.log(`   🔍 Verifying ABI deployment...`);
      
      // Check ABI using RPC
      if (codeData.abi) {
        console.log(`   ✅ ABI is deployed`);
        console.log(`   📄 ABI size: ${JSON.stringify(codeData.abi).length} characters`);
        
        // Check for required actions
        const requiredActions = ['createhtlc', 'claimhtlc', 'refundhtlc'];
        const foundActions = [];
        
        if (codeData.abi.actions) {
          console.log(`   🔧 Total actions: ${codeData.abi.actions.length}`);
          
          requiredActions.forEach(action => {
            const found = codeData.abi.actions.find(a => a.name === action);
            if (found) {
              foundActions.push(action);
              console.log(`   ✅ Action found: ${action}`);
            } else {
              console.log(`   ❌ Action missing: ${action}`);
            }
          });
          
          if (foundActions.length === requiredActions.length) {
            console.log(`   ✅ All required actions found (${foundActions.length}/${requiredActions.length})`);
          } else {
            throw new Error(`Missing required actions: ${foundActions.length}/${requiredActions.length}`);
          }
          
          // Show ABI info
          if (codeData.abi.version) {
            console.log(`   📋 ABI version: ${codeData.abi.version}`);
          }
          
        } else {
          throw new Error('No actions found in ABI');
        }
        
      } else if (codeData.error) {
        throw new Error(`ABI error: ${codeData.error.what}`);
      } else {
        throw new Error('ABI not found');
      }
      
    } catch (error) {
      console.log(`   ❌ Verification failed: ${error.message}`);
      throw error;
    }
  }

  async finalStatus() {
    try {
      console.log('🎯 Final Deployment Status:');
      console.log('=' .repeat(60));
      
      // Final verification using RPC
      const getcodeCommand = `curl -s "${this.apiEndpoint}/v1/chain/get_code" -X POST -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`;
      const codeResult = execSync(getcodeCommand, { encoding: 'utf8' });
      const codeData = JSON.parse(codeResult);
      
      const wasmDeployed = codeData.wasm && codeData.wasm.length > 0;
      const abiDeployed = codeData.abi && codeData.abi.actions;
      const actionsComplete = wasmDeployed && abiDeployed ? 
        ['createhtlc', 'claimhtlc', 'refundhtlc'].every(action => 
          codeData.abi.actions.find(a => a.name === action)
        ) : false;
      
      console.log(`📊 Deployment Results:`);
      console.log(`   🔧 WASM Code: ${wasmDeployed ? '✅ Deployed' : '❌ Not Deployed'}`);
      console.log(`   📄 ABI: ${abiDeployed ? '✅ Deployed' : '❌ Not Deployed'}`);
      console.log(`   🔧 Required Actions: ${actionsComplete ? '✅ Complete' : '❌ Incomplete'}`);
      console.log('');
      
      if (wasmDeployed && abiDeployed && actionsComplete) {
        console.log('🎉 CONTRACT SUCCESSFULLY DEPLOYED!');
        console.log('');
        console.log('✅ All components are working:');
        console.log('   - WASM code is deployed');
        console.log('   - ABI is deployed with all required actions');
        console.log('   - Contract is ready for transactions');
        console.log('');
        console.log('🚀 Ready for HTLC operations!');
        console.log(`🌐 Explorer: https://jungle4.cryptolions.io/account/${this.accountName}`);
        console.log(`🔗 API: ${this.apiEndpoint}`);
        console.log('');
        
        // Save deployment info
        const deploymentInfo = {
          network: this.network,
          account: this.accountName,
          apiEndpoint: this.apiEndpoint,
          deploymentTime: new Date().toISOString(),
          status: 'SUCCESS',
          components: {
            wasm: wasmDeployed,
            abi: abiDeployed,
            actions: actionsComplete
          },
          files: {
            wasm: this.wasmFile,
            abi: this.abiFile,
            wasmSize: fs.existsSync(this.wasmFile) ? fs.statSync(this.wasmFile).size : 0,
            abiSize: fs.existsSync(this.abiFile) ? fs.statSync(this.abiFile).size : 0
          },
          explorer: `https://jungle4.cryptolions.io/account/${this.accountName}`
        };
        
        const deploymentPath = path.join(__dirname, '../eos-cleos-deployment.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`📄 Deployment info saved to: ${deploymentPath}`);
        
      } else {
        console.log('⚠️  CONTRACT DEPLOYMENT INCOMPLETE');
        console.log('');
        console.log('❌ Issues found:');
        if (!wasmDeployed) console.log('   - WASM code not deployed');
        if (!abiDeployed) console.log('   - ABI not deployed');
        if (!actionsComplete) console.log('   - Required actions missing');
        console.log('');
        console.log('🔧 Recommended actions:');
        console.log('1. Check account permissions');
        console.log('2. Verify wallet is unlocked');
        console.log('3. Check network connectivity');
        console.log('4. Retry deployment');
        console.log('');
      }
      
    } catch (error) {
      console.log(`   ❌ Final status check failed: ${error.message}`);
      throw error;
    }
  }
}

// Export for use in other scripts
module.exports = { EosCleosDeployer };

// Run if called directly
if (require.main === module) {
  const deployer = new EosCleosDeployer();
  deployer.deployContract();
}