#!/usr/bin/env node

/**
 * 🔐 Create Real HTLC on EOS
 * 
 * This script creates a real HTLC on the deployed EOS contract.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

class RealHTLCCreator {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.contract = 'quicksnake34';
    }

    generateHashlock() {
        // Generate a random hashlock (in real scenario, this would be the hash of a secret)
        const randomBytes = crypto.randomBytes(32);
        return '0x' + randomBytes.toString('hex');
    }

    async createHTLC() {
        console.log(`🔐 Creating REAL HTLC on EOS Jungle4`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 Contract: ${this.contract}`);
        console.log(`🌐 Network: Jungle4 Testnet`);
        console.log(`💰 Amount: 0.1000 EOS`);
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
            const memo = 'Real HTLC for cross-chain swap';
            const ethTxHash = '0x' + '0'.repeat(64); // Placeholder ETH transaction hash

            console.log(`🔍 HTLC Parameters:`);
            console.log(`   💰 Amount: ${amount}`);
            console.log(`   🔐 Hashlock: ${hashlock}`);
            console.log(`   ⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   📝 Memo: ${memo}`);
            console.log(`   🔗 ETH TX: ${ethTxHash}`);
            console.log(``);

            console.log(`🚀 Creating HTLC...`);

            // Create HTLC action
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

            // Extract HTLC ID from transaction
            const htlcId = this.extractHTLCId(result);
            if (htlcId) {
                console.log(`🎯 HTLC ID: ${htlcId}`);
            }

            console.log(`🎉 Real HTLC Summary:`);
            console.log(`============================================================`);
            console.log(`✅ Status: CREATED`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`💰 Amount: ${amount}`);
            console.log(`🔐 Hashlock: ${hashlock}`);
            console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
            console.log(`📋 TX ID: ${result.transaction_id}`);
            console.log(``);

            console.log(`🔧 Next Steps:`);
            console.log(`   1. Claim HTLC: Use the secret to claim the funds`);
            console.log(`   2. Refund HTLC: If not claimed before timelock expires`);
            console.log(`   3. Monitor: Check HTLC status on explorer`);
            console.log(``);

            return {
                success: true,
                transactionId: result.transaction_id,
                htlcId: htlcId,
                hashlock: hashlock,
                amount: amount,
                timelock: timelock
            };

        } catch (error) {
            console.error(`❌ Error creating HTLC: ${error.message}`);
            if (error.details) {
                console.error(`📋 Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            return { success: false, error: error.message };
        }
    }

    extractHTLCId(result) {
        try {
            // Try to extract HTLC ID from transaction traces
            if (result.processed && result.processed.action_traces) {
                for (const trace of result.processed.action_traces) {
                    if (trace.act.name === 'createhtlc' && trace.console) {
                        // Look for HTLC ID in console output
                        const match = trace.console.match(/HTLC ID: (\d+)/);
                        if (match) {
                            return match[1];
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore extraction errors
        }
        return null;
    }
}

async function main() {
    const creator = new RealHTLCCreator();
    await creator.createHTLC();
}

if (require.main === module) {
    main();
}

module.exports = { RealHTLCCreator }; 