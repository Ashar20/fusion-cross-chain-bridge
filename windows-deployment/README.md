# 🚀 Windows EOS Contract Deployment Guide

## 📋 Prerequisites

1. **Install EOSIO.CDT for Windows**
   - Download from: https://github.com/EOSIO/eosio.cdt/releases
   - Install the latest version for Windows x64
   - Add to PATH: `C:\eosio.cdt\bin\`

2. **Install Node.js**
   - Download from: https://nodejs.org/
   - Install LTS version

3. **Install Git for Windows**
   - Download from: https://git-scm.com/download/win

## 🔧 Setup Steps

### Step 1: Open Command Prompt as Administrator
```cmd
# Navigate to the deployment directory
cd C:\path\to\windows-deployment
```

### Step 2: Install Dependencies
```cmd
npm install
```

### Step 3: Compile EOS Contract
```cmd
# Navigate to contracts directory
cd contracts\eos

# Compile the contract
eosio-cpp -o fusionbridge.wasm fusionbridge.cpp

# Generate ABI
eosio-abigen fusionbridge.cpp --output=fusionbridge.abi
```

### Step 4: Deploy Contract
```cmd
# Set contract using cleos (if you have it installed)
cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi

# Or use online tools:
# 1. EOS Studio: http://app.eosstudio.io/guest
# 2. Bloks.io: https://local.bloks.io/
# 3. Cryptolions Explorer: https://jungle4.cryptolions.io/
```

## 🧪 Test Deployment

### Step 5: Test HTLC Creation
```cmd
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
```

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
```
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
```

## 🎯 Next Steps

After successful deployment:
1. Run: `npm run verify-eos`
2. Test with: `npm run real-eos`
3. Start relayer: `npm run start-relayer`

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
