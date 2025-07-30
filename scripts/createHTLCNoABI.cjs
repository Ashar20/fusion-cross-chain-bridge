#!/usr/bin/env node

/**
 * 🔐 Create HTLC without ABI
 * 
 * This script creates an HTLC using eosjs without ABI requirements.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

class HTLCNoABICreator {
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

    async createHTLCNoABI() {
        console.log(`🔐 Creating HTLC without ABI`);
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
            const memo = 'HTLC without ABI for cross-chain swap';
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

            console.log(`🚀 Creating HTLC without ABI...`);

            // Try to create the transaction manually
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

            // Try to send the transaction
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

            console.log(`🎉 HTLC without ABI Summary:`);
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
            console.error(`❌ Error creating HTLC without ABI: ${error.message}`);
            if (error.details) {
                console.error(`📋 Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            
            console.log(`🔧 Alternative: Use online tools`);
            console.log(`   1. Visit: https://jungle4.cryptolions.io/`);
            console.log(`   2. Go to Smart Contracts`);
            console.log(`   3. Select account: ${this.account}`);
            console.log(`   4. Call action: createhtlc`);
            console.log(`   5. Use these parameters:`);
            console.log(`      - sender: ${this.account}`);
            console.log(`      - recipient: ${this.account}`);
            console.log(`      - amount: 0.1000 EOS`);
            console.log(`      - hashlock: ${this.generateHashlock()}`);
            console.log(`      - timelock: ${Math.floor(Date.now() / 1000) + 3600}`);
            console.log(`      - memo: HTLC via online tools`);
            console.log(`      - eth_tx_hash: 0x0000000000000000000000000000000000000000000000000000000000000000`);
            console.log(``);
            
            return { success: false, error: error.message };
        }
    }
}

async function main() {
    const creator = new HTLCNoABICreator();
    await creator.createHTLCNoABI();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCNoABICreator }; 