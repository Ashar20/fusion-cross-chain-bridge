# 🔧 ResolverAddressManager Integration Guide

## 📋 Contract Information
- **Address**: 0xF5b1ED98d34005B974dA8071BAE029954CEC53F2
- **Network**: sepolia
- **Deployer**: 0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53

## 🚀 Quick Start

### 1. Initialize Contract
```javascript
const { ethers } = require('ethers');

const addressManager = new ethers.Contract(
    '0xF5b1ED98d34005B974dA8071BAE029954CEC53F2',
    ['function createResolverAddress(string name, bytes signature) payable returns (address)'],
    wallet
);
```

### 2. Create Resolver Address
```javascript
// Generate signature
const message = `CreateResolverAddress${wallet.address}${resolverName}${nonce}`;
const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
const signature = await wallet.signMessage(ethers.getBytes(messageHash));

// Create address
const tx = await addressManager.createResolverAddress(
    resolverName,
    signature,
    { value: ethers.parseEther('0.001') }
);
```

### 3. Get Resolver Statistics
```javascript
const totalResolvers = await addressManager.getTotalResolvers();
const totalFees = await addressManager.getTotalFees();
const resolver = await addressManager.getResolverAddress(nonce);
```

## 🎯 Features
- Deterministic address generation
- Resolver wallet management
- Fee tracking per resolver
- Fill count tracking
- Address activation/deactivation
- Statistics and analytics

## 🔗 Links
- **Etherscan**: https://sepolia.etherscan.io/address/0xF5b1ED98d34005B974dA8071BAE029954CEC53F2
- **Deployment TX**: https://sepolia.etherscan.io/tx/0xb898716da2315f6d5613c5ef00340a44a8fb8dbb6b5b22b7b715978368988cc3
