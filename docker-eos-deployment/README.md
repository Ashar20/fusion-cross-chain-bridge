# 🐳 Docker EOS Contract Deployment Guide

## 📋 Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install for your platform (Windows/Mac/Linux)
   - Start Docker Desktop

2. **Verify Docker Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

## 🚀 Quick Start

### Step 1: Build Docker Image
```bash
# Navigate to docker-eos-deployment directory
cd docker-eos-deployment

# Build the Docker image
./build.sh
```

### Step 2: Compile Contract
```bash
# Compile the EOS contract using Docker
./compile.sh
```

### Step 3: Deploy Contract
```bash
# Deploy to Jungle4 testnet
./deploy.sh
```

### Step 4: Test Contract
```bash
# Test the deployed contract
./test.sh
```

## 🔧 Manual Steps

### Build Docker Image Manually
```bash
docker build -t eos-contract-compiler .
```

### Compile Contract Manually
```bash
# Create output directory
mkdir -p output

# Run compilation
docker run --rm \
    -v "$(pwd)/contracts:/eos-contracts/contracts" \
    -v "$(pwd)/output:/eos-contracts/output" \
    eos-contract-compiler
```

### Deploy Using Online Tools

#### Option 1: EOS Studio
1. Go to: http://app.eosstudio.io/guest
2. Upload `output/fusionbridge.wasm` and `output/fusionbridge.abi`
3. Deploy to `quicksnake34` account

#### Option 2: Bloks.io
1. Go to: https://local.bloks.io/
2. Connect to Jungle4 testnet
3. Upload and deploy contract

#### Option 3: Cryptolions Explorer
1. Go to: https://jungle4.cryptolions.io/
2. Use the contract deployment interface

## 📁 File Structure
```
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
```

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
   - Verify with `docker ps`

2. **Permission denied**
   - Make scripts executable: `chmod +x *.sh`
   - Run as administrator (Windows)

3. **Build fails**
   - Check internet connection
   - Clear Docker cache: `docker system prune`

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
