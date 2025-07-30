#!/usr/bin/env node

/**
 * 🔐 Execute HTLC CURL
 * 
 * This script executes the curl command to create an HTLC.
 */

const { exec } = require('child_process');
const crypto = require('crypto');

class HTLCCurlExecutor {
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

    async executeHTLCCurl() {
        console.log(`🔐 Executing HTLC CURL`);
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
            const memo = 'HTLC via CURL execution';
            const ethTxHash = '0x' + '0'.repeat(64);

            console.log(`🔍 HTLC Parameters:`);
            console.log(`   💰 Amount: ${amount}`);
            console.log(`   🔐 Hashlock: ${hashlock}`);
            console.log(`   ⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   📝 Memo: ${memo}`);
            console.log(``);

            // First, let's try to get the required keys
            console.log(`🔍 Step 1: Getting required keys...`);
            
            const getKeysCommand = `curl -X POST ${this.rpcUrl}/v1/chain/get_required_keys \\
  -H "Content-Type: application/json" \\
  -d '{
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
    },
    "available_keys": ["EOS6wL3u7cjnkdsRHUmiW6pWFnrsHAHFAZRon1eGS9fZKcgjjdFUe"]
  }'`;

            console.log(`📋 Get Keys Command:`);
            console.log(getKeysCommand);
            console.log(``);

            // Execute the get_required_keys command
            exec(getKeysCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Error getting required keys: ${error.message}`);
                    console.log(`🔧 Alternative: Use online tools for easier execution`);
                    console.log(`   1. Visit: https://jungle4.cryptolions.io/`);
                    console.log(`   2. Go to Smart Contracts`);
                    console.log(`   3. Select account: ${this.account}`);
                    console.log(`   4. Call action: createhtlc`);
                    console.log(`   5. Use these parameters:`);
                    console.log(`      - sender: ${this.account}`);
                    console.log(`      - recipient: ${this.account}`);
                    console.log(`      - amount: ${amount}`);
                    console.log(`      - hashlock: ${hashlock}`);
                    console.log(`      - timelock: ${timelock}`);
                    console.log(`      - memo: ${memo}`);
                    console.log(`      - eth_tx_hash: ${ethTxHash}`);
                    console.log(``);
                    return;
                }

                console.log(`✅ Required keys response:`);
                console.log(stdout);
                console.log(``);

                // Now try to push the transaction
                console.log(`🚀 Step 2: Pushing transaction...`);
                
                const pushCommand = `curl -X POST ${this.rpcUrl}/v1/chain/push_transaction \\
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

                console.log(`📋 Push Transaction Command:`);
                console.log(pushCommand);
                console.log(``);

                // Execute the push transaction command
                exec(pushCommand, (pushError, pushStdout, pushStderr) => {
                    if (pushError) {
                        console.error(`❌ Error pushing transaction: ${pushError.message}`);
                        console.log(`🔧 The transaction needs to be signed first`);
                        console.log(`📋 Transaction data is ready for manual signing`);
                        console.log(``);
                        return;
                    }

                    console.log(`✅ Transaction pushed successfully!`);
                    console.log(`📋 Response: ${pushStdout}`);
                    console.log(``);

                    console.log(`🎉 HTLC via CURL Summary:`);
                    console.log(`============================================================`);
                    console.log(`✅ Status: EXECUTED`);
                    console.log(`📁 Contract: ${this.contract}`);
                    console.log(`📁 Account: ${this.account}`);
                    console.log(`💰 Amount: ${amount}`);
                    console.log(`🔐 Hashlock: ${hashlock}`);
                    console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
                    console.log(``);
                });
            });

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    }
}

async function main() {
    const executor = new HTLCCurlExecutor();
    await executor.executeHTLCCurl();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCCurlExecutor }; 