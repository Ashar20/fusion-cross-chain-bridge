# 🚀 EOS Contract Deployment Guide

## 📋 Contract Files Ready

✅ **WASM File**: `docker-eos-deployment/output/fusionbridge.wasm` (59KB)
✅ **ABI File**: `docker-eos-deployment/output/fusionbridge.abi` (5KB)

## 🎯 Deployment Options

### Option 1: EOS Studio (Recommended)
1. Go to: http://app.eosstudio.io/guest
2. Click "Deploy Contract"
3. Upload `fusionbridge.wasm` file
4. Copy and paste the ABI content below
5. Deploy to account: `quicksnake34`

### Option 2: Bloks.io
1. Go to: https://local.bloks.io/
2. Connect to Jungle4 testnet
3. Navigate to Smart Contracts
4. Upload WASM and ABI files
5. Deploy to account: `quicksnake34`

### Option 3: Cryptolions Explorer
1. Go to: https://jungle4.cryptolions.io/
2. Use the contract deployment interface
3. Upload files and deploy

## 📄 ABI Content (Copy This)

```json
{
    "____comment": "This file was generated with eosio-abigen. DO NOT EDIT ",
    "version": "eosio::abi/1.2",
    "types": [],
    "structs": [
        {
            "name": "claimhtlc",
            "base": "",
            "fields": [
                {
                    "name": "htlc_id",
                    "type": "uint64"
                },
                {
                    "name": "secret",
                    "type": "checksum256"
                },
                {
                    "name": "claimer",
                    "type": "name"
                }
            ]
        },
        {
            "name": "cleanup",
            "base": "",
            "fields": [
                {
                    "name": "limit",
                    "type": "uint64"
                }
            ]
        },
        {
            "name": "createhtlc",
            "base": "",
            "fields": [
                {
                    "name": "sender",
                    "type": "name"
                },
                {
                    "name": "recipient",
                    "type": "name"
                },
                {
                    "name": "amount",
                    "type": "asset"
                },
                {
                    "name": "hashlock",
                    "type": "checksum256"
                },
                {
                    "name": "timelock",
                    "type": "uint32"
                },
                {
                    "name": "memo",
                    "type": "string"
                },
                {
                    "name": "eth_tx_hash",
                    "type": "string"
                }
            ]
        },
        {
            "name": "gethtlc",
            "base": "",
            "fields": [
                {
                    "name": "htlc_id",
                    "type": "uint64"
                }
            ]
        },
        {
            "name": "getstats",
            "base": "",
            "fields": []
        },
        {
            "name": "htlc",
            "base": "",
            "fields": [
                {
                    "name": "id",
                    "type": "uint64"
                },
                {
                    "name": "sender",
                    "type": "name"
                },
                {
                    "name": "recipient",
                    "type": "name"
                },
                {
                    "name": "amount",
                    "type": "asset"
                },
                {
                    "name": "hashlock",
                    "type": "checksum256"
                },
                {
                    "name": "timelock",
                    "type": "uint32"
                },
                {
                    "name": "claimed",
                    "type": "bool"
                },
                {
                    "name": "refunded",
                    "type": "bool"
                },
                {
                    "name": "memo",
                    "type": "string"
                },
                {
                    "name": "eth_tx_hash",
                    "type": "string"
                },
                {
                    "name": "secret_hash",
                    "type": "checksum256"
                },
                {
                    "name": "created_at",
                    "type": "uint32"
                }
            ]
        },
        {
            "name": "refundhtlc",
            "base": "",
            "fields": [
                {
                    "name": "htlc_id",
                    "type": "uint64"
                },
                {
                    "name": "refunder",
                    "type": "name"
                }
            ]
        }
    ],
    "actions": [
        {
            "name": "claimhtlc",
            "type": "claimhtlc",
            "ricardian_contract": ""
        },
        {
            "name": "cleanup",
            "type": "cleanup",
            "ricardian_contract": ""
        },
        {
            "name": "createhtlc",
            "type": "createhtlc",
            "ricardian_contract": ""
        },
        {
            "name": "gethtlc",
            "type": "gethtlc",
            "ricardian_contract": ""
        },
        {
            "name": "getstats",
            "type": "getstats",
            "ricardian_contract": ""
        },
        {
            "name": "refundhtlc",
            "type": "refundhtlc",
            "ricardian_contract": ""
        }
    ],
    "tables": [
        {
            "name": "htlcs",
            "type": "htlc",
            "index_type": "i64",
            "key_names": [],
            "key_types": []
        }
    ],
    "kv_tables": {},
    "ricardian_clauses": [],
    "variants": [],
    "action_results": [
        {
            "name": "gethtlc",
            "result_type": "htlc"
        }
    ]
}
```

## 🎉 After Deployment

Once deployed, your relayer will be able to create real EOS HTLCs! The contract supports:

- ✅ **createhtlc**: Create new HTLC
- ✅ **claimhtlc**: Claim HTLC with secret
- ✅ **refundhtlc**: Refund expired HTLC
- ✅ **gethtlc**: Query HTLC details
- ✅ **getstats**: Get contract statistics

## 🔗 Test Commands

After deployment, test with:

```bash
# Create HTLC
cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{"sender":"quicksnake34","recipient":"quicksnake34","amount":"0.1000 EOS","hashlock":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","timelock":1735689600,"memo":"Test HTLC","eth_tx_hash":"0x0000000000000000000000000000000000000000000000000000000000000000"}' -p quicksnake34@active

# Get HTLC details
cleos -u https://jungle4.cryptolions.io push action quicksnake34 gethtlc '{"htlc_id":1}' -p quicksnake34@active

# Get stats
cleos -u https://jungle4.cryptolions.io push action quicksnake34 getstats '{}' -p quicksnake34@active
```

## 🚀 Next Steps

1. Deploy the contract using one of the online tools above
2. Update the relayer configuration with the deployed contract address
3. Test the full cross-chain swap flow
4. Start the relayer service for automatic HTLC creation

## 🔍 Verification

After deployment, verify with:

```bash
npm run verify-eos
```

This will check if the contract is properly deployed and functional. 
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
            "ricardian_contract": ""
        },
        {
            "name": "refundhtlc",
            "type": "refundhtlc",
            "ricardian_contract": ""
        }
    ],
    "tables": [
        {
            "name": "htlcs",
            "type": "htlc",
            "index_type": "i64",
            "key_names": [],
            "key_types": []
        }
    ],
    "kv_tables": {},
    "ricardian_clauses": [],
    "variants": [],
    "action_results": [
        {
            "name": "gethtlc",
            "result_type": "htlc"
        }
    ]
}
```

## 🎉 After Deployment

Once deployed, your relayer will be able to create real EOS HTLCs! The contract supports:

- ✅ **createhtlc**: Create new HTLC
- ✅ **claimhtlc**: Claim HTLC with secret
- ✅ **refundhtlc**: Refund expired HTLC
- ✅ **gethtlc**: Query HTLC details
- ✅ **getstats**: Get contract statistics

## 🔗 Test Commands

After deployment, test with:

```bash
# Create HTLC
cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{"sender":"quicksnake34","recipient":"quicksnake34","amount":"0.1000 EOS","hashlock":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","timelock":1735689600,"memo":"Test HTLC","eth_tx_hash":"0x0000000000000000000000000000000000000000000000000000000000000000"}' -p quicksnake34@active

# Get HTLC details
cleos -u https://jungle4.cryptolions.io push action quicksnake34 gethtlc '{"htlc_id":1}' -p quicksnake34@active

# Get stats
cleos -u https://jungle4.cryptolions.io push action quicksnake34 getstats '{}' -p quicksnake34@active
```

## 🚀 Next Steps

1. Deploy the contract using one of the online tools above
2. Update the relayer configuration with the deployed contract address
3. Test the full cross-chain swap flow
4. Start the relayer service for automatic HTLC creation

## 🔍 Verification

After deployment, verify with:

```bash
npm run verify-eos
```

This will check if the contract is properly deployed and functional. 