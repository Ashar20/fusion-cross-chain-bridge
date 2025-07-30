#!/usr/bin/env node

/**
 * 📄 Deploy Fixed ABI to Jungle4 (Hex Serialized)
 * 
 * This script deploys the fixed ABI with proper hex serialization.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');

class FixedABIHexDeployer {
    constructor() {
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        this.abiPath = 'jungle4-build/fusionbridge.abi';
    }

    async deployFixedABI() {
        console.log(`📄 Deploying Fixed ABI to Jungle4 (Hex Serialized)`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 ABI: ${this.abiPath}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(``);

        try {
            // Check if ABI file exists
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

            // Read ABI file and serialize to hex
            const abiContent = fs.readFileSync(this.abiPath, 'utf8');
            const abi = JSON.parse(abiContent);
            const abiHex = Buffer.from(abiContent, 'utf8').toString('hex');

            console.log(`📋 ABI Version: ${abi.version}`);
            console.log(`📋 Actions: ${abi.actions.length}`);
            console.log(`📋 Tables: ${abi.tables.length}`);
            console.log(`📋 Hex Length: ${abiHex.length} characters`);
            console.log(``);

            // Deploy ABI with hex serialization
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
                        abi: abiHex
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

            console.log(`🎉 ABI deployment completed successfully!`);
            console.log(`============================================================`);
            console.log(`✅ Status: ABI DEPLOYED`);
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
                abiTxId: setAbiResult.transaction_id
            };

        } catch (error) {
            console.error(`❌ ABI deployment failed: ${error.message}`);
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
    const deployer = new FixedABIHexDeployer();
    await deployer.deployFixedABI();
}

if (require.main === module) {
    main();
}

module.exports = { FixedABIHexDeployer }; 