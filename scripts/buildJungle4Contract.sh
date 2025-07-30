#!/bin/bash

# Build script for Jungle4-compatible EOS contract
# Uses eosio.cdt 1.7.0 for maximum compatibility

set -e

echo "🔨 Building Jungle4-compatible EOS contract..."
echo "============================================================"

# Configuration
CONTRACT_NAME="fusionbridge"
SOURCE_FILE="contracts/eos/fusionbridge_fixed.cpp"
OUTPUT_DIR="jungle4-build"
CDT_VERSION="1.7.0"

# Create output directory
mkdir -p $OUTPUT_DIR

echo "📁 Source: $SOURCE_FILE"
echo "📁 Output: $OUTPUT_DIR"
echo "🔧 CDT Version: $CDT_VERSION"
echo ""

# Build using Docker with eosio.cdt 1.7.0
echo "🚀 Building with Docker (eosio.cdt $CDT_VERSION)..."
docker run --rm \
    -v "$(pwd):/workspace" \
    -w /workspace \
    eosio/eosio.cdt:$CDT_VERSION \
    bash -c "
        echo '📦 Compiling contract...'
        eosio-cpp -o $OUTPUT_DIR/$CONTRACT_NAME.wasm $SOURCE_FILE \
            -I. \
            -I/usr/local/include \
            -L/usr/local/lib \
            -leosio \
            -leosio.system \
            -leosio.token \
            -leosio.crypto \
            --abigen \
            --contract $CONTRACT_NAME \
            --output $OUTPUT_DIR/$CONTRACT_NAME.abi
        
        echo '✅ Compilation complete!'
        echo '📋 Generated files:'
        ls -la $OUTPUT_DIR/
        
        echo ''
        echo '🔍 ABI Version Check:'
        grep 'version' $OUTPUT_DIR/$CONTRACT_NAME.abi
        
        echo ''
        echo '📊 File sizes:'
        echo 'WASM: ' \$(stat -c%s $OUTPUT_DIR/$CONTRACT_NAME.wasm) ' bytes'
        echo 'ABI:  ' \$(stat -c%s $OUTPUT_DIR/$CONTRACT_NAME.abi) ' bytes'
    "

echo ""
echo "🎉 Build completed successfully!"
echo "============================================================"
echo "📁 WASM: $OUTPUT_DIR/$CONTRACT_NAME.wasm"
echo "📁 ABI:  $OUTPUT_DIR/$CONTRACT_NAME.abi"
echo ""
echo "🚀 Ready for deployment to Jungle4 testnet!"
echo ""
echo "📋 Deployment commands:"
echo "cleos -u https://jungle4.cryptolions.io set code quicksnake34 $OUTPUT_DIR/$CONTRACT_NAME.wasm"
echo "cleos -u https://jungle4.cryptolions.io set abi quicksnake34 $OUTPUT_DIR/$CONTRACT_NAME.abi"
echo "" 