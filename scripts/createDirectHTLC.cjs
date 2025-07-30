#!/usr/bin/env node

/**
 * 🔐 Create Direct HTLC on EOS
 * 
 * This script creates an HTLC using direct RPC calls.
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

class DirectHTLCCreator {
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

    async createDirectHTLC() {
        console.log(`🔐 Creating Direct HTLC on EOS Jungle4`);
        console.log(`============================================================`);
        console.log(`📁 Account: ${this.account}`);
        console.log(`📁 Contract: ${this.contract}`);
        console.log(`🌐 Network: Jungle4 Testnet`);
        console.log(``);

        try {
            // Generate HTLC parameters
            const hashlock = this.generateHashlock();
            const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const amount = '0.1000 EOS';
            const memo = 'Direct HTLC for cross-chain swap';
            const ethTxHash = '0x' + '0'.repeat(64);

            console.log(`🔍 HTLC Parameters:`);
            console.log(`   💰 Amount: ${amount}`);
            console.log(`   🔐 Hashlock: ${hashlock}`);
            console.log(`   ⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   📝 Memo: ${memo}`);
            console.log(``);

            console.log(`🚀 Creating Direct HTLC...`);

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

            console.log(`📋 Transaction Data:`);
            console.log(`   📁 Account: ${this.contract}`);
            console.log(`   📝 Action: createhtlc`);
            console.log(`   👤 Actor: ${this.account}@active`);
            console.log(``);

            // Note: This is a demonstration of the transaction structure
            // In a real implementation, you would need to sign this transaction
            console.log(`✅ Transaction Structure Created!`);
            console.log(`📋 Transaction Data: ${JSON.stringify(transactionData, null, 2)}`);
            console.log(``);

            console.log(`🎉 Direct HTLC Summary:`);
            console.log(`============================================================`);
            console.log(`✅ Status: STRUCTURE READY`);
            console.log(`📁 Contract: ${this.contract}`);
            console.log(`📁 Account: ${this.account}`);
            console.log(`💰 Amount: ${amount}`);
            console.log(`🔐 Hashlock: ${hashlock}`);
            console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
            console.log(``);

            console.log(`🔧 Next Steps:`);
            console.log(`   1. Sign the transaction with your private key`);
            console.log(`   2. Submit to the blockchain`);
            console.log(`   3. Monitor the HTLC status`);
            console.log(``);

            return {
                success: true,
                transactionData: transactionData,
                hashlock: hashlock,
                amount: amount,
                timelock: timelock
            };

        } catch (error) {
            console.error(`❌ Error creating Direct HTLC: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

async function main() {
    const creator = new DirectHTLCCreator();
    await creator.createDirectHTLC();
}

if (require.main === module) {
    main();
}

module.exports = { DirectHTLCCreator }; 