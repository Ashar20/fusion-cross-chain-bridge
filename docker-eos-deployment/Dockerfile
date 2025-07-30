# EOSIO.CDT Docker Image for Contract Compilation
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV EOSIO_CDT_VERSION=1.8.1

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    build-essential \
    cmake \
    pkg-config \
    libssl-dev \
    libcurl4-openssl-dev \
    libusb-1.0-0-dev \
    libudev-dev \
    && rm -rf /var/lib/apt/lists/*

# Install EOSIO.CDT
RUN wget https://github.com/EOSIO/eosio.cdt/releases/download/v${EOSIO_CDT_VERSION}/eosio.cdt_${EOSIO_CDT_VERSION}-1-ubuntu-20.04_amd64.deb \
    && dpkg -i eosio.cdt_${EOSIO_CDT_VERSION}-1-ubuntu-20.04_amd64.deb \
    && rm eosio.cdt_${EOSIO_CDT_VERSION}-1-ubuntu-20.04_amd64.deb

# Set PATH
ENV PATH="/usr/local/eosio.cdt/bin:${PATH}"

# Create working directory
WORKDIR /eos-contracts

# Copy contract files
COPY contracts/eos/ ./contracts/eos/

# Create compilation script
RUN echo '#!/bin/bash' > /compile.sh \
    && echo 'echo "🐳 Compiling EOS Contract in Docker..."' >> /compile.sh \
    && echo 'cd /eos-contracts/contracts/eos' >> /compile.sh \
    && echo 'echo "📦 Compiling fusionbridge.cpp..."' >> /compile.sh \
    && echo 'eosio-cpp -o fusionbridge.wasm fusionbridge.cpp' >> /compile.sh \
    && echo 'echo "📋 Generating ABI..."' >> /compile.sh \
    && echo 'eosio-abigen fusionbridge.cpp --output=fusionbridge.abi' >> /compile.sh \
    && echo 'echo "✅ Compilation complete!"' >> /compile.sh \
    && echo 'ls -la *.wasm *.abi' >> /compile.sh \
    && chmod +x /compile.sh

# Default command
CMD ["/compile.sh"]
