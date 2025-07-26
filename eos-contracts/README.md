# 🦎 EOS Smart Contracts

## 📋 Contract Overview

### **fusionbridge.cpp / fusionbridge.hpp**
Native EOS implementation of Hash Time Locked Contract (HTLC) for cross-chain atomic swaps.

#### **Key Features:**
- 🔄 Mirror Ethereum HTLC functionality on EOS
- 🪙 Support for native EOS tokens and custom tokens
- 🔗 Cross-chain parameter synchronization
- ⚡ Atomic swap primitives for non-EVM blockchain

#### **Core Actions:**
- `newcontract` - Create HTLC with hashlock and timelock
- `withdraw` - Claim funds with valid preimage
- `refund` - Recover funds after timeout
- `cleanup` - Remove expired contracts

#### **Data Structures:**
- **htlc_contract** - Main contract state
- **used_preimages** - Prevent replay attacks
- Multi-index tables for efficient querying

#### **Security Features:**
- ✅ Preimage uniqueness validation
- ✅ Timelock enforcement (1-48 hours)
- ✅ Asset validation and safe transfers
- ✅ Authorization checks

## 🌉 **Cross-Chain Synchronization**

The EOS contract maintains identical security guarantees as the Ethereum side:
- Same hashlock → Same atomic guarantee
- Synchronized timelock periods
- Matching fund amounts
- Atomic completion or full reversion

## 🚀 **Compilation & Deployment**

```bash
# Compile contract
eosio-cpp -abigen -o fusionbridge.wasm fusionbridge.cpp --contract fusionbridge

# Deploy to testnet
cleos -u https://jungle4.cryptolions.io set contract ACCOUNT ./eos-contracts \
  fusionbridge.wasm fusionbridge.abi -p ACCOUNT@active
```