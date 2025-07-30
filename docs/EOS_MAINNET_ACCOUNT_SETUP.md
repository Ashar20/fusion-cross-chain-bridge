# 🌐 EOS Mainnet Account Setup Guide

## Overview
This guide will help you create the EOS mainnet account `attachedsuit` for deploying your cross-chain bridge contract.

## 📋 Prerequisites

1. **EOS Mainnet Account**: You need an existing EOS mainnet account with sufficient EOS balance
2. **Private Key**: The private key for your existing EOS mainnet account
3. **EOS Balance**: At least 2-3 EOS for account creation costs

## 💰 Account Creation Costs

The account creation will cost approximately:
- **RAM**: ~0.3-0.5 EOS (1800 bytes)
- **NET Stake**: 0.0500 EOS
- **CPU Stake**: 1.0000 EOS
- **Total**: ~1.35-1.55 EOS

## 🔧 Setup Steps

### Step 1: Prepare Environment Variables

Add the following to your `.env` file:

```bash
# EOS Mainnet Account Creation
EOS_MAINNET_CREATOR_PRIVATE_KEY=your_existing_account_private_key_here
EOS_MAINNET_CREATOR_ACCOUNT=your_existing_account_name_here

# After account creation, add these:
EOS_MAINNET_ACCOUNT=attachedsuit
EOS_MAINNET_PRIVATE_KEY=your_new_account_private_key_here
```

### Step 2: Create the Account

Run the account creation script:

```bash
node scripts/createEosMainnetAccount.cjs
```

### Step 3: Verify Account Creation

The script will automatically verify the account was created successfully.

## 🔑 Account Details

- **Account Name**: `attachedsuit`
- **Owner Key**: `EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9`
- **Active Key**: `EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9`

## ⚠️ Important Security Notes

1. **Save the private key securely** - You'll need it for contract deployment
2. **Never share your private keys** - Keep them in your `.env` file only
3. **Backup your keys** - Store them in a secure location
4. **Test with small amounts first** - Always test with small amounts before large transactions

## 🚀 Next Steps

After successful account creation:

1. **Deploy the contract**:
   ```bash
   npm run deploy-eos-mainnet
   ```

2. **Verify deployment**:
   ```bash
   npm run verify-eos-mainnet
   ```

3. **Test the bridge**:
   ```bash
   npm run eth-to-eos-mainnet
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure your creator account has at least 2-3 EOS
2. **Invalid Private Key**: Double-check the private key format
3. **Network Issues**: Try again if you get network timeouts
4. **Account Already Exists**: The script will detect if the account already exists

### Error Messages

- `EOS_MAINNET_CREATOR_PRIVATE_KEY environment variable is required`
  - Solution: Add the private key to your `.env` file

- `EOS_MAINNET_CREATOR_ACCOUNT environment variable is required`
  - Solution: Add the account name to your `.env` file

- `insufficient balance`
  - Solution: Add more EOS to your creator account

## 📞 Support

If you encounter issues:

1. Check the error messages above
2. Verify your environment variables
3. Ensure sufficient EOS balance
4. Check network connectivity

## 🎯 Success Indicators

When successful, you should see:

```
🎉 Account creation completed successfully!
============================================================
📁 Account: attachedsuit
🔑 Owner Key: EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9
🔑 Active Key: EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9
🔗 Transaction: [transaction_id]
```

Your cross-chain bridge is now ready for mainnet deployment! 🚀 