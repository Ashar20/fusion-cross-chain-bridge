# 🌐 Online EOS Contract Deployment Guide

## **📋 Prerequisites**
- ✅ EOS account: `quicksnake34`
- ✅ Private key: `5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN`
- ✅ Account balance: `23.6264 EOS`
- ✅ Compiled WASM: `59,085 bytes`
- ✅ Compiled ABI: `5,022 bytes`
- ✅ Network: Jungle4 Testnet

## **🚀 Step-by-Step Online Deployment**

### **Step 1: Access Jungle4 Testnet Explorer**

1. **Open your browser** and go to: https://jungle4.cryptolions.io/
2. **Click on "Tools"** or look for "Contract Deployment" section
3. **Select "Deploy Contract"** or "Smart Contract" option

### **Step 2: Connect Your Account**

1. **Click "Connect Wallet"** or "Import Account"
2. **Enter your account details:**
   - Account Name: `quicksnake34`
   - Private Key: `5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN`
3. **Click "Connect"** or "Import"

### **Step 3: Upload Contract Files**

1. **Upload WASM File:**
   - Click "Upload WASM" or "Choose File"
   - Select: `contracts/eos/fusionbridge.wasm`
   - File size should be: `59,085 bytes`

2. **Upload ABI File:**
   - Click "Upload ABI" or "Choose File"
   - Select: `contracts/eos/fusionbridge.abi`
   - File size should be: `5,022 bytes`

### **Step 4: Deploy Contract**

1. **Set Contract Account:**
   - Contract Account: `quicksnake34`
   - This will deploy the contract to your account

2. **Review Deployment:**
   - Verify WASM file is loaded
   - Verify ABI file is loaded
   - Check account permissions

3. **Click "Deploy"** or "Set Contract"

### **Step 5: Verify Deployment**

1. **Check Contract Code:**
   - Go to: https://jungle4.cryptolions.io/account/quicksnake34
   - Look for "Contract" section
   - Should show non-zero code hash

2. **Check Contract ABI:**
   - Look for "Actions" section
   - Should show: `createhtlc`, `claimhtlc`, `refundhtlc`, etc.

## **🧪 Test Contract Deployment**

### **Test 1: Create HTLC**

1. **Go to "Actions" tab**
2. **Select "createhtlc" action**
3. **Fill in test parameters:**
   ```json
   {
     "sender": "quicksnake34",
     "recipient": "quicksnake34",
     "amount": "0.1000 EOS",
     "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
     "timelock": 1234567890,
     "memo": "Test HTLC",
     "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
   }
   ```
4. **Click "Execute"**

### **Test 2: Check HTLC Table**

1. **Go to "Tables" tab**
2. **Select "htlcs" table**
3. **Click "Query"**
4. **Should show the created HTLC**

## **🔗 Alternative Online Tools**

### **Option 1: EOS Authority**
- URL: https://eosauthority.com/
- Features: Contract deployment, ABI management
- Network: Jungle4 Testnet

### **Option 2: Bloks.io**
- URL: https://jungle4.bloks.io/
- Features: Full blockchain explorer with deployment tools
- Network: Jungle4 Testnet

### **Option 3: EOSX**
- URL: https://jungle4.eosx.io/
- Features: Contract deployment and management
- Network: Jungle4 Testnet

## **📱 Mobile Deployment (Anchor Wallet)**

### **Step 1: Install Anchor Wallet**
1. Download from App Store/Google Play
2. Create new wallet or import existing

### **Step 2: Import Account**
1. **Add Account** → **Import Existing**
2. **Enter account details:**
   - Account Name: `quicksnake34`
   - Private Key: `5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN`

### **Step 3: Deploy Contract**
1. **Go to "Tools"** → **"Smart Contracts"**
2. **Upload WASM and ABI files**
3. **Deploy to account**

## **🔍 Verification Commands**

After deployment, verify using these curl commands:

### **Check Contract Code:**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_code \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

### **Check Contract ABI:**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_abi \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

### **Check HTLC Table:**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_table_rows \
  -H "Content-Type: application/json" \
  -d '{"json":true,"code":"quicksnake34","scope":"quicksnake34","table":"htlcs","limit":10}'
```

## **🎯 Success Indicators**

✅ **Contract Deployed Successfully When:**
- Code hash is NOT `0000000000000000000000000000000000000000000000000000000000000000`
- ABI shows all actions: `createhtlc`, `claimhtlc`, `refundhtlc`, `gethtlc`, `getstats`, `cleanup`
- Tables show: `htlcs` table
- Test HTLC creation succeeds

## **🔧 Post-Deployment Setup**

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

## **🚨 Troubleshooting**

### **Deployment Fails:**
- **Check account balance**: Ensure sufficient EOS for deployment
- **Check permissions**: Account must have proper permissions
- **Verify files**: Ensure WASM and ABI files are valid

### **Contract Not Found:**
- **Wait for confirmation**: Deployment may take a few minutes
- **Check transaction**: Look for deployment transaction in account history
- **Refresh page**: Sometimes explorer needs refresh

### **Test HTLC Fails:**
- **Check RAM**: Ensure sufficient RAM for table operations
- **Check CPU/NET**: Ensure sufficient resources for transaction
- **Verify parameters**: Ensure all parameters are correct format

## **🎉 Expected Results**

After successful deployment:
- ✅ Contract code deployed to `quicksnake34`
- ✅ Contract ABI deployed with all actions
- ✅ Test HTLC creation successful
- ✅ Real EOS integration working
- ✅ 100% real cross-chain swaps

**Your cross-chain bridge will be completely real on both ETH and EOS!** 🚀 
 

## **📋 Prerequisites**
- ✅ EOS account: `quicksnake34`
- ✅ Private key: `5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN`
- ✅ Account balance: `23.6264 EOS`
- ✅ Compiled WASM: `59,085 bytes`
- ✅ Compiled ABI: `5,022 bytes`
- ✅ Network: Jungle4 Testnet

## **🚀 Step-by-Step Online Deployment**

### **Step 1: Access Jungle4 Testnet Explorer**

1. **Open your browser** and go to: https://jungle4.cryptolions.io/
2. **Click on "Tools"** or look for "Contract Deployment" section
3. **Select "Deploy Contract"** or "Smart Contract" option

### **Step 2: Connect Your Account**

1. **Click "Connect Wallet"** or "Import Account"
2. **Enter your account details:**
   - Account Name: `quicksnake34`
   - Private Key: `5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN`
3. **Click "Connect"** or "Import"

### **Step 3: Upload Contract Files**

1. **Upload WASM File:**
   - Click "Upload WASM" or "Choose File"
   - Select: `contracts/eos/fusionbridge.wasm`
   - File size should be: `59,085 bytes`

2. **Upload ABI File:**
   - Click "Upload ABI" or "Choose File"
   - Select: `contracts/eos/fusionbridge.abi`
   - File size should be: `5,022 bytes`

### **Step 4: Deploy Contract**

1. **Set Contract Account:**
   - Contract Account: `quicksnake34`
   - This will deploy the contract to your account

2. **Review Deployment:**
   - Verify WASM file is loaded
   - Verify ABI file is loaded
   - Check account permissions

3. **Click "Deploy"** or "Set Contract"

### **Step 5: Verify Deployment**

1. **Check Contract Code:**
   - Go to: https://jungle4.cryptolions.io/account/quicksnake34
   - Look for "Contract" section
   - Should show non-zero code hash

2. **Check Contract ABI:**
   - Look for "Actions" section
   - Should show: `createhtlc`, `claimhtlc`, `refundhtlc`, etc.

## **🧪 Test Contract Deployment**

### **Test 1: Create HTLC**

1. **Go to "Actions" tab**
2. **Select "createhtlc" action**
3. **Fill in test parameters:**
   ```json
   {
     "sender": "quicksnake34",
     "recipient": "quicksnake34",
     "amount": "0.1000 EOS",
     "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
     "timelock": 1234567890,
     "memo": "Test HTLC",
     "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
   }
   ```
4. **Click "Execute"**

### **Test 2: Check HTLC Table**

1. **Go to "Tables" tab**
2. **Select "htlcs" table**
3. **Click "Query"**
4. **Should show the created HTLC**

## **🔗 Alternative Online Tools**

### **Option 1: EOS Authority**
- URL: https://eosauthority.com/
- Features: Contract deployment, ABI management
- Network: Jungle4 Testnet

### **Option 2: Bloks.io**
- URL: https://jungle4.bloks.io/
- Features: Full blockchain explorer with deployment tools
- Network: Jungle4 Testnet

### **Option 3: EOSX**
- URL: https://jungle4.eosx.io/
- Features: Contract deployment and management
- Network: Jungle4 Testnet

## **📱 Mobile Deployment (Anchor Wallet)**

### **Step 1: Install Anchor Wallet**
1. Download from App Store/Google Play
2. Create new wallet or import existing

### **Step 2: Import Account**
1. **Add Account** → **Import Existing**
2. **Enter account details:**
   - Account Name: `quicksnake34`
   - Private Key: `5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN`

### **Step 3: Deploy Contract**
1. **Go to "Tools"** → **"Smart Contracts"**
2. **Upload WASM and ABI files**
3. **Deploy to account**

## **🔍 Verification Commands**

After deployment, verify using these curl commands:

### **Check Contract Code:**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_code \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

### **Check Contract ABI:**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_abi \
  -H "Content-Type: application/json" \
  -d '{"account_name":"quicksnake34"}'
```

### **Check HTLC Table:**
```bash
curl -X POST https://jungle4.cryptolions.io/v1/chain/get_table_rows \
  -H "Content-Type: application/json" \
  -d '{"json":true,"code":"quicksnake34","scope":"quicksnake34","table":"htlcs","limit":10}'
```

## **🎯 Success Indicators**

✅ **Contract Deployed Successfully When:**
- Code hash is NOT `0000000000000000000000000000000000000000000000000000000000000000`
- ABI shows all actions: `createhtlc`, `claimhtlc`, `refundhtlc`, `gethtlc`, `getstats`, `cleanup`
- Tables show: `htlcs` table
- Test HTLC creation succeeds

## **🔧 Post-Deployment Setup**

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

## **🚨 Troubleshooting**

### **Deployment Fails:**
- **Check account balance**: Ensure sufficient EOS for deployment
- **Check permissions**: Account must have proper permissions
- **Verify files**: Ensure WASM and ABI files are valid

### **Contract Not Found:**
- **Wait for confirmation**: Deployment may take a few minutes
- **Check transaction**: Look for deployment transaction in account history
- **Refresh page**: Sometimes explorer needs refresh

### **Test HTLC Fails:**
- **Check RAM**: Ensure sufficient RAM for table operations
- **Check CPU/NET**: Ensure sufficient resources for transaction
- **Verify parameters**: Ensure all parameters are correct format

## **🎉 Expected Results**

After successful deployment:
- ✅ Contract code deployed to `quicksnake34`
- ✅ Contract ABI deployed with all actions
- ✅ Test HTLC creation successful
- ✅ Real EOS integration working
- ✅ 100% real cross-chain swaps

**Your cross-chain bridge will be completely real on both ETH and EOS!** 🚀 