# 🚀 EOS Contract Deployment Guide

## 📋 Contract Files Ready

✅ **WASM File**: `output/fusionbridge.wasm` (59KB)
✅ **ABI File**: `output/fusionbridge.abi` (5KB)

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
 

## 📋 Contract Files Ready

✅ **WASM File**: `output/fusionbridge.wasm` (59KB)
✅ **ABI File**: `output/fusionbridge.abi` (5KB)

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