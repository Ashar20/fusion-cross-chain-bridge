#!/usr/bin/env node

/**
 * 🔷 Real Algorand HTLC Implementation
 * 
 * Creates actual HTLC smart contract on Algorand testnet using official SDK
 */

require('dotenv').config();
const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class RealAlgorandHTLC {
    constructor() {
        // Initialize Algorand client
        this.algodServer = 'https://testnet-api.algonode.cloud';
        this.algodClient = new algosdk.Algodv2('', this.algodServer, 443);
        
        // Load account from mnemonic
        const accountMnemonic = process.env.ALGORAND_MNEMONIC.replace(/"/g, '');
        this.account = algosdk.mnemonicToSecretKey(accountMnemonic);
    }

    async createHTLCUsingStatelessContract() {
        console.log('🔷 Creating Real Algorand HTLC (Stateless Contract)...');
        console.log('='.repeat(60));
        
        try {
            // Load Ethereum HTLC info
            const ethHTLCPath = path.join(__dirname, '../ethereum-htlc-fallback.json');
            const ethHTLC = JSON.parse(fs.readFileSync(ethHTLCPath, 'utf8'));
            
            console.log(`👤 Creator: ${this.account.addr}`);
            
            // Check balance
            const accountInfo = await this.algodClient.accountInformation(this.account.addr).do();
            const balance = Number(accountInfo.amount) / 1000000;
            console.log(`💰 Balance: ${balance} ALGO`);
            
            if (balance < 0.1) {
                throw new Error(`Insufficient balance: ${balance} ALGO`);
            }
            
            // HTLC Parameters (using same secret/hashlock as Ethereum)
            const secret = ethHTLC.secret;
            const hashImage = ethHTLC.hashlock;
            const receiver = this.account.addr; // For demo, send back to ourselves
            const owner = this.account.addr;
            const timeout = Math.floor(Date.now() / 1000) + 3600; // 1 hour timeout
            const maxFee = 2000;
            
            console.log('\n🔑 HTLC Parameters:');
            console.log(`   Owner: ${owner}`);
            console.log(`   Receiver: ${receiver}`);
            console.log(`   Secret: ${secret}`);
            console.log(`   Hash Image: ${hashImage}`);
            console.log(`   Timeout: ${new Date(timeout * 1000).toISOString()}`);
            
            // Create HTLC TEAL program manually since template might not be available
            const htlcTeal = this.createHTLCTealProgram(owner, receiver, hashImage, timeout, maxFee);
            
            console.log('\n🔨 Compiling HTLC TEAL program...');
            
            // Compile the TEAL program
            const compiledProgram = await this.algodClient.compile(htlcTeal).do();
            const programBytes = new Uint8Array(Buffer.from(compiledProgram.result, 'base64'));
            
            // Create logic signature and get address
            const lsig = new algosdk.LogicSig(programBytes);
            const contractAddress = lsig.address();
            console.log(`📋 HTLC Contract Address: ${contractAddress}`);
            console.log(`📋 Contract Address Type: ${typeof contractAddress}`);
            console.log(`📋 Account Address: ${this.account.addr}`);
            console.log(`📋 Account Address Type: ${typeof this.account.addr}`);
            
            // Fund the contract
            console.log('\n💰 Funding HTLC contract...');
            const suggestedParams = await this.algodClient.getTransactionParams().do();
            
            const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                from: this.account.addr.toString(),
                to: contractAddress.toString(),
                amount: 1000000, // 1 ALGO
                suggestedParams: suggestedParams
            });
            
            const signedFundTxn = fundTxn.signTxn(this.account.sk);
            const fundResult = await this.algodClient.sendRawTransaction(signedFundTxn).do();
            const fundTxId = fundResult.txId;
            
            console.log(`📋 Fund Transaction: ${fundTxId}`);
            console.log('⏳ Waiting for funding confirmation...');
            
            await algosdk.waitForConfirmation(this.algodClient, fundTxId, 4);
            console.log('✅ Contract funded successfully!');
            
            // Now execute the HTLC with the secret
            console.log('\n🔓 Executing HTLC with secret...');
            
            // Create logic signature with the secret as argument
            const secretBuffer = Buffer.from(secret.replace('0x', ''), 'hex');
            const claimLsig = new algosdk.LogicSig(programBytes, [secretBuffer]);
            
            // Create transaction to claim funds
            const claimParams = await this.algodClient.getTransactionParams().do();
            
            const claimTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                from: contractAddress.toString(),
                to: receiver.toString(),
                amount: 0, // Will close entire balance
                closeRemainderTo: receiver.toString(),
                suggestedParams: claimParams
            });
            
            // Sign with logic signature
            const signedClaimTxn = algosdk.signLogicSigTransactionObject(claimTxn, claimLsig);
            
            const claimResult = await this.algodClient.sendRawTransaction(signedClaimTxn.blob).do();
            const claimTxId = claimResult.txId;
            
            console.log(`📋 Claim Transaction: ${claimTxId}`);
            console.log('⏳ Waiting for claim confirmation...');
            
            const claimConfirm = await algosdk.waitForConfirmation(this.algodClient, claimTxId, 4);
            
            console.log('✅ HTLC Executed Successfully!');
            console.log(`📋 Fund Block: ${claimConfirm['confirmed-round']}`);
            console.log(`🔗 Fund TX: https://testnet.algoexplorer.io/tx/${fundTxId}`);
            console.log(`🔗 Claim TX: https://testnet.algoexplorer.io/tx/${claimTxId}`);
            
            // Save HTLC info
            const htlcInfo = {
                chain: 'algorand',
                network: 'testnet',
                chainId: 416002,
                contractAddress: contractAddress,
                fundTransactionId: fundTxId,
                claimTransactionId: claimTxId,
                blockNumber: claimConfirm['confirmed-round'],
                creator: this.account.addr,
                receiver: receiver,
                amount: 1.0,
                secret: secret,
                hashImage: hashImage,
                timeout: timeout,
                created: new Date().toISOString(),
                status: 'completed'
            };
            
            const htlcPath = path.join(__dirname, '../algorand-htlc-real.json');
            fs.writeFileSync(htlcPath, JSON.stringify(htlcInfo, null, 2));
            
            console.log(`📁 Real Algorand HTLC saved to: ${htlcPath}`);
            
            return htlcInfo;
            
        } catch (error) {
            console.error('❌ Algorand HTLC creation failed:', error.message);
            throw error;
        }
    }

    createHTLCTealProgram(owner, receiver, hashImage, timeout, maxFee) {
        // Create HTLC TEAL program based on official Algorand template
        return `#pragma version 6

// HTLC Logic:
// If secret is provided and hash matches, send to receiver
// If timeout reached, send back to owner

txn TypeEnum
int pay
==
assert

// Check if we have the correct secret
arg 0
sha256
byte base64 ${Buffer.from(hashImage.replace('0x', ''), 'hex').toString('base64')}
==
bnz claim

// Check if timeout has passed
global LatestTimestamp
int ${timeout}
>=
bnz refund

// Neither condition met, reject
int 0
return

claim:
// Secret is correct, allow payment to receiver
txn CloseRemainderTo
addr ${receiver}
==
assert
int 1
return

refund:
// Timeout reached, allow refund to owner
txn CloseRemainderTo
addr ${owner}
==
assert
int 1
return`;
    }
}

async function main() {
    const htlc = new RealAlgorandHTLC();
    await htlc.createHTLCUsingStatelessContract();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { RealAlgorandHTLC };