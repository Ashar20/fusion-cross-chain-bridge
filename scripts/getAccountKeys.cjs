#!/usr/bin/env node

/**
 * 🔑 Get Account Public Keys
 * 
 * This script retrieves the actual public keys for an EOS account.
 */

const { JsonRpc } = require('eosjs');

class AccountKeyRetriever {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.accountName = 'quicksnake34';
    }

    async getAccountKeys() {
        console.log(`🔑 Getting Public Keys for Account`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.accountName}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(``);

        try {
            const rpc = new JsonRpc(this.rpcUrl);
            
            // Get account info
            const accountInfo = await rpc.get_account(this.accountName);
            
            console.log(`✅ Account found: ${this.accountName}`);
            console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
            console.log(``);

            // Get permissions and keys
            console.log(`🔐 Account Permissions:`);
            
            for (const permission of accountInfo.permissions) {
                console.log(`   📋 ${permission.perm_name}:`);
                console.log(`      🔑 Required: ${permission.required_auth.threshold}`);
                
                for (const key of permission.required_auth.keys) {
                    console.log(`      🔑 Public Key: ${key.key}`);
                    console.log(`      ⚖️  Weight: ${key.weight}`);
                }
                
                if (permission.required_auth.accounts.length > 0) {
                    console.log(`      👥 Accounts: ${permission.required_auth.accounts.map(acc => acc.permission.actor + '@' + acc.permission.permission).join(', ')}`);
                }
                console.log(``);
            }

            return accountInfo;

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            return null;
        }
    }
}

async function main() {
    const retriever = new AccountKeyRetriever();
    await retriever.getAccountKeys();
}

if (require.main === module) {
    main();
}

module.exports = { AccountKeyRetriever }; 