# 🏗️ WORKING SCRIPTS - DEPLOYED CONTRACT ADDRESSES

## 📋 **Contract Addresses Used in Working Scripts**

### **🎯 Primary Production Contracts**

#### **1. Enhanced Limit Order Bridge** ✅ **VERIFIED & ACTIVE**
- **Address**: `0x384B0011f6E6aA8C192294F36dCE09a3758Df788`
- **Network**: Sepolia Testnet
- **Status**: ✅ **VERIFIED ON ETHERSCAN**
- **Used in**: Enhanced bidding relayer scripts
- **Purpose**: Main contract for competitive bidding and limit orders

#### **2. Cross Chain HTLC Resolver** ✅ **DEPLOYED & ACTIVE**
- **Address**: `0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64`
- **Network**: Sepolia Testnet
- **Status**: ✅ **DEPLOYED & ACTIVE**
- **Used in**: All working swap scripts and relayer
- **Purpose**: Handles cross-chain HTLC creation and execution

#### **3. Official 1inch Escrow Factory** ✅ **OFFICIAL CONTRACT**
- **Address**: `0x523258A91028793817F84aB037A3372B468ee940`
- **Network**: Sepolia Testnet
- **Status**: ✅ **OFFICIAL 1INCH CONTRACT**
- **Used in**: Complete cross-chain relayer
- **Purpose**: Official 1inch escrow factory for Fusion+ integration

#### **4. Algorand HTLC Bridge** ✅ **DEPLOYED & ACTIVE**
- **App ID**: `743645803`
- **Network**: Algorand Testnet
- **Status**: ✅ **DEPLOYED & ACTIVE**
- **Used in**: All working scripts and relayer
- **Purpose**: Algorand-side HTLC contract for atomic swaps

### **🔧 Supporting Infrastructure**

#### **5. Resolver Address Manager** ✅ **DEPLOYED**
- **Address**: `0xF5b1ED98d34005B974dA8071BAE029954CEC53F2`
- **Network**: Sepolia Testnet
- **Status**: ✅ **DEPLOYED**
- **Used in**: Resolver management scripts
- **Purpose**: Manages deterministic resolver addresses

#### **6. Enhanced Cross Chain Resolver** ✅ **DEPLOYED**
- **Address**: `0xdE9fA203098BaD66399d9743a6505E9967171815`
- **Network**: Sepolia Testnet
- **Status**: ✅ **DEPLOYED**
- **Used in**: Advanced resolver scripts
- **Purpose**: Advanced resolver with full 1inch Fusion+ features

## 🚀 **Working Scripts Contract Usage**

### **📁 Swap Scripts (`working-scripts/swap/`)**

#### **1. `gaslessETHtoALGOSwap.cjs`**
```javascript
// Contract Addresses Used:
resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64'
algorandAppId: 743645803
```

#### **2. `gaslessALGOtoETHSwapRelayer.cjs`**
```javascript
// Contract Addresses Used:
resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64'
algorandAppId: 743645803
```

#### **3. `bidirectionalGaslessSwap.cjs`**
```javascript
// Contract Addresses Used:
resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64'
algorandAppId: 743645803
```

### **📁 Relayer Scripts (`working-scripts/relayer/`)**

#### **1. `completeCrossChainRelayer.cjs`**
```javascript
// Contract Addresses Used:
resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64'
escrowFactoryAddress: '0x523258A91028793817F84aB037A3372B468ee940'
algorandAppId: 743645803
```

#### **2. `enhancedBiddingRelayer.cjs`**
```javascript
// Contract Addresses Used:
// Loads from deployment file: ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json
contractAddress: '0x384B0011f6E6aA8C192294F36dCE09a3758Df788'
algorandAppId: 743645803
```

#### **3. `startCompleteRelayer.cjs`**
```javascript
// Contract Addresses Used:
// Uses completeCrossChainRelayer.cjs configuration
resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64'
escrowFactoryAddress: '0x523258A91028793817F84aB037A3372B468ee940'
algorandAppId: 743645803
```

### **📁 Verification Scripts (`working-scripts/verification/`)**

#### **1. `simpleVerification.cjs`**
```javascript
// Contract Addresses Used:
algorandAppId: 743645803
// Focuses on Algorand transaction verification
```

## 🎯 **Contract Address Summary**

### **✅ Active Contract Addresses**

| Contract | Address/ID | Network | Status | Usage |
|----------|------------|---------|--------|-------|
| **EnhancedLimitOrderBridge** | `0x384B0011f6E6aA8C192294F36dCE09a3758Df788` | Sepolia | ✅ **VERIFIED** | Enhanced bidding |
| **CrossChainHTLCResolver** | `0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64` | Sepolia | ✅ **ACTIVE** | All swap scripts |
| **1inch EscrowFactory** | `0x523258A91028793817F84aB037A3372B468ee940` | Sepolia | ✅ **OFFICIAL** | Relayer integration |
| **Algorand HTLC Bridge** | `743645803` | Algorand | ✅ **ACTIVE** | All scripts |
| **ResolverAddressManager** | `0xF5b1ED98d34005B974dA8071BAE029954CEC53F2` | Sepolia | ✅ **DEPLOYED** | Resolver management |
| **EnhancedCrossChainResolver** | `0xdE9fA203098BaD66399d9743a6505E9967171815` | Sepolia | ✅ **DEPLOYED** | Advanced features |

### **🔗 Etherscan Links**

#### **Ethereum Contracts (Sepolia)**
- **EnhancedLimitOrderBridge**: https://sepolia.etherscan.io/address/0x384B0011f6E6aA8C192294F36dCE09a3758Df788#code
- **CrossChainHTLCResolver**: https://sepolia.etherscan.io/address/0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64
- **1inch EscrowFactory**: https://sepolia.etherscan.io/address/0x523258A91028793817F84aB037A3372B468ee940
- **ResolverAddressManager**: https://sepolia.etherscan.io/address/0xF5b1ED98d34005B974dA8071BAE029954CEC53F2
- **EnhancedCrossChainResolver**: https://sepolia.etherscan.io/address/0xdE9fA203098BaD66399d9743a6505E9967171815

#### **Algorand Contracts (Testnet)**
- **Algorand HTLC Bridge**: https://testnet.algoexplorer.io/application/743645803

## 🚀 **Working Scripts Status**

### **✅ Fully Functional Scripts**

#### **1. Gasless Swap Scripts**
- ✅ `gaslessETHtoALGOSwap.cjs` - ETH → ALGO gasless swap
- ✅ `gaslessALGOtoETHSwapRelayer.cjs` - ALGO → ETH gasless swap
- ✅ `bidirectionalGaslessSwap.cjs` - Bidirectional gasless swaps

#### **2. Relayer Scripts**
- ✅ `completeCrossChainRelayer.cjs` - Complete relayer service
- ✅ `enhancedBiddingRelayer.cjs` - Enhanced bidding relayer
- ✅ `startCompleteRelayer.cjs` - Relayer startup script

#### **3. Verification Scripts**
- ✅ `simpleVerification.cjs` - Transaction verification

### **🔧 Configuration Files**

#### **Environment Files**
- `.env.relayer` - Relayer addresses and keys
- `.env.resolvers` - Resolver environment
- `resolver-config.json` - Resolver configuration

#### **Deployment Files**
- `ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json` - Enhanced bridge deployment
- `ALGORAND-DEPLOYMENT-SUCCESS.json` - Algorand deployment info

## 🎯 **Current Status**

### **✅ Production Ready**
- **All working scripts** use deployed and verified contracts
- **Cross-chain infrastructure** fully operational
- **Gasless swap functionality** working
- **Relayer services** active
- **Bidding system** ready for production

### **🚀 Ready for Action**
- **4 Funded Resolvers** ready for competitive bidding
- **Complete contract ecosystem** deployed and verified
- **All scripts tested** and functional
- **Cross-chain coordination** working

**All working scripts are using the correct deployed contract addresses and are ready for production use!** 🎉 