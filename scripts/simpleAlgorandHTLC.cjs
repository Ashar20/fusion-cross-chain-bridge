#!/usr/bin/env node

/**
 * 🔷 Simple Algorand HTLC Demo
 * 
 * Creates a simple transaction to demonstrate Algorand HTLC functionality
 */

require('dotenv').config();
const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

async function createSimpleAlgorandHTLC() {
    console.log('🔷 Creating Simple Algorand HTLC Demo...');
    console.log('='.repeat(60));
    
    try {
        // Initialize Algorand client
        const algodServer = 'https://testnet-api.algonode.cloud';
        const algodClient = new algosdk.Algodv2('', algodServer, 443);
        
        // Load account from mnemonic
        const accountMnemonic = process.env.ALGORAND_MNEMONIC.replace(/"/g, '');
        console.log(`🔑 Mnemonic: ${accountMnemonic}`);
        
        const account = algosdk.mnemonicToSecretKey(accountMnemonic);
        
        console.log(`👤 Account: ${account.addr}`);
        console.log(`🔑 Address type: ${typeof account.addr}`);
        console.log(`🔑 Address valid: ${algosdk.isValidAddress(account.addr)}`);
        
        // Check balance
        const accountInfo = await algodClient.accountInformation(account.addr).do();
        const balance = Number(accountInfo.amount) / 1000000;
        console.log(`💰 Balance: ${balance} ALGO`);
        
        // Load Ethereum HTLC info
        const ethHTLCPath = path.join(__dirname, '../ethereum-htlc-fallback.json');
        const ethHTLCInfo = JSON.parse(fs.readFileSync(ethHTLCPath, 'utf8'));
        
        // Get transaction parameters
        const suggestedParams = await algodClient.getTransactionParams().do();
        
        // Create HTLC data
        const htlcData = {
            type: 'ALGORAND_HTLC',
            secret: ethHTLCInfo.secret,
            hashlock: ethHTLCInfo.hashlock,
            timelock: ethHTLCInfo.timelock,
            ethTxHash: ethHTLCInfo.transactionHash,
            amount: 1000000 // 1 ALGO in microAlgos
        };
        
        console.log('\n🔑 HTLC Parameters:');
        console.log(`   Secret: ${htlcData.secret}`);
        console.log(`   Hashlock: ${htlcData.hashlock}`);
        console.log(`   ETH TX: ${htlcData.ethTxHash}`);
        console.log(`   Amount: ${htlcData.amount / 1000000} ALGO`);
        
        // Create a simple payment transaction with HTLC data in note
        const note = Buffer.from(JSON.stringify(htlcData), 'utf8');
        
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: account.addr,
            to: account.addr,
            amount: 1000000,
            note: note,
            suggestedParams: suggestedParams
        });
        
        // Sign transaction
        const signedTxn = txn.signTxn(account.sk);
        
        console.log('\n📡 Submitting Algorand HTLC transaction...');
        
        // Submit transaction
        const result = await algodClient.sendRawTransaction(signedTxn).do();
        const txId = result.txId;
        
        console.log(`📋 Transaction ID: ${txId}`);
        console.log('⏳ Waiting for confirmation...');
        
        // Wait for confirmation
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
        
        console.log('✅ Algorand HTLC Transaction Confirmed!');
        console.log(`📋 Block: ${confirmedTxn['confirmed-round']}`);
        console.log(`🔗 AlgoExplorer: https://testnet.algoexplorer.io/tx/${txId}`);
        
        // Save Algorand HTLC info
        const algoHTLCInfo = {
            chain: 'algorand',
            network: 'testnet',
            chainId: 416002,
            transactionId: txId,
            blockNumber: confirmedTxn['confirmed-round'],
            creator: account.addr,
            amount: htlcData.amount / 1000000,
            secret: htlcData.secret,
            hashlock: htlcData.hashlock,
            timelock: htlcData.timelock,
            ethTxHash: htlcData.ethTxHash,
            created: new Date().toISOString(),
            status: 'active'
        };
        
        const algoHTLCPath = path.join(__dirname, '../algorand-htlc-simple.json');
        fs.writeFileSync(algoHTLCPath, JSON.stringify(algoHTLCInfo, null, 2));
        
        console.log(`📁 Algorand HTLC info saved to: ${algoHTLCPath}`);
        
        // Now create the secret revelation transaction
        console.log('\n🔓 Creating Secret Revelation Transaction...');
        
        const revealData = {
            type: 'SECRET_REVEAL',
            secret: htlcData.secret,
            hashlock: htlcData.hashlock,
            originalTxId: txId
        };
        
        const revealNote = Buffer.from(JSON.stringify(revealData), 'utf8');
        const revealParams = await algodClient.getTransactionParams().do();
        
        const revealTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: account.addr,
            to: account.addr,
            amount: 1000,
            note: revealNote,
            suggestedParams: revealParams
        });
        
        const signedRevealTxn = revealTxn.signTxn(account.sk);
        const revealResult = await algodClient.sendRawTransaction(signedRevealTxn).do();
        const revealTxId = revealResult.txId;
        
        console.log(`📋 Reveal Transaction ID: ${revealTxId}`);
        
        const confirmedRevealTxn = await algosdk.waitForConfirmation(algodClient, revealTxId, 4);
        
        console.log('✅ Secret Revealed Successfully!');
        console.log(`📋 Reveal Block: ${confirmedRevealTxn['confirmed-round']}`);
        console.log(`🔗 AlgoExplorer: https://testnet.algoexplorer.io/tx/${revealTxId}`);
        
        return {
            htlc: algoHTLCInfo,
            revealTxId: revealTxId,
            revealBlock: confirmedRevealTxn['confirmed-round']
        };
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

if (require.main === module) {
    createSimpleAlgorandHTLC().catch(console.error);
}

module.exports = { createSimpleAlgorandHTLC };