/**
 * Deploy using private key instead of mnemonic
 */

const algosdk = require('algosdk');
const fs = require('fs');

async function deployWithPrivateKey() {
    console.log('🎯 ALGORAND DEPLOYMENT WITH PRIVATE KEY');
    console.log('======================================');
    
    try {
        require('dotenv').config();
        
        // Initialize client
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        console.log('✅ Algorand client initialized');
        
        // Try to create account from private key instead of mnemonic
        const privateKeyBase64 = process.env.ALGORAND_PRIVATE_KEY;
        if (!privateKeyBase64) {
            throw new Error('ALGORAND_PRIVATE_KEY not found in .env');
        }
        
        // Decode the private key
        const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
        console.log(`🔑 Private key bytes length: ${privateKeyBytes.length}`);
        
        // Create account from private key bytes
        const account = {
            addr: algosdk.encodeAddress(privateKeyBytes.slice(32)), // Last 32 bytes are public key
            sk: privateKeyBytes
        };
        
        console.log(`📱 Account address: ${account.addr}`);
        console.log(`🔑 Secret key length: ${account.sk.length}`);
        
        // Verify this matches the expected address
        const expectedAddr = process.env.ALGORAND_ACCOUNT_ADDRESS;
        console.log(`🔍 Expected: ${expectedAddr}`);
        console.log(`🔍 Got: ${account.addr}`);
        console.log(`✅ Addresses match: ${account.addr === expectedAddr}`);
        
        // Check balance
        const accountInfo = await algodClient.accountInformation(account.addr).do();
        const balanceAlgos = parseInt(accountInfo.amount.toString()) / 1000000;
        console.log(`💰 Balance: ${balanceAlgos} ALGO`);
        
        // Get current round manually
        const statusResponse = await fetch('https://testnet-api.algonode.cloud/v2/status');
        const statusData = await statusResponse.json();
        const currentRound = statusData['last-round'];
        console.log(`📊 Current round: ${currentRound}`);
        
        // Create transaction parameters
        const txnParams = {
            fee: 1000,
            firstRound: currentRound,
            lastRound: currentRound + 1000,
            genesisID: 'testnet-v1.0',
            genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexkd/cOUJOiI='
        };
        
        // Convert genesisHash to Uint8Array
        txnParams.genesisHash = new Uint8Array(Buffer.from(txnParams.genesisHash, 'base64'));
        
        console.log('📋 Transaction parameters:');
        console.log(`   Fee: ${txnParams.fee}`);
        console.log(`   First Round: ${txnParams.firstRound}`);
        console.log(`   Last Round: ${txnParams.lastRound}`);
        console.log(`   Genesis ID: ${txnParams.genesisID}`);
        
        // Simple programs
        const approvalProgram = new Uint8Array([0x06, 0x81, 0x01]);
        const clearProgram = new Uint8Array([0x06, 0x81, 0x01]);
        
        console.log('🔨 Creating transaction...');
        
        // Try using the new account format
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: account.addr,
            suggestedParams: txnParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: approvalProgram,
            clearProgram: clearProgram,
            numLocalInts: 8,
            numLocalByteSlices: 8,
            numGlobalInts: 16,
            numGlobalByteSlices: 16
        });
        
        console.log('✅ Transaction created!');
        
        // Sign and submit
        const signedTxn = appCreateTxn.signTxn(account.sk);
        const result = await algodClient.sendRawTransaction(signedTxn).do();
        console.log(`✅ Transaction submitted: ${result.txId}`);
        
        const confirmed = await algosdk.waitForConfirmation(algodClient, result.txId, 4);
        const appId = confirmed['application-index'];
        
        console.log(`\n🎉 SUCCESS! App ID: ${appId}`);
        
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
        console.error('❌ Deployment failed:', error.message);
        console.error('Stack:', error.stack);
        return { success: false, error: error.message };
    }
}

deployWithPrivateKey().then(result => {
    if (result.success) {
        console.log(`\n🚀 Deployment successful! App ID: ${result.applicationId}`);
    }
}).catch(console.error);