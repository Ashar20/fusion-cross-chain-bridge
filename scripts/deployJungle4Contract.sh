#!/bin/bash

# Deployment script for Jungle4-compatible EOS contract

set -e

echo "🚀 Deploying Jungle4-compatible EOS contract..."
echo "============================================================"

# Configuration
CONTRACT_NAME="fusionbridge"
ACCOUNT_NAME="quicksnake34"
NETWORK="jungle4"
RPC_URL="https://jungle4.cryptolions.io"
BUILD_DIR="jungle4-build"

# Check if build files exist
if [ ! -f "$BUILD_DIR/$CONTRACT_NAME.wasm" ]; then
    echo "❌ WASM file not found: $BUILD_DIR/$CONTRACT_NAME.wasm"
    echo "🔧 Please run the build script first: ./scripts/buildJungle4Contract.sh"
    exit 1
fi

if [ ! -f "$BUILD_DIR/$CONTRACT_NAME.abi" ]; then
    echo "❌ ABI file not found: $BUILD_DIR/$CONTRACT_NAME.abi"
    echo "🔧 Please run the build script first: ./scripts/buildJungle4Contract.sh"
    exit 1
fi

echo "📁 Contract: $CONTRACT_NAME"
echo "📁 Account: $ACCOUNT_NAME"
echo "🌐 Network: $NETWORK"
echo "🔗 RPC: $RPC_URL"
echo ""

# Check account balance
echo "💰 Checking account balance..."
BALANCE=$(curl -s -X POST $RPC_URL/v1/chain/get_currency_balance \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"eosio.token\",\"account\":\"$ACCOUNT_NAME\",\"symbol\":\"EOS\"}" | jq -r '.[0]')

if [ "$BALANCE" = "null" ] || [ -z "$BALANCE" ]; then
    echo "❌ Could not retrieve account balance"
else
    echo "✅ Account balance: $BALANCE"
fi

echo ""

# Deploy WASM code
echo "📦 Deploying WASM code..."
WASM_RESULT=$(curl -s -X POST $RPC_URL/v1/chain/push_transaction \
    -H "Content-Type: application/json" \
    -d "{
        \"signatures\": [],
        \"compression\": \"none\",
        \"packed_context_free_data\": \"\",
        \"packed_trx\": \"\",
        \"transaction\": {
            \"delay_sec\": 0,
            \"max_cpu_usage_ms\": 0,
            \"max_net_usage_words\": 0,
            \"actions\": [{
                \"account\": \"eosio\",
                \"name\": \"setcode\",
                \"authorization\": [{\"actor\": \"$ACCOUNT_NAME\", \"permission\": \"active\"}],
                \"data\": {
                    \"account\": \"$ACCOUNT_NAME\",
                    \"vmtype\": 0,
                    \"vmversion\": 0,
                    \"code\": \"$(base64 -w 0 $BUILD_DIR/$CONTRACT_NAME.wasm)\"
                }
            }]
        }
    }")

echo "📋 WASM deployment result: $WASM_RESULT"

# Deploy ABI
echo ""
echo "📄 Deploying ABI..."
ABI_CONTENT=$(cat $BUILD_DIR/$CONTRACT_NAME.abi)
ABI_RESULT=$(curl -s -X POST $RPC_URL/v1/chain/push_transaction \
    -H "Content-Type: application/json" \
    -d "{
        \"signatures\": [],
        \"compression\": \"none\",
        \"packed_context_free_data\": \"\",
        \"packed_trx\": \"\",
        \"transaction\": {
            \"delay_sec\": 0,
            \"max_cpu_usage_ms\": 0,
            \"max_net_usage_words\": 0,
            \"actions\": [{
                \"account\": \"eosio\",
                \"name\": \"setabi\",
                \"authorization\": [{\"actor\": \"$ACCOUNT_NAME\", \"permission\": \"active\"}],
                \"data\": {
                    \"account\": \"$ACCOUNT_NAME\",
                    \"abi\": \"$ABI_CONTENT\"
                }
            }]
        }
    }")

echo "📋 ABI deployment result: $ABI_RESULT"

echo ""
echo "🎉 Deployment completed!"
echo "============================================================"
echo "📁 Contract: $CONTRACT_NAME"
echo "📁 Account: $ACCOUNT_NAME"
echo "🌐 Network: $NETWORK"
echo "🔗 Explorer: https://jungle4.greymass.com/account/$ACCOUNT_NAME"
echo ""
echo "🧪 Test commands:"
echo "cleos -u $RPC_URL push action $ACCOUNT_NAME getstats '{}' -p $ACCOUNT_NAME@active"
echo "cleos -u $RPC_URL get code $ACCOUNT_NAME"
echo "cleos -u $RPC_URL get abi $ACCOUNT_NAME"
echo "" 