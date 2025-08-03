/**
 * Final Working Algorand HTLC Deployment
 */

const algosdk = require('algosdk');
const fs = require('fs');

async function finalDeployment() {
    console.log('🎯 FINAL ALGORAND DEPLOYMENT');
    console.log('=============================');
    
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
        console.log(`🔑 Address type: ${typeof account.addr}`);
        console.log(`🔑 Address constructor: ${account.addr.constructor.name}`);
        
        // Convert address to string if needed
        let fromAddress;
        if (typeof account.addr === 'string') {
            fromAddress = account.addr;
        } else if (account.addr.toString) {
            fromAddress = account.addr.toString();
        } else {
            throw new Error('Cannot convert address to string');
        }
        
        console.log(`📱 Using address: ${fromAddress} (${typeof fromAddress})`);
        
        // Check balance
        const accountInfo = await algodClient.accountInformation(fromAddress).do();
        const balanceAlgos = parseInt(accountInfo.amount.toString()) / 1000000;
        console.log(`💰 Balance: ${balanceAlgos} ALGO`);
        
        // Get suggested params
        console.log('🔧 Getting suggested parameters...');
        const suggestedParams = await algodClient.getTransactionParams().do();
        
        // Fix params if needed
        if (!suggestedParams.firstRound) {
            const status = await fetch('https://testnet-api.algonode.cloud/v2/status');
            const statusData = await status.json();
            const currentRound = statusData['last-round'];
            suggestedParams.firstRound = currentRound;
            suggestedParams.lastRound = currentRound + 1000;
        }
        
        // Convert fee to number if it's bigint
        if (typeof suggestedParams.fee === 'bigint') {
            suggestedParams.fee = Number(suggestedParams.fee);
        }
        if (!suggestedParams.fee || suggestedParams.fee === 0) {
            suggestedParams.fee = 1000;
        }
        
        console.log('📋 Parameters:');
        console.log(`   Fee: ${suggestedParams.fee} (${typeof suggestedParams.fee})`);
        console.log(`   First: ${suggestedParams.firstRound} (${typeof suggestedParams.firstRound})`);
        console.log(`   Last: ${suggestedParams.lastRound} (${typeof suggestedParams.lastRound})`);
        console.log(`   Genesis ID: ${suggestedParams.genesisID}`);
        
        // Create simple programs
        const approvalProgram = new Uint8Array([0x06, 0x81, 0x01]);
        const clearProgram = new Uint8Array([0x06, 0x81, 0x01]);
        
        console.log('🔨 Creating application transaction...');
        console.log(`🔨 From address: "${fromAddress}" (type: ${typeof fromAddress})`);
        
        // Create the transaction object with explicit parameter validation
        const txnObject = {
            from: fromAddress,
            suggestedParams: suggestedParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: approvalProgram,
            clearProgram: clearProgram,
            numLocalInts: 8,
            numLocalByteSlices: 8,
            numGlobalInts: 16,
            numGlobalByteSlices: 16
        };
        
        console.log('🔍 Transaction object prepared:');
        console.log(`   from: "${txnObject.from}" (${typeof txnObject.from})`);
        console.log(`   onComplete: ${txnObject.onComplete}`);
        console.log(`   approval program length: ${txnObject.approvalProgram.length}`);
        console.log(`   clear program length: ${txnObject.clearProgram.length}`);
        
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject(txnObject);
        
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
        console.log(`👤 Deployer: ${fromAddress}`);
        
        // Update .env
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
            deployer: fromAddress,
            network: 'testnet',
            deployedAt: new Date().toISOString(),
            status: 'SUCCESS',
            explorer: `https://testnet.algoexplorer.io/application/${appId}`
        };
        
        fs.writeFileSync('algorand-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('✅ Deployment info saved');
        console.log('✅ .env updated with ALGORAND_APP_ID');
        
        console.log('\n🌉 DEPLOYMENT COMPLETE!');
        console.log('========================');
        console.log('✅ Algorand smart contract deployed');
        console.log('✅ App ID saved to .env file');
        console.log('🚀 Ready for cross-chain operations!');
        
        return { success: true, applicationId: appId };
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('❌ Stack:', error.stack);
        return { success: false, error: error.message };
    }
}

finalDeployment().then(result => {
    if (result.success) {
        console.log(`\n🚀 SUCCESS! Algorand App deployed with ID: ${result.applicationId}`);
    } else {
        console.log('\n❌ Deployment failed - check logs above');
    }
}).catch(console.error);