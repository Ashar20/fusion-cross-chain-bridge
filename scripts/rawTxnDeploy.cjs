/**
 * Deploy using raw Transaction constructor
 */

const algosdk = require('algosdk');
const fs = require('fs');

async function rawTransactionDeploy() {
    console.log('🎯 ALGORAND DEPLOYMENT WITH RAW TRANSACTION');
    console.log('==========================================');
    
    try {
        require('dotenv').config();
        
        // Initialize client
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        console.log('✅ Algorand client initialized');
        
        // Create account from mnemonic
        const account = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
        console.log(`📱 Account address: ${account.addr}`);
        
        // Check balance
        const accountInfo = await algodClient.accountInformation(account.addr).do();
        const balanceAlgos = parseInt(accountInfo.amount.toString()) / 1000000;
        console.log(`💰 Balance: ${balanceAlgos} ALGO`);
        
        // Get current round
        const statusResponse = await fetch('https://testnet-api.algonode.cloud/v2/status');
        const statusData = await statusResponse.json();
        const currentRound = statusData['last-round'];
        console.log(`📊 Current round: ${currentRound}`);
        
        // Create simple programs
        const approvalProgram = new Uint8Array([0x06, 0x81, 0x01]);
        const clearProgram = new Uint8Array([0x06, 0x81, 0x01]);
        
        console.log('🔨 Creating raw transaction...');
        
        // Create transaction using raw constructor
        const txn = new algosdk.Transaction({
            from: account.addr,
            fee: 1000,
            firstRound: currentRound,
            lastRound: currentRound + 1000,
            genesisID: 'testnet-v1.0',
            genesisHash: new Uint8Array(Buffer.from('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexkd/cOUJOiI=', 'base64')),
            type: 'appl',
            appOnComplete: 0, // NoOp
            appApprovalProgram: approvalProgram,
            appClearProgram: clearProgram,
            appLocalInts: 8,
            appLocalByteSlices: 8,
            appGlobalInts: 16,
            appGlobalByteSlices: 16
        });
        
        console.log('✅ Raw transaction created!');
        
        // Sign and submit
        const signedTxn = txn.signTxn(account.sk);
        const result = await algodClient.sendRawTransaction(signedTxn).do();
        console.log(`✅ Transaction submitted: ${result.txId}`);
        
        const confirmed = await algosdk.waitForConfirmation(algodClient, result.txId, 4);
        const appId = confirmed['application-index'];
        
        console.log(`\n🎉 SUCCESS! App ID: ${appId}`);
        console.log(`🔗 Explorer: https://testnet.algoexplorer.io/application/${appId}`);
        
        // Update .env
        const envContent = fs.readFileSync('.env', 'utf8');
        const updatedEnv = envContent.replace(
            /ALGORAND_APP_ID=.*/,
            `ALGORAND_APP_ID=${appId}`
        );
        fs.writeFileSync('.env', updatedEnv);
        
        console.log('✅ .env updated with ALGORAND_APP_ID');
        
        return { success: true, applicationId: appId };
        
    } catch (error) {
        console.error('❌ Raw deployment failed:', error.message);
        console.error('Stack:', error.stack);
        return { success: false, error: error.message };
    }
}

rawTransactionDeploy().then(result => {
    if (result.success) {
        console.log(`\n🚀 Raw deployment successful! App ID: ${result.applicationId}`);
    }
}).catch(console.error);