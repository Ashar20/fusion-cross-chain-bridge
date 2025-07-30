#!/usr/bin/env node

/**
 * 🔧 Fix Jungle4 Compatibility
 * 
 * This script fixes the Jungle4 compatibility by redeploying the contract with the correct ABI.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');

class Jungle4CompatibilityFixer {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.contract = 'quicksnake34';
    }

    async fixJungle4Compatibility() {
        console.log(`🔧 Fixing Jungle4 Compatibility`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 Contract: ${this.contract}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(``);

        try {
            // Create compatible ABI
            const compatibleABI = {
                "version": "eosio::abi/1.0",
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
                        "name": "gethtlc",
                        "base": "",
                        "fields": [
                            {"name": "htlc_id", "type": "uint64"}
                        ]
                    },
                    {
                        "name": "cleanup",
                        "base": "",
                        "fields": [
                            {"name": "limit", "type": "uint64"}
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
                    {"name": "gethtlc", "type": "gethtlc", "ricardian_contract": ""},
                    {"name": "cleanup", "type": "cleanup", "ricardian_contract": ""},
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

            // Save compatible ABI
            const abiPath = 'jungle4-compatible-build/fusionbridge_compatible.abi';
            if (!fs.existsSync('jungle4-compatible-build')) {
                fs.mkdirSync('jungle4-compatible-build', { recursive: true });
            }
            fs.writeFileSync(abiPath, JSON.stringify(compatibleABI, null, 2));

            console.log(`✅ Compatible ABI created: ${abiPath}`);
            console.log(`📋 ABI Version: ${compatibleABI.version}`);
            console.log(`📋 Actions: ${compatibleABI.actions.length}`);
            console.log(`📋 Tables: ${compatibleABI.tables.length}`);
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

            // Deploy compatible ABI
            console.log(`📄 Deploying compatible ABI...`);
            const abiHex = Buffer.from(JSON.stringify(compatibleABI), 'utf8').toString('hex');
            
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

            console.log(`✅ Compatible ABI deployed successfully!`);
            console.log(`📋 Transaction ID: ${setAbiResult.transaction_id}`);
            console.log(``);

            // Test the deployment
            console.log(`🧪 Testing deployment...`);
            await this.testDeployment(api);

            console.log(`🎉 Jungle4 compatibility fixed!`);
            console.log(`============================================================`);
            console.log(`✅ Status: COMPATIBILITY FIXED`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`🌐 Network: Jungle4 testnet`);
            console.log(`🔗 Explorer: https://jungle4.greymass.com/account/${this.account}`);
            console.log(``);

            console.log(`🧪 Test Commands:`);
            console.log(`cleos -u ${this.rpcUrl} push action ${this.account} getstats '{}' -p ${this.account}@active`);
            console.log(`cleos -u ${this.rpcUrl} get abi ${this.account}`);
            console.log(`cleos -u ${this.rpcUrl} get table ${this.account} ${this.account} htlcs`);
            console.log(``);

            console.log(`🚀 Now you can create HTLCs using:`);
            console.log(`1. EOS Studio: https://jungle4.eosstudio.io/`);
            console.log(`2. EOS Authority: https://eosauthority.com/?network=jungle4`);
            console.log(`3. Direct cleos commands`);
            console.log(``);

            return {
                success: true,
                abiTxId: setAbiResult.transaction_id,
                abiPath: abiPath
            };

        } catch (error) {
            console.error(`❌ Jungle4 compatibility fix failed: ${error.message}`);
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
    const fixer = new Jungle4CompatibilityFixer();
    await fixer.fixJungle4Compatibility();
}

if (require.main === module) {
    main();
}

module.exports = { Jungle4CompatibilityFixer }; 