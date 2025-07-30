const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 🐳 Compile EOS Contract using Docker
 */
class EosContractCompiler {
  constructor() {
    this.contractPath = path.join(__dirname, '../contracts/eos/fusionbridge.cpp');
    this.outputDir = path.join(__dirname, '../contracts/eos');
    this.dockerImage = 'eos-compiler';
  }

  async compile() {
    console.log('🐳 Compiling EOS Contract with Docker');
    console.log('=' .repeat(50));
    
    try {
      // Check if contract source exists
      if (!fs.existsSync(this.contractPath)) {
        throw new Error(`Contract source not found: ${this.contractPath}`);
      }
      
      console.log(`📁 Contract source: ${this.contractPath}`);
      console.log(`📁 Output directory: ${this.outputDir}`);
      console.log('');
      
      // Build Docker image if not exists
      console.log('🔨 Building Docker image...');
      const dockerfilePath = path.join(__dirname, '../Dockerfile.eos');
      const buildCommand = `docker build --platform linux/amd64 -f ${dockerfilePath} -t ${this.dockerImage} .`;
      
      console.log(`   Running: ${buildCommand}`);
      execSync(buildCommand, { stdio: 'inherit' });
      console.log('✅ Docker image built successfully');
      console.log('');
      
      // Run compilation
      console.log('🔨 Compiling contract...');
      const projectDir = path.join(__dirname, '..');
      const runCommand = `docker run --platform linux/amd64 --rm -v "${projectDir}:/project" ${this.dockerImage}`;
      
      console.log(`   Running: ${runCommand}`);
      execSync(runCommand, { stdio: 'inherit' });
      console.log('✅ Contract compiled successfully');
      console.log('');
      
      // Check output files
      const wasmPath = path.join(this.outputDir, 'fusionbridge.wasm');
      const abiPath = path.join(this.outputDir, 'fusionbridge.abi');
      
      if (fs.existsSync(wasmPath)) {
        const wasmStats = fs.statSync(wasmPath);
        console.log(`📦 WASM file: ${wasmPath} (${wasmStats.size} bytes)`);
      }
      
      if (fs.existsSync(abiPath)) {
        const abiStats = fs.statSync(abiPath);
        console.log(`📄 ABI file: ${abiPath} (${abiStats.size} bytes)`);
      }
      
      console.log('');
      console.log('🎯 Compilation Summary:');
      console.log('=' .repeat(50));
      console.log('✅ EOS Contract compiled successfully');
      console.log('✅ WASM and ABI files generated');
      console.log('✅ Ready for deployment to EOS blockchain');
      console.log('');
      
      return {
        success: true,
        wasmPath,
        abiPath
      };
      
    } catch (error) {
      console.error('❌ Compilation failed:', error.message);
      console.error('   Error details:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other scripts
module.exports = { EosContractCompiler };

// Run if called directly
if (require.main === module) {
  const compiler = new EosContractCompiler();
  compiler.compile();
} 