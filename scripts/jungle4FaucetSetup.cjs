#!/usr/bin/env node

/**
 * 🌴 Jungle4 Testnet Faucet Setup
 * 
 * This script guides you through getting testnet tokens and creating the silaslist123 account.
 */

class Jungle4FaucetSetup {
    constructor() {
        this.accountName = 'silaslist123';
        this.ownerKey = 'EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9';
        this.activeKey = 'EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9';
    }

    async run() {
        console.log(`🌴 Jungle4 Testnet Account Setup`);
        console.log(`============================================================`);
        console.log(`📁 Account Name: ${this.accountName}`);
        console.log(`🔑 Owner Key: ${this.ownerKey}`);
        console.log(`🔑 Active Key: ${this.activeKey}`);
        console.log(``);
        
        console.log(`📋 Step 1: Get Testnet Tokens`);
        console.log(`   Visit: https://monitor.jungletestnet.io/`);
        console.log(`   Click "Create Account"`);
        console.log(`   Enter account name: ${this.accountName}`);
        console.log(`   Enter owner key: ${this.ownerKey}`);
        console.log(`   Enter active key: ${this.activeKey}`);
        console.log(`   Click "Create Account"`);
        console.log(``);
        
        console.log(`📋 Step 2: Alternative Method (if above doesn't work)`);
        console.log(`   Visit: https://faucet.jungletestnet.io/`);
        console.log(`   Or: https://jungle4.cryptolions.io/`);
        console.log(`   Request tokens for: ${this.accountName}`);
        console.log(``);
        
        console.log(`📋 Step 3: Verify Account Creation`);
        console.log(`   After getting tokens, run:`);
        console.log(`   node scripts/verifyJungle4Account.cjs`);
        console.log(``);
        
        console.log(`📋 Step 4: Deploy Contract`);
        console.log(`   Once account is created, run:`);
        console.log(`   node scripts/deployEosTestnetSetup.cjs`);
        console.log(``);
        
        console.log(`🔗 Useful Links:`);
        console.log(`   🌐 Jungle4 Monitor: https://monitor.jungletestnet.io/`);
        console.log(`   🌐 Jungle4 Faucet: https://faucet.jungletestnet.io/`);
        console.log(`   🌐 Jungle4 Explorer: https://jungle4.eosq.eosnation.io/`);
        console.log(`   🌐 Cryptolions Faucet: https://jungle4.cryptolions.io/`);
        console.log(``);
        
        console.log(`💡 Tips:`);
        console.log(`   - Account names must be 12 characters or less`);
        console.log(`   - Keys must be valid EOS public keys`);
        console.log(`   - You may need to wait a few minutes for account creation`);
        console.log(`   - If one faucet doesn't work, try another`);
        console.log(``);
        
        console.log(`🎯 Next Steps:`);
        console.log(`   1. Go to https://monitor.jungletestnet.io/`);
        console.log(`   2. Create account: ${this.accountName}`);
        console.log(`   3. Wait for confirmation`);
        console.log(`   4. Run: node scripts/verifyJungle4Account.cjs`);
        console.log(`   5. Run: node scripts/deployEosTestnetSetup.cjs`);
    }
}

// Run the setup guide
async function main() {
    const setup = new Jungle4FaucetSetup();
    await setup.run();
}

if (require.main === module) {
    main();
}

module.exports = { Jungle4FaucetSetup }; 