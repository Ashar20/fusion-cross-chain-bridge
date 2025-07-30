#!/bin/bash
# Jungle4 Deployment Script

echo "🚀 Deploying to Jungle4 testnet..."

# Deploy WASM code
cleos -u https://jungle4.cryptolions.io set code quicksnake34 fusionbridge.wasm

# Deploy ABI
cleos -u https://jungle4.cryptolions.io set abi quicksnake34 fusionbridge.abi

echo "✅ Deployment complete!"
echo "🧪 Test with: cleos -u https://jungle4.cryptolions.io push action quicksnake34 getstats '{}' -p quicksnake34@active"
