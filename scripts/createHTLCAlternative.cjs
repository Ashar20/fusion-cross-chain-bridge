#!/usr/bin/env node

/**
 * 🔐 Create HTLC Alternative Approach
 * 
 * This script tries alternative RPC endpoints and methods to create an HTLC.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

class HTLCAlternativeCreator {
    constructor() {
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.contract = 'quicksnake34';
        this.rpcEndpoints = [
            'https://jungle4.cryptolions.io',
            'https://jungle4.greymass.com',
            'https://jungle4.api.eosnation.io'
        ];
    }

    generateHashlock() {
        const randomBytes = crypto.randomBytes(32);
        return '0x' + randomBytes.toString('hex');
    }

    async createHTLCAlternative() {
        console.log(`🔐 Creating HTLC - Alternative Approach`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 Contract: ${this.contract}`);
        console.log(``);

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

        // Try different RPC endpoints
        for (const rpcUrl of this.rpcEndpoints) {
            console.log(`🌐 Trying RPC: ${rpcUrl}`);
            
            try {
                const signatureProvider = new JsSignatureProvider([this.privateKey]);
                const rpc = new JsonRpc(rpcUrl);
                const api = new Api({
                    rpc: rpc,
                    signatureProvider: signatureProvider,
                    textDecoder: new TextDecoder(),
                    textEncoder: new TextEncoder()
                });

                console.log(`🚀 Attempting HTLC creation...`);

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
                console.log(`🔗 Explorer: ${rpcUrl.replace('/v1/chain', '')}/transaction/${result.transaction_id}`);
                console.log(``);

                console.log(`🎉 HTLC Alternative Creation Summary:`);
                console.log(`============================================================`);
                console.log(`✅ Status: HTLC CREATED`);
                console.log(`📁 Contract: ${this.contract}`);
                console.log(`📁 Account: ${this.account}`);
                console.log(`💰 Amount: ${amount}`);
                console.log(`🔐 Hashlock: ${hashlock}`);
                console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
                console.log(`📋 TX ID: ${result.transaction_id}`);
                console.log(`🌐 RPC: ${rpcUrl}`);
                console.log(``);

                return {
                    success: true,
                    transactionId: result.transaction_id,
                    hashlock: hashlock,
                    amount: amount,
                    timelock: timelock,
                    rpcUrl: rpcUrl
                };

            } catch (error) {
                console.log(`❌ Failed with ${rpcUrl}: ${error.message}`);
                continue;
            }
        }

        // If all RPC endpoints fail, provide manual instructions
        console.log(`🔧 All RPC endpoints failed. Manual creation required.`);
        console.log(`============================================================`);
        console.log(`📋 Use these parameters in the online explorer:`);
        console.log(``);
        console.log(`   sender: ${this.account}`);
        console.log(`   recipient: ${this.account}`);
        console.log(`   amount: 0.1000 EOS`);
        console.log(`   hashlock: ${hashlock}`);
        console.log(`   timelock: ${timelock}`);
        console.log(`   memo: ${memo}`);
        console.log(`   eth_tx_hash: ${ethTxHash}`);
        console.log(``);
        console.log(`🌐 Visit: https://jungle4.cryptolions.io/`);
        console.log(`📁 Go to Smart Contracts → ${this.account} → Actions → createhtlc`);
        console.log(``);

        return { success: false, error: 'All RPC endpoints failed' };
    }
}

async function main() {
    const creator = new HTLCAlternativeCreator();
    await creator.createHTLCAlternative();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCAlternativeCreator }; 