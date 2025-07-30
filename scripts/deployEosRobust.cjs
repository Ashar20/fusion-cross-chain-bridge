#!/usr/bin/env node

/**
 * 🚀 Robust EOS Testnet Deployment
 * 
 * This script deploys the fixed fusionbridge contract with better error handling.
 */

// Load environment variables from .env file
require('dotenv').config();

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');
const path = require('path');

class RobustEosDeployment {
    constructor() {
        this.network = 'jungle4';
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        this.privateKey = '5Hw21rCXdLBRPzKwpQ19ZeVEoWZewDTttuP5PBAvdacBwGnG5HN';
        
        // Fixed files from docker-eos-deployment/output
        this.wasmPath = path.join(__dirname, '../docker-eos-deployment/output/fusionbridge.wasm');
        this.abiPath = path.join(__dirname, '../docker-eos-deployment/output/fusionbridge.abi');
        
        if (!this.privateKey) {
            throw new Error('EOS_PRIVATE_KEY environment variable is required');
        }
        
        // Initialize EOS connection
        this.signatureProvider = new JsSignatureProvider([this.privateKey]);
        this.rpc = new JsonRpc(this.rpcUrl);
        this.api = new Api({
            rpc: this.rpc,
            signatureProvider: this.signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });
    }

    async deploy() {
        console.log(`🚀 Robust EOS Testnet Deployment`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`🌐 Network: ${this.network}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(`📦 WASM: ${this.wasmPath}`);
        console.log(`📄 ABI: ${this.abiPath}`);
        console.log(``);
        
        try {
            // Step 1: Verify account and key
            console.log(`🔍 Step 1: Verifying account and private key...`);
            const accountInfo = await this.rpc.get_account(this.account);
            console.log(`✅ Account verified: ${accountInfo.account_name}`);
            console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
            
            // Step 2: Check files
            console.log(`\n📁 Step 2: Checking compiled files...`);
            if (!fs.existsSync(this.wasmPath)) {
                throw new Error(`WASM file not found: ${this.wasmPath}`);
            }
            if (!fs.existsSync(this.abiPath)) {
                throw new Error(`ABI file not found: ${this.abiPath}`);
            }
            
            const wasmBuffer = fs.readFileSync(this.wasmPath);
            const abiContent = JSON.parse(fs.readFileSync(this.abiPath, 'utf8'));
            
            console.log(`✅ WASM file: ${wasmBuffer.length} bytes`);
            console.log(`✅ ABI file: ${JSON.stringify(abiContent).length} bytes`);
            console.log(`✅ ABI version: ${abiContent.version || 'N/A'}`);
            console.log(`✅ ABI actions: ${abiContent.actions?.length || 0}`);
            console.log(`✅ ABI tables: ${abiContent.tables?.length || 0}`);
            
            // Step 3: Deploy WASM
            console.log(`\n📦 Step 3: Deploying WASM code...`);
            const setCodeResult = await this.api.transact({
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
                        code: Array.from(wasmBuffer)
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 60,
                broadcast: true,
                sign: true
            });
            
            console.log(`✅ WASM deployed successfully!`);
            console.log(`🔗 Transaction: ${setCodeResult.transaction_id}`);
            console.log(`🔗 Explorer: https://jungle4.eosq.eosnation.io/tx/${setCodeResult.transaction_id}`);
            
            // Wait a moment for the transaction to be processed
            console.log(`⏳ Waiting for transaction to be processed...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 4: Deploy ABI
            console.log(`\n📄 Step 4: Deploying ABI...`);
            const setAbiResult = await this.api.transact({
                actions: [{
                    account: 'eosio',
                    name: 'setabi',
                    authorization: [{
                        actor: this.account,
                        permission: 'active'
                    }],
                    data: {
                        account: this.account,
                        abi: JSON.stringify(abiContent)
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 60,
                broadcast: true,
                sign: true
            });
            
            console.log(`✅ ABI deployed successfully!`);
            console.log(`🔗 Transaction: ${setAbiResult.transaction_id}`);
            console.log(`🔗 Explorer: https://jungle4.eosq.eosnation.io/tx/${setAbiResult.transaction_id}`);
            
            // Wait a moment for the transaction to be processed
            console.log(`⏳ Waiting for transaction to be processed...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 5: Verify deployment
            console.log(`\n🔍 Step 5: Verifying deployment...`);
            await this.verifyDeployment();
            
            console.log(`\n🎉 Deployment completed successfully!`);
            console.log(`============================================================`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`🌐 Network: ${this.network}`);
            console.log(`🔗 WASM TX: ${setCodeResult.transaction_id}`);
            console.log(`🔗 ABI TX: ${setAbiResult.transaction_id}`);
            console.log(`\n📋 Next Steps:`);
            console.log(`   1. Test contract actions`);
            console.log(`   2. Create HTLC: createhtlc`);
            console.log(`   3. Claim HTLC: claimhtlc`);
            console.log(`   4. Refund HTLC: refundhtlc`);
            
            return {
                success: true,
                wasmTx: setCodeResult.transaction_id,
                abiTx: setAbiResult.transaction_id
            };
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            if (error.details) {
                console.error('   Details:', error.details);
            }
            if (error.error) {
                console.error('   Error:', error.error);
            }
            return { success: false, error: error.message };
        }
    }

    async verifyDeployment() {
        try {
            // Check WASM code
            const codeInfo = await this.rpc.get_code(this.account);
            if (codeInfo.wasm && codeInfo.wasm.length > 0) {
                console.log(`   ✅ WASM code verified: ${codeInfo.wasm.length} bytes`);
            } else {
                console.log(`   ❌ WASM code not found`);
            }
            
            // Check ABI
            const abiInfo = await this.rpc.get_abi(this.account);
            if (abiInfo.abi) {
                console.log(`   ✅ ABI verified: ${abiInfo.abi.actions?.length || 0} actions`);
                console.log(`   📋 Actions: ${abiInfo.abi.actions?.map(a => a.name).join(', ') || 'None'}`);
            } else {
                console.log(`   ❌ ABI not found`);
            }
            
        } catch (error) {
            console.log(`   ⚠️  Verification failed: ${error.message}`);
        }
    }
}

// Run the deployment
async function main() {
    const deployment = new RobustEosDeployment();
    
    try {
        const result = await deployment.deploy();
        
        if (result.success) {
            console.log('\n🎯 Deployment Summary:');
            console.log(`   ✅ WASM: ${result.wasmTx}`);
            console.log(`   ✅ ABI: ${result.abiTx}`);
        } else {
            console.error('\n❌ Deployment failed!');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { RobustEosDeployment };