#!/usr/bin/env node

/**
 * 📄 Create Minimal ABI for Jungle4
 * 
 * This script creates a minimal ABI that should be compatible with Jungle4 testnet.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');

class MinimalABICreator {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
    }

    async createMinimalABI() {
        console.log(`📄 Creating Minimal ABI for Jungle4`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
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
                            {"name": "created_at", "type": "uint32"}
                        ]
                    }
                ],
                "actions": [
                    {"name": "createhtlc", "type": "createhtlc", "ricardian_contract": ""},
                    {"name": "claimhtlc", "type": "claimhtlc", "ricardian_contract": ""},
                    {"name": "refundhtlc", "type": "refundhtlc", "ricardian_contract": ""},
                    {"name": "getstats", "type": "getstats", "ricardian_contract": ""}
                ],
                "tables": [
                    {
                        "name": "htlcs",
                        "type": "htlc",
                        "index_type": "i64",
                        "key_names": ["id"],
                        "key_types": ["uint64"]
                    }
                ],
                "ricardian_clauses": [],
                "variants": []
            };

            // Save minimal ABI
            const abiPath = 'jungle4-build/fusionbridge_minimal.abi';
            fs.writeFileSync(abiPath, JSON.stringify(minimalABI, null, 2));

            console.log(`✅ Minimal ABI created: ${abiPath}`);
            console.log(`📋 ABI Version: ${minimalABI.version}`);
            console.log(`📋 Actions: ${minimalABI.actions.length}`);
            console.log(`📋 Tables: ${minimalABI.tables.length}`);
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

            // Deploy minimal ABI
            console.log(`📄 Deploying minimal ABI...`);
            const abiHex = Buffer.from(JSON.stringify(minimalABI), 'utf8').toString('hex');
            
            const setAbiResult = await api.transact({
                actions: [{
                    account: 'eosio',
                    name: 'setabi',
                    authorization: [{
                        actor: this.account,
                        permission: 'active'
                    }],
                    data: {
                        account: this.account,
                        abi: abiHex
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(`✅ Minimal ABI deployed successfully!`);
            console.log(`📋 Transaction ID: ${setAbiResult.transaction_id}`);
            console.log(``);

            // Test the deployment
            console.log(`🧪 Testing minimal ABI...`);
            await this.testDeployment(api);

            console.log(`🎉 Minimal ABI deployment completed!`);
            console.log(`============================================================`);
            console.log(`✅ Status: MINIMAL ABI DEPLOYED`);
            console.log(`📁 Contract: fusionbridge`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`🌐 Network: Jungle4 testnet`);
            console.log(`🔗 Explorer: https://jungle4.greymass.com/account/${this.account}`);
            console.log(``);

            console.log(`🧪 Test Commands:`);
            console.log(`cleos -u ${this.rpcUrl} push action ${this.account} getstats '{}' -p ${this.account}@active`);
            console.log(`cleos -u ${this.rpcUrl} get abi ${this.account}`);
            console.log(`cleos -u ${this.rpcUrl} get table ${this.account} ${this.account} htlcs`);
            console.log(``);

            return {
                success: true,
                abiTxId: setAbiResult.transaction_id,
                abiPath: abiPath
            };

        } catch (error) {
            console.error(`❌ Minimal ABI deployment failed: ${error.message}`);
            if (error.details) {
                console.error(`📋 Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            return { success: false, error: error.message };
        }
    }

    async testDeployment(api) {
        try {
            // Test getstats action
            const testResult = await api.transact({
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

            console.log(`✅ getstats action works!`);
            console.log(`📋 Test TX ID: ${testResult.transaction_id}`);

        } catch (error) {
            console.log(`⚠️  Test failed: ${error.message}`);
        }
    }
}

async function main() {
    const creator = new MinimalABICreator();
    await creator.createMinimalABI();
}

if (require.main === module) {
    main();
}

module.exports = { MinimalABICreator }; 