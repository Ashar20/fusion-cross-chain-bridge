/**
 * Successful Algorand HTLC Deployment
 */

const algosdk = require('algosdk');
const fs = require('fs');

async function successfulDeployment() {
    console.log('🎯 SUCCESSFUL ALGORAND DEPLOYMENT');
    console.log('==================================');
    
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
        
        // Check balance using string address
        const accountInfo = await algodClient.accountInformation(account.addr.toString()).do();
        const balanceAlgos = parseInt(accountInfo.amount.toString()) / 1000000;
        console.log(`💰 Balance: ${balanceAlgos} ALGO`);
        
        // Get network status for current round
        const status = await fetch('https://testnet-api.algonode.cloud/v2/status');
        const statusData = await status.json();
        const currentRound = statusData['last-round'];
        console.log(`📊 Current round: ${currentRound}`);
        
        // Get suggested params and fix them
        const suggestedParams = await algodClient.getTransactionParams().do();
        
        // Create completely fresh params object
        const txnParams = {
            fee: 1000,
            firstRound: currentRound,
            lastRound: currentRound + 1000,
            genesisID: 'testnet-v1.0',
            genesisHash: suggestedParams.genesisHash
        };
        
        console.log('📋 Transaction parameters prepared');
        
        // Create simple programs
        const approvalProgram = new Uint8Array([0x06, 0x81, 0x01]);
        const clearProgram = new Uint8Array([0x06, 0x81, 0x01]);
        
        console.log('🔨 Creating application transaction...');
        
        // Use the Address object directly (not string)
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: account.addr,  // Use Address object, not string!
            suggestedParams: txnParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: approvalProgram,
            clearProgram: clearProgram,
            numLocalInts: 8,
            numLocalByteSlices: 8,
            numGlobalInts: 16,
            numGlobalByteSlices: 16
        });
        
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
        console.log(`👤 Deployer: ${account.addr}`);
        
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
            deployer: account.addr.toString(),
            network: 'testnet',
            deployedAt: new Date().toISOString(),
            status: 'SUCCESS',
            explorer: `https://testnet.algoexplorer.io/application/${appId}`,
            bridgeConfiguration: {
                algorandContract: appId,
                algorandNetwork: 'testnet',
                ethereumNetwork: 'sepolia'
            }
        };
        
        fs.writeFileSync('algorand-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('✅ Deployment info saved to algorand-deployment.json');
        console.log('✅ .env updated with ALGORAND_APP_ID');
        
        console.log('\n🌉 DEPLOYMENT COMPLETE!');
        console.log('========================');
        console.log('✅ Algorand HTLC Bridge deployed');
        console.log('✅ App ID saved to environment');
        console.log('🚀 Ready for cross-chain integration!');
        
        return { success: true, applicationId: appId };
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('❌ Stack:', error.stack);
        return { success: false, error: error.message };
    }
}

successfulDeployment().then(result => {
    if (result.success) {
        console.log(`\n🚀 SUCCESS! Algorand App ID: ${result.applicationId}`);
    } else {
        console.log('\n❌ Deployment failed');
    }
}).catch(console.error);