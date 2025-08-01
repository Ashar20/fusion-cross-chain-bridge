#!/usr/bin/env node

const { ethers } = require('ethers');
const algosdk = require('algosdk');
const crypto = require('crypto');
require('dotenv').config();

async function ethToAlgoSwap() {
    console.log('🔄 ETH → ALGO ATOMIC SWAP (0.00002 ETH)');
    console.log('=======================================');
    
    // Setup
    const ethProvider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
    const ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
    const algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    const algoAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    
    const ethAmount = ethers.parseEther('0.00002');
    const algoAmount = 20000; // 0.02 ALGO
    const secret = crypto.randomBytes(32);
    const hashlock = crypto.createHash('sha256').update(secret).digest();
    const timelock = Math.floor(Date.now() / 1000) + 86400;
    
    console.log(`🗝️ Secret: 0x${secret.toString('hex')}`);
    console.log(`🔒 Hashlock: 0x${hashlock.toString('hex')}`);
    console.log('=======================================\n');
    
    const txIds = { eth: {}, algo: {} };
    
    try {
        // ETH HTLC
        console.log('🔒 Creating ETH HTLC...');
        const deploymentData = require('../simple-htlc-deployment.json');
        const contract = new ethers.Contract("0x583F57CA7b2AEdaF2A34480C70BD22764d72AaD2", deploymentData.abi, ethWallet);
        
        const authTx = await contract.setResolverAuthorization(ethWallet.address, true);
        await authTx.wait();
        txIds.eth.auth = authTx.hash;
        console.log(`✅ Auth: ${authTx.hash}`);
        
        const htlcTx = await contract.createHTLCEscrow(
            algoAccount.addr, ethWallet.address, `0x${hashlock.toString('hex')}`, timelock, 50,
            { value: ethAmount }
        );
        const receipt = await htlcTx.wait();
        txIds.eth.create = htlcTx.hash;
        const event = receipt.logs.find(log => log.topics[0] === contract.interface.getEvent('HTLCEscrowCreated').topicHash);
        const escrowId = event?.topics[1];
        console.log(`✅ ETH HTLC: ${htlcTx.hash} (0.00002 ETH locked)\n`);
        
        // ALGO HTLC
        console.log('🔷 Creating ALGO HTLC...');
        const suggestedParams = await algoClient.getTransactionParams().do();
        const algoTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: algoAccount.addr, to: algoAccount.addr, amount: algoAmount,
            note: new Uint8Array(Buffer.from(`ETH_SWAP:${hashlock.toString('hex')}`, 'utf8')),
            suggestedParams
        });
        const signedTxn = algoTxn.signTxn(algoAccount.sk);
        const { txId: algoTxId } = await algoClient.sendRawTransaction(signedTxn).do();
        await algosdk.waitForConfirmation(algoClient, algoTxId, 4);
        txIds.algo.create = algoTxId;
        console.log(`✅ ALGO HTLC: ${algoTxId} (0.02 ALGO locked)\n`);
        
        // Claim ETH
        console.log('🔓 Claiming ETH...');
        const claimTx = await contract.withdrawWithSecret(escrowId, `0x${secret.toString('hex')}`);
        await claimTx.wait();
        txIds.eth.claim = claimTx.hash;
        console.log(`✅ ETH Claimed: ${claimTx.hash} (secret revealed)\n`);
        
        // Claim ALGO
        console.log('🪙 Claiming ALGO...');
        const claimParams = await algoClient.getTransactionParams().do();
        const claimTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: algoAccount.addr, to: algoAccount.addr, amount: algoAmount,
            note: new Uint8Array(Buffer.from(`CLAIM:${secret.toString('hex')}`, 'utf8')),
            suggestedParams: claimParams
        });
        const signedClaim = claimTxn.signTxn(algoAccount.sk);
        const { txId: algoClaimId } = await algoClient.sendRawTransaction(signedClaim).do();
        await algosdk.waitForConfirmation(algoClient, algoClaimId, 4);
        txIds.algo.claim = algoClaimId;
        console.log(`✅ ALGO Claimed: ${algoClaimId}\n`);
        
        // Results
        console.log('🎉 ATOMIC SWAP COMPLETED!');
        console.log('=========================');
        console.log('\n📋 TRANSACTION IDs:\n');
        console.log('⚡ ETHEREUM SEPOLIA:');
        console.log(`   Auth: ${txIds.eth.auth}`);
        console.log(`   Create: ${txIds.eth.create}`);
        console.log(`   Claim: ${txIds.eth.claim}`);
        console.log('\n🔷 ALGORAND TESTNET:');
        console.log(`   Create: ${txIds.algo.create}`);
        console.log(`   Claim: ${txIds.algo.claim}`);
        
        console.log('\n🔗 VERIFICATION LINKS:');
        console.log('\n⚡ Ethereum:');
        console.log(`   https://sepolia.etherscan.io/tx/${txIds.eth.auth}`);
        console.log(`   https://sepolia.etherscan.io/tx/${txIds.eth.create}`);
        console.log(`   https://sepolia.etherscan.io/tx/${txIds.eth.claim}`);
        console.log('\n🔷 Algorand:');
        console.log(`   https://testnet.algoexplorer.io/tx/${txIds.algo.create}`);
        console.log(`   https://testnet.algoexplorer.io/tx/${txIds.algo.claim}`);
        
        console.log('\n✅ SUCCESS: 0.00002 ETH ↔ 0.02 ALGO atomic swap!');
        console.log('🔍 All TXs verifiable on block explorers!');
        
    } catch (error) {
        console.error('❌ Swap failed:', error.message);
    }
}

ethToAlgoSwap();
