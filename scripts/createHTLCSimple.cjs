#!/usr/bin/env node

/**
 * 🔐 Create HTLC Simple Approach
 * 
 * This script creates an HTLC using a simple approach that should work.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

class HTLCSimpleCreator {
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

    async createHTLCSimple() {
        console.log(`🔐 Creating HTLC - Simple Approach`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 Contract: ${this.contract}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(``);

        try {
            // Generate HTLC parameters
            const hashlock = this.generateHashlock();
            const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const amount = '0.1000 EOS';
            const memo = 'Real HTLC for cross-chain atomic swap';
            const ethTxHash = '0x' + '0'.repeat(64);

            console.log(`🔍 HTLC Parameters:`);
            console.log(`   💰 Amount: ${amount}`);
            console.log(`   🔐 Hashlock: ${hashlock}`);
            console.log(`   ⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   📝 Memo: ${memo}`);
            console.log(``);

            // Initialize EOS connection
            const signatureProvider = new JsSignatureProvider([this.privateKey]);
            const rpc = new JsonRpc(this.rpcUrl);
            const api = new Api({
                rpc: rpc,
                signatureProvider: signatureProvider,
                textDecoder: new TextDecoder(),
                textEncoder: new TextEncoder()
            });

            console.log(`🚀 Creating HTLC...`);

            // Try to create HTLC with simple approach
            const result = await api.transact({
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
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(`✅ HTLC Created Successfully!`);
            console.log(`📋 Transaction ID: ${result.transaction_id}`);
            console.log(`🔗 Explorer: https://jungle4.greymass.com/transaction/${result.transaction_id}`);
            console.log(``);

            console.log(`🎉 HTLC Simple Creation Summary:`);
            console.log(`============================================================`);
            console.log(`✅ Status: HTLC CREATED`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`💰 Amount: ${amount}`);
            console.log(`🔐 Hashlock: ${hashlock}`);
            console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
            console.log(`📋 TX ID: ${result.transaction_id}`);
            console.log(``);

            console.log(`🧪 Verification Commands:`);
            console.log(`cleos -u ${this.rpcUrl} get table ${this.contract} ${this.contract} htlcs`);
            console.log(`cleos -u ${this.rpcUrl} push action ${this.contract} getstats '{}' -p ${this.account}@active`);
            console.log(``);

            return {
                success: true,
                transactionId: result.transaction_id,
                hashlock: hashlock,
                amount: amount,
                timelock: timelock
            };

        } catch (error) {
            console.error(`❌ HTLC creation failed: ${error.message}`);
            
            // Provide manual instructions
            console.log(`🔧 Manual HTLC Creation Required`);
            console.log(`============================================================`);
            console.log(`📋 Use these parameters in the online explorer:`);
            console.log(``);
            console.log(`   sender: ${this.account}`);
            console.log(`   recipient: ${this.account}`);
            console.log(`   amount: 0.1000 EOS`);
            console.log(`   hashlock: ${this.generateHashlock()}`);
            console.log(`   timelock: ${Math.floor(Date.now() / 1000) + 3600}`);
            console.log(`   memo: Real HTLC for cross-chain atomic swap`);
            console.log(`   eth_tx_hash: 0x0000000000000000000000000000000000000000000000000000000000000000`);
            console.log(``);
            console.log(`🌐 Visit: https://jungle4.cryptolions.io/`);
            console.log(`📁 Go to Smart Contracts → ${this.account} → Actions → createhtlc`);
            console.log(``);
            
            return { success: false, error: error.message };
        }
    }
}

async function main() {
    const creator = new HTLCSimpleCreator();
    await creator.createHTLCSimple();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCSimpleCreator }; 