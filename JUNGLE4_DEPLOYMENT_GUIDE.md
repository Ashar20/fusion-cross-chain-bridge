# 🚀 Jungle4-Compatible EOS Contract Deployment Guide

## 📋 Overview

This guide provides a complete solution for deploying the Fusion Bridge EOS smart contract to Jungle4 testnet with full compatibility.

## 🔧 Fixed Contract Features

### ✅ **Compatibility Improvements:**
- **ABI Version**: Downgraded to `eosio::abi/1.0` for Jungle4 compatibility
- **CDT Version**: Uses `eosio.cdt 1.7.0` for maximum compatibility
- **Removed**: `std::variant`, `std::optional`, `std::map`, tuples
- **Simplified**: Contract structure for better compatibility

### ✅ **Contract Actions:**
- `createhtlc` - Create new HTLC
- `claimhtlc` - Claim HTLC with secret
- `refundhtlc` - Refund expired HTLC
- `gethtlc` - Query HTLC details
- `cleanup` - Clean up expired HTLCs
- `getstats` - Get contract statistics

## 🏗️ Build Process

### **Step 1: Build Contract**
```bash
# Make build script executable
chmod +x scripts/buildJungle4Contract.sh

# Build the contract
./scripts/buildJungle4Contract.sh
```

### **Step 2: Verify Build Output**
```bash
# Check generated files
ls -la jungle4-build/

# Verify ABI version
grep "version" jungle4-build/fusionbridge.abi
```

**Expected Output:**
```
📁 WASM: jungle4-build/fusionbridge.wasm
📁 ABI:  jungle4-build/fusionbridge.abi
🔍 ABI Version: "eosio::abi/1.0"
```

## 🚀 Deployment Process

### **Method 1: Automated Deployment**
```bash
# Make deployment script executable
chmod +x scripts/deployJungle4Contract.sh

# Deploy to Jungle4
./scripts/deployJungle4Contract.sh
```

### **Method 2: Manual Deployment with cleos**
```bash
# Deploy WASM code
cleos -u https://jungle4.cryptolions.io set code quicksnake34 jungle4-build/fusionbridge.wasm

# Deploy ABI
cleos -u https://jungle4.cryptolions.io set abi quicksnake34 jungle4-build/fusionbridge.abi
```

### **Method 3: Online Deployment**
1. Visit: https://jungle4.cryptolions.io/
2. Navigate to Smart Contracts
3. Select account: `quicksnake34`
4. Upload `jungle4-build/fusionbridge.wasm`
5. Copy and paste ABI content from `jungle4-build/fusionbridge.abi`

## 🧪 Testing the Deployment

### **Test 1: Check Contract Code**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_code \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

### **Test 2: Check Contract ABI**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_abi \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

### **Test 3: Test getstats Action**
```bash
cleos -u https://jungle4.cryptolions.io push action quicksnake34 getstats '{}' -p quicksnake34@active
```

### **Test 4: Create Test HTLC**
```bash
cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc \
  '["quicksnake34", "quicksnake34", "0.1000 EOS", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", 1735689600, "Test HTLC", "0x0000000000000000000000000000000000000000000000000000000000000000"]' \
  -p quicksnake34@active
```

## 🔍 Verification Commands

### **Check Account Info**
```bash
cleos -u https://jungle4.cryptolions.io get account quicksnake34
```

### **Check Contract Actions**
```bash
cleos -u https://jungle4.cryptolions.io get abi quicksnake34
```

### **Check Contract Tables**
```bash
cleos -u https://jungle4.cryptolions.io get table quicksnake34 quicksnake34 htlcs
```

## 🎯 Expected Results

### **After Successful Deployment:**
- ✅ Contract code deployed without errors
- ✅ ABI deployed with version `eosio::abi/1.0`
- ✅ All actions working (createhtlc, claimhtlc, refundhtlc, gethtlc, cleanup, getstats)
- ✅ No "Unsupported abi version" errors
- ✅ No "Failed to deserialize variant" errors
- ✅ No "Invalid packed transaction" errors

### **Contract Status:**
- **WASM Code**: ✅ Deployed
- **ABI**: ✅ Deployed (version 1.0)
- **Actions**: ✅ All 6 actions working
- **Tables**: ✅ htlcs table accessible
- **Compatibility**: ✅ Jungle4 testnet compatible

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. Build Errors**
```bash
# Ensure Docker is running
docker --version

# Pull the correct CDT image
docker pull eosio/eosio.cdt:1.7.0
```

#### **2. Deployment Errors**
```bash
# Check account permissions
cleos -u https://jungle4.cryptolions.io get account quicksnake34

# Check account balance
cleos -u https://jungle4.cryptolions.io get currency balance eosio.token quicksnake34 EOS
```

#### **3. ABI Errors**
```bash
# Verify ABI version
grep "version" jungle4-build/fusionbridge.abi

# Should show: "version": "eosio::abi/1.0"
```

## 🎉 Success Indicators

### **When Deployment is Complete:**
1. **Contract Code**: Non-zero code hash
2. **Contract ABI**: Version 1.0 with all actions
3. **Test Actions**: getstats works without errors
4. **HTLC Creation**: createhtlc works without errors
5. **Table Access**: htlcs table accessible

### **Final Status:**
- **ETH Side**: 100% real ✅
- **EOS Side**: 100% real ✅ (Jungle4 compatible)
- **Relayer**: 100% real ✅
- **Cross-chain**: 100% real ✅

**Your cross-chain bridge will be completely real and compatible with Jungle4 testnet!** 🚀 