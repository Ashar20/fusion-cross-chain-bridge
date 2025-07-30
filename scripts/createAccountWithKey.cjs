#!/usr/bin/env node

/**
 * 🆕 Create New Account with Private Key
 * 
 * This script helps create a new account using the provided private key.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

class AccountCreator {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.newAccountName = 'myfusionacc';
    }

    async createAccount() {
        console.log(`🆕 Create New Account with Private Key`);
        console.log(`============================================================`);
        console.log(`🔑 Private Key: ${this.privateKey.substring(0, 10)}...${this.privateKey.substring(this.privateKey.length - 10)}`);
        console.log(`📁 New Account: ${this.newAccountName}`);
        console.log(`🌐 Network: Jungle4 Testnet`);
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

            // Get the public key
            const publicKey = await signatureProvider.getAvailableKeys();
            console.log(`🔑 Public Key: ${publicKey[0]}`);
            console.log(``);

            console.log(`📋 Manual Account Creation Steps:`);
            console.log(`   1. Visit: https://monitor.jungletestnet.io/`);
            console.log(`   2. Click "Create Account"`);
            console.log(`   3. Enter account name: ${this.newAccountName}`);
            console.log(`   4. Enter owner key: ${publicKey[0]}`);
            console.log(`   5. Enter active key: ${publicKey[0]}`);
            console.log(`   6. Click "Create Account"`);
            console.log(`   7. Wait a few minutes for activation`);
            console.log(``);

            console.log(`🔗 Alternative: Use Bloks.io`);
            console.log(`   1. Visit: https://local.bloks.io/`);
            console.log(`   2. Connect your wallet`);
            console.log(`   3. Use the account creation feature`);
            console.log(``);

            console.log(`💰 After account creation:`);
            console.log(`   1. Transfer some EOS from quicksnake34 to ${this.newAccountName}`);
            console.log(`   2. Update deployment script with: ${this.newAccountName}`);
            console.log(`   3. Run: node scripts/deployEosRobust.cjs`);
            console.log(``);

            return {
                accountName: this.newAccountName,
                publicKey: publicKey[0],
                privateKey: this.privateKey
            };

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            return null;
        }
    }
}

async function main() {
    const creator = new AccountCreator();
    
    console.log(`🎯 Account Creation Guide`);
    console.log(`============================================================`);
    
    const result = await creator.createAccount();
    
    if (result) {
        console.log(`\n📋 Account Details:`);
        console.log(`   📁 Name: ${result.accountName}`);
        console.log(`   🔑 Public Key: ${result.publicKey}`);
        console.log(`   🔐 Private Key: ${result.privateKey.substring(0, 10)}...${result.privateKey.substring(result.privateKey.length - 10)}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { AccountCreator }; 