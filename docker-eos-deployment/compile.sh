#!/bin/bash
echo "🐳 Compiling EOS Contract using Docker..."

# Create output directory
mkdir -p output

# Run compilation in Docker
docker run --rm \
    -v "$(pwd)/contracts:/eos-contracts/contracts" \
    -v "$(pwd)/output:/eos-contracts/output" \
    eos-contract-compiler

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    echo "📁 Output files:"
    ls -la output/
else
    echo "❌ Compilation failed!"
    exit 1
fi
