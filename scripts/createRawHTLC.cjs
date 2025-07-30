#!/usr/bin/env node

/**
 * 🔐 Create Raw HTLC on EOS
 * 
 * This script creates an HTLC using raw transaction data.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

class RawHTLCCreator {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.contract = 'quicksnake34';
    }

    generateHashlock() {
        const randomBytes = crypto.randomBytes(32);
        return '0x' + randomBytes.toString('hex');
    }

    async createRawHTLC() {
        console.log(`🔐 Creating Raw HTLC on EOS Jungle4`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 Contract: ${this.contract}`);
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

            // Generate HTLC parameters
            const hashlock = this.generateHashlock();
            const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const amount = '0.1000 EOS';
            const memo = 'Raw HTLC for cross-chain swap';
            const ethTxHash = '0x' + '0'.repeat(64);

            console.log(`🔍 HTLC Parameters:`);
            console.log(`   💰 Amount: ${amount}`);
            console.log(`   🔐 Hashlock: ${hashlock}`);
            console.log(`   ⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   📝 Memo: ${memo}`);
            console.log(``);

            console.log(`🚀 Creating Raw HTLC...`);

            // Create raw transaction
            const transaction = {
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
                        amount: amount,
                        hashlock: hashlock,
                        timelock: timelock,
                        memo: memo,
                        eth_tx_hash: ethTxHash
                    }
                }]
            };

            // Send transaction
            const result = await api.transact(transaction, {
                blocksBehind: 3,
                expireSeconds: 30,
                useLastIrreversible: false
            });

            console.log(`✅ Raw HTLC Created Successfully!`);
            console.log(`📋 Transaction ID: ${result.transaction_id}`);
            console.log(`🔗 Explorer: https://jungle4.greymass.com/transaction/${result.transaction_id}`);
            console.log(``);

            console.log(`🎉 Raw HTLC Summary:`);
            console.log(`============================================================`);
            console.log(`✅ Status: CREATED`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`💰 Amount: ${amount}`);
            console.log(`🔐 Hashlock: ${hashlock}`);
            console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
            console.log(`📋 TX ID: ${result.transaction_id}`);
            console.log(``);

            return {
                success: true,
                transactionId: result.transaction_id,
                hashlock: hashlock,
                amount: amount,
                timelock: timelock
            };

        } catch (error) {
            console.error(`❌ Error creating Raw HTLC: ${error.message}`);
            if (error.details) {
                console.error(`📋 Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            return { success: false, error: error.message };
        }
    }
}

async function main() {
    const creator = new RawHTLCCreator();
    await creator.createRawHTLC();
}

if (require.main === module) {
    main();
}

module.exports = { RawHTLCCreator }; 