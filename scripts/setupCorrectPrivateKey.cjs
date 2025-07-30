#!/usr/bin/env node

/**
 * 🔑 Setup Correct Private Key for Testnet Account
 * 
 * This script helps set up the correct private key for your existing testnet account.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

class PrivateKeySetup {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.accountName = 'quicksnake34';
    }

    async testPrivateKey(privateKey) {
        console.log(`🔑 Testing Private Key for ${this.accountName}`);
        console.log(`============================================================`);
        
        try {
            const signatureProvider = new JsSignatureProvider([privateKey]);
            const rpc = new JsonRpc(this.rpcUrl);
            const api = new Api({
                rpc: rpc,
                signatureProvider: signatureProvider,
                textDecoder: new TextDecoder(),
                textEncoder: new TextEncoder()
            });
            
            // Try to get account info to test the key
            const accountInfo = await rpc.get_account(this.accountName);
            console.log(`✅ Account found: ${accountInfo.account_name}`);
            console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
            
            // Try to get account permissions to verify key works
            if (accountInfo.permissions) {
                for (const perm of accountInfo.permissions) {
                    if (perm.perm_name === 'active') {
                        console.log(`✅ Active permission found with ${perm.required_auth.keys?.length || 0} keys`);
                        break;
                    }
                }
            }
            
            console.log(`✅ Private key appears to be valid for this account!`);
            return true;
            
        } catch (error) {
            console.log(`❌ Private key test failed: ${error.message}`);
            return false;
        }
    }

    async run() {
        console.log(`🔑 Private Key Setup for Testnet Account`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.accountName}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(``);
        
        const currentKey = process.env.EOS_PRIVATE_KEY;
        if (currentKey) {
            console.log(`📋 Current EOS_PRIVATE_KEY is set`);
            console.log(`🔑 Key: ${currentKey.substring(0, 10)}...${currentKey.substring(currentKey.length - 10)}`);
            console.log(``);
            
            const isValid = await this.testPrivateKey(currentKey);
            if (isValid) {
                console.log(`🎉 Current private key is valid!`);
                console.log(`📋 You can now run: node scripts/deployEosTestnetSetup.cjs`);
                return;
            } else {
                console.log(`❌ Current private key is not valid for ${this.accountName}`);
            }
        } else {
            console.log(`❌ EOS_PRIVATE_KEY is not set`);
        }
        
        console.log(``);
        console.log(`📋 To fix this:`);
        console.log(`   1. Get the correct private key for ${this.accountName}`);
        console.log(`   2. Set it as environment variable:`);
        console.log(`      export EOS_PRIVATE_KEY="your_correct_private_key_here"`);
        console.log(`   3. Or add to your .env file:`);
        console.log(`      EOS_PRIVATE_KEY=your_correct_private_key_here`);
        console.log(`   4. Run this script again to test`);
        console.log(``);
        console.log(`💡 If you don't have the private key:`);
        console.log(`   - Check your wallet/keystore`);
        console.log(`   - Check your .env file`);
        console.log(`   - Check your backup files`);
        console.log(`   - Or create a new account if needed`);
    }
}

// Run the setup
async function main() {
    const setup = new PrivateKeySetup();
    await setup.run();
}

if (require.main === module) {
    main();
}

module.exports = { PrivateKeySetup }; 