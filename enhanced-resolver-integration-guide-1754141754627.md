# 🚀 Enhanced Cross-Chain Resolver Integration Guide

## 📋 Contract Addresses
- **EnhancedCrossChainResolver**: 0xdE9fA203098BaD66399d9743a6505E9967171815
- **Network**: Sepolia Testnet

## 🎯 Key Features
- ✅ Partial Fill Support
- ✅ Dutch Auction Price Discovery
- ✅ Multi-Stage Timelocks
- ✅ Access Token System
- ✅ Rescue Functionality

## 🔧 Basic Usage

### 1. Create Enhanced HTLC
```javascript
const orderHash = await enhancedResolver.createEnhancedCrossChainHTLC(
    hashlock,
    timelock,
    token,
    amount,
    recipient,
    algorandAddress,
    partialFillsEnabled,
    minFillAmount,
    amountMode,
    auctionStartTime,
    auctionEndTime,
    startPrice,
    endPrice,
    accessToken
);
```

### 2. Execute Partial Fill
```javascript
await enhancedResolver.executePartialFill(
    orderHash,
    fillAmount,
    secret,
    algorandAmount
);
```

### 3. Place Dutch Auction Bid
```javascript
await enhancedResolver.placeBid(
    orderHash,
    bidAmount
);
```

### 4. Transition Timelock Stage
```javascript
await enhancedResolver.transitionStage(orderHash);
```

## 🎯 Configuration
- **MIN_ORDER_VALUE**: 0.001 ETH
- **DEFAULT_TIMELOCK**: 86400 seconds
- **AUCTION_DURATION**: 180 seconds
- **MAX_PARTIAL_FILLS**: 10
- **RESOLVER_FEE_RATE**: 0.5%
- **PARTIAL_FILL_BONUS**: 0.25%

## 🔗 Official 1inch Integration
- **ESCROW_FACTORY**: 0x523258A91028793817F84aB037A3372B468ee940
- **LIMIT_ORDER_PROTOCOL**: 0x68b68381b76e705A7Ef8209800D0886e21b654FE

## 🚀 Ready for Production!
This resolver implements full 1inch Fusion+ standards with cross-chain capabilities.
