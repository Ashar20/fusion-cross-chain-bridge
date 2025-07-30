#!/usr/bin/env node

/**
 * 🌴 Create Jungle4 Testnet Account
 * 
 * This script helps create the silaslist123 account on Jungle4 testnet.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

class Jungle4AccountCreator {
    constructor() {
        this.network = 'jungle4';
        this.rpcUrl = 'https://api.eosauthority.com';
        this.newAccountName = 'silaslist123';
        this.ownerKey = 'EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9';
        this.activeKey = 'EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9';
        
        // You'll need a creator account with testnet tokens
        this.creatorPrivateKey = process.env.EOS_PRIVATE_KEY;
        
        if (!this.creatorPrivateKey) {
            throw new Error('EOS_PRIVATE_KEY environment variable is required');
        }
        
        this.rpc = new JsonRpc(this.rpcUrl);
        this.signatureProvider = new JsSignatureProvider([this.creatorPrivateKey]);
        this.api = new Api({
            rpc: this.rpc,
            signatureProvider: this.signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });
    }

    async createAccount() {
        console.log(`🌴 Creating Jungle4 Testnet Account`);
        console.log(`============================================================`);
        console.log(`📁 New Account: ${this.newAccountName}`);
        console.log(`🔑 Owner Key: ${this.ownerKey}`);
        console.log(`🔑 Active Key: ${this.activeKey}`);
        console.log(`🌐 Network: ${this.network}`);
        console.log(`🌐 RPC: ${this.rpcUrl}`);
        console.log(``);
        
        try {
            // Step 1: Check if account already exists
            console.log(`📋 Step 1: Checking if account exists...`);
            try {
                const accountInfo = await this.rpc.get_account(this.newAccountName);
                console.log(`✅ Account already exists: ${accountInfo.account_name}`);
                console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
                return true;
            } catch (error) {
                console.log(`📝 Account does not exist, will create it...`);
            }
            
            // Step 2: Get account creation cost
            console.log(`\n💰 Step 2: Getting account creation cost...`);
            const cost = await this.getAccountCost();
            console.log(`💵 Estimated cost: ${cost.total} EOS`);
            console.log(`   - RAM: ${cost.ram} EOS`);
            console.log(`   - NET: ${cost.net} EOS`);
            console.log(`   - CPU: ${cost.cpu} EOS`);
            
            // Step 3: Create account
            console.log(`\n🚀 Step 3: Creating account...`);
            const result = await this.api.transact({
                actions: [
                    {
                        account: 'eosio',
                        name: 'newaccount',
                        authorization: [{
                            actor: 'eosio',
                            permission: 'active'
                        }],
                        data: {
                            creator: 'eosio',
                            name: this.newAccountName,
                            owner: {
                                threshold: 1,
                                keys: [{
                                    key: this.ownerKey,
                                    weight: 1
                                }],
                                accounts: [],
                                waits: []
                            },
                            active: {
                                threshold: 1,
                                keys: [{
                                    key: this.activeKey,
                                    weight: 1
                                }],
                                accounts: [],
                                waits: []
                            }
                        }
                    },
                    {
                        account: 'eosio',
                        name: 'buyrambytes',
                        authorization: [{
                            actor: 'eosio',
                            permission: 'active'
                        }],
                        data: {
                            payer: 'eosio',
                            receiver: this.newAccountName,
                            bytes: 1800
                        }
                    },
                    {
                        account: 'eosio',
                        name: 'delegatebw',
                        authorization: [{
                            actor: 'eosio',
                            permission: 'active'
                        }],
                        data: {
                            from: 'eosio',
                            receiver: this.newAccountName,
                            stake_net_quantity: '0.0500 EOS',
                            stake_cpu_quantity: '1.0000 EOS',
                            transfer: false
                        }
                    }
                ]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });
            
            console.log(`✅ Account created successfully!`);
            console.log(`🔗 Transaction: ${result.transaction_id}`);
            console.log(`🔗 Explorer: https://jungle4.eosq.eosnation.io/tx/${result.transaction_id}`);
            
            // Step 4: Verify account
            console.log(`\n🔍 Step 4: Verifying account...`);
            await this.verifyAccount();
            
            console.log(`\n🎉 Account creation completed!`);
            console.log(`============================================================`);
            console.log(`📁 Account: ${this.newAccountName}`);
            console.log(`🔑 Owner Key: ${this.ownerKey}`);
            console.log(`🔑 Active Key: ${this.activeKey}`);
            console.log(`🔗 TX: ${result.transaction_id}`);
            console.log(`\n📋 Next Steps:`);
            console.log(`   1. Deploy the fusionbridge contract`);
            console.log(`   2. Test contract actions`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Account creation failed:', error.message);
            if (error.details) {
                console.error('   Details:', error.details);
            }
            return false;
        }
    }

    async getAccountCost() {
        try {
            // Get RAM price
            const ramPrice = await this.rpc.get_table_rows({
                json: true,
                code: 'eosio',
                scope: 'eosio',
                table: 'rammarket',
                limit: 1
            });
            
            const ramBytes = 1800;
            const ramPricePerKb = parseFloat(ramPrice.rows[0].quote.balance) / parseFloat(ramPrice.rows[0].base.balance);
            const ramCost = (ramBytes / 1024) * ramPricePerKb;
            
            return {
                ram: ramCost.toFixed(4),
                net: 0.0500,
                cpu: 1.0000,
                total: (ramCost + 0.0500 + 1.0000).toFixed(4)
            };
        } catch (error) {
            return {
                ram: '0.3000',
                net: 0.0500,
                cpu: 1.0000,
                total: '1.3500'
            };
        }
    }

    async verifyAccount() {
        try {
            const accountInfo = await this.rpc.get_account(this.newAccountName);
            console.log(`✅ Account verified: ${accountInfo.account_name}`);
            console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`);
            console.log(`📊 RAM: ${accountInfo.ram_quota} bytes`);
            console.log(`⚡ CPU: ${accountInfo.cpu_weight} EOS`);
            console.log(`🌐 NET: ${accountInfo.net_weight} EOS`);
        } catch (error) {
            console.log(`⚠️  Verification failed: ${error.message}`);
        }
    }
}

// Run the account creation
async function main() {
    const creator = new Jungle4AccountCreator();
    
    try {
        const result = await creator.createAccount();
        
        if (result) {
            console.log('\n🎯 Account creation successful!');
            console.log(`   📁 Account: silaslist123`);
            console.log(`   🔑 Keys: EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9`);
        } else {
            console.error('\n❌ Account creation failed!');
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

module.exports = { Jungle4AccountCreator }; 