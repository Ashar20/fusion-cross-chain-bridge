#!/usr/bin/env node

/**
 * 🔐 Submit HTLC Transaction
 * 
 * This script submits the HTLC transaction using a different approach.
 */

const { exec } = require('child_process');
const crypto = require('crypto');

class HTLCSubmitter {
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

    async submitHTLC() {
        console.log(`🔐 Submitting HTLC Transaction`);
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
            const memo = 'Real HTLC for cross-chain swap';
            const ethTxHash = '0x' + '0'.repeat(64);

            console.log(`🔍 HTLC Parameters:`);
            console.log(`   💰 Amount: ${amount}`);
            console.log(`   🔐 Hashlock: ${hashlock}`);
            console.log(`   ⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   📝 Memo: ${memo}`);
            console.log(``);

            // Create the cleos command
            const cleosCommand = `cleos -u ${this.rpcUrl} push action ${this.contract} createhtlc '["${this.account}", "${this.account}", "${amount}", "${hashlock}", ${timelock}, "${memo}", "${ethTxHash}"]' -p ${this.account}@active`;

            console.log(`🚀 Submitting HTLC Transaction...`);
            console.log(`📋 Command: ${cleosCommand}`);
            console.log(``);

            // Execute the command
            exec(cleosCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Error: ${error.message}`);
                    console.log(`🔧 Alternative: Use online tools`);
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

                if (stderr) {
                    console.error(`⚠️  Warning: ${stderr}`);
                }

                console.log(`✅ HTLC Transaction Submitted!`);
                console.log(`📋 Output: ${stdout}`);
                console.log(``);

                console.log(`🎉 HTLC Summary:`);
                console.log(`============================================================`);
                console.log(`✅ Status: SUBMITTED`);
                console.log(`📁 Contract: ${this.contract}`);
                console.log(`📁 Account: ${this.account}`);
                console.log(`💰 Amount: ${amount}`);
                console.log(`🔐 Hashlock: ${hashlock}`);
                console.log(`⏰ Expires: ${new Date(timelock * 1000).toISOString()}`);
                console.log(``);
            });

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    }
}

async function main() {
    const submitter = new HTLCSubmitter();
    await submitter.submitHTLC();
}

if (require.main === module) {
    main();
}

module.exports = { HTLCSubmitter }; 