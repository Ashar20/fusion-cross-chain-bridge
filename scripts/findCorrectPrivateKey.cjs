#!/usr/bin/env node

/**
 * 🔍 Find Correct Private Key
 * 
 * This script helps identify the correct private key for an account.
 */

const { JsonRpc } = require('eosjs');

class PrivateKeyFinder {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.accountName = 'quicksnake34';
    }

    async findCorrectKey() {
        console.log(`🔍 Finding Correct Private Key`);
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

            // Get the public key from active permission
            const activePermission = accountInfo.permissions.find(p => p.perm_name === 'active');
            if (activePermission && activePermission.required_auth.keys.length > 0) {
                const publicKey = activePermission.required_auth.keys[0].key;
                console.log(`🔑 Required Public Key: ${publicKey}`);
                console.log(``);
                
                console.log(`📋 To find the correct private key:`);
                console.log(`   1. Check your wallet/keystore for the private key that generates: ${publicKey}`);
                console.log(`   2. The private key should be a 51-character string starting with '5'`);
                console.log(`   3. Update your .env file with: EOS_PRIVATE_KEY=your_private_key_here`);
                console.log(``);
                
                console.log(`🔧 Alternative: If you don't have the private key:`);
                console.log(`   1. Create a new account with your current private key`);
                console.log(`   2. Transfer some EOS to the new account`);
                console.log(`   3. Use the new account for deployment`);
                console.log(``);
                
                return publicKey;
            }

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            return null;
        }
    }
}

async function main() {
    const finder = new PrivateKeyFinder();
    await finder.findCorrectKey();
}

if (require.main === module) {
    main();
}

module.exports = { PrivateKeyFinder }; 