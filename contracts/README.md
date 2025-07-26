# 🔗 Smart Contracts

## 📋 Contract Overview

### **FusionEOSBridge.sol**
Hash Time Locked Contract (HTLC) implementation for Ethereum side of cross-chain atomic swaps.

#### **Key Features:**
- ⚡ Atomic swap guarantees via cryptographic hashlocks
- ⏰ Time-locked refunds for safety  
- 🔄 Support for ETH and ERC20 tokens
- 🌉 Cross-chain parameter storage for EOS integration

#### **Core Functions:**
- `newContract()` - Create new HTLC with hashlock and timelock
- `withdraw()` - Claim funds with valid preimage  
- `refund()` - Recover funds after timeout expiration

#### **Security Features:**
- ✅ Reentrancy protection
- ✅ Preimage uniqueness validation
- ✅ Timelock bounds enforcement
- ✅ Safe token transfers

## 🚀 **Next Steps**
- [ ] Add EOS contract implementation
- [ ] Implement 1inch Fusion+ integration
- [ ] Add partial fill support