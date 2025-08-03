# 🔧 RESOLVER ENVIRONMENT USAGE GUIDE

## 📋 OVERVIEW
This guide explains how to use the resolver environment files and scripts.

## 📁 ENVIRONMENT FILES

### 1. `.env.resolvers`
Contains all resolver wallet addresses and configuration.

### 2. `resolver-config.json`
JSON configuration with resolver details.

### 3. `RESOLVER_FUNDING_INSTRUCTIONS.md`
Complete funding guide with addresses.

## 🚀 USAGE SCRIPTS

### 1. Check Resolver Balances
```bash
node scripts/manageResolverWallets.cjs
```

### 2. Verify Funding Status
```bash
node scripts/verifyResolverFunding.cjs
```

### 3. Use Specific Resolver
```bash
node scripts/resolverBidding.cjs
```

## 💻 PROGRAMMATIC USAGE

### Load Environment in Your Scripts
```javascript
require('dotenv').config({ path: '.env.resolvers' });

// Access resolver addresses
const resolver1Address = process.env.RESOLVER_1_ADDRESS;
const resolver2Address = process.env.RESOLVER_2_ADDRESS;
const resolver3Address = process.env.RESOLVER_3_ADDRESS;
const resolver4Address = process.env.RESOLVER_4_ADDRESS;
```

### Load Configuration
```javascript
const config = require('./resolver-config.json');
const resolvers = config.resolvers;
```

### Use Wallet Manager
```javascript
const ResolverWalletManager = require('./scripts/manageResolverWallets.cjs');
const manager = new ResolverWalletManager();
await manager.checkBalances();
```

### Use Bidding System
```javascript
const ResolverBidding = require('./scripts/resolverBidding.cjs');
const bidding = new ResolverBidding(1); // Use resolver 1
await bidding.placeBid(orderHash, bidAmount);
```

## 🎯 RESOLVER ADDRESSES

| Index | Name | Address |
|-------|------|---------|
| 1 | High-Frequency-Resolver-1 | `0xEb6901a6d726636976B112d233A20F18eBE7C344` |
| 2 | Arbitrage-Resolver-1 | `0x8e1A3b2548Faf6c1bce04953F8B3a7D52BF61d2a` |
| 3 | MEV-Resolver-1 | `0x3F6a6A9bBa278F6A4307F4Aa19C31484af68D0e1` |
| 4 | Backup-Resolver-1 | `0xB9f906AD2371c4bC8A2b0EEa55D3F7Ee3aEa803f` |

## 🔧 ENVIRONMENT VARIABLES

### Contract Addresses
- `RESOLVER_ADDRESS_MANAGER`: 0xF5b1ED98d34005B974dA8071BAE029954CEC53F2
- `ENHANCED_CROSS_CHAIN_RESOLVER`: 0xdE9fA203098BaD66399d9743a6505E9967171815

### Resolver Variables
- `RESOLVER_1_NAME`, `RESOLVER_1_ADDRESS`, `RESOLVER_1_FUNDING`
- `RESOLVER_2_NAME`, `RESOLVER_2_ADDRESS`, `RESOLVER_2_FUNDING`
- `RESOLVER_3_NAME`, `RESOLVER_3_ADDRESS`, `RESOLVER_3_FUNDING`
- `RESOLVER_4_NAME`, `RESOLVER_4_ADDRESS`, `RESOLVER_4_FUNDING`

## 📊 MONITORING

### Check All Balances
```bash
node scripts/manageResolverWallets.cjs
```

### Verify Funding
```bash
node scripts/verifyResolverFunding.cjs
```

### Etherscan Links
- https://sepolia.etherscan.io/address/0xEb6901a6d726636976B112d233A20F18eBE7C344
- https://sepolia.etherscan.io/address/0x8e1A3b2548Faf6c1bce04953F8B3a7D52BF61d2a
- https://sepolia.etherscan.io/address/0x3F6a6A9bBa278F6A4307F4Aa19C31484af68D0e1
- https://sepolia.etherscan.io/address/0xB9f906AD2371c4bC8A2b0EEa55D3F7Ee3aEa803f

## 🚀 READY FOR OPERATION

Once funded, resolvers can:
- Participate in Dutch auctions
- Execute partial fills
- Earn fees from successful operations
- Compete for cross-chain swap opportunities
