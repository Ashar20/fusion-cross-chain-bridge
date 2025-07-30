#!/usr/bin/env node

/**
 * 🔍 Verify Jungle4 Testnet Account
 * 
 * This script verifies if the silaslist123 account exists on Jungle4 testnet.
 */

const { JsonRpc } = require('eosjs');

class Jungle4AccountVerifier {
    constructor() {
        this.rpcUrl = 'https://api.eosauthority.com';
        this.accountName = 'silaslist123';
        this.rpc = new JsonRpc(this.rpcUrl);
    }

    async verify() {
        console.log(`🔍 Verifying Jungle4 Testnet Account`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.accountName}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(``);
        
        try {
            const accountInfo = await this.rpc.get_account(this.accountName);
            
            console.log(`✅ Account exists!`);
            console.log(`📁 Account Name: ${accountInfo.account_name}`);
            console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
            console.log(`📊 RAM: ${accountInfo.ram_quota} bytes`);
            console.log(`⚡ CPU: ${accountInfo.cpu_weight} EOS`);
            console.log(`🌐 NET: ${accountInfo.net_weight} EOS`);
            console.log(`🔐 Permissions: ${accountInfo.permissions?.length || 0}`);
            
            if (accountInfo.permissions) {
                accountInfo.permissions.forEach(perm => {
                    console.log(`   - ${perm.perm_name}: ${perm.required_auth.keys?.length || 0} keys`);
                });
            }
            
            console.log(``);
            console.log(`🎉 Account is ready for contract deployment!`);
            console.log(`📋 Next step: node scripts/deployEosTestnetSetup.cjs`);
            
            return true;
            
        } catch (error) {
            console.log(`❌ Account not found: ${this.accountName}`);
            console.log(`💡 Error: ${error.message}`);
            console.log(``);
            console.log(`📋 To create the account:`);
            console.log(`   1. Visit: https://monitor.jungletestnet.io/`);
            console.log(`   2. Click "Create Account"`);
            console.log(`   3. Enter account name: ${this.accountName}`);
            console.log(`   4. Enter owner key: EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9`);
            console.log(`   5. Enter active key: EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9`);
            console.log(`   6. Click "Create Account"`);
            console.log(`   7. Wait a few minutes and run this script again`);
            
            return false;
        }
    }
}

// Run the verification
async function main() {
    const verifier = new Jungle4AccountVerifier();
    await verifier.verify();
}

if (require.main === module) {
    main();
}

module.exports = { Jungle4AccountVerifier }; 