#!/bin/bash
echo "🚀 Deploying EOS Contract to Jungle4..."

# Check if compiled files exist
if [ ! -f "output/fusionbridge.wasm" ] || [ ! -f "output/fusionbridge.abi" ]; then
    echo "❌ Compiled files not found! Run compile.sh first."
    exit 1
fi

echo "📋 Deploying contract to quicksnake34 account..."
echo "🔗 Using Jungle4 testnet: https://jungle4.cryptolions.io"

# Note: This requires cleos to be installed locally or use online tools
echo "💡 Deployment options:"
echo "1. Use online tools:"
echo "   - EOS Studio: http://app.eosstudio.io/guest"
echo "   - Bloks.io: https://local.bloks.io/"
echo "2. Install cleos locally and run:"
echo "   cleos -u https://jungle4.cryptolions.io set contract quicksnake34 output/ fusionbridge.wasm fusionbridge.abi"

echo "📁 Files ready for deployment:"
ls -la output/
