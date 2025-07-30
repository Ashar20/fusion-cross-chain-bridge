#!/usr/bin/env node

/**
 * 🧪 Test HTLC Contract
 * 
 * This script tests the deployed HTLC contract by creating a test HTLC.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

class HTLCTester {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.contract = 'quicksnake34';
    }

    async testHTLC() {
        console.log(`🧪 Testing HTLC Contract`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 Contract: ${this.contract}`);
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

            console.log(`🔍 Step 1: Testing getstats action...`);
            
            // Test getstats action
            const statsResult = await api.transact({
                actions: [{
                    account: this.contract,
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

            console.log(`✅ getstats successful!`);
            console.log(`📋 Transaction ID: ${statsResult.transaction_id}`);
            console.log(``);

            console.log(`🔍 Step 2: Testing createhtlc action...`);
            
            // Test createhtlc action
            const createResult = await api.transact({
                actions: [{
                    account: this.contract,
                    name: 'createhtlc',
                    authorization: [{
                        actor: this.account,
                        permission: 'active'
                    }],
                    data: {
                        sender: this.account,
                        recipient: this.account,
                        amount: '0.1000 EOS',
                        hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                        timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                        memo: 'Test HTLC',
                        eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(`✅ createhtlc successful!`);
            console.log(`📋 Transaction ID: ${createResult.transaction_id}`);
            console.log(``);

            console.log(`🎉 HTLC Contract Test Results:`);
            console.log(`============================================================`);
            console.log(`✅ getstats: Working`);
            console.log(`✅ createhtlc: Working`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
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
    const tester = new HTLCTester();
    await tester.testHTLC();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCTester }; 