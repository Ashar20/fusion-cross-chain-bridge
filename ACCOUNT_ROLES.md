# 🎯 Account Roles & Objectives in Fusion Cross-Chain Bridge

## 📋 **Account Overview**

Your Fusion Cross-Chain Bridge uses multiple accounts with different roles to enable secure, gasless cross-chain atomic swaps between Ethereum and Algorand.

## 🔐 **Ethereum Accounts**

### **1. Main Account (User/Maker)**
- **Address**: `0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53`
- **Private Key**: `PRIVATE_KEY` in .env
- **Balance**: `0.024 ETH` (Sepolia)

**Objectives:**
- 🎯 **Create HTLC Orders**: User creates cross-chain swap intentions
- 💰 **Lock Funds**: Deposits ETH/ERC20 tokens into HTLC contracts
- ✍️ **Sign Transactions**: Signs HTLC creation and execution transactions
- 🔐 **Secret Management**: Generates and reveals secrets for atomic swaps
- 📋 **Order Management**: Manages cross-chain order lifecycle

**What This Account Does:**
1. Creates ETH → Algorand swap orders
2. Locks ETH in Ethereum HTLC contract
3. Waits for Algorand HTLC to be created by relayer
4. Reveals secret to claim Algorand tokens
5. Completes atomic swap execution

### **2. Relayer Account**
- **Address**: `0x742d35Cc6634C0532925a3b8D4C7c3d6C4b4d8b6` (derived from RELAYER_PRIVATE_KEY)
- **Private Key**: `RELAYER_PRIVATE_KEY` in .env

**Objectives:**
- 🤖 **Gasless Execution**: Executes transactions on behalf of users
- 🏷️ **Dutch Auction Participation**: Bids competitively for execution rights
- 🌉 **Cross-Chain Coordination**: Monitors both chains and coordinates swaps
- 💸 **Fee Collection**: Earns fees for providing gasless execution service
- ⚡ **Fast Execution**: Provides professional-grade swap execution

**What This Account Does:**
1. Monitors Ethereum for new HTLC creation
2. Creates matching HTLC on Algorand blockchain
3. Participates in Dutch auctions for execution rights
4. Executes HTLCs when secrets are revealed
5. Collects relayer fees for services

## 🔗 **Algorand Accounts**

### **1. Main Algorand Account**
- **Address**: `EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA`
- **Private Key**: `ALGORAND_PRIVATE_KEY` in .env
- **Mnemonic**: Stored in `ALGORAND_MNEMONIC`
- **Balance**: `0 ALGO` ❌ (Needs funding!)

**Objectives:**
- 🏗️ **Contract Deployment**: Deploy Algorand HTLC smart contracts
- 💰 **Receive Funds**: Receive ALGO from cross-chain swaps
- 🔐 **Secret Verification**: Verify secrets in Algorand HTLCs
- 📋 **Contract Management**: Manage Algorand-side contract operations
- ⚖️ **Balance Management**: Handle ALGO token transfers

**What This Account Does:**
1. Deploys Algorand HTLC bridge contract
2. Receives ALGO from completed cross-chain swaps
3. Participates in secret revelation process
4. Manages Algorand-side contract state
5. Handles refunds for expired HTLCs

## 🌉 **Cross-Chain Swap Flow**

### **Scenario: ETH → ALGO Swap**

1. **User (Ethereum Account)**:
   - Creates HTLC on Ethereum
   - Locks 0.01 ETH with secret hash
   - Specifies Algorand recipient address

2. **Relayer Service**:
   - Detects new HTLC on Ethereum
   - Creates matching HTLC on Algorand
   - Locks equivalent ALGO amount
   - Starts Dutch auction for execution

3. **User (Reveals Secret)**:
   - Claims ALGO from Algorand HTLC
   - Reveals secret in the process

4. **Relayer (Completes Swap)**:
   - Uses revealed secret to claim ETH
   - Completes atomic swap
   - Earns relayer fee

### **Scenario: ALGO → ETH Swap**

1. **User (Algorand Account)**:
   - Creates HTLC on Algorand
   - Locks ALGO with secret hash
   - Specifies Ethereum recipient address

2. **Relayer Service**:
   - Detects new HTLC on Algorand
   - Creates matching HTLC on Ethereum
   - Locks equivalent ETH amount

3. **User (Reveals Secret)**:
   - Claims ETH from Ethereum HTLC
   - Reveals secret in the process

4. **Relayer (Completes Swap)**:
   - Uses revealed secret to claim ALGO
   - Completes atomic swap
   - Earns relayer fee

## 🎯 **Key Objectives by Account Type**

### **👤 User Accounts (Both Chains)**
- 🎯 **Primary Goal**: Execute cross-chain swaps without gas fees
- 🔐 **Security**: Maintain control of private keys and secrets
- 💰 **Asset Management**: Safely swap tokens between chains
- ⚡ **User Experience**: Enjoy gasless, intent-based trading

### **🤖 Relayer Accounts**
- 🎯 **Primary Goal**: Provide gasless execution infrastructure
- 💸 **Revenue**: Earn fees from competitive execution
- 🏷️ **Efficiency**: Win Dutch auctions with optimal gas pricing
- 🌉 **Reliability**: Ensure 24/7 cross-chain bridge operation

### **🏭 Contract Accounts**
- 🎯 **Primary Goal**: Enable secure atomic swaps
- 🔒 **Security**: Enforce timelock and hashlock conditions
- ⚖️ **Fairness**: Ensure either both sides complete or both revert
- 🚫 **Censorship Resistance**: Operate without centralized control

## 🔄 **Account Interaction Flow**

```
User (ETH) ────────────────────────────────────── User (ALGO)
    │                                                   │
    │ 1. Create HTLC                                    │ 4. Reveal Secret
    │                                                   │    & Claim ALGO
    ▼                                                   ▼
Ethereum HTLC ◄─────────────────────────────► Algorand HTLC
    ▲                                                   ▲
    │ 2. Monitor & Create                               │ 3. Create Matching
    │    Matching HTLC                                  │    HTLC
    │                                                   │
Relayer (ETH) ◄─────── Relayer Service ──────► Relayer (ALGO)
    │                                                   
    │ 5. Use Secret to Claim ETH & Complete Swap
    ▼
  Swap Complete ✅
```

## 💰 **Funding Requirements**

### **Ethereum Accounts**
- **Main Account**: ✅ `0.024 ETH` (sufficient for testing)
- **Relayer Account**: Needs ETH for gas fees and HTLC creation

### **Algorand Accounts**
- **Main Account**: ❌ `0 ALGO` (needs funding for deployment)
- **Required**: `5-10 ALGO` for contract deployment and operations

## 🎯 **Success Metrics**

### **For Users**
- ✅ Successfully swap tokens between chains
- ✅ Pay zero gas fees (relayers handle it)
- ✅ Experience fast, reliable execution
- ✅ Maintain full control of funds

### **For Relayers**
- ✅ Earn fees from successful executions
- ✅ Win Dutch auctions with competitive pricing
- ✅ Maintain high uptime and reliability
- ✅ Scale to handle multiple simultaneous swaps

### **For the System**
- ✅ Enable atomic swaps with zero failed transactions
- ✅ Maintain security without centralized control
- ✅ Scale to handle high transaction volumes
- ✅ Integrate seamlessly with 1inch Fusion+ ecosystem

---

**🌉 Each account plays a crucial role in making cross-chain DeFi accessible, secure, and efficient!**