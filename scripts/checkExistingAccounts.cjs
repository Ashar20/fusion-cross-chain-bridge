#!/usr/bin/env node

/**
 * 🔍 Check Existing EOS Testnet Accounts
 * 
 * This script checks what EOS testnet accounts are available and working.
 */

const { JsonRpc } = require('eosjs');

class ExistingAccountsChecker {
    constructor() {
        this.rpcUrls = [
            'https://api.eosauthority.com',
            'https://jungle4.cryptolions.io',
            'https://jungle4.greymass.com',
            'https://jungle4.api.eosnation.io'
        ];
        
        this.testAccounts = [
            'quicksnake34',
            'silaslist123',
            'eosio',
            'junglefaucet'
        ];
    }

    async checkAllAccounts() {
        console.log(`🔍 Checking Existing EOS Testnet Accounts`);
        console.log(`============================================================`);
        
        for (const rpcUrl of this.rpcUrls) {
            console.log(`\n🌐 Testing RPC: ${rpcUrl}`);
            const rpc = new JsonRpc(rpcUrl);
            
            for (const account of this.testAccounts) {
                try {
                    const accountInfo = await rpc.get_account(account);
                    console.log(`   ✅ ${account}: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
                } catch (error) {
                    console.log(`   ❌ ${account}: Not found`);
                }
            }
        }
        
        console.log(`\n📋 Summary:`);
        console.log(`   - Try different RPC endpoints if accounts aren't found`);
        console.log(`   - Some RPCs may have different account data`);
        console.log(`   - Use the RPC that shows your account exists`);
    }

    async checkSpecificAccount(accountName) {
        console.log(`🔍 Checking Account: ${accountName}`);
        console.log(`============================================================`);
        
        for (const rpcUrl of this.rpcUrls) {
            console.log(`\n🌐 RPC: ${rpcUrl}`);
            const rpc = new JsonRpc(rpcUrl);
            
            try {
                const accountInfo = await rpc.get_account(accountName);
                console.log(`✅ Account found!`);
                console.log(`   📁 Name: ${accountInfo.account_name}`);
                console.log(`   💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
                console.log(`   📊 RAM: ${accountInfo.ram_quota} bytes`);
                console.log(`   ⚡ CPU: ${accountInfo.cpu_weight} EOS`);
                console.log(`   🌐 NET: ${accountInfo.net_weight} EOS`);
                console.log(`   🔐 Permissions: ${accountInfo.permissions?.length || 0}`);
                
                if (accountInfo.permissions) {
                    accountInfo.permissions.forEach(perm => {
                        console.log(`      - ${perm.perm_name}: ${perm.required_auth.keys?.length || 0} keys`);
                    });
                }
                
                return { rpcUrl, accountInfo };
                
            } catch (error) {
                console.log(`❌ Account not found: ${error.message}`);
            }
        }
        
        return null;
    }
}

// Run the account checker
async function main() {
    const checker = new ExistingAccountsChecker();
    
    // Check all accounts
    await checker.checkAllAccounts();
    
    // Check specific accounts
    console.log(`\n🔍 Detailed Account Checks:`);
    
    const accountsToCheck = ['quicksnake34', 'silaslist123'];
    for (const account of accountsToCheck) {
        const result = await checker.checkSpecificAccount(account);
        if (result) {
            console.log(`\n🎯 Found working account: ${account} on ${result.rpcUrl}`);
            console.log(`   Use this RPC URL for deployment: ${result.rpcUrl}`);
        }
    }
}

if (require.main === module) {
    main();
}

module.exports = { ExistingAccountsChecker }; 