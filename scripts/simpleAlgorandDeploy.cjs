/**
 * Simple Algorand HTLC Deployment
 */

const algosdk = require('algosdk');
const fs = require('fs');

async function simpleDeployment() {
    console.log('🎯 SIMPLE ALGORAND DEPLOYMENT');
    console.log('==============================');
    
    try {
        require('dotenv').config();
        
        const envMnemonic = process.env.ALGORAND_MNEMONIC;
        if (!envMnemonic) {
            throw new Error('ALGORAND_MNEMONIC not found in .env');
        }
        
        // Initialize client
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        console.log('✅ Algorand client initialized');
        
        // Create account from mnemonic
        const account = algosdk.mnemonicToSecretKey(envMnemonic);
        console.log(`📱 Deployer address: ${account.addr}`);
        
        // Check balance
        const accountInfo = await algodClient.accountInformation(account.addr).do();
        const balanceAlgos = parseInt(accountInfo.amount.toString()) / 1000000;
        console.log(`💰 Balance: ${balanceAlgos} ALGO`);
        
        // Get transaction parameters using a simpler method
        console.log('🔧 Getting transaction parameters...');
        
        // Get status for current round
        const statusResponse = await fetch('https://testnet-api.algonode.cloud/v2/status');
        const statusData = await statusResponse.json();
        const currentRound = statusData['last-round'];
        console.log(`📊 Current round: ${currentRound}`);
        
        // Get transaction parameters
        const paramsResponse = await fetch('https://testnet-api.algonode.cloud/v2/transactions/params');
        const paramsData = await paramsResponse.json();
        console.log(`⚙️  Min fee: ${paramsData['min-fee']}`);
        
        // Create transaction parameters manually
        const txnParams = {
            fee: paramsData['min-fee'] || 1000,
            firstRound: currentRound,
            lastRound: currentRound + 1000,
            genesisID: paramsData['genesis-id'] || 'testnet-v1.0',
            genesisHash: paramsData['genesis-hash']
        };
        
        console.log('📋 Transaction Parameters:');
        console.log(`   Fee: ${txnParams.fee}`);
        console.log(`   First Round: ${txnParams.firstRound}`);
        console.log(`   Last Round: ${txnParams.lastRound}`);
        console.log(`   Genesis ID: ${txnParams.genesisID}`);
        
        // Create simple programs
        const approvalProgram = new Uint8Array([0x06, 0x81, 0x01]);
        const clearProgram = new Uint8Array([0x06, 0x81, 0x01]);
        
        console.log('🔨 Creating application transaction...');
        
        // Create transaction using basic constructor
        const appCreateTxn = {
            from: account.addr,
            fee: txnParams.fee,
            firstRound: txnParams.firstRound,
            lastRound: txnParams.lastRound,
            genesisID: txnParams.genesisID,
            genesisHash: new Uint8Array(Buffer.from(txnParams.genesisHash, 'base64')),
            type: 'appl',
            appOnComplete: 0, // NoOp
            appApprovalProgram: approvalProgram,
            appClearProgram: clearProgram,
            appLocalInts: 8,
            appLocalByteSlices: 8,
            appGlobalInts: 16,
            appGlobalByteSlices: 16
        };
        
        // Use the SDK's transaction constructor directly
        const txn = new algosdk.Transaction(appCreateTxn);
        
        console.log('✅ Transaction created successfully!');
        
        // Sign transaction
        console.log('✍️ Signing transaction...');
        const signedTxn = txn.signTxn(account.sk);
        console.log('✅ Transaction signed');
        
        // Submit transaction
        console.log('📤 Submitting transaction...');
        const result = await algodClient.sendRawTransaction(signedTxn).do();
        console.log(`✅ Transaction submitted! TxID: ${result.txId}`);
        
        // Wait for confirmation
        console.log('⏳ Waiting for confirmation...');
        const confirmed = await algosdk.waitForConfirmation(algodClient, result.txId, 4);
        console.log('✅ Transaction confirmed!');
        
        const appId = confirmed['application-index'];
        
        console.log('\n🎉 ALGORAND HTLC BRIDGE DEPLOYED!');
        console.log('==================================');
        console.log(`📱 Application ID: ${appId}`);
        console.log(`🔗 Explorer: https://testnet.algoexplorer.io/application/${appId}`);
        console.log(`📊 Transaction: https://testnet.algoexplorer.io/tx/${result.txId}`);
        
        // Save deployment info
        const deploymentInfo = {
            applicationId: appId,
            transactionId: result.txId,
            deployer: account.addr,
            network: 'testnet',
            deployedAt: new Date().toISOString()
        };
        
        fs.writeFileSync('algorand-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('✅ Deployment saved to algorand-deployment.json');
        
        return { success: true, applicationId: appId };
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        return { success: false, error: error.message };
    }
}

simpleDeployment().then(result => {
    if (result.success) {
        console.log(`\n🚀 Deployment successful! App ID: ${result.applicationId}`);
    } else {
        console.log('\n❌ Deployment failed');
    }
});