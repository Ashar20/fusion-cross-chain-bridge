#!/usr/bin/env node

/**
 * 🔑 Verify Private Key Account
 * 
 * This script helps verify which account a private key belongs to.
 */

// Load environment variables from .env file
require('dotenv').config();

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

class PrivateKeyVerifier {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.accountName = 'quicksnake34';
    }

    async verifyPrivateKey() {
        console.log(`🔑 Verifying Private Key Account`);
        console.log(`============================================================`);
        
        if (!this.privateKey) {
            console.log(`❌ EOS_PRIVATE_KEY not found in environment`);
            console.log(`💡 Make sure your .env file contains: EOS_PRIVATE_KEY=your_private_key`);
            return;
        }

        console.log(`🔑 Private Key: ${this.privateKey.substring(0, 10)}...${this.privateKey.substring(this.privateKey.length - 10)}`);
        console.log(``);

        try {
            // Initialize EOS connection
            const signatureProvider = new JsSignatureProvider([this.privateKey]);
            const rpc = new JsonRpc(this.rpcUrl);
            const api = new Api({
                rpc: rpc,
                signatureProvider: signatureProvider,
                textDecoder: new TextDecoder(),
                textEncoder: new TextEncoder()
            });

            // Get the public key from the private key
            const publicKey = await signatureProvider.getAvailableKeys();
            console.log(`🔑 Public Key: ${publicKey[0]}`);
            console.log(``);

            // Try to find accounts that use this public key
            console.log(`🔍 Searching for accounts using this public key...`);
            
            // Test some common account names
            const testAccounts = [
                'quicksnake34',
                'silaslist123',
                'testaccount1',
                'testaccount2',
                'myaccount',
                'eosaccount'
            ];

            for (const accountName of testAccounts) {
                try {
                    const accountInfo = await rpc.get_account(accountName);
                    
                    // Check if this account uses our public key
                    if (accountInfo.permissions) {
                        for (const perm of accountInfo.permissions) {
                            if (perm.required_auth && perm.required_auth.keys) {
                                for (const key of perm.required_auth.keys) {
                                    if (key.key === publicKey[0]) {
                                        console.log(`✅ Found matching account: ${accountName}`);
                                        console.log(`   📁 Account: ${accountInfo.account_name}`);
                                        console.log(`   💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
                                        console.log(`   🔐 Permission: ${perm.perm_name}`);
                                        console.log(`   🔑 Key: ${key.key}`);
                                        console.log(``);
                                        
                                        console.log(`🎯 This is the account your private key belongs to!`);
                                        console.log(`📋 Use this account name for deployment: ${accountName}`);
                                        return accountName;
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    // Account doesn't exist, continue
                }
            }

            console.log(`❌ No matching account found for this private key`);
            console.log(`💡 This private key might belong to:`);
            console.log(`   1. A different account name`);
            console.log(`   2. A mainnet account (not testnet)`);
            console.log(`   3. A different network`);
            console.log(``);
            console.log(`🔍 To find the correct account:`);
            console.log(`   1. Check your wallet/keystore for the account name`);
            console.log(`   2. Try searching on EOS block explorers`);
            console.log(`   3. Use a different private key that matches quicksnake34`);

        } catch (error) {
            console.error(`❌ Error verifying private key: ${error.message}`);
        }
    }

    async testAccountCreation() {
        console.log(`\n🔧 Testing Account Creation Capability`);
        console.log(`============================================================`);
        
        try {
            const signatureProvider = new JsSignatureProvider([this.privateKey]);
            const rpc = new JsonRpc(this.rpcUrl);
            const api = new Api({
                rpc: rpc,
                signatureProvider: signatureProvider,
                textDecoder: new TextDecoder(),
                textEncoder: new TextEncoder()
            });

            // Try to get account info for eosio (should always work)
            const eosioInfo = await rpc.get_account('eosio');
            console.log(`✅ Network connection working`);
            console.log(`🌐 RPC: ${this.rpcUrl}`);
            console.log(`📊 Network: Jungle4 Testnet`);
            console.log(``);

            console.log(`💡 Options:`);
            console.log(`   1. Use the correct private key for quicksnake34`);
            console.log(`   2. Create a new account with this private key`);
            console.log(`   3. Use a different existing account`);

        } catch (error) {
            console.error(`❌ Network connection failed: ${error.message}`);
        }
    }
}

// Run the verification
async function main() {
    const verifier = new PrivateKeyVerifier();
    
    console.log(`🔍 Private Key Account Verification`);
    console.log(`============================================================`);
    
    await verifier.verifyPrivateKey();
    await verifier.testAccountCreation();
}

if (require.main === module) {
    main();
}

module.exports = { PrivateKeyVerifier }; 