#!/usr/bin/env node

/**
 * 🔐 Create HTLC Raw Transaction
 * 
 * This script creates an HTLC using raw transaction data to bypass ABI issues.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

class HTLCRawCreator {
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

    async createHTLCRaw() {
        console.log(`🔐 Creating HTLC with Raw Transaction`);
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

            // Initialize EOS connection with custom configuration
            const signatureProvider = new JsSignatureProvider([this.privateKey]);
            const rpc = new JsonRpc(this.rpcUrl);
            
            // Create API with custom configuration to bypass ABI issues
            const api = new Api({
                rpc: rpc,
                signatureProvider: signatureProvider,
                textDecoder: new TextDecoder(),
                textEncoder: new TextEncoder(),
                // Disable ABI caching and fetching
                abiProvider: {
                    getRawAbi: async () => null,
                    getAbi: async () => null
                }
            });

            console.log(`🚀 Creating HTLC with raw transaction...`);

            // Create the transaction manually without ABI
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

            console.log(`📋 Transaction Structure:`);
            console.log(JSON.stringify(transaction, null, 2));
            console.log(``);

            // Try to send the transaction with raw data
            const result = await api.transact(transaction, {
                blocksBehind: 3,
                expireSeconds: 30,
                useLastIrreversible: false,
                // Disable ABI validation
                abiSerializationType: 0
            });

            console.log(`✅ HTLC Created Successfully!`);
            console.log(`📋 Transaction ID: ${result.transaction_id}`);
            console.log(`🔗 Explorer: https://jungle4.greymass.com/transaction/${result.transaction_id}`);
            console.log(``);

            console.log(`🎉 HTLC Raw Transaction Summary:`);
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
            if (error.details) {
                console.error(`📋 Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            
            // Try alternative approach with direct RPC
            console.log(`🔧 Trying alternative approach with direct RPC...`);
            await this.createHTLCDirectRPC(hashlock, timelock, amount, memo, ethTxHash);
            
            return { success: false, error: error.message };
        }
    }

    async createHTLCDirectRPC(hashlock, timelock, amount, memo, ethTxHash) {
        try {
            console.log(`🚀 Attempting direct RPC approach...`);
            
            // Create transaction data
            const transactionData = {
                delay_sec: 0,
                max_cpu_usage_ms: 0,
                max_net_usage_words: 0,
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

            console.log(`📋 Direct RPC transaction data ready`);
            console.log(`🔧 Manual execution required due to signing requirements`);
            console.log(`📋 Use these parameters in the online explorer:`);
            console.log(``);
            console.log(`   sender: ${this.account}`);
            console.log(`   recipient: ${this.account}`);
            console.log(`   amount: ${amount}`);
            console.log(`   hashlock: ${hashlock}`);
            console.log(`   timelock: ${timelock}`);
            console.log(`   memo: ${memo}`);
            console.log(`   eth_tx_hash: ${ethTxHash}`);
            console.log(``);

        } catch (error) {
            console.error(`❌ Direct RPC approach failed: ${error.message}`);
        }
    }
}

async function main() {
    const creator = new HTLCRawCreator();
    await creator.createHTLCRaw();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCRawCreator }; 