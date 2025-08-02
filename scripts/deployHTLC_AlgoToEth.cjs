#!/usr/bin/env node
/**
 * Deploy ALGO→ETH minimal HTLC contract to Algorand Testnet
 */
const { execSync } = require('child_process');
const fs = require('fs');
const { Algodv2, mnemonicToSecretKey, makeApplicationCreateTxn } = require('algosdk');
require('dotenv').config();

const contractPath = 'contracts/algorand/AlgorandHTLCBridge_AlgoToEth.py';

function compileTeal() {
    const teal = execSync(`source pyteal_env/bin/activate && python3 ${contractPath}`, { encoding: 'utf8', shell: '/bin/bash' });
    fs.writeFileSync('contracts/algorand/AlgorandHTLCBridge_AlgoToEth.teal', teal);
    return teal;
}

async function deploy() {
    const algodClient = new Algodv2(
        process.env.ALGOD_TOKEN,
        process.env.ALGOD_SERVER,
        process.env.ALGOD_PORT || 443
    );
    const account = mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    const teal = compileTeal();
    const tealBytes = new TextEncoder().encode(teal);
    const suggestedParams = await algodClient.getTransactionParams().do();
    const txn = makeApplicationCreateTxn(
        account.addr,
        suggestedParams,
        0,
        tealBytes,
        tealBytes,
        0, 0, 8, 8
    );
    const signedTxn = txn.signTxn(account.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log('Submitted, waiting for confirmation:', txId);
    let confirmedTxn = null;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
            confirmedTxn = await algodClient.pendingTransactionInformation(txId).do();
            if (confirmedTxn['application-index']) break;
        } catch {}
    }
    if (!confirmedTxn || !confirmedTxn['application-index']) throw new Error('App not confirmed');
    const appId = confirmedTxn['application-index'];
    console.log('✅ Deployed ALGO→ETH HTLC App ID:', appId);
    fs.writeFileSync('ALGORAND_HTLC_ALGO_TO_ETH_DEPLOYMENT.json', JSON.stringify({ appId, txId }, null, 2));
}

deploy().catch(e => { console.error(e); process.exit(1); }); 
/**
 * Deploy ALGO→ETH minimal HTLC contract to Algorand Testnet
 */
const { execSync } = require('child_process');
const fs = require('fs');
const { Algodv2, mnemonicToSecretKey, makeApplicationCreateTxn } = require('algosdk');
require('dotenv').config();

const contractPath = 'contracts/algorand/AlgorandHTLCBridge_AlgoToEth.py';

function compileTeal() {
    const teal = execSync(`source pyteal_env/bin/activate && python3 ${contractPath}`, { encoding: 'utf8', shell: '/bin/bash' });
    fs.writeFileSync('contracts/algorand/AlgorandHTLCBridge_AlgoToEth.teal', teal);
    return teal;
}

async function deploy() {
    const algodClient = new Algodv2(
        process.env.ALGOD_TOKEN,
        process.env.ALGOD_SERVER,
        process.env.ALGOD_PORT || 443
    );
    const account = mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    const teal = compileTeal();
    const tealBytes = new TextEncoder().encode(teal);
    const suggestedParams = await algodClient.getTransactionParams().do();
    const txn = makeApplicationCreateTxn(
        account.addr,
        suggestedParams,
        0,
        tealBytes,
        tealBytes,
        0, 0, 8, 8
    );
    const signedTxn = txn.signTxn(account.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log('Submitted, waiting for confirmation:', txId);
    let confirmedTxn = null;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
            confirmedTxn = await algodClient.pendingTransactionInformation(txId).do();
            if (confirmedTxn['application-index']) break;
        } catch {}
    }
    if (!confirmedTxn || !confirmedTxn['application-index']) throw new Error('App not confirmed');
    const appId = confirmedTxn['application-index'];
    console.log('✅ Deployed ALGO→ETH HTLC App ID:', appId);
    fs.writeFileSync('ALGORAND_HTLC_ALGO_TO_ETH_DEPLOYMENT.json', JSON.stringify({ appId, txId }, null, 2));
}

deploy().catch(e => { console.error(e); process.exit(1); }); 
 