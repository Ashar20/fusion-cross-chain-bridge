#!/bin/bash
echo "🐳 Building EOS Contract Compiler Docker Image..."
docker build -t eos-contract-compiler .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "📦 Image name: eos-contract-compiler"
else
    echo "❌ Docker build failed!"
    exit 1
fi
