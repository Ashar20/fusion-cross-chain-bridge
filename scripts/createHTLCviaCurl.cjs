#!/usr/bin/env node

/**
 * 🔐 Create HTLC via CURL
 * 
 * This script creates an HTLC using curl and direct RPC calls.
 */

const { exec } = require('child_process');
const crypto = require('crypto');

class HTLCCurlCreator {
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

    async createHTLCviaCurl() {
        console.log(`🔐 Creating HTLC via CURL`);
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
            const memo = 'HTLC via CURL for cross-chain swap';
            const ethTxHash = '0x' + '0'.repeat(64);

            console.log(`🔍 HTLC Parameters:`);
            console.log(`   💰 Amount: ${amount}`);
            console.log(`   🔐 Hashlock: ${hashlock}`);
            console.log(`   ⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   📝 Memo: ${memo}`);
            console.log(``);

            // Create transaction data
            const transactionData = {
                delay_sec: 0,
                max_cpu_usage_ms: 0,
                max_net_usage_words: 0,
                actions: [{
                    account: this.contract,
                    name: 'createhtlc',
                    authorization: [{
                        actor: this.account,
                        permission: 'active'
                    }],
                    data: {
                        sender: this.account,
                        recipient: this.account,
                        amount: amount,
                        hashlock: hashlock,
                        timelock: timelock,
                        memo: memo,
                        eth_tx_hash: ethTxHash
                    }
                }]
            };

            console.log(`🚀 Creating HTLC via CURL...`);
            console.log(`📋 Transaction Data: ${JSON.stringify(transactionData, null, 2)}`);
            console.log(``);

            // Create curl command for push_transaction
            const curlCommand = `curl -X POST ${this.rpcUrl}/v1/chain/push_transaction \\
  -H "Content-Type: application/json" \\
  -d '{
    "signatures": [],
    "compression": "none",
    "packed_context_free_data": "",
    "packed_trx": "",
    "transaction": ${JSON.stringify(transactionData)}
  }'`;

            console.log(`📋 CURL Command:`);
            console.log(curlCommand);
            console.log(``);

            // Note: This is a demonstration of the curl command
            // In a real implementation, you would need to sign the transaction first
            console.log(`⚠️  Note: This transaction needs to be signed before submission`);
            console.log(`🔧 To complete the HTLC creation:`);
            console.log(`   1. Sign the transaction with your private key`);
            console.log(`   2. Submit the signed transaction via curl`);
            console.log(`   3. Or use the online tools for easier signing`);
            console.log(``);

            console.log(`🎉 HTLC via CURL Summary:`);
            console.log(`============================================================`);
            console.log(`✅ Status: TRANSACTION READY`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`💰 Amount: ${amount}`);
            console.log(`🔐 Hashlock: ${hashlock}`);
            console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
            console.log(``);

            // Try a simpler approach - use push_transaction with minimal data
            console.log(`🔧 Alternative: Simple CURL approach`);
            const simpleCurlCommand = `curl -X POST ${this.rpcUrl}/v1/chain/push_transaction \\
  -H "Content-Type: application/json" \\
  -d '{
    "signatures": [],
    "compression": "none",
    "packed_context_free_data": "",
    "packed_trx": "",
    "transaction": {
      "delay_sec": 0,
      "max_cpu_usage_ms": 0,
      "max_net_usage_words": 0,
      "actions": [{
        "account": "${this.contract}",
        "name": "createhtlc",
        "authorization": [{"actor": "${this.account}", "permission": "active"}],
        "data": {
          "sender": "${this.account}",
          "recipient": "${this.account}",
          "amount": "${amount}",
          "hashlock": "${hashlock}",
          "timelock": ${timelock},
          "memo": "${memo}",
          "eth_tx_hash": "${ethTxHash}"
        }
      }]
    }
  }'`;

            console.log(`📋 Simple CURL Command:`);
            console.log(simpleCurlCommand);
            console.log(``);

            return {
                success: true,
                transactionData: transactionData,
                hashlock: hashlock,
                amount: amount,
                timelock: timelock,
                curlCommand: simpleCurlCommand
            };

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

async function main() {
    const creator = new HTLCCurlCreator();
    await creator.createHTLCviaCurl();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCCurlCreator }; 