const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🐳 Docker EOS Deployment Package Creator
 * Creates a Docker-based solution for EOS contract deployment
 */
class DockerPackageCreator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.dockerDir = path.join(this.projectRoot, 'docker-eos-deployment');
    this.eosDir = path.join(this.projectRoot, 'contracts/eos');
    
    console.log('🐳 Docker EOS Deployment Package Creator');
    console.log(`📍 Project Root: ${this.projectRoot}`);
    console.log(`📍 Docker Dir: ${this.dockerDir}`);
  }
  
  /**
   * 📦 Create Docker deployment directory
   */
  createDockerDirectory() {
    console.log('\n📦 Creating Docker deployment directory...');
    
    if (fs.existsSync(this.dockerDir)) {
      console.log('🗑️  Removing existing docker-eos-deployment directory');
      fs.rmSync(this.dockerDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(this.dockerDir, { recursive: true });
    console.log('✅ Docker deployment directory created');
  }
  
  /**
   * 📋 Copy essential files for Docker deployment
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
      const destPath = path.join(this.dockerDir, file);
      
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
   * 🐳 Create Dockerfile
   */
  createDockerfile() {
    console.log('\n🐳 Creating Dockerfile...');
    
    const dockerfileContent = `# EOSIO.CDT Docker Image for Contract Compilation
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV EOSIO_CDT_VERSION=1.8.1

# Install dependencies
RUN apt-get update && apt-get install -y \\
    wget \\
    curl \\
    git \\
    build-essential \\
    cmake \\
    pkg-config \\
    libssl-dev \\
    libcurl4-openssl-dev \\
    libusb-1.0-0-dev \\
    libudev-dev \\
    && rm -rf /var/lib/apt/lists/*

# Install EOSIO.CDT
RUN wget https://github.com/EOSIO/eosio.cdt/releases/download/v\${EOSIO_CDT_VERSION}/eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb \\
    && dpkg -i eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb \\
    && rm eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb

# Set PATH
ENV PATH="/usr/local/eosio.cdt/bin:\${PATH}"

# Create working directory
WORKDIR /eos-contracts

# Copy contract files
COPY contracts/eos/ ./contracts/eos/

# Create compilation script
RUN echo '#!/bin/bash' > /compile.sh \\
    && echo 'echo "🐳 Compiling EOS Contract in Docker..."' >> /compile.sh \\
    && echo 'cd /eos-contracts/contracts/eos' >> /compile.sh \\
    && echo 'echo "📦 Compiling fusionbridge.cpp..."' >> /compile.sh \\
    && echo 'eosio-cpp -o fusionbridge.wasm fusionbridge.cpp' >> /compile.sh \\
    && echo 'echo "📋 Generating ABI..."' >> /compile.sh \\
    && echo 'eosio-abigen fusionbridge.cpp --output=fusionbridge.abi' >> /compile.sh \\
    && echo 'echo "✅ Compilation complete!"' >> /compile.sh \\
    && echo 'ls -la *.wasm *.abi' >> /compile.sh \\
    && chmod +x /compile.sh

# Default command
CMD ["/compile.sh"]
`;

    const dockerfilePath = path.join(this.dockerDir, 'Dockerfile');
    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log('✅ Dockerfile created');
  }
  
  /**
   * 🐳 Create docker-compose.yml
   */
  createDockerCompose() {
    console.log('\n🐳 Creating docker-compose.yml...');
    
    const composeContent = `version: '3.8'

services:
  eos-compiler:
    build: .
    container_name: eos-contract-compiler
    volumes:
      - ./contracts:/eos-contracts/contracts
      - ./output:/eos-contracts/output
    environment:
      - EOSIO_CDT_VERSION=1.8.1
    command: /compile.sh
    
  eos-deployer:
    image: eosio/eos:latest
    container_name: eos-deployer
    volumes:
      - ./output:/eos-contracts/output
      - ./scripts:/scripts
    environment:
      - EOSIO_NODE_URL=https://jungle4.cryptolions.io
    command: /bin/bash -c "echo 'Deployment tools ready' && tail -f /dev/null"
`;

    const composePath = path.join(this.dockerDir, 'docker-compose.yml');
    fs.writeFileSync(composePath, composeContent);
    console.log('✅ docker-compose.yml created');
  }
  
  /**
   * 📝 Create Docker deployment scripts
   */
  createDockerScripts() {
    console.log('\n📝 Creating Docker deployment scripts...');
    
    // Build script
    const buildScript = `#!/bin/bash
echo "🐳 Building EOS Contract Compiler Docker Image..."
docker build -t eos-contract-compiler .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "📦 Image name: eos-contract-compiler"
else
    echo "❌ Docker build failed!"
    exit 1
fi
`;

    // Compile script
    const compileScript = `#!/bin/bash
echo "🐳 Compiling EOS Contract using Docker..."

# Create output directory
mkdir -p output

# Run compilation in Docker
docker run --rm \\
    -v "\$(pwd)/contracts:/eos-contracts/contracts" \\
    -v "\$(pwd)/output:/eos-contracts/output" \\
    eos-contract-compiler

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    echo "📁 Output files:"
    ls -la output/
else
    echo "❌ Compilation failed!"
    exit 1
fi
`;

    // Deploy script
    const deployScript = `#!/bin/bash
echo "🚀 Deploying EOS Contract to Jungle4..."

# Check if compiled files exist
if [ ! -f "output/fusionbridge.wasm" ] || [ ! -f "output/fusionbridge.abi" ]; then
    echo "❌ Compiled files not found! Run compile.sh first."
    exit 1
fi

echo "📋 Deploying contract to quicksnake34 account..."
echo "🔗 Using Jungle4 testnet: https://jungle4.cryptolions.io"

# Note: This requires cleos to be installed locally or use online tools
echo "💡 Deployment options:"
echo "1. Use online tools:"
echo "   - EOS Studio: http://app.eosstudio.io/guest"
echo "   - Bloks.io: https://local.bloks.io/"
echo "2. Install cleos locally and run:"
echo "   cleos -u https://jungle4.cryptolions.io set contract quicksnake34 output/ fusionbridge.wasm fusionbridge.abi"

echo "📁 Files ready for deployment:"
ls -la output/
`;

    // Test script
    const testScript = `#!/bin/bash
echo "🧪 Testing EOS HTLC Contract..."

echo "📋 Test HTLC Parameters:"
cat << EOF
{
  "sender": "quicksnake34",
  "recipient": "quicksnake34",
  "amount": "0.1000 EOS",
  "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "timelock": $(date -d '+1 hour' +%s),
  "memo": "Test HTLC",
  "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
EOF

echo "💡 Test command (after deployment):"
echo "cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{\\"sender\\":\\"quicksnake34\\",\\"recipient\\":\\"quicksnake34\\",\\"amount\\":\\"0.1000 EOS\\",\\"hashlock\\":\\"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\\",\\"timelock\\":$(date -d '+1 hour' +%s),\\"memo\\":\\"Test HTLC\\",\\"eth_tx_hash\\":\\"0x0000000000000000000000000000000000000000000000000000000000000000\\"}' -p quicksnake34@active"
`;

    // Write scripts
    fs.writeFileSync(path.join(this.dockerDir, 'build.sh'), buildScript);
    fs.writeFileSync(path.join(this.dockerDir, 'compile.sh'), compileScript);
    fs.writeFileSync(path.join(this.dockerDir, 'deploy.sh'), deployScript);
    fs.writeFileSync(path.join(this.dockerDir, 'test.sh'), testScript);
    
    // Make scripts executable
    ['build.sh', 'compile.sh', 'deploy.sh', 'test.sh'].forEach(script => {
      const scriptPath = path.join(this.dockerDir, script);
      fs.chmodSync(scriptPath, '755');
    });
    
    console.log('✅ Docker deployment scripts created');
  }
  
  /**
   * 📝 Create Docker deployment guide
   */
  createDockerGuide() {
    console.log('\n📝 Creating Docker deployment guide...');
    
    const guideContent = `# 🐳 Docker EOS Contract Deployment Guide

## 📋 Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install for your platform (Windows/Mac/Linux)
   - Start Docker Desktop

2. **Verify Docker Installation**
   \`\`\`bash
   docker --version
   docker-compose --version
   \`\`\`

## 🚀 Quick Start

### Step 1: Build Docker Image
\`\`\`bash
# Navigate to docker-eos-deployment directory
cd docker-eos-deployment

# Build the Docker image
./build.sh
\`\`\`

### Step 2: Compile Contract
\`\`\`bash
# Compile the EOS contract using Docker
./compile.sh
\`\`\`

### Step 3: Deploy Contract
\`\`\`bash
# Deploy to Jungle4 testnet
./deploy.sh
\`\`\`

### Step 4: Test Contract
\`\`\`bash
# Test the deployed contract
./test.sh
\`\`\`

## 🔧 Manual Steps

### Build Docker Image Manually
\`\`\`bash
docker build -t eos-contract-compiler .
\`\`\`

### Compile Contract Manually
\`\`\`bash
# Create output directory
mkdir -p output

# Run compilation
docker run --rm \\
    -v "\$(pwd)/contracts:/eos-contracts/contracts" \\
    -v "\$(pwd)/output:/eos-contracts/output" \\
    eos-contract-compiler
\`\`\`

### Deploy Using Online Tools

#### Option 1: EOS Studio
1. Go to: http://app.eosstudio.io/guest
2. Upload \`output/fusionbridge.wasm\` and \`output/fusionbridge.abi\`
3. Deploy to \`quicksnake34\` account

#### Option 2: Bloks.io
1. Go to: https://local.bloks.io/
2. Connect to Jungle4 testnet
3. Upload and deploy contract

#### Option 3: Cryptolions Explorer
1. Go to: https://jungle4.cryptolions.io/
2. Use the contract deployment interface

## 📁 File Structure
\`\`\`
docker-eos-deployment/
├── Dockerfile
├── docker-compose.yml
├── build.sh
├── compile.sh
├── deploy.sh
├── test.sh
├── contracts/
│   └── eos/
│       ├── fusionbridge.cpp
│       ├── fusionbridge.hpp
│       ├── CMakeLists.txt
│       ├── fusionbridge.wasm
│       └── fusionbridge.abi
├── output/ (created after compilation)
└── README.md (this file)
\`\`\`

## 🎯 Advantages of Docker

✅ **Cross-platform compatibility** (Windows, Mac, Linux)
✅ **No local EOSIO.CDT installation required**
✅ **Consistent compilation environment**
✅ **Easy to reproduce and share**
✅ **Isolated from system dependencies**

## 🆘 Troubleshooting

### Common Issues:

1. **Docker not running**
   - Start Docker Desktop
   - Verify with \`docker ps\`

2. **Permission denied**
   - Make scripts executable: \`chmod +x *.sh\`
   - Run as administrator (Windows)

3. **Build fails**
   - Check internet connection
   - Clear Docker cache: \`docker system prune\`

4. **Compilation errors**
   - Check contract source code
   - Verify EOSIO.CDT version compatibility

### Support:
- Docker Docs: https://docs.docker.com/
- EOSIO.CDT Docs: https://developers.eos.io/manuals/eosio.cdt/latest/
- Jungle4 Testnet: https://jungle4.cryptolions.io/

## 🎉 Next Steps

After successful deployment:
1. Update your JavaScript integration with the deployed contract address
2. Test the full cross-chain swap flow
3. Start the relayer service
4. Test bidirectional swaps (ETH↔EOS)
`;

    const guidePath = path.join(this.dockerDir, 'README.md');
    fs.writeFileSync(guidePath, guideContent);
    console.log('✅ Docker deployment guide created');
  }
  
  /**
   * 🐳 Create output directory
   */
  createOutputDirectory() {
    console.log('\n🐳 Creating output directory...');
    
    const outputDir = path.join(this.dockerDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create .gitkeep to preserve directory
    fs.writeFileSync(path.join(outputDir, '.gitkeep'), '');
    console.log('✅ Output directory created');
  }
  
  /**
   * 📦 Create deployment package
   */
  async createPackage() {
    console.log('🐳 Creating Docker EOS deployment package...');
    console.log('=' .repeat(60));
    
    try {
      // Create directory
      this.createDockerDirectory();
      
      // Copy files
      this.copyEssentialFiles();
      
      // Create Dockerfile
      this.createDockerfile();
      
      // Create docker-compose
      this.createDockerCompose();
      
      // Create scripts
      this.createDockerScripts();
      
      // Create guide
      this.createDockerGuide();
      
      // Create output directory
      this.createOutputDirectory();
      
      console.log('\n🎉 Docker EOS deployment package created successfully!');
      console.log('=' .repeat(60));
      console.log(`📍 Location: ${this.dockerDir}`);
      console.log('📋 Contents:');
      console.log('  - Dockerfile (EOSIO.CDT environment)');
      console.log('  - docker-compose.yml (orchestration)');
      console.log('  - build.sh (build Docker image)');
      console.log('  - compile.sh (compile contract)');
      console.log('  - deploy.sh (deployment guide)');
      console.log('  - test.sh (testing guide)');
      console.log('  - contracts/eos/ (source files)');
      console.log('  - output/ (compiled files)');
      console.log('  - README.md (complete guide)');
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Install Docker Desktop');
      console.log('2. Navigate to docker-eos-deployment directory');
      console.log('3. Run: ./build.sh (build Docker image)');
      console.log('4. Run: ./compile.sh (compile contract)');
      console.log('5. Run: ./deploy.sh (deploy to Jungle4)');
      console.log('6. Run: ./test.sh (test deployment)');
      
      console.log('\n💡 Advantages:');
      console.log('✅ Works on Windows, Mac, and Linux');
      console.log('✅ No local EOSIO.CDT installation needed');
      console.log('✅ Consistent compilation environment');
      console.log('✅ Easy to reproduce and share');
      
      return true;
    } catch (error) {
      console.error('❌ Error creating Docker package:', error.message);
      return false;
    }
  }
}

// Export for use in other scripts
module.exports = { DockerPackageCreator };

// Run package creation if called directly
if (require.main === module) {
  const creator = new DockerPackageCreator();
  creator.createPackage();
} 
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🐳 Docker EOS Deployment Package Creator
 * Creates a Docker-based solution for EOS contract deployment
 */
class DockerPackageCreator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.dockerDir = path.join(this.projectRoot, 'docker-eos-deployment');
    this.eosDir = path.join(this.projectRoot, 'contracts/eos');
    
    console.log('🐳 Docker EOS Deployment Package Creator');
    console.log(`📍 Project Root: ${this.projectRoot}`);
    console.log(`📍 Docker Dir: ${this.dockerDir}`);
  }
  
  /**
   * 📦 Create Docker deployment directory
   */
  createDockerDirectory() {
    console.log('\n📦 Creating Docker deployment directory...');
    
    if (fs.existsSync(this.dockerDir)) {
      console.log('🗑️  Removing existing docker-eos-deployment directory');
      fs.rmSync(this.dockerDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(this.dockerDir, { recursive: true });
    console.log('✅ Docker deployment directory created');
  }
  
  /**
   * 📋 Copy essential files for Docker deployment
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
      const destPath = path.join(this.dockerDir, file);
      
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
   * 🐳 Create Dockerfile
   */
  createDockerfile() {
    console.log('\n🐳 Creating Dockerfile...');
    
    const dockerfileContent = `# EOSIO.CDT Docker Image for Contract Compilation
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV EOSIO_CDT_VERSION=1.8.1

# Install dependencies
RUN apt-get update && apt-get install -y \\
    wget \\
    curl \\
    git \\
    build-essential \\
    cmake \\
    pkg-config \\
    libssl-dev \\
    libcurl4-openssl-dev \\
    libusb-1.0-0-dev \\
    libudev-dev \\
    && rm -rf /var/lib/apt/lists/*

# Install EOSIO.CDT
RUN wget https://github.com/EOSIO/eosio.cdt/releases/download/v\${EOSIO_CDT_VERSION}/eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb \\
    && dpkg -i eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb \\
    && rm eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb

# Set PATH
ENV PATH="/usr/local/eosio.cdt/bin:\${PATH}"

# Create working directory
WORKDIR /eos-contracts

# Copy contract files
COPY contracts/eos/ ./contracts/eos/

# Create compilation script
RUN echo '#!/bin/bash' > /compile.sh \\
    && echo 'echo "🐳 Compiling EOS Contract in Docker..."' >> /compile.sh \\
    && echo 'cd /eos-contracts/contracts/eos' >> /compile.sh \\
    && echo 'echo "📦 Compiling fusionbridge.cpp..."' >> /compile.sh \\
    && echo 'eosio-cpp -o fusionbridge.wasm fusionbridge.cpp' >> /compile.sh \\
    && echo 'echo "📋 Generating ABI..."' >> /compile.sh \\
    && echo 'eosio-abigen fusionbridge.cpp --output=fusionbridge.abi' >> /compile.sh \\
    && echo 'echo "✅ Compilation complete!"' >> /compile.sh \\
    && echo 'ls -la *.wasm *.abi' >> /compile.sh \\
    && chmod +x /compile.sh

# Default command
CMD ["/compile.sh"]
`;

    const dockerfilePath = path.join(this.dockerDir, 'Dockerfile');
    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log('✅ Dockerfile created');
  }
  
  /**
   * 🐳 Create docker-compose.yml
   */
  createDockerCompose() {
    console.log('\n🐳 Creating docker-compose.yml...');
    
    const composeContent = `version: '3.8'

services:
  eos-compiler:
    build: .
    container_name: eos-contract-compiler
    volumes:
      - ./contracts:/eos-contracts/contracts
      - ./output:/eos-contracts/output
    environment:
      - EOSIO_CDT_VERSION=1.8.1
    command: /compile.sh
    
  eos-deployer:
    image: eosio/eos:latest
    container_name: eos-deployer
    volumes:
      - ./output:/eos-contracts/output
      - ./scripts:/scripts
    environment:
      - EOSIO_NODE_URL=https://jungle4.cryptolions.io
    command: /bin/bash -c "echo 'Deployment tools ready' && tail -f /dev/null"
`;

    const composePath = path.join(this.dockerDir, 'docker-compose.yml');
    fs.writeFileSync(composePath, composeContent);
    console.log('✅ docker-compose.yml created');
  }
  
  /**
   * 📝 Create Docker deployment scripts
   */
  createDockerScripts() {
    console.log('\n📝 Creating Docker deployment scripts...');
    
    // Build script
    const buildScript = `#!/bin/bash
echo "🐳 Building EOS Contract Compiler Docker Image..."
docker build -t eos-contract-compiler .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "📦 Image name: eos-contract-compiler"
else
    echo "❌ Docker build failed!"
    exit 1
fi
`;

    // Compile script
    const compileScript = `#!/bin/bash
echo "🐳 Compiling EOS Contract using Docker..."

# Create output directory
mkdir -p output

# Run compilation in Docker
docker run --rm \\
    -v "\$(pwd)/contracts:/eos-contracts/contracts" \\
    -v "\$(pwd)/output:/eos-contracts/output" \\
    eos-contract-compiler

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    echo "📁 Output files:"
    ls -la output/
else
    echo "❌ Compilation failed!"
    exit 1
fi
`;

    // Deploy script
    const deployScript = `#!/bin/bash
echo "🚀 Deploying EOS Contract to Jungle4..."

# Check if compiled files exist
if [ ! -f "output/fusionbridge.wasm" ] || [ ! -f "output/fusionbridge.abi" ]; then
    echo "❌ Compiled files not found! Run compile.sh first."
    exit 1
fi

echo "📋 Deploying contract to quicksnake34 account..."
echo "🔗 Using Jungle4 testnet: https://jungle4.cryptolions.io"

# Note: This requires cleos to be installed locally or use online tools
echo "💡 Deployment options:"
echo "1. Use online tools:"
echo "   - EOS Studio: http://app.eosstudio.io/guest"
echo "   - Bloks.io: https://local.bloks.io/"
echo "2. Install cleos locally and run:"
echo "   cleos -u https://jungle4.cryptolions.io set contract quicksnake34 output/ fusionbridge.wasm fusionbridge.abi"

echo "📁 Files ready for deployment:"
ls -la output/
`;

    // Test script
    const testScript = `#!/bin/bash
echo "🧪 Testing EOS HTLC Contract..."

echo "📋 Test HTLC Parameters:"
cat << EOF
{
  "sender": "quicksnake34",
  "recipient": "quicksnake34",
  "amount": "0.1000 EOS",
  "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "timelock": $(date -d '+1 hour' +%s),
  "memo": "Test HTLC",
  "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
EOF

echo "💡 Test command (after deployment):"
echo "cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{\\"sender\\":\\"quicksnake34\\",\\"recipient\\":\\"quicksnake34\\",\\"amount\\":\\"0.1000 EOS\\",\\"hashlock\\":\\"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\\",\\"timelock\\":$(date -d '+1 hour' +%s),\\"memo\\":\\"Test HTLC\\",\\"eth_tx_hash\\":\\"0x0000000000000000000000000000000000000000000000000000000000000000\\"}' -p quicksnake34@active"
`;

    // Write scripts
    fs.writeFileSync(path.join(this.dockerDir, 'build.sh'), buildScript);
    fs.writeFileSync(path.join(this.dockerDir, 'compile.sh'), compileScript);
    fs.writeFileSync(path.join(this.dockerDir, 'deploy.sh'), deployScript);
    fs.writeFileSync(path.join(this.dockerDir, 'test.sh'), testScript);
    
    // Make scripts executable
    ['build.sh', 'compile.sh', 'deploy.sh', 'test.sh'].forEach(script => {
      const scriptPath = path.join(this.dockerDir, script);
      fs.chmodSync(scriptPath, '755');
    });
    
    console.log('✅ Docker deployment scripts created');
  }
  
  /**
   * 📝 Create Docker deployment guide
   */
  createDockerGuide() {
    console.log('\n📝 Creating Docker deployment guide...');
    
    const guideContent = `# 🐳 Docker EOS Contract Deployment Guide

## 📋 Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install for your platform (Windows/Mac/Linux)
   - Start Docker Desktop

2. **Verify Docker Installation**
   \`\`\`bash
   docker --version
   docker-compose --version
   \`\`\`

## 🚀 Quick Start

### Step 1: Build Docker Image
\`\`\`bash
# Navigate to docker-eos-deployment directory
cd docker-eos-deployment

# Build the Docker image
./build.sh
\`\`\`

### Step 2: Compile Contract
\`\`\`bash
# Compile the EOS contract using Docker
./compile.sh
\`\`\`

### Step 3: Deploy Contract
\`\`\`bash
# Deploy to Jungle4 testnet
./deploy.sh
\`\`\`

### Step 4: Test Contract
\`\`\`bash
# Test the deployed contract
./test.sh
\`\`\`

## 🔧 Manual Steps

### Build Docker Image Manually
\`\`\`bash
docker build -t eos-contract-compiler .
\`\`\`

### Compile Contract Manually
\`\`\`bash
# Create output directory
mkdir -p output

# Run compilation
docker run --rm \\
    -v "\$(pwd)/contracts:/eos-contracts/contracts" \\
    -v "\$(pwd)/output:/eos-contracts/output" \\
    eos-contract-compiler
\`\`\`

### Deploy Using Online Tools

#### Option 1: EOS Studio
1. Go to: http://app.eosstudio.io/guest
2. Upload \`output/fusionbridge.wasm\` and \`output/fusionbridge.abi\`
3. Deploy to \`quicksnake34\` account

#### Option 2: Bloks.io
1. Go to: https://local.bloks.io/
2. Connect to Jungle4 testnet
3. Upload and deploy contract

#### Option 3: Cryptolions Explorer
1. Go to: https://jungle4.cryptolions.io/
2. Use the contract deployment interface

## 📁 File Structure
\`\`\`
docker-eos-deployment/
├── Dockerfile
├── docker-compose.yml
├── build.sh
├── compile.sh
├── deploy.sh
├── test.sh
├── contracts/
│   └── eos/
│       ├── fusionbridge.cpp
│       ├── fusionbridge.hpp
│       ├── CMakeLists.txt
│       ├── fusionbridge.wasm
│       └── fusionbridge.abi
├── output/ (created after compilation)
└── README.md (this file)
\`\`\`

## 🎯 Advantages of Docker

✅ **Cross-platform compatibility** (Windows, Mac, Linux)
✅ **No local EOSIO.CDT installation required**
✅ **Consistent compilation environment**
✅ **Easy to reproduce and share**
✅ **Isolated from system dependencies**

## 🆘 Troubleshooting

### Common Issues:

1. **Docker not running**
   - Start Docker Desktop
   - Verify with \`docker ps\`

2. **Permission denied**
   - Make scripts executable: \`chmod +x *.sh\`
   - Run as administrator (Windows)

3. **Build fails**
   - Check internet connection
   - Clear Docker cache: \`docker system prune\`

4. **Compilation errors**
   - Check contract source code
   - Verify EOSIO.CDT version compatibility

### Support:
- Docker Docs: https://docs.docker.com/
- EOSIO.CDT Docs: https://developers.eos.io/manuals/eosio.cdt/latest/
- Jungle4 Testnet: https://jungle4.cryptolions.io/

## 🎉 Next Steps

After successful deployment:
1. Update your JavaScript integration with the deployed contract address
2. Test the full cross-chain swap flow
3. Start the relayer service
4. Test bidirectional swaps (ETH↔EOS)
`;

    const guidePath = path.join(this.dockerDir, 'README.md');
    fs.writeFileSync(guidePath, guideContent);
    console.log('✅ Docker deployment guide created');
  }
  
  /**
   * 🐳 Create output directory
   */
  createOutputDirectory() {
    console.log('\n🐳 Creating output directory...');
    
    const outputDir = path.join(this.dockerDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create .gitkeep to preserve directory
    fs.writeFileSync(path.join(outputDir, '.gitkeep'), '');
    console.log('✅ Output directory created');
  }
  
  /**
   * 📦 Create deployment package
   */
  async createPackage() {
    console.log('🐳 Creating Docker EOS deployment package...');
    console.log('=' .repeat(60));
    
    try {
      // Create directory
      this.createDockerDirectory();
      
      // Copy files
      this.copyEssentialFiles();
      
      // Create Dockerfile
      this.createDockerfile();
      
      // Create docker-compose
      this.createDockerCompose();
      
      // Create scripts
      this.createDockerScripts();
      
      // Create guide
      this.createDockerGuide();
      
      // Create output directory
      this.createOutputDirectory();
      
      console.log('\n🎉 Docker EOS deployment package created successfully!');
      console.log('=' .repeat(60));
      console.log(`📍 Location: ${this.dockerDir}`);
      console.log('📋 Contents:');
      console.log('  - Dockerfile (EOSIO.CDT environment)');
      console.log('  - docker-compose.yml (orchestration)');
      console.log('  - build.sh (build Docker image)');
      console.log('  - compile.sh (compile contract)');
      console.log('  - deploy.sh (deployment guide)');
      console.log('  - test.sh (testing guide)');
      console.log('  - contracts/eos/ (source files)');
      console.log('  - output/ (compiled files)');
      console.log('  - README.md (complete guide)');
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Install Docker Desktop');
      console.log('2. Navigate to docker-eos-deployment directory');
      console.log('3. Run: ./build.sh (build Docker image)');
      console.log('4. Run: ./compile.sh (compile contract)');
      console.log('5. Run: ./deploy.sh (deploy to Jungle4)');
      console.log('6. Run: ./test.sh (test deployment)');
      
      console.log('\n💡 Advantages:');
      console.log('✅ Works on Windows, Mac, and Linux');
      console.log('✅ No local EOSIO.CDT installation needed');
      console.log('✅ Consistent compilation environment');
      console.log('✅ Easy to reproduce and share');
      
      return true;
    } catch (error) {
      console.error('❌ Error creating Docker package:', error.message);
      return false;
    }
  }
}

// Export for use in other scripts
module.exports = { DockerPackageCreator };

// Run package creation if called directly
if (require.main === module) {
  const creator = new DockerPackageCreator();
  creator.createPackage();
} 
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🐳 Docker EOS Deployment Package Creator
 * Creates a Docker-based solution for EOS contract deployment
 */
class DockerPackageCreator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.dockerDir = path.join(this.projectRoot, 'docker-eos-deployment');
    this.eosDir = path.join(this.projectRoot, 'contracts/eos');
    
    console.log('🐳 Docker EOS Deployment Package Creator');
    console.log(`📍 Project Root: ${this.projectRoot}`);
    console.log(`📍 Docker Dir: ${this.dockerDir}`);
  }
  
  /**
   * 📦 Create Docker deployment directory
   */
  createDockerDirectory() {
    console.log('\n📦 Creating Docker deployment directory...');
    
    if (fs.existsSync(this.dockerDir)) {
      console.log('🗑️  Removing existing docker-eos-deployment directory');
      fs.rmSync(this.dockerDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(this.dockerDir, { recursive: true });
    console.log('✅ Docker deployment directory created');
  }
  
  /**
   * 📋 Copy essential files for Docker deployment
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
      const destPath = path.join(this.dockerDir, file);
      
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
   * 🐳 Create Dockerfile
   */
  createDockerfile() {
    console.log('\n🐳 Creating Dockerfile...');
    
    const dockerfileContent = `# EOSIO.CDT Docker Image for Contract Compilation
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV EOSIO_CDT_VERSION=1.8.1

# Install dependencies
RUN apt-get update && apt-get install -y \\
    wget \\
    curl \\
    git \\
    build-essential \\
    cmake \\
    pkg-config \\
    libssl-dev \\
    libcurl4-openssl-dev \\
    libusb-1.0-0-dev \\
    libudev-dev \\
    && rm -rf /var/lib/apt/lists/*

# Install EOSIO.CDT
RUN wget https://github.com/EOSIO/eosio.cdt/releases/download/v\${EOSIO_CDT_VERSION}/eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb \\
    && dpkg -i eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb \\
    && rm eosio.cdt_\${EOSIO_CDT_VERSION}_amd64.deb

# Set PATH
ENV PATH="/usr/local/eosio.cdt/bin:\${PATH}"

# Create working directory
WORKDIR /eos-contracts

# Copy contract files
COPY contracts/eos/ ./contracts/eos/

# Create compilation script
RUN echo '#!/bin/bash' > /compile.sh \\
    && echo 'echo "🐳 Compiling EOS Contract in Docker..."' >> /compile.sh \\
    && echo 'cd /eos-contracts/contracts/eos' >> /compile.sh \\
    && echo 'echo "📦 Compiling fusionbridge.cpp..."' >> /compile.sh \\
    && echo 'eosio-cpp -o fusionbridge.wasm fusionbridge.cpp' >> /compile.sh \\
    && echo 'echo "📋 Generating ABI..."' >> /compile.sh \\
    && echo 'eosio-abigen fusionbridge.cpp --output=fusionbridge.abi' >> /compile.sh \\
    && echo 'echo "✅ Compilation complete!"' >> /compile.sh \\
    && echo 'ls -la *.wasm *.abi' >> /compile.sh \\
    && chmod +x /compile.sh

# Default command
CMD ["/compile.sh"]
`;

    const dockerfilePath = path.join(this.dockerDir, 'Dockerfile');
    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log('✅ Dockerfile created');
  }
  
  /**
   * 🐳 Create docker-compose.yml
   */
  createDockerCompose() {
    console.log('\n🐳 Creating docker-compose.yml...');
    
    const composeContent = `version: '3.8'

services:
  eos-compiler:
    build: .
    container_name: eos-contract-compiler
    volumes:
      - ./contracts:/eos-contracts/contracts
      - ./output:/eos-contracts/output
    environment:
      - EOSIO_CDT_VERSION=1.8.1
    command: /compile.sh
    
  eos-deployer:
    image: eosio/eos:latest
    container_name: eos-deployer
    volumes:
      - ./output:/eos-contracts/output
      - ./scripts:/scripts
    environment:
      - EOSIO_NODE_URL=https://jungle4.cryptolions.io
    command: /bin/bash -c "echo 'Deployment tools ready' && tail -f /dev/null"
`;

    const composePath = path.join(this.dockerDir, 'docker-compose.yml');
    fs.writeFileSync(composePath, composeContent);
    console.log('✅ docker-compose.yml created');
  }
  
  /**
   * 📝 Create Docker deployment scripts
   */
  createDockerScripts() {
    console.log('\n📝 Creating Docker deployment scripts...');
    
    // Build script
    const buildScript = `#!/bin/bash
echo "🐳 Building EOS Contract Compiler Docker Image..."
docker build -t eos-contract-compiler .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "📦 Image name: eos-contract-compiler"
else
    echo "❌ Docker build failed!"
    exit 1
fi
`;

    // Compile script
    const compileScript = `#!/bin/bash
echo "🐳 Compiling EOS Contract using Docker..."

# Create output directory
mkdir -p output

# Run compilation in Docker
docker run --rm \\
    -v "\$(pwd)/contracts:/eos-contracts/contracts" \\
    -v "\$(pwd)/output:/eos-contracts/output" \\
    eos-contract-compiler

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    echo "📁 Output files:"
    ls -la output/
else
    echo "❌ Compilation failed!"
    exit 1
fi
`;

    // Deploy script
    const deployScript = `#!/bin/bash
echo "🚀 Deploying EOS Contract to Jungle4..."

# Check if compiled files exist
if [ ! -f "output/fusionbridge.wasm" ] || [ ! -f "output/fusionbridge.abi" ]; then
    echo "❌ Compiled files not found! Run compile.sh first."
    exit 1
fi

echo "📋 Deploying contract to quicksnake34 account..."
echo "🔗 Using Jungle4 testnet: https://jungle4.cryptolions.io"

# Note: This requires cleos to be installed locally or use online tools
echo "💡 Deployment options:"
echo "1. Use online tools:"
echo "   - EOS Studio: http://app.eosstudio.io/guest"
echo "   - Bloks.io: https://local.bloks.io/"
echo "2. Install cleos locally and run:"
echo "   cleos -u https://jungle4.cryptolions.io set contract quicksnake34 output/ fusionbridge.wasm fusionbridge.abi"

echo "📁 Files ready for deployment:"
ls -la output/
`;

    // Test script
    const testScript = `#!/bin/bash
echo "🧪 Testing EOS HTLC Contract..."

echo "📋 Test HTLC Parameters:"
cat << EOF
{
  "sender": "quicksnake34",
  "recipient": "quicksnake34",
  "amount": "0.1000 EOS",
  "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "timelock": $(date -d '+1 hour' +%s),
  "memo": "Test HTLC",
  "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
EOF

echo "💡 Test command (after deployment):"
echo "cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{\\"sender\\":\\"quicksnake34\\",\\"recipient\\":\\"quicksnake34\\",\\"amount\\":\\"0.1000 EOS\\",\\"hashlock\\":\\"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\\",\\"timelock\\":$(date -d '+1 hour' +%s),\\"memo\\":\\"Test HTLC\\",\\"eth_tx_hash\\":\\"0x0000000000000000000000000000000000000000000000000000000000000000\\"}' -p quicksnake34@active"
`;

    // Write scripts
    fs.writeFileSync(path.join(this.dockerDir, 'build.sh'), buildScript);
    fs.writeFileSync(path.join(this.dockerDir, 'compile.sh'), compileScript);
    fs.writeFileSync(path.join(this.dockerDir, 'deploy.sh'), deployScript);
    fs.writeFileSync(path.join(this.dockerDir, 'test.sh'), testScript);
    
    // Make scripts executable
    ['build.sh', 'compile.sh', 'deploy.sh', 'test.sh'].forEach(script => {
      const scriptPath = path.join(this.dockerDir, script);
      fs.chmodSync(scriptPath, '755');
    });
    
    console.log('✅ Docker deployment scripts created');
  }
  
  /**
   * 📝 Create Docker deployment guide
   */
  createDockerGuide() {
    console.log('\n📝 Creating Docker deployment guide...');
    
    const guideContent = `# 🐳 Docker EOS Contract Deployment Guide

## 📋 Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install for your platform (Windows/Mac/Linux)
   - Start Docker Desktop

2. **Verify Docker Installation**
   \`\`\`bash
   docker --version
   docker-compose --version
   \`\`\`

## 🚀 Quick Start

### Step 1: Build Docker Image
\`\`\`bash
# Navigate to docker-eos-deployment directory
cd docker-eos-deployment

# Build the Docker image
./build.sh
\`\`\`

### Step 2: Compile Contract
\`\`\`bash
# Compile the EOS contract using Docker
./compile.sh
\`\`\`

### Step 3: Deploy Contract
\`\`\`bash
# Deploy to Jungle4 testnet
./deploy.sh
\`\`\`

### Step 4: Test Contract
\`\`\`bash
# Test the deployed contract
./test.sh
\`\`\`

## 🔧 Manual Steps

### Build Docker Image Manually
\`\`\`bash
docker build -t eos-contract-compiler .
\`\`\`

### Compile Contract Manually
\`\`\`bash
# Create output directory
mkdir -p output

# Run compilation
docker run --rm \\
    -v "\$(pwd)/contracts:/eos-contracts/contracts" \\
    -v "\$(pwd)/output:/eos-contracts/output" \\
    eos-contract-compiler
\`\`\`

### Deploy Using Online Tools

#### Option 1: EOS Studio
1. Go to: http://app.eosstudio.io/guest
2. Upload \`output/fusionbridge.wasm\` and \`output/fusionbridge.abi\`
3. Deploy to \`quicksnake34\` account

#### Option 2: Bloks.io
1. Go to: https://local.bloks.io/
2. Connect to Jungle4 testnet
3. Upload and deploy contract

#### Option 3: Cryptolions Explorer
1. Go to: https://jungle4.cryptolions.io/
2. Use the contract deployment interface

## 📁 File Structure
\`\`\`
docker-eos-deployment/
├── Dockerfile
├── docker-compose.yml
├── build.sh
├── compile.sh
├── deploy.sh
├── test.sh
├── contracts/
│   └── eos/
│       ├── fusionbridge.cpp
│       ├── fusionbridge.hpp
│       ├── CMakeLists.txt
│       ├── fusionbridge.wasm
│       └── fusionbridge.abi
├── output/ (created after compilation)
└── README.md (this file)
\`\`\`

## 🎯 Advantages of Docker

✅ **Cross-platform compatibility** (Windows, Mac, Linux)
✅ **No local EOSIO.CDT installation required**
✅ **Consistent compilation environment**
✅ **Easy to reproduce and share**
✅ **Isolated from system dependencies**

## 🆘 Troubleshooting

### Common Issues:

1. **Docker not running**
   - Start Docker Desktop
   - Verify with \`docker ps\`

2. **Permission denied**
   - Make scripts executable: \`chmod +x *.sh\`
   - Run as administrator (Windows)

3. **Build fails**
   - Check internet connection
   - Clear Docker cache: \`docker system prune\`

4. **Compilation errors**
   - Check contract source code
   - Verify EOSIO.CDT version compatibility

### Support:
- Docker Docs: https://docs.docker.com/
- EOSIO.CDT Docs: https://developers.eos.io/manuals/eosio.cdt/latest/
- Jungle4 Testnet: https://jungle4.cryptolions.io/

## 🎉 Next Steps

After successful deployment:
1. Update your JavaScript integration with the deployed contract address
2. Test the full cross-chain swap flow
3. Start the relayer service
4. Test bidirectional swaps (ETH↔EOS)
`;

    const guidePath = path.join(this.dockerDir, 'README.md');
    fs.writeFileSync(guidePath, guideContent);
    console.log('✅ Docker deployment guide created');
  }
  
  /**
   * 🐳 Create output directory
   */
  createOutputDirectory() {
    console.log('\n🐳 Creating output directory...');
    
    const outputDir = path.join(this.dockerDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create .gitkeep to preserve directory
    fs.writeFileSync(path.join(outputDir, '.gitkeep'), '');
    console.log('✅ Output directory created');
  }
  
  /**
   * 📦 Create deployment package
   */
  async createPackage() {
    console.log('🐳 Creating Docker EOS deployment package...');
    console.log('=' .repeat(60));
    
    try {
      // Create directory
      this.createDockerDirectory();
      
      // Copy files
      this.copyEssentialFiles();
      
      // Create Dockerfile
      this.createDockerfile();
      
      // Create docker-compose
      this.createDockerCompose();
      
      // Create scripts
      this.createDockerScripts();
      
      // Create guide
      this.createDockerGuide();
      
      // Create output directory
      this.createOutputDirectory();
      
      console.log('\n🎉 Docker EOS deployment package created successfully!');
      console.log('=' .repeat(60));
      console.log(`📍 Location: ${this.dockerDir}`);
      console.log('📋 Contents:');
      console.log('  - Dockerfile (EOSIO.CDT environment)');
      console.log('  - docker-compose.yml (orchestration)');
      console.log('  - build.sh (build Docker image)');
      console.log('  - compile.sh (compile contract)');
      console.log('  - deploy.sh (deployment guide)');
      console.log('  - test.sh (testing guide)');
      console.log('  - contracts/eos/ (source files)');
      console.log('  - output/ (compiled files)');
      console.log('  - README.md (complete guide)');
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Install Docker Desktop');
      console.log('2. Navigate to docker-eos-deployment directory');
      console.log('3. Run: ./build.sh (build Docker image)');
      console.log('4. Run: ./compile.sh (compile contract)');
      console.log('5. Run: ./deploy.sh (deploy to Jungle4)');
      console.log('6. Run: ./test.sh (test deployment)');
      
      console.log('\n💡 Advantages:');
      console.log('✅ Works on Windows, Mac, and Linux');
      console.log('✅ No local EOSIO.CDT installation needed');
      console.log('✅ Consistent compilation environment');
      console.log('✅ Easy to reproduce and share');
      
      return true;
    } catch (error) {
      console.error('❌ Error creating Docker package:', error.message);
      return false;
    }
  }
}

// Export for use in other scripts
module.exports = { DockerPackageCreator };

// Run package creation if called directly
if (require.main === module) {
  const creator = new DockerPackageCreator();
  creator.createPackage();
} 