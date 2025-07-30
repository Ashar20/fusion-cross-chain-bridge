# 🚀 EOS Mainnet Deployment Guide

## ⚠️ Important Warnings

**This guide is for deploying to EOS MAINNET with REAL EOS tokens.**
- Deployment will cost real EOS for CPU/NET resources
- Contract interactions will use real EOS
- Test thoroughly on testnet first
- Use a dedicated account for deployment

## 📋 Prerequisites

### 1. EOS Account Requirements
- **Account Name**: Must be 12 characters, lowercase letters and numbers 1-5
- **Balance**: At least 2-3 EOS for deployment costs
- **Active Permission**: Must have active permission with private key
- **CPU/NET**: Sufficient resources for contract deployment

### 2. Environment Setup
Add these variables to your `.env` file:

```bash
# EOS Mainnet Configuration
EOS_MAINNET_PRIVATE_KEY=your_private_key_here
EOS_MAINNET_ACCOUNT=your_account_name
EOS_MAINNET_RPC=https://eos.greymass.com
```

### 3. Contract Compilation
Ensure contract is compiled:
```bash
npm run compile-eos
```

## 🚀 Deployment Steps

### Step 1: Setup Mainnet Environment
```bash
npm run setup-mainnet
```

### Step 2: Verify Requirements
Check that all requirements are met:
- ✅ Compiled contract files exist
- ✅ Mainnet private key configured
- ✅ Mainnet account configured
- ✅ Sufficient EOS balance

### Step 3: Deploy to Mainnet
```bash
npm run deploy-eos-mainnet
```

### Step 4: Verify Deployment
```bash
npm run verify-eos-mainnet
```

## 📊 Deployment Costs

### Estimated Costs (EOS Mainnet)
- **WASM Deployment**: ~0.5-1.0 EOS
- **ABI Deployment**: ~0.1-0.3 EOS
- **Total**: ~0.6-1.3 EOS

### Resource Requirements
- **CPU**: ~50-100ms for deployment
- **NET**: ~50-100KB for contract code
- **RAM**: Minimal (contract uses table storage)

## 🔍 Verification

### Manual Verification
1. **Account Check**: https://eos.eosq.eosnation.io/account/YOUR_ACCOUNT
2. **Contract Code**: Should show deployed WASM
3. **ABI**: Should show contract actions and tables
4. **Tables**: Should be accessible

### Automated Verification
```bash
npm run verify-eos-mainnet
```

## 🛡️ Security Considerations

### Private Key Security
- **Never share** your private key
- **Use dedicated account** for deployment
- **Store securely** in environment variables
- **Backup safely** in secure location

### Account Security
- **Test thoroughly** on testnet first
- **Use minimal permissions** for deployment
- **Monitor transactions** after deployment
- **Keep sufficient balance** for operations

## 🔧 Troubleshooting

### Common Issues

#### 1. Insufficient Balance
```
Error: insufficient balance
```
**Solution**: Ensure account has at least 2-3 EOS

#### 2. Permission Denied
```
Error: transaction declares authority but does not have signatures
```
**Solution**: Check private key matches account's active permission

#### 3. Contract Already Deployed
```
Error: contract is already running this version of code
```
**Solution**: This is normal - contract is already deployed

#### 4. Network Issues
```
Error: fetch failed
```
**Solution**: Try different RPC endpoint or check network connectivity

### RPC Endpoints
- **Primary**: https://eos.greymass.com
- **Backup**: https://eos.eosn.io
- **Alternative**: https://api.eosnewyork.io

## 📈 Post-Deployment

### 1. Test Contract Functions
```bash
# Test HTLC creation (will cost real EOS)
npm run test-mainnet-htlc
```

### 2. Monitor Transactions
- Check transaction history
- Monitor resource usage
- Verify contract interactions

### 3. Update Documentation
- Update contract addresses
- Document deployment details
- Record transaction hashes

## 🔗 Useful Links

- **EOS Mainnet Explorer**: https://eos.eosq.eosnation.io
- **EOS Account Creation**: https://eos-account-creator.com
- **EOS Resource Calculator**: https://eosresource.io
- **EOS Network Status**: https://eosnetwork.com

## 📝 Deployment Checklist

- [ ] Compiled contract files exist
- [ ] Mainnet private key in .env
- [ ] Mainnet account configured
- [ ] Sufficient EOS balance (2-3 EOS)
- [ ] Tested on testnet first
- [ ] Backup private key securely
- [ ] Monitor deployment transaction
- [ ] Verify contract deployment
- [ ] Test contract functions
- [ ] Document deployment details

## 🎯 Success Criteria

Deployment is successful when:
- ✅ WASM code deployed and verified
- ✅ ABI deployed with all actions
- ✅ Contract tables accessible
- ✅ Account shows contract code
- ✅ No deployment errors
- ✅ Transaction confirmed on blockchain

---

**⚠️ Remember**: Mainnet deployment uses real EOS tokens. Test thoroughly and ensure you understand the implications before proceeding. 