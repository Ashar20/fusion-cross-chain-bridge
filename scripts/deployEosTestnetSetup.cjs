#!/usr/bin/env node

/**
 * 🐳 EOS Testnet Deployment Setup
 * 
 * This script helps set up and deploy the fixed fusionbridge contract to EOS testnet.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fs = require('fs');
const path = require('path');

class EosTestnetSetup {
    constructor() {
        this.network = 'jungle4';
        this.rpcUrl = 'https://jungle4.cryptolions.io';
        this.account = 'quicksnake34';
        
        // Fixed files from docker-eos-deployment/output
        this.wasmPath = path.join(__dirname, '../docker-eos-deployment/output/fusionbridge.wasm');
        this.abiPath = path.join(__dirname, '../docker-eos-deployment/output/fusionbridge.abi');
    }

    async checkEnvironment() {
        console.log(`🔧 EOS Testnet Deployment Setup`);
        console.log(`============================================================`);
        
        // Check environment variables
        console.log(`\n📋 Step 1: Environment Check`);
        const privateKey = process.env.EOS_PRIVATE_KEY;
        
        if (!privateKey) {
            console.log(`❌ EOS_PRIVATE_KEY not set in environment`);
            console.log(`💡 Please set your EOS testnet private key:`);
            console.log(`   export EOS_PRIVATE_KEY="your_private_key_here"`);
            console.log(`   or add to your .env file: EOS_PRIVATE_KEY=your_private_key_here`);
            return false;
        }
        
        console.log(`✅ EOS_PRIVATE_KEY is set`);
        
        // Check if files exist
        console.log(`\n📁 Step 2: File Check`);
        if (!fs.existsSync(this.wasmPath)) {
            console.log(`❌ WASM file not found: ${this.wasmPath}`);
            return false;
        }
        if (!fs.existsSync(this.abiPath)) {
            console.log(`❌ ABI file not found: ${this.abiPath}`);
            return false;
        }
        
        const wasmBuffer = fs.readFileSync(this.wasmPath);
        const abiContent = JSON.parse(fs.readFileSync(this.abiPath, 'utf8'));
        
        console.log(`✅ WASM file: ${wasmBuffer.length} bytes`);
        console.log(`✅ ABI file: ${JSON.stringify(abiContent).length} bytes`);
        console.log(`✅ ABI version: ${abiContent.version || 'N/A'}`);
        console.log(`✅ ABI actions: ${abiContent.actions?.length || 0}`);
        console.log(`✅ ABI tables: ${abiContent.tables?.length || 0}`);
        
        return true;
    }

    async checkAccount() {
        console.log(`\n👤 Step 3: Account Check`);
        
        const privateKey = process.env.EOS_PRIVATE_KEY;
        const signatureProvider = new JsSignatureProvider([privateKey]);
        const rpc = new JsonRpc(this.rpcUrl);
        const api = new Api({
            rpc: rpc,
            signatureProvider: signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });
        
        try {
            const accountInfo = await rpc.get_account(this.account);
            console.log(`✅ Account exists: ${accountInfo.account_name}`);
            console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
            console.log(`📊 RAM: ${accountInfo.ram_quota} bytes`);
            console.log(`⚡ CPU: ${accountInfo.cpu_weight} EOS`);
            console.log(`🌐 NET: ${accountInfo.net_weight} EOS`);
            return true;
        } catch (error) {
            console.log(`❌ Account not found: ${this.account}`);
            console.log(`💡 You need to create this account first or use an existing account`);
            console.log(`\n📋 Options:`);
            console.log(`   1. Create account '${this.account}' on Jungle4 testnet`);
            console.log(`   2. Use an existing account (update the script)`);
            console.log(`   3. Get testnet tokens from: https://monitor.jungletestnet.io/`);
            return false;
        }
    }

    async deploy() {
        console.log(`\n🚀 Step 4: Deploying Contract`);
        
        const privateKey = process.env.EOS_PRIVATE_KEY;
        const signatureProvider = new JsSignatureProvider([privateKey]);
        const rpc = new JsonRpc(this.rpcUrl);
        const api = new Api({
            rpc: rpc,
            signatureProvider: signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });
        
        try {
            const wasmBuffer = fs.readFileSync(this.wasmPath);
            const abiContent = JSON.parse(fs.readFileSync(this.abiPath, 'utf8'));
            
            // Deploy WASM
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
                        code: Array.from(wasmBuffer)
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });
            
            console.log(`✅ WASM deployed! TX: ${setCodeResult.transaction_id}`);
            
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
                        abi: JSON.stringify(abiContent)
                    }
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });
            
            console.log(`✅ ABI deployed! TX: ${setAbiResult.transaction_id}`);
            
            console.log(`\n🎉 Deployment completed successfully!`);
            console.log(`============================================================`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`🌐 Network: ${this.network}`);
            console.log(`🔗 WASM TX: ${setCodeResult.transaction_id}`);
            console.log(`🔗 ABI TX: ${setAbiResult.transaction_id}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            if (error.details) {
                console.error('   Details:', error.details);
            }
            return false;
        }
    }

    async run() {
        // Check environment
        if (!await this.checkEnvironment()) {
            console.log(`\n❌ Setup incomplete. Please fix the issues above.`);
            return;
        }
        
        // Check account
        if (!await this.checkAccount()) {
            console.log(`\n❌ Account issue. Please create the account or use an existing one.`);
            return;
        }
        
        // Deploy
        await this.deploy();
    }
}

// Run the setup
async function main() {
    const setup = new EosTestnetSetup();
    await setup.run();
}

if (require.main === module) {
    main();
}

module.exports = { EosTestnetSetup }; 