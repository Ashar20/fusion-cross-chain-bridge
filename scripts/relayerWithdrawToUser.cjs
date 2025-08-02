#!/usr/bin/env node

/**
 * 🔧 RELAYER WITHDRAWS HTLC TO SEND ALGO TO USER
 * 
 * The correct flow: Relayer (who created HTLC) withdraws using secret,
 * and the contract sends ALGO to the recipient (user)
 */

const algosdk = require('algosdk');
require('dotenv').config();

async function relayerWithdrawToUser() {
    console.log('🔧 RELAYER WITHDRAWING HTLC TO SEND ALGO TO USER');
    console.log('===============================================');
    
    const algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    const relayerAccount = algosdk.mnemonicToSecretKey(process.env.RELAYER_ALGORAND_MNEMONIC || process.env.ALGORAND_MNEMONIC);
    const userAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    const appId = 743645803;
    
    // From the most recent swap
    const htlcId = '0x4ca28a0d32b497893759f4de8e40442032997e27d7ab2ff77b621b5117a35acb';
    const secret = '302119d868b78bd7c64992cbe87b04843c51b3b7d5bfab13ec1b7f97ef850d7a';
    
    console.log('📍 Relayer:', relayerAccount.addr);
    console.log('📍 User (Recipient):', userAccount.addr);
    console.log('📱 App ID:', appId);
    console.log('🔑 HTLC ID:', htlcId);
    console.log('🔐 Secret:', secret);
    console.log('');
    
    // Check current balances
    const appAddress = algosdk.getApplicationAddress(appId);
    const appInfoBefore = await algoClient.accountInformation(appAddress).do();
    const userInfoBefore = await algoClient.accountInformation(userAccount.addr).do();
    const relayerInfoBefore = await algoClient.accountInformation(relayerAccount.addr).do();
    
    console.log('💰 BALANCES BEFORE:');
    console.log('==================');
    console.log('📦 Contract:', appInfoBefore.amount / 1000000, 'ALGO');
    console.log('👤 User:', userInfoBefore.amount / 1000000, 'ALGO');
    console.log('🤖 Relayer:', relayerInfoBefore.amount / 1000000, 'ALGO');
    console.log('');
    
    console.log('🔄 RELAYER WITHDRAWING HTLC...');
    console.log('==============================');
    console.log('💡 Relayer has HTLC in local state');
    console.log('💡 Contract will send ALGO to recipient (user)');
    console.log('');
    
    try {
        const suggestedParams = await algoClient.getTransactionParams().do();
        
        // Relayer calls withdraw with secret
        const withdrawTxn = algosdk.makeApplicationNoOpTxnFromObject({
            from: relayerAccount.addr, // RELAYER calls withdraw
            suggestedParams: suggestedParams,
            appIndex: appId,
            appArgs: [
                new Uint8Array(Buffer.from('withdraw', 'utf8')),
                new Uint8Array(Buffer.from(htlcId.slice(2), 'hex')),
                new Uint8Array(Buffer.from(secret, 'hex'))
            ]
        });
        
        const signedWithdrawTxn = withdrawTxn.signTxn(relayerAccount.sk);
        const withdrawResult = await algoClient.sendRawTransaction(signedWithdrawTxn).do();
        
        console.log('📝 Relayer Withdraw Transaction:', withdrawResult.txId);
        console.log('🔗 Algoexplorer: https://testnet.algoexplorer.io/tx/' + withdrawResult.txId);
        
        await algosdk.waitForConfirmation(algoClient, withdrawResult.txId, 4);
        console.log('✅ RELAYER WITHDRAWAL SUCCESSFUL!');
        console.log('');
        
        // Check balances after
        const appInfoAfter = await algoClient.accountInformation(appAddress).do();
        const userInfoAfter = await algoClient.accountInformation(userAccount.addr).do();
        const relayerInfoAfter = await algoClient.accountInformation(relayerAccount.addr).do();
        
        console.log('💰 BALANCES AFTER:');
        console.log('==================');
        console.log('📦 Contract:', appInfoAfter.amount / 1000000, 'ALGO');
        console.log('👤 User:', userInfoAfter.amount / 1000000, 'ALGO');
        console.log('🤖 Relayer:', relayerInfoAfter.amount / 1000000, 'ALGO');
        console.log('');
        
        const userIncrease = (userInfoAfter.amount - userInfoBefore.amount) / 1000000;
        const contractDecrease = (appInfoBefore.amount - appInfoAfter.amount) / 1000000;
        const relayerChange = (relayerInfoAfter.amount - relayerInfoBefore.amount) / 1000000;
        
        console.log('📊 BALANCE CHANGES:');
        console.log('===================');
        console.log('📈 User Increase:', userIncrease.toFixed(3), 'ALGO');
        console.log('📉 Contract Decrease:', contractDecrease.toFixed(3), 'ALGO');
        console.log('🤖 Relayer Change:', relayerChange.toFixed(3), 'ALGO');
        console.log('');
        
        if (userIncrease > 0.49) { // Account for fees
            console.log('🎉 ATOMIC SWAP COMPLETED SUCCESSFULLY!');
            console.log('======================================');
            console.log('✅ User received 0.5 ALGO');
            console.log('✅ Contract released the funds');
            console.log('✅ HTLC withdrawal mechanism working');
            console.log('✅ Cross-chain atomic swap proven!');
        } else if (contractDecrease > 0.49) {
            console.log('✅ ALGO TRANSFERRED FROM CONTRACT');
            console.log('==================================');
            console.log('✅ Contract released:', contractDecrease.toFixed(3), 'ALGO');
            console.log('✅ HTLC mechanism working correctly');
            console.log('');
            if (userIncrease < 0.49) {
                console.log('💡 NOTE: In self-swap scenario');
                console.log('💡 Same account is user and relayer');
                console.log('💡 Net effect: transaction fees only');
            }
        }
        
        return {
            success: true,
            userIncrease: userIncrease,
            contractDecrease: contractDecrease,
            txId: withdrawResult.txId
        };
        
    } catch (error) {
        console.error('❌ WITHDRAWAL FAILED:', error.message);
        return { success: false, error: error.message };
    }
}

// Execute the withdrawal
if (require.main === module) {
    relayerWithdrawToUser().then(result => {
        if (result.success) {
            console.log('\n🌟 HTLC WITHDRAWAL COMPLETED!');
            console.log('Contract released:', result.contractDecrease.toFixed(3), 'ALGO');
            console.log('User received:', result.userIncrease.toFixed(3), 'ALGO');
        }
        process.exit(result.success ? 0 : 1);
    }).catch(console.error);
}

module.exports = relayerWithdrawToUser; 
 
 