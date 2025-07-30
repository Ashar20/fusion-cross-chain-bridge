#!/usr/bin/env node

/**
 * 🎯 Create HTLC Raw RPC - No ABI Required
 * 
 * This script creates an HTLC using raw RPC calls, completely bypassing ABI issues.
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

class HTLCRawRPCCreator {
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

    // Convert private key to public key
    privateKeyToPublicKey(privateKey) {
        const { Eos } = require('eosjs');
        const ecc = require('eosjs-ecc');
        
        try {
            const publicKey = ecc.privateToPublic(privateKey);
            return publicKey;
        } catch (error) {
            throw new Error(`Failed to convert private key: ${error.message}`);
        }
    }

    // Serialize action data manually
    serializeActionData(actionData) {
        // This is a simplified serialization for the createhtlc action
        // In a real implementation, you'd use proper EOS serialization
        const { TextEncoder } = require('util');
        const encoder = new TextEncoder();
        
        // Convert to hex string (simplified approach)
        const jsonStr = JSON.stringify(actionData);
        const buffer = encoder.encode(jsonStr);
        return Buffer.from(buffer).toString('hex');
    }

    async createHTLCRawRPC() {
        console.log(`🎯 Create HTLC Raw RPC - No ABI Required`);
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
            console.log(``);

            // Get account info first
            console.log(`📋 Getting account info...`);
            const accountResponse = await fetch(`${this.rpcUrl}/v1/chain/get_account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_name: this.account })
            });

            if (!accountResponse.ok) {
                throw new Error(`Failed to get account info: ${accountResponse.statusText}`);
            }

            const accountInfo = await accountResponse.json();
            console.log(`✅ Account found: ${accountInfo.account_name}`);
            console.log(`💰 Balance: ${accountInfo.core_liquid}`);
            console.log(``);

            // Get chain info for transaction
            console.log(`📋 Getting chain info...`);
            const chainResponse = await fetch(`${this.rpcUrl}/v1/chain/get_info`);
            if (!chainResponse.ok) {
                throw new Error(`Failed to get chain info: ${chainResponse.statusText}`);
            }

            const chainInfo = await chainResponse.json();
            console.log(`✅ Chain ID: ${chainInfo.chain_id}`);
            console.log(`📋 Head Block: ${chainInfo.head_block_num}`);
            console.log(``);

            // Create transaction structure
            const transaction = {
                expiration: new Date(Date.now() + 30000).toISOString().slice(0, -1), // 30 seconds from now
                ref_block_num: chainInfo.head_block_num & 0xFFFF,
                ref_block_prefix: 0,
                max_net_usage_words: 0,
                max_cpu_usage_ms: 0,
                delay_sec: 0,
                context_free_actions: [],
                actions: [
                    {
                        account: this.contract,
                        name: 'createhtlc',
                        authorization: [
                            {
                                actor: this.account,
                                permission: 'active'
                            }
                        ],
                        data: {
                            sender: this.account,
                            recipient: this.account,
                            amount: amount,
                            hashlock: hashlock,
                            timelock: timelock,
                            memo: memo,
                            eth_tx_hash: ethTxHash
                        }
                    }
                ],
                transaction_extensions: []
            };

            console.log(`📋 Transaction structure created`);
            console.log(`⏰ Expiration: ${transaction.expiration}`);
            console.log(``);

            // Get required keys
            console.log(`🔑 Getting required keys...`);
            const requiredKeysResponse = await fetch(`${this.rpcUrl}/v1/chain/get_required_keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction: transaction,
                    available_keys: [this.privateKeyToPublicKey(this.privateKey)]
                })
            });

            if (!requiredKeysResponse.ok) {
                throw new Error(`Failed to get required keys: ${requiredKeysResponse.statusText}`);
            }

            const requiredKeys = await requiredKeysResponse.json();
            console.log(`✅ Required keys: ${requiredKeys.required_keys.length}`);
            console.log(``);

            // Sign transaction
            console.log(`✍️  Signing transaction...`);
            const { Eos } = require('eosjs');
            const eos = new Eos({
                httpEndpoint: this.rpcUrl,
                keyProvider: [this.privateKey]
            });

            const signedTx = await eos.transaction(transaction, {
                broadcast: false,
                sign: true
            });

            console.log(`✅ Transaction signed`);
            console.log(`📋 Transaction ID: ${signedTx.transaction_id}`);
            console.log(``);

            // Broadcast transaction
            console.log(`📡 Broadcasting transaction...`);
            const broadcastResponse = await fetch(`${this.rpcUrl}/v1/chain/push_transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signatures: signedTx.signatures,
                    compression: 0,
                    packed_context_free_data: '',
                    packed_trx: signedTx.packed_trx
                })
            });

            if (!broadcastResponse.ok) {
                const errorText = await broadcastResponse.text();
                throw new Error(`Broadcast failed: ${errorText}`);
            }

            const broadcastResult = await broadcastResponse.json();
            console.log(`✅ Transaction broadcasted successfully!`);
            console.log(`📋 Transaction ID: ${broadcastResult.transaction_id}`);
            console.log(`🔗 Explorer: https://jungle4.greymass.com/transaction/${broadcastResult.transaction_id}`);
            console.log(``);

            console.log(`🎉 HTLC Raw RPC Creation Summary:`);
            console.log(`============================================================`);
            console.log(`✅ Status: HTLC CREATED VIA RAW RPC`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`💰 Amount: ${amount}`);
            console.log(`🔐 Hashlock: ${hashlock}`);
            console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
            console.log(`📋 TX ID: ${broadcastResult.transaction_id}`);
            console.log(``);

            console.log(`🧪 Verification Commands:`);
            console.log(`curl -X POST ${this.rpcUrl}/v1/chain/get_table_rows -H "Content-Type: application/json" -d '{"json":true,"code":"${this.contract}","scope":"${this.contract}","table":"htlcs","lower_bound":"","upper_bound":"","limit":10}'`);
            console.log(``);

            return {
                success: true,
                transactionId: broadcastResult.transaction_id,
                hashlock: hashlock,
                amount: amount,
                timelock: timelock
            };

        } catch (error) {
            console.error(`❌ HTLC creation failed: ${error.message}`);
            
            // Provide curl command as fallback
            console.log(`🔧 Fallback: Direct curl command`);
            console.log(`============================================================`);
            console.log(`📋 Use this curl command directly:`);
            console.log(``);
            
            const hashlock = this.generateHashlock();
            const timelock = Math.floor(Date.now() / 1000) + 3600;
            
            console.log(`curl -X POST ${this.rpcUrl}/v1/chain/push_transaction \\`);
            console.log(`  -H "Content-Type: application/json" \\`);
            console.log(`  -d '{`);
            console.log(`    "actions": [{`);
            console.log(`      "account": "${this.contract}",`);
            console.log(`      "name": "createhtlc",`);
            console.log(`      "authorization": [{`);
            console.log(`        "actor": "${this.account}",`);
            console.log(`        "permission": "active"`);
            console.log(`      }],`);
            console.log(`      "data": {`);
            console.log(`        "sender": "${this.account}",`);
            console.log(`        "recipient": "${this.account}",`);
            console.log(`        "amount": "0.1000 EOS",`);
            console.log(`        "hashlock": "${hashlock}",`);
            console.log(`        "timelock": ${timelock},`);
            console.log(`        "memo": "Real HTLC for cross-chain atomic swap",`);
            console.log(`        "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"`);
            console.log(`      }`);
            console.log(`    }]`);
            console.log(`  }'`);
            console.log(``);
            
            return { success: false, error: error.message };
        }
    }
}

async function main() {
    const creator = new HTLCRawRPCCreator();
    await creator.createHTLCRawRPC();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCRawRPCCreator }; 