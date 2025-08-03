# 💰 ETH Requirements for AlgorandHTLCBridge Deployment

## 🧮 **EXACT CALCULATION:**

### **Gas Configuration:**
- **Gas Limit:** 3,000,000 gas
- **Gas Price:** 20 gwei (0.00000002 ETH per gas)

### **Cost Breakdown:**
```
Maximum Cost = Gas Limit × Gas Price
Maximum Cost = 3,000,000 × 20 gwei
Maximum Cost = 60,000,000 gwei
Maximum Cost = 0.06 ETH
```

### **Realistic Estimates:**
- **Typical Usage:** ~2,500,000 gas (83% of limit)
- **Typical Cost:** 0.05 ETH
- **With Buffer:** 0.01-0.02 ETH

---

## 🎯 **RECOMMENDED AMOUNTS:**

| Scenario | Amount | Reason |
|----------|--------|--------|
| **Minimum** | 0.01 ETH | Basic deployment with buffer |
| **Recommended** | 0.02 ETH | Extra safety margin |
| **Conservative** | 0.05 ETH | Handles gas price spikes |

---

## 🚰 **GET SEPOLIA ETH:**

**Send to:** `0x234eFf7948EeB44bAeE7c4B3945e1aCe83934546`

### **Free Faucets:**
1. **https://sepoliafaucet.com/** → 0.05 ETH/day
2. **https://faucets.chain.link/sepolia** → 0.1 ETH/day  
3. **https://sepolia-faucet.pk910.de/** → 0.05 ETH/day

---

## ⚡ **QUICK SUMMARY:**

**You need:** `0.01-0.02 ETH`  
**Your wallet:** `0x234eFf7948EeB44bAeE7c4B3945e1aCe83934546`  
**Best faucet:** https://sepoliafaucet.com/  

**After getting ETH, run:** `node generate-wallet-and-deploy.cjs`

---

*One faucet request is enough to deploy your gasless cross-chain bridge!* 🌉 