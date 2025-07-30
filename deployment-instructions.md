# EOS Contract Deployment Instructions

## Problem
The EOS contract is not properly deployed, causing ETH → EOS swap failures with "unable to retrieve account code" errors.

## Files Ready for Deployment
- **WASM**: `docker-eos-deployment/output/fusionbridge.wasm` (57.7KB)
- **ABI**: `docker-eos-deployment/output/fusionbridge.abi` (4.0KB - fixed version)
- **Account**: `quicksnake34`
- **Network**: Jungle4 Testnet

## Deployment Options

### Option 1: EOS Studio (Recommended)
1. Go to: http://app.eosstudio.io/guest
2. Click "Deploy Contract"
3. Upload WASM file: `docker-eos-deployment/output/fusionbridge.wasm`
4. Copy ABI content from: `docker-eos-deployment/output/fusionbridge.abi`
5. Deploy to account: `quicksnake34`
6. Use private key: `5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN`

### Option 2: Bloks.io
1. Go to: https://local.bloks.io/
2. Connect to Jungle4 testnet
3. Navigate to Smart Contracts
4. Upload both WASM and ABI files
5. Deploy to account: `quicksnake34`

### Option 3: Cryptolions
1. Go to: https://jungle4.cryptolions.io/
2. Use contract deployment interface
3. Upload WASM and ABI files
4. Deploy to account: `quicksnake34`

## After Deployment
Run verification to confirm deployment:
```bash
node scripts/verifyEosDeployment.cjs
```

## Expected Actions After Deployment
The contract should support these actions:
- `createhtlc` - Create Hash Time Locked Contract
- `claimhtlc` - Claim an HTLC with secret
- `refundhtlc` - Refund expired HTLC
- `getstats` - Get contract statistics

## Account Details
- **Account**: quicksnake34
- **Balance**: 1.6264 EOS
- **RAM**: 613KB available
- **Network**: Jungle4 Testnet (https://jungle4.cryptolions.io)

## Fixed Issues
- Removed ABI version 1.2 incompatibility
- Removed `action_results` and `kv_tables` causing parsing errors
- Simplified to standard ABI 1.1 format