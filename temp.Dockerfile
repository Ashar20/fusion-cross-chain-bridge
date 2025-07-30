
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    build-essential \
    cmake \
    libssl-dev \
    libcurl4-openssl-dev \
    liblog4cxx-dev \
    libgflags-dev \
    libsnappy-dev \
    zlib1g-dev \
    libbz2-dev \
    liblz4-dev \
    libzstd-dev \
    libboost-all-dev \
    libgmp-dev \
    libsecp256k1-dev \
    libsecp256k1-0 \
    && rm -rf /var/lib/apt/lists/*

# Install cleos
RUN wget https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-20.04_amd64.deb \
    && dpkg -i eos_2.1.0-1-ubuntu-20.04_amd64.deb \
    && rm eos_2.1.0-1-ubuntu-20.04_amd64.deb

WORKDIR /work
