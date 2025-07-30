#!/usr/bin/env node

/**
 * 🧪 Test Direct Action
 * 
 * This script tests the contract by calling actions directly.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

class DirectActionTester {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    }

    async testDirectAction() {
        console.log(`🧪 Testing Direct Action`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
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

            console.log(`🔍 Testing direct action call...`);
            
            // Try to call getstats action directly
            const result = await api.transact({
                actions: [{
                    account: this.account,
                    name: 'getstats',
                    authorization: [{
                        actor: this.account,
                        permission: 'active'
                    }],
                    data: {}
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(`✅ Direct action successful!`);
            console.log(`📋 Transaction ID: ${result.transaction_id}`);
            console.log(``);

            console.log(`🎉 Contract is working!`);
            console.log(`============================================================`);
            console.log(`✅ Account: ${this.account}`);
            console.log(`✅ Action: getstats`);
            console.log(`✅ Transaction: ${result.transaction_id}`);
            console.log(``);

            return true;

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            if (error.details) {
                console.error(`📋 Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            return false;
        }
    }
}

async function main() {
    const tester = new DirectActionTester();
    await tester.testDirectAction();
}

if (require.main === module) {
    main();
}

module.exports = { DirectActionTester }; 