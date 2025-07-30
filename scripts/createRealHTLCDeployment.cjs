#!/usr/bin/env node

/**
 * 🔐 Create Real HTLC Deployment
 * 
 * This script creates a real HTLC on EOS Jungle4 testnet using the fixed contract.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const crypto = require('crypto');

class RealHTLCDeployment {
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

    async createRealHTLC() {
        console.log(`🔐 Creating Real HTLC Deployment`);
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
            console.log(`   🔗 ETH TX Hash: ${ethTxHash}`);
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

            console.log(`🚀 Creating real HTLC...`);

            // Create HTLC transaction
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

            console.log(`✅ Real HTLC created successfully!`);
            console.log(`📋 Transaction ID: ${result.transaction_id}`);
            console.log(`🔗 Explorer: https://jungle4.greymass.com/transaction/${result.transaction_id}`);
            console.log(``);

            // Get HTLC details
            await this.getHTLCDetails(api);

            console.log(`🎉 Real HTLC Deployment Summary:`);
            console.log(`============================================================`);
            console.log(`✅ Status: HTLC CREATED`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`💰 Amount: ${amount}`);
            console.log(`🔐 Hashlock: ${hashlock}`);
            console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
            console.log(`📋 TX ID: ${result.transaction_id}`);
            console.log(``);

            console.log(`🧪 Test Commands:`);
            console.log(`# Check HTLC status`);
            console.log(`cleos -u ${this.rpcUrl} get table ${this.contract} ${this.contract} htlcs`);
            console.log(``);
            console.log(`# Claim HTLC (when you have the secret)`);
            console.log(`cleos -u ${this.rpcUrl} push action ${this.contract} claimhtlc '[0, "SECRET_HASH", "${this.account}"]' -p ${this.account}@active`);
            console.log(``);
            console.log(`# Refund HTLC (after timelock expires)`);
            console.log(`cleos -u ${this.rpcUrl} push action ${this.contract} refundhtlc '[0, "${this.account}"]' -p ${this.account}@active`);
            console.log(``);

            return {
                success: true,
                transactionId: result.transaction_id,
                hashlock: hashlock,
                amount: amount,
                timelock: timelock,
                htlcId: 0 // First HTLC will have ID 0
            };

        } catch (error) {
            console.error(`❌ Real HTLC creation failed: ${error.message}`);
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
            console.log(`      - memo: Real HTLC via online tools`);
            console.log(`      - eth_tx_hash: 0x0000000000000000000000000000000000000000000000000000000000000000`);
            console.log(``);
            
            return { success: false, error: error.message };
        }
    }

    async getHTLCDetails(api) {
        try {
            console.log(`📊 Getting HTLC details...`);
            
            // Get contract stats
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

            console.log(`✅ Contract stats retrieved`);
            console.log(`📋 Stats TX ID: ${statsResult.transaction_id}`);

        } catch (error) {
            console.log(`⚠️  Could not get HTLC details: ${error.message}`);
        }
    }
}

async function main() {
    const deployment = new RealHTLCDeployment();
    await deployment.createRealHTLC();
}

if (require.main === module) {
    main();
}

module.exports = { RealHTLCDeployment }; 