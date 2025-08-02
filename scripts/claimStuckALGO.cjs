#!/usr/bin/env node

/**
 * 🔧 CLAIM STUCK ALGO FROM HTLC CONTRACT
 * 
 * The ALGO is stuck because we called 'claim_htlc' instead of 'withdraw'
 * This script uses the correct function name to claim the 0.5 ALGO
 */

const algosdk = require('algosdk');
require('dotenv').config();

async function claimStuckALGO() {
    console.log('🔧 CLAIMING STUCK ALGO FROM HTLC CONTRACT');
    console.log('==========================================');
    
    const algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    const userAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    const appId = 743645803;
    
    // From the most recent swap
    const htlcId = '0x4ca28a0d32b497893759f4de8e40442032997e27d7ab2ff77b621b5117a35acb';
    const secret = '302119d868b78bd7c64992cbe87b04843c51b3b7d5bfab13ec1b7f97ef850d7a';
    
    console.log('📍 User:', userAccount.addr);
    console.log('📱 App ID:', appId);
    console.log('🔑 HTLC ID:', htlcId);
    console.log('🔐 Secret:', secret);
    console.log('');
    
    // Check current contract balance
    const appAddress = algosdk.getApplicationAddress(appId);
    const appInfo = await algoClient.accountInformation(appAddress).do();
    console.log('💰 Contract Balance Before:', appInfo.amount / 1000000, 'ALGO');
    
    // Check user balance before
    const userInfoBefore = await algoClient.accountInformation(userAccount.addr).do();
    console.log('👤 User Balance Before:', userInfoBefore.amount / 1000000, 'ALGO');
    console.log('');
    
    console.log('🔄 CLAIMING WITH CORRECT FUNCTION NAME...');
    console.log('==========================================');
    
    try {
        const suggestedParams = await algoClient.getTransactionParams().do();
        
        // Use 'withdraw' instead of 'claim_htlc'
        const withdrawTxn = algosdk.makeApplicationNoOpTxnFromObject({
            from: userAccount.addr,
            suggestedParams: suggestedParams,
            appIndex: appId,
            appArgs: [
                new Uint8Array(Buffer.from('withdraw', 'utf8')), // CORRECT FUNCTION NAME
                new Uint8Array(Buffer.from(htlcId.slice(2), 'hex')),
                new Uint8Array(Buffer.from(secret, 'hex'))
            ]
        });
        
        const signedWithdrawTxn = withdrawTxn.signTxn(userAccount.sk);
        const withdrawResult = await algoClient.sendRawTransaction(signedWithdrawTxn).do();
        
        console.log('📝 Withdraw Transaction:', withdrawResult.txId);
        console.log('🔗 Algoexplorer: https://testnet.algoexplorer.io/tx/' + withdrawResult.txId);
        
        await algosdk.waitForConfirmation(algoClient, withdrawResult.txId, 4);
        console.log('✅ ALGO WITHDRAWAL SUCCESSFUL!');
        console.log('');
        
        // Check balances after
        const appInfoAfter = await algoClient.accountInformation(appAddress).do();
        const userInfoAfter = await algoClient.accountInformation(userAccount.addr).do();
        
        console.log('📊 BALANCE CHANGES:');
        console.log('===================');
        console.log('💰 Contract Balance After:', appInfoAfter.amount / 1000000, 'ALGO');
        console.log('👤 User Balance After:', userInfoAfter.amount / 1000000, 'ALGO');
        
        const userIncrease = (userInfoAfter.amount - userInfoBefore.amount) / 1000000;
        const contractDecrease = (appInfoBefore.amount - appInfoAfter.amount) / 1000000;
        
        console.log('');
        console.log('✅ SUCCESS METRICS:');
        console.log('==================');
        console.log('📈 User Balance Increase:', userIncrease.toFixed(3), 'ALGO');
        console.log('📉 Contract Balance Decrease:', contractDecrease.toFixed(3), 'ALGO');
        
        if (userIncrease > 0.49) { // Account for fees
            console.log('');
            console.log('🎉 ATOMIC SWAP COMPLETED SUCCESSFULLY!');
            console.log('======================================');
            console.log('✅ User finally received the 0.5 ALGO');
            console.log('✅ Contract properly released the funds');
            console.log('✅ Atomic swap mechanism proven working');
        }
        
        return {
            success: true,
            userIncrease: userIncrease,
            txId: withdrawResult.txId
        };
        
    } catch (error) {
        console.error('❌ CLAIM FAILED:', error.message);
        return { success: false, error: error.message };
    }
}

// Execute the claim
if (require.main === module) {
    claimStuckALGO().then(result => {
        if (result.success) {
            console.log('\n🌟 ATOMIC SWAP FULLY COMPLETED!');
            console.log('User received:', result.userIncrease.toFixed(3), 'ALGO');
        }
        process.exit(result.success ? 0 : 1);
    }).catch(console.error);
}

module.exports = claimStuckALGO; 
 
 