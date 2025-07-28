const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🚀 Windows Deployment Package Creator
 * Prepares the codebase for Windows EOS deployment
 */
class WindowsPackageCreator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.windowsDir = path.join(this.projectRoot, 'windows-deployment');
    this.eosDir = path.join(this.projectRoot, 'contracts/eos');
    
    console.log('🚀 Windows EOS Deployment Package Creator');
    console.log(`📍 Project Root: ${this.projectRoot}`);
    console.log(`📍 Windows Dir: ${this.windowsDir}`);
  }
  
  /**
   * 📦 Create Windows deployment directory
   */
  createWindowsDirectory() {
    console.log('\n📦 Creating Windows deployment directory...');
    
    if (fs.existsSync(this.windowsDir)) {
      console.log('🗑️  Removing existing windows-deployment directory');
      fs.rmSync(this.windowsDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(this.windowsDir, { recursive: true });
    console.log('✅ Windows deployment directory created');
  }
  
  /**
   * 📋 Copy essential files for Windows deployment
   */
  copyEssentialFiles() {
    console.log('\n📋 Copying essential files...');
    
    const filesToCopy = [
      'contracts/eos/fusionbridge.cpp',
      'contracts/eos/fusionbridge.hpp',
      'contracts/eos/CMakeLists.txt',
      'contracts/eos/fusionbridge.wasm',
      'contracts/eos/fusionbridge.abi',
      'package.json',
      '.env.example'
    ];
    
    filesToCopy.forEach(file => {
      const sourcePath = path.join(this.projectRoot, file);
      const destPath = path.join(this.windowsDir, file);
      
      if (fs.existsSync(sourcePath)) {
        // Create directory structure
        const destDir = path.dirname(destPath);
        fs.mkdirSync(destDir, { recursive: true });
        
        // Copy file
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied: ${file}`);
      } else {
        console.log(`⚠️  File not found: ${file}`);
      }
    });
  }
  
  /**
   * 📝 Create Windows deployment guide
   */
  createWindowsGuide() {
    console.log('\n📝 Creating Windows deployment guide...');
    
    const guideContent = `# 🚀 Windows EOS Contract Deployment Guide

## 📋 Prerequisites

1. **Install EOSIO.CDT for Windows**
   - Download from: https://github.com/EOSIO/eosio.cdt/releases
   - Install the latest version for Windows x64
   - Add to PATH: \`C:\\eosio.cdt\\bin\\\`

2. **Install Node.js**
   - Download from: https://nodejs.org/
   - Install LTS version

3. **Install Git for Windows**
   - Download from: https://git-scm.com/download/win

## 🔧 Setup Steps

### Step 1: Open Command Prompt as Administrator
\`\`\`cmd
# Navigate to the deployment directory
cd C:\\path\\to\\windows-deployment
\`\`\`

### Step 2: Install Dependencies
\`\`\`cmd
npm install
\`\`\`

### Step 3: Compile EOS Contract
\`\`\`cmd
# Navigate to contracts directory
cd contracts\\eos

# Compile the contract
eosio-cpp -o fusionbridge.wasm fusionbridge.cpp

# Generate ABI
eosio-abigen fusionbridge.cpp --output=fusionbridge.abi
\`\`\`

### Step 4: Deploy Contract
\`\`\`cmd
# Set contract using cleos (if you have it installed)
cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi

# Or use online tools:
# 1. EOS Studio: http://app.eosstudio.io/guest
# 2. Bloks.io: https://local.bloks.io/
# 3. Cryptolions Explorer: https://jungle4.cryptolions.io/
\`\`\`

## 🧪 Test Deployment

### Step 5: Test HTLC Creation
\`\`\`cmd
# Create test HTLC
cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{
  "sender": "quicksnake34",
  "recipient": "quicksnake34",
  "amount": "0.1000 EOS",
  "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "timelock": 1753746959,
  "memo": "Test HTLC",
  "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}' -p quicksnake34@active
\`\`\`

## 🔗 Online Deployment Options

### Option 1: EOS Studio
1. Go to: http://app.eosstudio.io/guest
2. Upload fusionbridge.wasm and fusionbridge.abi
3. Deploy to quicksnake34 account

### Option 2: Bloks.io
1. Go to: https://local.bloks.io/
2. Connect to Jungle4 testnet
3. Upload and deploy contract

### Option 3: Cryptolions Explorer
1. Go to: https://jungle4.cryptolions.io/
2. Use the contract deployment interface

## 📁 File Structure
\`\`\`
windows-deployment/
├── contracts/
│   └── eos/
│       ├── fusionbridge.cpp
│       ├── fusionbridge.hpp
│       ├── CMakeLists.txt
│       ├── fusionbridge.wasm
│       └── fusionbridge.abi
├── package.json
├── .env.example
└── README.md (this file)
\`\`\`

## 🎯 Next Steps

After successful deployment:
1. Run: \`npm run verify-eos\`
2. Test with: \`npm run real-eos\`
3. Start relayer: \`npm run start-relayer\`

## 🆘 Troubleshooting

### Common Issues:
1. **EOSIO.CDT not found**: Make sure it's installed and in PATH
2. **Compilation errors**: Check C++ syntax in fusionbridge.cpp
3. **Deployment fails**: Ensure account has enough EOS for deployment
4. **Permission denied**: Run Command Prompt as Administrator

### Support:
- EOSIO.CDT Docs: https://developers.eos.io/manuals/eosio.cdt/latest/
- Jungle4 Testnet: https://jungle4.cryptolions.io/
- EOS Studio: http://app.eosstudio.io/guest
`;

    const guidePath = path.join(this.windowsDir, 'README.md');
    fs.writeFileSync(guidePath, guideContent);
    console.log('✅ Windows deployment guide created');
  }
  
  /**
   * 🔧 Create Windows batch scripts
   */
  createWindowsScripts() {
    console.log('\n🔧 Creating Windows batch scripts...');
    
    // Compile script
    const compileScript = `@echo off
echo 🚀 Compiling EOS Contract for Windows...
cd contracts\\eos

echo 📦 Compiling fusionbridge.cpp...
eosio-cpp -o fusionbridge.wasm fusionbridge.cpp

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Compilation failed!
    pause
    exit /b 1
)

echo 📋 Generating ABI...
eosio-abigen fusionbridge.cpp --output=fusionbridge.abi

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ABI generation failed!
    pause
    exit /b 1
)

echo ✅ Compilation successful!
echo 📁 Files created:
echo   - fusionbridge.wasm
echo   - fusionbridge.abi
pause
`;

    // Deploy script
    const deployScript = `@echo off
echo 🚀 Deploying EOS Contract to Jungle4...

echo 📋 Checking files...
if not exist "contracts\\eos\\fusionbridge.wasm" (
    echo ❌ fusionbridge.wasm not found! Run compile.bat first.
    pause
    exit /b 1
)

if not exist "contracts\\eos\\fusionbridge.abi" (
    echo ❌ fusionbridge.abi not found! Run compile.bat first.
    pause
    exit /b 1
)

echo 🔗 Deploying contract...
cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts\\eos fusionbridge.wasm fusionbridge.abi

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed!
    echo 💡 Try using online tools instead:
    echo   - EOS Studio: http://app.eosstudio.io/guest
    echo   - Bloks.io: https://local.bloks.io/
    pause
    exit /b 1
)

echo ✅ Deployment successful!
pause
`;

    // Test script
    const testScript = `@echo off
echo 🧪 Testing EOS HTLC Contract...

echo 📋 Creating test HTLC...
cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{
  "sender": "quicksnake34",
  "recipient": "quicksnake34",
  "amount": "0.1000 EOS",
  "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "timelock": 1753746959,
  "memo": "Test HTLC",
  "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}' -p quicksnake34@active

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Test failed!
    pause
    exit /b 1
)

echo ✅ Test successful!
pause
`;

    // Write scripts
    fs.writeFileSync(path.join(this.windowsDir, 'compile.bat'), compileScript);
    fs.writeFileSync(path.join(this.windowsDir, 'deploy.bat'), deployScript);
    fs.writeFileSync(path.join(this.windowsDir, 'test.bat'), testScript);
    
    console.log('✅ Windows batch scripts created');
  }
  
  /**
   * 📦 Create deployment package
   */
  async createPackage() {
    console.log('🚀 Creating Windows deployment package...');
    console.log('=' .repeat(60));
    
    try {
      // Create directory
      this.createWindowsDirectory();
      
      // Copy files
      this.copyEssentialFiles();
      
      // Create guide
      this.createWindowsGuide();
      
      // Create scripts
      this.createWindowsScripts();
      
      console.log('\n🎉 Windows deployment package created successfully!');
      console.log('=' .repeat(60));
      console.log(`📍 Location: ${this.windowsDir}`);
      console.log('📋 Contents:');
      console.log('  - contracts/eos/ (source files)');
      console.log('  - compile.bat (compilation script)');
      console.log('  - deploy.bat (deployment script)');
      console.log('  - test.bat (testing script)');
      console.log('  - README.md (deployment guide)');
      console.log('  - package.json (dependencies)');
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Copy the windows-deployment folder to your Windows machine');
      console.log('2. Install EOSIO.CDT for Windows');
      console.log('3. Run compile.bat to compile the contract');
      console.log('4. Run deploy.bat to deploy (or use online tools)');
      console.log('5. Run test.bat to test the deployment');
      
      return true;
    } catch (error) {
      console.error('❌ Error creating Windows package:', error.message);
      return false;
    }
  }
}

// Export for use in other scripts
module.exports = { WindowsPackageCreator };

// Run package creation if called directly
if (require.main === module) {
  const creator = new WindowsPackageCreator();
  creator.createPackage();
} 