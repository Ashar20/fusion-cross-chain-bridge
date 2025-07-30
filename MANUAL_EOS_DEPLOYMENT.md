# 🚀 Manual EOS Contract Deployment Guide

## 📋 Current Status
- ✅ Environment variables configured
- ✅ Account verified (quicksnake34 with 23.6264 EOS)
- ✅ Contract files compiled (WASM: 59,085 bytes, ABI: 5,022 bytes)
- ✅ Network connection established (Jungle4 testnet)
- ❌ Contract deployment pending

## 🔧 Deployment Options

### Option 1: Install EOSIO Software (Recommended)

#### Step 1: Download EOSIO Software
1. Go to: https://github.com/EOSIO/eos/releases
2. Download the latest release for Windows
3. Extract to a folder (e.g., `C:\eosio`)

#### Step 2: Add to PATH
1. Open System Properties → Environment Variables
2. Add `C:\eosio\bin` to your PATH
3. Restart PowerShell

#### Step 3: Deploy Contract
```bash
# Navigate to project directory
cd C:\Users\silas\fusion-cross-chain-bridge

# Deploy contract
cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts\eos fusionbridge.wasm fusionbridge.abi
```

### Option 2: Use EOSIO.CDT Docker with cleos

#### Step 1: Create custom Docker image
```dockerfile
FROM eosio/eosio.cdt:v1.8.1
RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-18.04_amd64.deb
RUN dpkg -i eos_2.1.0-1-ubuntu-18.04_amd64.deb
```

#### Step 2: Build and use custom image
```bash
docker build -t eosio-with-cleos .
docker run --rm -v "C:/temp/eos-deploy:/work" eosio-with-cleos bash -c "cd /work && cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi"
```

### Option 3: Online Deployment Tools

#### EOS Studio (Alternative)
1. Go to: https://eosstudio.io/
2. Create account and connect wallet
3. Upload WASM/ABI files
4. Deploy to quicksnake34 account

#### Bloks.io (Alternative)
1. Go to: https://jungle.bloks.io/
2. Connect wallet
3. Go to Smart Contracts → Deploy Contract
4. Upload files and deploy

## 📁 Contract Files Location
```
C:\Users\silas\fusion-cross-chain-bridge\contracts\eos\
├── fusionbridge.cpp (source)
├── fusionbridge.hpp (header)
├── fusionbridge.wasm (59,085 bytes) ✅
└── fusionbridge.abi (5,022 bytes) ✅
```

## 🔍 Verification Commands

After deployment, verify with:
```bash
# Check contract code
cleos -u https://jungle4.cryptolions.io get code quicksnake34

# Test contract
cleos -u https://jungle4.cryptolions.io push action quicksnake34 getstats '[]' -p quicksnake34
```

## 💰 Cost Estimation
- **RAM**: ~50 EOS (for contract storage)
- **CPU**: ~10 EOS (for deployment transaction)
- **NET**: ~5 EOS (for transaction data)
- **Total**: ~65 EOS (you have 23.6264 EOS available)

## ⚠️ Important Notes
1. **RAM Purchase Required**: You need to buy RAM before deployment
2. **Account Resources**: Ensure sufficient CPU/NET for deployment
3. **Testnet**: This is Jungle4 testnet, not mainnet
4. **Backup**: Keep your private keys secure

## 🆘 Troubleshooting

### "transaction net usage is too high"
- Solution: Use cleos instead of eosjs
- Alternative: Split deployment into smaller transactions

### "cleos: command not found"
- Solution: Install EOSIO software
- Alternative: Use Docker with custom image

### "insufficient RAM"
- Solution: Buy RAM using: `cleos system buyram quicksnake34 quicksnake34 1000000`

## 📞 Support
- EOS Documentation: https://developers.eos.io/
- Jungle Testnet: https://jungletestnet.io/
- EOS Community: https://forums.eoscommunity.org/ 

## 📋 Current Status
- ✅ Environment variables configured
- ✅ Account verified (quicksnake34 with 23.6264 EOS)
- ✅ Contract files compiled (WASM: 59,085 bytes, ABI: 5,022 bytes)
- ✅ Network connection established (Jungle4 testnet)
- ❌ Contract deployment pending

## 🔧 Deployment Options

### Option 1: Install EOSIO Software (Recommended)

#### Step 1: Download EOSIO Software
1. Go to: https://github.com/EOSIO/eos/releases
2. Download the latest release for Windows
3. Extract to a folder (e.g., `C:\eosio`)

#### Step 2: Add to PATH
1. Open System Properties → Environment Variables
2. Add `C:\eosio\bin` to your PATH
3. Restart PowerShell

#### Step 3: Deploy Contract
```bash
# Navigate to project directory
cd C:\Users\silas\fusion-cross-chain-bridge

# Deploy contract
cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts\eos fusionbridge.wasm fusionbridge.abi
```

### Option 2: Use EOSIO.CDT Docker with cleos

#### Step 1: Create custom Docker image
```dockerfile
FROM eosio/eosio.cdt:v1.8.1
RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-18.04_amd64.deb
RUN dpkg -i eos_2.1.0-1-ubuntu-18.04_amd64.deb
```

#### Step 2: Build and use custom image
```bash
docker build -t eosio-with-cleos .
docker run --rm -v "C:/temp/eos-deploy:/work" eosio-with-cleos bash -c "cd /work && cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi"
```

### Option 3: Online Deployment Tools

#### EOS Studio (Alternative)
1. Go to: https://eosstudio.io/
2. Create account and connect wallet
3. Upload WASM/ABI files
4. Deploy to quicksnake34 account

#### Bloks.io (Alternative)
1. Go to: https://jungle.bloks.io/
2. Connect wallet
3. Go to Smart Contracts → Deploy Contract
4. Upload files and deploy

## 📁 Contract Files Location
```
C:\Users\silas\fusion-cross-chain-bridge\contracts\eos\
├── fusionbridge.cpp (source)
├── fusionbridge.hpp (header)
├── fusionbridge.wasm (59,085 bytes) ✅
└── fusionbridge.abi (5,022 bytes) ✅
```

## 🔍 Verification Commands

After deployment, verify with:
```bash
# Check contract code
cleos -u https://jungle4.cryptolions.io get code quicksnake34

# Test contract
cleos -u https://jungle4.cryptolions.io push action quicksnake34 getstats '[]' -p quicksnake34
```

## 💰 Cost Estimation
- **RAM**: ~50 EOS (for contract storage)
- **CPU**: ~10 EOS (for deployment transaction)
- **NET**: ~5 EOS (for transaction data)
- **Total**: ~65 EOS (you have 23.6264 EOS available)

## ⚠️ Important Notes
1. **RAM Purchase Required**: You need to buy RAM before deployment
2. **Account Resources**: Ensure sufficient CPU/NET for deployment
3. **Testnet**: This is Jungle4 testnet, not mainnet
4. **Backup**: Keep your private keys secure

## 🆘 Troubleshooting

### "transaction net usage is too high"
- Solution: Use cleos instead of eosjs
- Alternative: Split deployment into smaller transactions

### "cleos: command not found"
- Solution: Install EOSIO software
- Alternative: Use Docker with custom image

### "insufficient RAM"
- Solution: Buy RAM using: `cleos system buyram quicksnake34 quicksnake34 1000000`

## 📞 Support
- EOS Documentation: https://developers.eos.io/
- Jungle Testnet: https://jungletestnet.io/
- EOS Community: https://forums.eoscommunity.org/ 

## 📋 Current Status
- ✅ Environment variables configured
- ✅ Account verified (quicksnake34 with 23.6264 EOS)
- ✅ Contract files compiled (WASM: 59,085 bytes, ABI: 5,022 bytes)
- ✅ Network connection established (Jungle4 testnet)
- ❌ Contract deployment pending

## 🔧 Deployment Options

### Option 1: Install EOSIO Software (Recommended)

#### Step 1: Download EOSIO Software
1. Go to: https://github.com/EOSIO/eos/releases
2. Download the latest release for Windows
3. Extract to a folder (e.g., `C:\eosio`)

#### Step 2: Add to PATH
1. Open System Properties → Environment Variables
2. Add `C:\eosio\bin` to your PATH
3. Restart PowerShell

#### Step 3: Deploy Contract
```bash
# Navigate to project directory
cd C:\Users\silas\fusion-cross-chain-bridge

# Deploy contract
cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts\eos fusionbridge.wasm fusionbridge.abi
```

### Option 2: Use EOSIO.CDT Docker with cleos

#### Step 1: Create custom Docker image
```dockerfile
FROM eosio/eosio.cdt:v1.8.1
RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-18.04_amd64.deb
RUN dpkg -i eos_2.1.0-1-ubuntu-18.04_amd64.deb
```

#### Step 2: Build and use custom image
```bash
docker build -t eosio-with-cleos .
docker run --rm -v "C:/temp/eos-deploy:/work" eosio-with-cleos bash -c "cd /work && cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi"
```

### Option 3: Online Deployment Tools

#### EOS Studio (Alternative)
1. Go to: https://eosstudio.io/
2. Create account and connect wallet
3. Upload WASM/ABI files
4. Deploy to quicksnake34 account

#### Bloks.io (Alternative)
1. Go to: https://jungle.bloks.io/
2. Connect wallet
3. Go to Smart Contracts → Deploy Contract
4. Upload files and deploy

## 📁 Contract Files Location
```
C:\Users\silas\fusion-cross-chain-bridge\contracts\eos\
├── fusionbridge.cpp (source)
├── fusionbridge.hpp (header)
├── fusionbridge.wasm (59,085 bytes) ✅
└── fusionbridge.abi (5,022 bytes) ✅
```

## 🔍 Verification Commands

After deployment, verify with:
```bash
# Check contract code
cleos -u https://jungle4.cryptolions.io get code quicksnake34

# Test contract
cleos -u https://jungle4.cryptolions.io push action quicksnake34 getstats '[]' -p quicksnake34
```

## 💰 Cost Estimation
- **RAM**: ~50 EOS (for contract storage)
- **CPU**: ~10 EOS (for deployment transaction)
- **NET**: ~5 EOS (for transaction data)
- **Total**: ~65 EOS (you have 23.6264 EOS available)

## ⚠️ Important Notes
1. **RAM Purchase Required**: You need to buy RAM before deployment
2. **Account Resources**: Ensure sufficient CPU/NET for deployment
3. **Testnet**: This is Jungle4 testnet, not mainnet
4. **Backup**: Keep your private keys secure

## 🆘 Troubleshooting

### "transaction net usage is too high"
- Solution: Use cleos instead of eosjs
- Alternative: Split deployment into smaller transactions

### "cleos: command not found"
- Solution: Install EOSIO software
- Alternative: Use Docker with custom image

### "insufficient RAM"
- Solution: Buy RAM using: `cleos system buyram quicksnake34 quicksnake34 1000000`

## 📞 Support
- EOS Documentation: https://developers.eos.io/
- Jungle Testnet: https://jungletestnet.io/
- EOS Community: https://forums.eoscommunity.org/ 