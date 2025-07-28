# 🌴 Manual EOS Contract Deployment Guide

## **Current Status**
- ✅ Docker Desktop installed
- ✅ Docker starting up
- ✅ EOS account verified: `quicksnake34`
- ✅ Account balance: `23.6264 EOS`
- ⏳ Waiting for Docker to fully start

## **🚀 Next Steps**

### **Option 1: Wait for Docker (Recommended)**

1. **Wait for Docker to fully start** (usually takes 1-2 minutes)
2. **Run the deployment script:**
   ```bash
   npm run deploy-eos-docker
   ```

### **Option 2: Manual Docker Commands**

Once Docker is fully started, run these commands manually:

```bash
# 1. Navigate to contract directory
cd contracts/eos/

# 2. Compile contract using Docker
docker run --rm -v $(pwd):/work eosio/eosio.cdt:v1.8.1 eosio-cpp -o fusionbridge.wasm fusionbridge.cpp

# 3. Generate ABI using Docker
docker run --rm -v $(pwd):/work eosio/eosio.cdt:v1.8.1 eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi

# 4. Deploy contract code
docker run --rm -v $(pwd):/work eosio/eosio.cdt:v1.8.1 cleos -u https://jungle4.cryptolions.io set code quicksnake34 /work/fusionbridge.wasm

# 5. Deploy contract ABI
docker run --rm -v $(pwd):/work eosio/eosio.cdt:v1.8.1 cleos -u https://jungle4.cryptolions.io set abi quicksnake34 /work/fusionbridge.abi

# 6. Test deployment
docker run --rm -v $(pwd):/work eosio/eosio.cdt:v1.8.1 cleos -u https://jungle4.cryptolions.io get code quicksnake34
```

### **Option 3: Online Compilation**

If Docker continues to have issues:

1. **Visit**: https://jungle4.cryptolions.io/
2. **Upload**: `contracts/eos/fusionbridge.cpp`
3. **Compile online** and download WASM/ABI files
4. **Deploy manually** using the commands above

## **🧪 Testing After Deployment**

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
docker run --rm -v $(pwd):/work eosio/eosio.cdt:v1.8.1 cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc \
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

## **🎯 Expected Results**

After successful deployment:
- ✅ Contract code deployed
- ✅ Contract ABI deployed
- ✅ Test HTLC created
- ✅ Real EOS integration working
- ✅ 100% real cross-chain swaps

## **🚨 Troubleshooting**

### **Docker Issues:**
- **Wait longer**: Docker can take 2-3 minutes to fully start
- **Restart Docker**: Quit and restart Docker Desktop
- **Use online compiler**: Alternative if Docker continues to fail

### **Deployment Issues:**
- **Check account balance**: Ensure sufficient EOS for deployment
- **Check network**: Verify Jungle4 testnet connectivity
- **Check permissions**: Ensure account has proper permissions

## **🎉 Success Indicators**

When deployment is complete:
1. **Contract Code**: Non-zero code hash
2. **Contract ABI**: Actions and tables present
3. **Test HTLC**: Successfully created
4. **Real Integration**: Working without simulation
5. **Cross-chain Swaps**: 100% real on both chains

**Your cross-chain bridge will be completely real on both ETH and EOS!** 🚀 