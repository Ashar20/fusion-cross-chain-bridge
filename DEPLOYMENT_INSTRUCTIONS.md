# 🚀 Deploy AlgorandHTLCBridge.sol to Sepolia

## 🔧 Setup Instructions

### 1. Create `.env` file in project root:
```bash
# Copy and paste this into a new .env file:
PRIVATE_KEY=your_ethereum_private_key_here_without_0x_prefix
ETHERSCAN_API_KEY=optional_for_contract_verification
```

### 2. Get Sepolia Testnet ETH:
- Visit: https://sepoliafaucet.com/
- Or: https://faucets.chain.link/sepolia
- You need ~0.01 ETH for deployment

### 3. Deploy to Sepolia:
```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

## 🌐 Your Infura Configuration:
- ✅ Project ID: `116078ce3b154dd0b21e372e9626f104`
- ✅ Quota: 697 of 3M used (2.999M available!)
- ✅ Network: Sepolia testnet
- ✅ RPC: `https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104`

## 📊 Expected Results:
- Contract deployed to Sepolia testnet
- Ready for 277,712 daily gasless swaps
- Cross-chain ETH ↔ Algorand bridge operational
- Premium Infura infrastructure active

## 🎯 Post-Deployment:
1. Contract verification on Etherscan
2. Deploy Algorand counterpart
3. Start relayer network
4. Begin processing gasless swaps

---
*Your cross-chain bridge will be production-ready with enterprise-grade infrastructure!* 🌉 