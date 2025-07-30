#!/usr/bin/env node

/**
 * 🚀 Deploy Fixed Contract to Jungle4
 * 
 * This script deploys the Jungle4-compatible contract.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');

class FixedContractDeployer {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.wasmPath = 'jungle4-build/fusionbridge.wasm';
        this.abiPath = 'jungle4-build/fusionbridge.abi';
    }

    async deployFixedContract() {
        console.log(`🚀 Deploying Fixed Contract to Jungle4`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 WASM: ${this.wasmPath}`);
        console.log(`📁 ABI: ${this.abiPath}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(``);

        try {
            // Check if files exist
            if (!fs.existsSync(this.wasmPath)) {
                throw new Error(`WASM file not found: ${this.wasmPath}`);
            }
            if (!fs.existsSync(this.abiPath)) {
                throw new Error(`ABI file not found: ${this.abiPath}`);
            }

            // Initialize EOS connection
            const signatureProvider = new JsSignatureProvider([this.privateKey]);
            const rpc = new JsonRpc(this.rpcUrl);
            const api = new Api({
                rpc: rpc,
                signatureProvider: signatureProvider,
                textDecoder: new TextDecoder(),
                textEncoder: new TextEncoder()
            });

            // Read files
            const wasmBuffer = fs.readFileSync(this.wasmPath);
            const abiContent = fs.readFileSync(this.abiPath, 'utf8');
            const abi = JSON.parse(abiContent);

            console.log(`📋 ABI Version: ${abi.version}`);
            console.log(`📋 Actions: ${abi.actions.length}`);
            console.log(`📋 Tables: ${abi.tables.length}`);
            console.log(``);

            // Deploy WASM code
            console.log(`📦 Deploying WASM code...`);
            const setCodeResult = await api.transact({
                actions: [{
                    account: 'eosio',
                    name: 'setcode',
                    authorization: [{
                        actor: this.account,
                        permission: 'active'
                    }],
                    data: {
                        account: this.account,
                        vmtype: 0,
                        vmversion: 0,
                        code: wasmBuffer
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(`✅ WASM deployed successfully!`);
            console.log(`📋 Transaction ID: ${setCodeResult.transaction_id}`);
            console.log(``);

            // Deploy ABI
            console.log(`📄 Deploying ABI...`);
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
                        abi: abi
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(`✅ ABI deployed successfully!`);
            console.log(`📋 Transaction ID: ${setAbiResult.transaction_id}`);
            console.log(``);

            // Test the deployment
            console.log(`🧪 Testing deployment...`);
            await this.testDeployment(api);

            console.log(`🎉 Deployment completed successfully!`);
            console.log(`============================================================`);
            console.log(`✅ Status: DEPLOYED`);
            console.log(`📁 Contract: fusionbridge`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`🌐 Network: Jungle4 testnet`);
            console.log(`🔗 Explorer: https://jungle4.greymass.com/account/${this.account}`);
            console.log(``);

            console.log(`🧪 Test Commands:`);
            console.log(`cleos -u ${this.rpcUrl} push action ${this.account} getstats '{}' -p ${this.account}@active`);
            console.log(`cleos -u ${this.rpcUrl} get code ${this.account}`);
            console.log(`cleos -u ${this.rpcUrl} get abi ${this.account}`);
            console.log(``);

            return {
                success: true,
                wasmTxId: setCodeResult.transaction_id,
                abiTxId: setAbiResult.transaction_id
            };

        } catch (error) {
            console.error(`❌ Deployment failed: ${error.message}`);
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
    const deployer = new FixedContractDeployer();
    await deployer.deployFixedContract();
}

if (require.main === module) {
    main();
}

module.exports = { FixedContractDeployer }; 