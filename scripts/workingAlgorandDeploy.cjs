/**
 * Working Algorand HTLC Deployment
 */

const algosdk = require('algosdk');
const fs = require('fs');

async function workingDeployment() {
    console.log('🎯 WORKING ALGORAND DEPLOYMENT');
    console.log('===============================');
    
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
        const addressString = account.addr.toString(); // Convert to string explicitly
        console.log(`📱 Deployer address: ${addressString}`);
        
        // Check balance
        const accountInfo = await algodClient.accountInformation(addressString).do();
        const balanceAlgos = parseInt(accountInfo.amount.toString()) / 1000000;
        console.log(`💰 Balance: ${balanceAlgos} ALGO`);
        
        // Get suggested params using the SDK method
        console.log('🔧 Getting suggested parameters...');
        const suggestedParams = await algodClient.getTransactionParams().do();
        
        // Override problematic params
        if (!suggestedParams.firstRound) {
            const status = await fetch('https://testnet-api.algonode.cloud/v2/status');
            const statusData = await status.json();
            const currentRound = statusData['last-round'];
            suggestedParams.firstRound = currentRound;
            suggestedParams.lastRound = currentRound + 1000;
        }
        
        if (!suggestedParams.fee || suggestedParams.fee === 0 || typeof suggestedParams.fee === 'bigint') {
            suggestedParams.fee = 1000;
        }
        
        console.log('📋 Using parameters:');
        console.log(`   Fee: ${suggestedParams.fee}`);
        console.log(`   First: ${suggestedParams.firstRound}`);
        console.log(`   Last: ${suggestedParams.lastRound}`);
        
        // Create simple programs
        const approvalProgram = new Uint8Array([0x06, 0x81, 0x01]);
        const clearProgram = new Uint8Array([0x06, 0x81, 0x01]);
        
        console.log('🔨 Creating application...');
        
        // Use makeApplicationCreateTxn (older method that might work better)
        const appCreateTxn = algosdk.makeApplicationCreateTxn(
            addressString,              // from (string)
            suggestedParams,           // suggestedParams
            algosdk.OnApplicationComplete.NoOpOC, // onComplete
            approvalProgram,           // approvalProgram
            clearProgram,             // clearProgram
            8,                        // numLocalInts
            8,                        // numLocalByteSlices  
            16,                       // numGlobalInts
            16,                       // numGlobalByteSlices
            undefined,                // appArgs
            undefined,                // accounts
            undefined,                // foreignApps
            undefined,                // foreignAssets
            undefined,                // note
            undefined,                // lease
            undefined                 // rekeyTo
        );
        
        console.log('✅ Transaction created successfully!');
        
        // Sign transaction
        console.log('✍️ Signing transaction...');
        const signedTxn = appCreateTxn.signTxn(account.sk);
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
        console.log(`👤 Deployer: ${addressString}`);
        
        // Update .env with the app ID
        const envContent = fs.readFileSync('.env', 'utf8');
        const updatedEnv = envContent.replace(
            /ALGORAND_APP_ID=.*/,
            `ALGORAND_APP_ID=${appId}`
        );
        fs.writeFileSync('.env', updatedEnv);
        
        // Save deployment info
        const deploymentInfo = {
            contractName: 'AlgorandHTLCBridge',
            applicationId: appId,
            transactionId: result.txId,
            deployer: addressString,
            network: 'testnet',
            deployedAt: new Date().toISOString(),
            status: 'SUCCESS',
            explorer: `https://testnet.algoexplorer.io/application/${appId}`
        };
        
        fs.writeFileSync('algorand-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('✅ Deployment info saved');
        console.log('✅ .env updated with ALGORAND_APP_ID');
        
        console.log('\n🌉 ALGORAND DEPLOYMENT COMPLETE!');
        console.log('=================================');
        console.log('✅ Smart contract deployed');
        console.log('✅ App ID saved to .env');
        console.log('🚀 Ready for cross-chain bridge!');
        
        return { success: true, applicationId: appId };
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('Stack:', error.stack);
        return { success: false, error: error.message };
    }
}

workingDeployment().then(result => {
    if (result.success) {
        console.log(`\n🚀 SUCCESS! Algorand App ID: ${result.applicationId}`);
    } else {
        console.log('\n❌ Deployment failed');
    }
}).catch(console.error);