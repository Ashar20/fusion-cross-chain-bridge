#!/bin/bash

# Build script for Jungle4-compatible EOS contract
# Uses eosio.cdt 1.7.0 for maximum compatibility

set -e

echo "🔨 Building Jungle4-compatible EOS contract..."
echo "============================================================"

# Configuration
CONTRACT_NAME="fusionbridge"
SOURCE_FILE="contracts/eos/fusionbridge_jungle4_compatible.cpp"
OUTPUT_DIR="jungle4-compatible-build"
CDT_VERSION="1.7.0"

# Create output directory
mkdir -p $OUTPUT_DIR

echo "📁 Source: $SOURCE_FILE"
echo "📁 Output: $OUTPUT_DIR"
echo "🔧 CDT Version: $CDT_VERSION"
echo ""

# Try to find available CDT images
echo "🔍 Checking for available eosio.cdt images..."

# Try different CDT versions
CDT_VERSIONS=("1.7.0" "1.6.3" "1.6.2" "1.6.1" "1.6.0")

for version in "${CDT_VERSIONS[@]}"; do
    echo "📦 Trying eosio.cdt:$version..."
    
    # Check if image exists
    if docker images | grep -q "eosio/eosio.cdt.*$version"; then
        echo "✅ Found eosio.cdt:$version locally"
        CDT_VERSION=$version
        break
    fi
    
    # Try to pull the image
    if docker pull eosio/eosio.cdt:$version > /dev/null 2>&1; then
        echo "✅ Successfully pulled eosio.cdt:$version"
        CDT_VERSION=$version
        break
    else
        echo "❌ Failed to pull eosio.cdt:$version"
    fi
done

if [ -z "$CDT_VERSION" ]; then
    echo "❌ No compatible eosio.cdt version found"
    echo "🔧 Manual compilation required"
    echo ""
    echo "📋 Manual compilation steps:"
    echo "1. Install eosio.cdt 1.7.0 or 1.6.x"
    echo "2. Run: eosio-cpp -o $OUTPUT_DIR/$CONTRACT_NAME.wasm $SOURCE_FILE"
    echo "3. Run: eosio-abigen $SOURCE_FILE --contract=$CONTRACT_NAME --output=$OUTPUT_DIR/$CONTRACT_NAME.abi"
    echo ""
    exit 1
fi

echo "🚀 Building with eosio.cdt $CDT_VERSION..."
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
echo "🔧 CDT Version: $CDT_VERSION"
echo ""
echo "🚀 Ready for deployment to Jungle4 testnet!"
echo ""
echo "📋 Deployment commands:"
echo "cleos -u https://jungle4.cryptolions.io set code quicksnake34 $OUTPUT_DIR/$CONTRACT_NAME.wasm"
echo "cleos -u https://jungle4.cryptolions.io set abi quicksnake34 $OUTPUT_DIR/$CONTRACT_NAME.abi"
echo "" 