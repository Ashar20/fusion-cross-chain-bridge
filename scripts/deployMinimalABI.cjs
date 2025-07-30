#!/usr/bin/env node

/**
 * 🔧 Deploy Minimal ABI
 * 
 * This script deploys a minimal ABI that should be compatible with Jungle4.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

class MinimalABIDeployer {
    constructor() {
        this.network = 'jungle4';
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    }

    async deployMinimalABI() {
        console.log(`🔧 Deploying Minimal ABI`);
        console.log(`==================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 Network: ${this.network} Testnet`);
        console.log(``);

        try {
            // Create minimal ABI
            const minimalABI = {
                "version": "eosio::abi/1.0",
                "types": [],
                "structs": [
                    {
                        "name": "createhtlc",
                        "base": "",
                        "fields": [
                            {"name": "sender", "type": "name"},
                            {"name": "recipient", "type": "name"},
                            {"name": "amount", "type": "asset"},
                            {"name": "hashlock", "type": "checksum256"},
                            {"name": "timelock", "type": "uint32"},
                            {"name": "memo", "type": "string"},
                            {"name": "eth_tx_hash", "type": "string"}
                        ]
                    },
                    {
                        "name": "claimhtlc",
                        "base": "",
                        "fields": [
                            {"name": "htlc_id", "type": "uint64"},
                            {"name": "secret", "type": "checksum256"},
                            {"name": "claimer", "type": "name"}
                        ]
                    },
                    {
                        "name": "refundhtlc",
                        "base": "",
                        "fields": [
                            {"name": "htlc_id", "type": "uint64"},
                            {"name": "refunder", "type": "name"}
                        ]
                    },
                    {
                        "name": "getstats",
                        "base": "",
                        "fields": []
                    },
                    {
                        "name": "htlc",
                        "base": "",
                        "fields": [
                            {"name": "id", "type": "uint64"},
                            {"name": "sender", "type": "name"},
                            {"name": "recipient", "type": "name"},
                            {"name": "amount", "type": "asset"},
                            {"name": "hashlock", "type": "checksum256"},
                            {"name": "timelock", "type": "uint32"},
                            {"name": "claimed", "type": "bool"},
                            {"name": "refunded", "type": "bool"},
                            {"name": "memo", "type": "string"},
                            {"name": "eth_tx_hash", "type": "string"},
                            {"name": "secret_hash", "type": "checksum256"},
                            {"name": "created_at", "type": "uint32"}
                        ]
                    }
                ],
                "actions": [
                    {"name": "createhtlc", "type": "createhtlc"},
                    {"name": "claimhtlc", "type": "claimhtlc"},
                    {"name": "refundhtlc", "type": "refundhtlc"},
                    {"name": "getstats", "type": "getstats"}
                ],
                "tables": [
                    {
                        "name": "htlcs",
                        "type": "htlc",
                        "index_type": "i64",
                        "key_names": [],
                        "key_types": []
                    }
                ]
            };

            console.log(`📖 Creating minimal ABI...`);
            console.log(`✅ ABI version: ${minimalABI.version}`);
            console.log(`✅ Actions: ${minimalABI.actions.length}`);
            console.log(`✅ Tables: ${minimalABI.tables.length}`);
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

            // Deploy ABI
            console.log(`📄 Deploying minimal ABI...`);
            const serializedAbi = Buffer.from(JSON.stringify(minimalABI)).toString('hex');

            const result = await api.transact({
                actions: [{
                    account: 'eosio',
                    name: 'setabi',
                    authorization: [{
                        actor: this.account,
                        permission: 'active'
                    }],
                    data: {
                        account: this.account,
                        abi: serializedAbi
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(`✅ Minimal ABI deployed successfully!`);
            console.log(`📋 Transaction ID: ${result.transaction_id}`);
            console.log(``);

            // Wait for processing
            console.log(`⏳ Waiting for blockchain to process...`);
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log(`🎯 Minimal ABI Deployment Summary:`);
            console.log(`==================================================`);
            console.log(`✅ Account: ${this.account}`);
            console.log(`✅ Network: ${this.network} Testnet`);
            console.log(`✅ ABI Transaction: ${result.transaction_id}`);
            console.log(`🌐 Explorer: https://jungle4.greymass.com/account/${this.account}`);
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
    const deployer = new MinimalABIDeployer();
    await deployer.deployMinimalABI();
}

if (require.main === module) {
    main();
}

module.exports = { MinimalABIDeployer }; 