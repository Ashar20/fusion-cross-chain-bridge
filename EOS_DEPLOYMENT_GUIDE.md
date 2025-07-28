# 🌴 EOS Contract Deployment Guide

## **Overview**
This guide will help you deploy the fusionbridge contract to EOS Jungle4 testnet using your account `quicksnake34`.

## **🔧 Prerequisites**

### **Account Information**
- **Account**: `quicksnake34`
- **Private Key**: `5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN`
- **Balance**: `23.6264 EOS` ✅
- **Network**: Jungle4 Testnet

## **🚀 Deployment Options**

### **Option 1: Using Docker (Recommended for Apple Silicon)**

#### **1. Install Docker Desktop**
```bash
# Download and install Docker Desktop
# https://www.docker.com/products/docker-desktop
```

#### **2. Run Docker Deployment**
```bash
# Add to package.json and run
npm run deploy-eos-docker
```

### **Option 2: Manual Compilation (Intel Mac)**

#### **1. Install EOSIO.CDT**
```bash
# For Intel Mac
brew install eosio

# For Apple Silicon (M1/M2) - Use Docker instead
```

#### **2. Compile Contract**
```bash
cd contracts/eos/
eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi
```

#### **3. Deploy Contract**
```bash
# Deploy contract code
cleos -u https://jungle4.cryptolions.io set code quicksnake34 fusionbridge.wasm

# Deploy contract ABI
cleos -u https://jungle4.cryptolions.io set abi quicksnake34 fusionbridge.abi
```

### **Option 3: Online Compilation**

#### **1. Use Online Compiler**
1. Visit: https://jungle4.cryptolions.io/
2. Upload: `contracts/eos/fusionbridge.cpp`
3. Compile online
4. Download WASM and ABI files

#### **2. Deploy Downloaded Files**
```bash
# Deploy contract code
cleos -u https://jungle4.cryptolions.io set code quicksnake34 fusionbridge.wasm

# Deploy contract ABI
cleos -u https://jungle4.cryptolions.io set abi quicksnake34 fusionbridge.abi
```

## **🧪 Testing Deployment**

### **1. Check Contract Code**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_code \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

### **2. Check Contract ABI**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_abi \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

### **3. Create Test HTLC**
```bash
cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc \
  '["quicksnake34", "quicksnake34", "0.1000 EOS", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", 1234567890, "Test HTLC", "0x0000000000000000000000000000000000000000000000000000000000000000"]' \
  -p quicksnake34@active
```

## **🔗 Integration Steps**

### **1. Update Environment Variables**
Add to your `.env` file:
```bash
EOS_PRIVATE_KEY=5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN
EOS_ACCOUNT_NAME=quicksnake34
EOS_NETWORK=jungle4
EOS_RPC_URL=https://jungle4.cryptolions.io
```

### **2. Test Real EOS Integration**
```bash
npm run real-eos
```

### **3. Start Relayer with Real EOS**
```bash
npm run start-relayer
```

### **4. Test Bidirectional Swaps**
```bash
npm run bidirectional
```

## **📋 Quick Commands**

### **For Docker Users:**
```bash
# 1. Install Docker Desktop
# 2. Run deployment
npm run deploy-eos-docker
```

### **For Manual Users:**
```bash
# 1. Install EOSIO.CDT (Intel Mac only)
brew install eosio

# 2. Compile contract
cd contracts/eos/
eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi

# 3. Deploy contract
cleos -u https://jungle4.cryptolions.io set code quicksnake34 fusionbridge.wasm
cleos -u https://jungle4.cryptolions.io set abi quicksnake34 fusionbridge.abi

# 4. Test deployment
cleos -u https://jungle4.cryptolions.io get code quicksnake34
```

## **🎯 Expected Results**

### **After Successful Deployment:**
- ✅ Contract code deployed
- ✅ Contract ABI deployed
- ✅ Test HTLC created
- ✅ Real EOS integration working
- ✅ 100% real cross-chain swaps

### **Verification Commands:**
```bash
# Check account balance
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_currency_balance \
  -H "Content-Type: application/json" \
  -d '{"code":"eosio.token","account":"quicksnake34","symbol":"EOS"}'

# Check contract code
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_code \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

## **🚨 Troubleshooting**

### **Common Issues:**

#### **1. EOSIO.CDT Installation Failed**
- **Solution**: Use Docker or online compiler
- **Alternative**: Install manually from GitHub

#### **2. Compilation Errors**
- **Solution**: Check C++ syntax in `fusionbridge.cpp`
- **Alternative**: Use pre-compiled files

#### **3. Deployment Failed**
- **Solution**: Check account permissions and balance
- **Alternative**: Use different account

#### **4. Contract Not Found**
- **Solution**: Verify deployment commands
- **Alternative**: Check network connectivity

## **🎉 Success Indicators**

### **When Deployment is Complete:**
1. **Contract Code**: Non-zero code hash
2. **Contract ABI**: Actions and tables present
3. **Test HTLC**: Successfully created
4. **Real Integration**: Working without simulation
5. **Cross-chain Swaps**: 100% real on both chains

### **Final Status:**
- **ETH Side**: 100% real ✅
- **EOS Side**: 100% real ✅
- **Relayer**: 100% real ✅
- **Cross-chain**: 100% real ✅

**Your cross-chain bridge will be completely real on both ETH and EOS!** 🚀 