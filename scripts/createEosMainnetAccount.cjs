#!/usr/bin/env node

/**
 * 🌐 Create EOS Mainnet Account
 * 
 * This script creates a new EOS mainnet account for the cross-chain bridge.
 */

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

class EosMainnetAccountCreator {
    constructor() {
        this.rpcUrl = 'https://api.eosauthority.com';
        this.accountName = 'attachedsuit';
        this.ownerKey = 'EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9';
        this.activeKey = 'EOS8472qBGGeqfH8Yqcj9AG1o2RCfTCZVQcVeNPwVqYUfxFRu6sY9';
        
        // You'll need to provide the private key for the account that will pay for the creation
        this.creatorPrivateKey = process.env.EOS_MAINNET_CREATOR_PRIVATE_KEY;
        this.creatorAccount = process.env.EOS_MAINNET_CREATOR_ACCOUNT;
        
        if (!this.creatorPrivateKey) {
            throw new Error('EOS_MAINNET_CREATOR_PRIVATE_KEY environment variable is required');
        }
        if (!this.creatorAccount) {
            throw new Error('EOS_MAINNET_CREATOR_ACCOUNT environment variable is required');
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
        console.log('🌐 Creating EOS Mainnet Account');
        console.log('=' .repeat(60));
        console.log(`📁 Account Name: ${this.accountName}`);
        console.log(`🔑 Owner Key: ${this.ownerKey}`);
        console.log(`🔑 Active Key: ${this.activeKey}`);
        console.log(`💰 Creator Account: ${this.creatorAccount}`);
        console.log(`🌐 RPC URL: ${this.rpcUrl}\n`);

        try {
            // Check if account already exists
            console.log('🔍 Checking if account already exists...');
            try {
                const accountInfo = await this.rpc.get_account(this.accountName);
                console.log(`   ✅ Account ${this.accountName} already exists!`);
                console.log(`   📅 Created: ${accountInfo.created}`);
                console.log(`   💰 Balance: ${accountInfo.core_liquid}`);
                return { success: true, message: 'Account already exists', accountInfo };
            } catch (error) {
                if (error.message.includes('unknown key')) {
                    console.log(`   ❌ Account ${this.accountName} does not exist. Creating...`);
                } else {
                    throw error;
                }
            }

            // Create the account
            console.log('\n🔨 Creating account...');
            const actions = [
                {
                    account: 'eosio',
                    name: 'newaccount',
                    authorization: [{ actor: this.creatorAccount, permission: 'active' }],
                    data: {
                        creator: this.creatorAccount,
                        name: this.accountName,
                        owner: {
                            threshold: 1,
                            keys: [{ key: this.ownerKey, weight: 1 }],
                            accounts: [],
                            waits: []
                        },
                        active: {
                            threshold: 1,
                            keys: [{ key: this.activeKey, weight: 1 }],
                            accounts: [],
                            waits: []
                        }
                    }
                },
                {
                    account: 'eosio',
                    name: 'buyrambytes',
                    authorization: [{ actor: this.creatorAccount, permission: 'active' }],
                    data: {
                        payer: this.creatorAccount,
                        receiver: this.accountName,
                        bytes: 1800
                    }
                },
                {
                    account: 'eosio',
                    name: 'delegatebw',
                    authorization: [{ actor: this.creatorAccount, permission: 'active' }],
                    data: {
                        from: this.creatorAccount,
                        receiver: this.accountName,
                        stake_net_quantity: '0.0500 EOS',
                        stake_cpu_quantity: '1.0000 EOS',
                        transfer: false
                    }
                }
            ];

            const transaction = await this.api.transact({
                actions: actions
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(`   ✅ Account created successfully!`);
            console.log(`   🔗 Transaction ID: ${transaction.transaction_id}`);
            console.log(`   📊 Block: ${transaction.processed.block_num}`);

            // Verify the account was created
            console.log('\n🔍 Verifying account creation...');
            const accountInfo = await this.rpc.get_account(this.accountName);
            console.log(`   ✅ Account verified!`);
            console.log(`   📅 Created: ${accountInfo.created}`);
            console.log(`   💰 Balance: ${accountInfo.core_liquid}`);
            console.log(`   🧠 RAM: ${accountInfo.ram_quota} bytes`);
            console.log(`   🌐 NET: ${accountInfo.net_weight}`);
            console.log(`   💻 CPU: ${accountInfo.cpu_weight}`);

            return {
                success: true,
                transactionId: transaction.transaction_id,
                accountInfo: accountInfo
            };

        } catch (error) {
            console.error('❌ Account creation failed:', error.message);
            if (error.details) {
                console.error('   Details:', error.details);
            }
            return { success: false, error: error.message };
        }
    }

    async getAccountCost() {
        console.log('\n💰 Estimating account creation cost...');
        try {
            // Get current RAM price
            const ramPrice = await this.rpc.get_table_rows({
                json: true,
                code: 'eosio',
                scope: 'eosio',
                table: 'global',
                limit: 1
            });

            if (ramPrice.rows.length > 0) {
                const ramPricePerKb = ramPrice.rows[0].ram_price_per_kb;
                const ramBytes = 1800;
                const ramCost = (ramBytes / 1024) * ramPricePerKb;
                
                console.log(`   🧠 RAM Cost: ~${ramCost.toFixed(4)} EOS`);
                console.log(`   🌐 NET Stake: 0.0500 EOS`);
                console.log(`   💻 CPU Stake: 1.0000 EOS`);
                console.log(`   💰 Total Estimated Cost: ~${(ramCost + 1.05).toFixed(4)} EOS`);
            }
        } catch (error) {
            console.log(`   ⚠️  Could not estimate cost: ${error.message}`);
        }
    }
}

// Run the account creator
async function main() {
    try {
        const creator = new EosMainnetAccountCreator();
        
        // Show cost estimate first
        await creator.getAccountCost();
        
        // Create the account
        const result = await creator.createAccount();
        
        if (result.success) {
            console.log('\n🎉 Account creation completed successfully!');
            console.log('=' .repeat(60));
            console.log(`📁 Account: ${creator.accountName}`);
            console.log(`🔑 Owner Key: ${creator.ownerKey}`);
            console.log(`🔑 Active Key: ${creator.activeKey}`);
            console.log(`🔗 Transaction: ${result.transactionId}`);
            console.log('\n📋 Next Steps:');
            console.log('   1. Save the account name and keys securely');
            console.log('   2. Set EOS_MAINNET_ACCOUNT=attachedsuit in your .env file');
            console.log('   3. Set EOS_MAINNET_PRIVATE_KEY=<your_private_key> in your .env file');
            console.log('   4. Run: npm run deploy-eos-mainnet');
        } else {
            console.error('\n❌ Account creation failed!');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Script failed:', error.message);
        console.log('\n📋 Setup Instructions:');
        console.log('   1. Set EOS_MAINNET_CREATOR_PRIVATE_KEY in your .env file');
        console.log('   2. Set EOS_MAINNET_CREATOR_ACCOUNT in your .env file');
        console.log('   3. Ensure your creator account has sufficient EOS balance');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { EosMainnetAccountCreator }; 