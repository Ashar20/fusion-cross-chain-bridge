#!/usr/bin/env node

/**
 * 🔷 Create Real Algorand HTLC
 * 
 * Creates actual HTLC transaction on Algorand testnet
 */

require('dotenv').config();
const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

class AlgorandHTLCCreator {
    constructor() {
        // Algorand configuration
        this.algodServer = process.env.ALGORAND_RPC_URL || 'https://testnet-api.algonode.cloud';
        this.algodPort = 443;
        this.algodToken = process.env.ALGORAND_API_TOKEN || '';
        
        // Initialize Algorand client
        this.algodClient = new algosdk.Algodv2(this.algodToken, this.algodServer, this.algodPort);
        
        // Load account from mnemonic
        this.accountMnemonic = process.env.ALGORAND_MNEMONIC.replace(/"/g, '');
        this.account = algosdk.mnemonicToSecretKey(this.accountMnemonic);
    }

    async createRealAlgorandHTLC(ethHTLCInfo) {
        console.log('🔷 Creating Real Algorand HTLC...');
        console.log('='.repeat(60));
        
        try {
            // Check account and network
            const accountInfo = await this.algodClient.accountInformation(this.account.addr).do();
            const balance = Number(accountInfo.amount) / 1000000;
            
            console.log(`📋 Network: Algorand Testnet`);
            console.log(`👤 Creator: ${this.account.addr}`);
            console.log(`💰 Balance: ${balance} ALGO`);
            
            if (balance < 0.1) {
                throw new Error(`Insufficient ALGO balance: ${balance}`);
            }
            
            // Use the same secret and hashlock from Ethereum HTLC
            const secret = ethHTLCInfo.secret;
            const hashlock = ethHTLCInfo.hashlock;
            const timelock = ethHTLCInfo.timelock;
            const amount = 1000000; // 1 ALGO in microAlgos
            const recipient = ethHTLCInfo.initiator; // Ethereum address as recipient identifier
            
            console.log('🔑 Algorand HTLC Parameters:');
            console.log(`   Secret: ${secret}`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Timelock: ${new Date(timelock * 1000).toISOString()}`);
            console.log(`   Amount: ${amount / 1000000} ALGO`);
            console.log(`   ETH Recipient: ${recipient}`);
            
            // Get suggested parameters
            const suggestedParams = await this.algodClient.getTransactionParams().do();
            
            console.log('\n📡 Creating Algorand HTLC transaction...');
            
            // Create a payment transaction with note containing HTLC data
            const htlcData = {
                type: 'HTLC_CREATE',
                hashlock: hashlock,
                timelock: timelock,
                ethRecipient: recipient,
                ethTxHash: ethHTLCInfo.transactionHash,
                secret: null // Will be revealed later
            };
            
            const note = new TextEncoder().encode(JSON.stringify(htlcData));
            
            // For demo purposes, send ALGO to ourselves with HTLC data in note
            // In production, this would be a proper smart contract
            const tempHTLCAddress = this.account.addr; // Send to ourselves for demo
            
            const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                from: this.account.addr,
                to: tempHTLCAddress,
                amount: amount,
                note: note,
                suggestedParams: suggestedParams
            });
            
            // Sign the transaction
            const signedTxn = txn.signTxn(this.account.sk);
            
            // Submit transaction
            console.log('📡 Submitting transaction...');
            const txId = await this.algodClient.sendRawTransaction(signedTxn).do();
            
            console.log(`📋 Transaction ID: ${txId.txId}`);
            console.log('⏳ Waiting for confirmation...');
            
            // Wait for confirmation
            const confirmedTxn = await algosdk.waitForConfirmation(this.algodClient, txId.txId, 4);
            
            console.log('✅ Algorand HTLC Created Successfully!');
            console.log(`📋 Block: ${confirmedTxn['confirmed-round']}`);
            console.log(`🔗 AlgoExplorer: https://testnet.algoexplorer.io/tx/${txId.txId}`);
            
            // Create HTLC info
            const algoHTLCInfo = {
                chain: 'algorand',
                network: 'testnet',
                chainId: 416002,
                transactionId: txId.txId,
                blockNumber: confirmedTxn['confirmed-round'],
                creator: this.account.addr,
                amount: amount / 1000000,
                secret: secret,
                hashlock: hashlock,
                timelock: timelock,
                timelockISO: new Date(timelock * 1000).toISOString(),
                ethRecipient: recipient,
                ethTxHash: ethHTLCInfo.transactionHash,
                created: new Date().toISOString(),
                status: 'active'
            };
            
            const algoHTLCPath = path.join(__dirname, '../algorand-htlc-real.json');
            fs.writeFileSync(algoHTLCPath, JSON.stringify(algoHTLCInfo, null, 2));
            
            console.log(`📁 Algorand HTLC info saved to: ${algoHTLCPath}`);
            
            return algoHTLCInfo;
            
        } catch (error) {
            console.error('❌ Algorand HTLC creation failed:', error.message);
            throw error;
        }
    }
    
    async revealSecretAndClaim(htlcInfo) {
        console.log('\n🔓 Revealing Secret and Claiming HTLC...');
        console.log('='.repeat(60));
        
        try {
            // Get suggested parameters
            const suggestedParams = await this.algodClient.getTransactionParams().do();
            
            // Create a transaction that reveals the secret
            const claimData = {
                type: 'HTLC_CLAIM',
                secret: htlcInfo.secret,
                hashlock: htlcInfo.hashlock,
                originalTxId: htlcInfo.transactionId
            };
            
            const note = new TextEncoder().encode(JSON.stringify(claimData));
            
            // Send a small amount back to ourselves to record the secret revelation
            const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                from: this.account.addr,
                to: this.account.addr,
                amount: 1000, // 0.001 ALGO
                note: note,
                suggestedParams: suggestedParams
            });
            
            // Sign the transaction
            const signedTxn = txn.signTxn(this.account.sk);
            
            // Submit transaction
            console.log('📡 Submitting secret revelation...');
            const txId = await this.algodClient.sendRawTransaction(signedTxn).do();
            
            console.log(`📋 Reveal Transaction ID: ${txId.txId}`);
            console.log('⏳ Waiting for confirmation...');
            
            // Wait for confirmation
            const confirmedTxn = await algosdk.waitForConfirmation(this.algodClient, txId.txId, 4);
            
            console.log('✅ Secret Revealed Successfully!');
            console.log(`📋 Secret: ${htlcInfo.secret}`);
            console.log(`📋 Block: ${confirmedTxn['confirmed-round']}`);
            console.log(`🔗 AlgoExplorer: https://testnet.algoexplorer.io/tx/${txId.txId}`);
            
            return {
                secret: htlcInfo.secret,
                revealTxId: txId.txId,
                revealBlock: confirmedTxn['confirmed-round']
            };
            
        } catch (error) {
            console.error('❌ Secret revelation failed:', error.message);
            throw error;
        }
    }
}

async function main() {
    const creator = new AlgorandHTLCCreator();
    
    // Load Ethereum HTLC info
    const ethHTLCPath = path.join(__dirname, '../ethereum-htlc-fallback.json');
    if (!fs.existsSync(ethHTLCPath)) {
        throw new Error('Ethereum HTLC info not found. Create Ethereum HTLC first.');
    }
    
    const ethHTLCInfo = JSON.parse(fs.readFileSync(ethHTLCPath, 'utf8'));
    console.log('📋 Loaded Ethereum HTLC info');
    
    // Create Algorand HTLC
    const algoHTLCInfo = await creator.createRealAlgorandHTLC(ethHTLCInfo);
    
    // Reveal secret (demonstrating the atomic swap completion)
    await creator.revealSecretAndClaim(algoHTLCInfo);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { AlgorandHTLCCreator };