# 🏆 1inch Hackathon Qualification Submission

**Complete implementation of 1inch hackathon requirements for cross-chain atomic swaps**

## 📜 Hackathon Requirements Met

### ✅ **Requirement 2: Use 1inch Official Escrow Contracts on EVM**
- **EscrowFactory**: `0x084cE671a59bAeAfc10F21467B03dE0F4204E10C` ([View on Sepolia](https://sepolia.etherscan.io/address/0x084cE671a59bAeAfc10F21467B03dE0F4204E10C))
- **Custom Resolver**: `0x58A0D476778f6C84e945e8aD8e368A2B1491a6a8` ([View on Sepolia](https://sepolia.etherscan.io/address/0x58A0D476778f6C84e945e8aD8e368A2B1491a6a8))
- ✅ Uses real 1inch EscrowFactory and Escrow contracts on Sepolia (EVM)
- ✅ Resolver deploys these contracts as part of swap logic

### ✅ **Requirement 3: Custom HTLC Escrow on Non-EVM Chain**
- **Chain**: EOS Jungle4 Testnet (Non-EVM)
- **Implementation**: Custom HTLC escrow logic
- ✅ Accepts lock parameters (recipient, hashlock, timelock, amount)
- ✅ Allows claim with correct secret
- ✅ Refunds sender after timeout
- ✅ Mirrors EVM escrow logic

### ✅ **Official Hackathon Requirement**
*"You must implement a custom resolver that commits to the swap, funds the destination escrow, and claims the origin escrow once the secret is revealed."*

- ✅ **Commits to swap**: `resolver.commitToSwap()`
- ✅ **Funds destination escrow**: `resolver.fundDestinationEscrow()`
- ✅ **Claims origin escrow**: `resolver.claimOriginEscrow()`

## 🚀 Quick Start

### Prerequisites
```bash
npm install
cp .env.example .env
# Configure your keys in .env
```

### Run Complete Hackathon Demo
```bash
npm run hackathon-demo
```

This single command demonstrates ALL hackathon requirements with real transactions!

## 📁 Repository Structure

### Essential Contracts
```
contracts/
├── Official1inchEscrowFactory.sol  # Real 1inch EscrowFactory implementation
├── Official1inchResolver.sol       # Custom resolver meeting hackathon requirements
└── eos/
    └── fusionbridge.cpp            # EOS HTLC escrow (non-EVM)
```

### Core Libraries
```
lib/
├── official1inchEscrow.js          # 1inch integration logic
└── realEOSIntegration.js           # EOS (non-EVM) integration
```

### Demo Scripts
```
scripts/
├── hackathonQualificationDemo.js   # Complete demo of all requirements
├── deployComplete1inchSystem.js    # Deploy EscrowFactory + Resolver
├── deployEOSContract.js            # Deploy EOS HTLC contract
└── realAtomicSwapOfficial1inch.js  # Full atomic swap execution
```

## 🎯 Contract Addresses (Sepolia Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **EscrowFactory** | `0x084cE671a59bAeAfc10F21467B03dE0F4204E10C` | Official 1inch escrow deployment |
| **Custom Resolver** | `0x58A0D476778f6C84e945e8aD8e368A2B1491a6a8` | Hackathon requirement implementation |
| **EOS Contract** | `fusionbridge` on Jungle4 | Non-EVM HTLC escrow |

## 🔧 Available Commands

```bash
# Complete hackathon demonstration
npm run hackathon-demo

# Deploy complete system
npm run deploy-system

# Deploy EOS contract
npm run deploy-eos

# Run full atomic swap
npm run atomic-swap
```

## 📊 Live Demo Transactions

### Recent Successful Demos
- **EscrowFactory Deploy**: [0xb6361d8bfa33aa2f814cdbc13fa72e4a9facb437a4dcc2a11384edc7e589a72b](https://sepolia.etherscan.io/tx/0xb6361d8bfa33aa2f814cdbc13fa72e4a9facb437a4dcc2a11384edc7e589a72b)
- **Resolver Deploy**: [0xef0df5c6f79fb13f0239bacb451ad80e2f1592f47345eb47a54d6572696799c6](https://sepolia.etherscan.io/tx/0xef0df5c6f79fb13f0239bacb451ad80e2f1592f47345eb47a54d6572696799c6)
- **Atomic Swap**: [0x69ced670ccf3bedb6c337748596e44771c4d4cd8c3902351237c99fff981e475](https://sepolia.etherscan.io/tx/0x69ced670ccf3bedb6c337748596e44771c4d4cd8c3902351237c99fff981e475)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   EOS (Non-EVM) │    │  Custom Resolver │    │ Ethereum (EVM)  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ HTLC Escrow │◄┼────┼─│ Commits Swap │ │    │ │ 1inch       │ │
│ │             │ │    │ │ Funds Escrow │ │    │ │ EscrowFactory│ │
│ │ - Lock      │ │    │ │ Claims Funds │ │    │ │             │ │
│ │ - Claim     │ │    │ └──────────────┘ │    │ │ ┌─────────┐ │ │
│ │ - Refund    │ │    │                  │    │ │ │ Escrow  │ │ │
│ └─────────────┘ │    │                  │    │ │ │Contract │ │ │
└─────────────────┘    └──────────────────┘    │ │ └─────────┘ │ │
                                               │ └─────────────┘ │
                                               └─────────────────┘
```

## 🎉 Hackathon Compliance

This implementation fully satisfies the 1inch hackathon requirements:

1. **✅ Real 1inch Contracts**: Uses actual EscrowFactory and Escrow contracts
2. **✅ Custom Resolver**: Implements commit/fund/claim pattern exactly as specified
3. **✅ Cross-Chain HTLC**: Custom escrow on EOS mirrors EVM logic
4. **✅ Production Ready**: Real transactions on live testnets
5. **✅ Complete Demo**: Single command proves all requirements

## 🔗 Links

- **Sepolia Testnet**: https://sepolia.etherscan.io/
- **EOS Jungle4**: https://jungle4.eosq.eosnation.io/
- **1inch Protocol**: https://1inch.io/
- **Repository**: https://github.com/your-repo/fusion-cross-chain-bridge

---

**🏆 Ready for 1inch Hackathon Submission!**