#!/usr/bin/env node

/**
 * 🔧 DEPLOY FIXED ALGORAND HTLC CONTRACT
 * 
 * Compiles and deploys the fixed AlgorandHTLCBridge.py with correct parameter handling
 */

const algosdk = require('algosdk');
const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

async function deployFixedAlgorandContract() {
    console.log('🔧 DEPLOYING FIXED ALGORAND HTLC CONTRACT');
    console.log('=========================================');
    console.log('✅ Fixed: Parameter indexing in all functions');
    console.log('✅ Fixed: Argument count validation');
    console.log('✅ Fixed: Router function name matching');
    console.log('=========================================\n');
    
    const algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    const deployerAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    
    console.log('📍 Deployer:', deployerAccount.addr);
    console.log('🌐 Network: Algorand Testnet');
    console.log('');
    
    try {
        // Step 1: Compile PyTeal contract
        console.log('🔨 STEP 1: COMPILING PYTEAL CONTRACT');
        console.log('===================================');
        
        const contractPath = 'contracts/algorand/AlgorandHTLCBridge.py';
        
        // Use Python to compile PyTeal to TEAL
        console.log('📝 Compiling PyTeal to TEAL...');
        const tealCode = execSync(`source pyteal_env/bin/activate && python3 ${contractPath}`, { 
            encoding: 'utf8',
            shell: '/bin/bash'
        });
        
        // Save TEAL code to file for reference
        fs.writeFileSync('AlgorandHTLCBridge.teal', tealCode);
        console.log('✅ TEAL code saved to AlgorandHTLCBridge.teal');
        console.log('📄 TEAL length:', tealCode.length, 'characters');
        console.log('');
        
        // Step 2: Compile TEAL to bytecode
        console.log('🔨 STEP 2: COMPILING TEAL TO BYTECODE');
        console.log('====================================');
        
        const compileResponse = await algoClient.compile(Buffer.from(tealCode)).do();
        const compiledProgram = new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
        
        console.log('✅ Contract compiled successfully');
        console.log('📊 Bytecode length:', compiledProgram.length, 'bytes');
        console.log('🔗 Hash:', compileResponse.hash);
        console.log('');
        
        // Step 3: Deploy contract
        console.log('🚀 STEP 3: DEPLOYING TO ALGORAND TESTNET');
        console.log('========================================');
        
        const suggestedParams = await algoClient.getTransactionParams().do();
        
        // Create application creation transaction
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: deployerAccount.addr,
            suggestedParams: suggestedParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: compiledProgram,
            clearProgram: new Uint8Array(Buffer.from('I3ByYWdtYSB2ZXJzaW9uIDEKaW50IDE=', 'base64')), // Simple clear program
            numLocalInts: 8,      // Increased for more HTLC data
            numLocalByteSlices: 8,
            numGlobalInts: 4,
            numGlobalByteSlices: 4
        });
        
        // Sign and submit
        const signedTxn = appCreateTxn.signTxn(deployerAccount.sk);
        const txResult = await algoClient.sendRawTransaction(signedTxn).do();
        
        console.log('📝 Deploy Transaction:', txResult.txId);
        console.log('🔗 Algoexplorer: https://testnet.algoexplorer.io/tx/' + txResult.txId);
        console.log('⏳ Waiting for confirmation...');
        
        // Wait for confirmation
        const confirmedTxn = await algosdk.waitForConfirmation(algoClient, txResult.txId, 4);
        const appId = confirmedTxn['application-index'];
        
        console.log('');
        console.log('🎉 DEPLOYMENT SUCCESSFUL!');
        console.log('=========================');
        console.log('📱 New App ID:', appId);
        console.log('📍 Contract Address:', algosdk.getApplicationAddress(appId));
        console.log('🏗️  Created in Round:', confirmedTxn['confirmed-round']);
        console.log('');
        
        // Step 4: Save deployment info
        const deploymentInfo = {
            appId: appId,
            contractAddress: algosdk.getApplicationAddress(appId),
            deployerAddress: deployerAccount.addr,
            txId: txResult.txId,
            confirmedRound: confirmedTxn['confirmed-round'],
            deploymentTime: new Date().toISOString(),
            fixes: [
                'Fixed parameter indexing in create_htlc function',
                'Fixed argument count validation in all functions',
                'Fixed router function name matching',
                'All functions now account for function name as arg[0]'
            ]
        };
        
        fs.writeFileSync('FIXED_ALGORAND_DEPLOYMENT.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('💾 Deployment info saved to FIXED_ALGORAND_DEPLOYMENT.json');
        console.log('');
        
        console.log('🔧 MIGRATION STEPS:');
        console.log('==================');
        console.log('1. ✅ Old App ID: 743645803 (has parameter bugs)');
        console.log('2. ✅ New App ID:', appId, '(fixed parameters)');
        console.log('3. 📝 Update atomic swap scripts to use new App ID');
        console.log('4. 🧪 Test with fixed parameter handling');
        console.log('');
        
        return {
            success: true,
            appId: appId,
            contractAddress: algosdk.getApplicationAddress(appId),
            oldAppId: 743645803
        };
        
    } catch (error) {
        console.error('❌ DEPLOYMENT FAILED:', error.message);
        return { success: false, error: error.message };
    }
}

// Execute deployment
if (require.main === module) {
    deployFixedAlgorandContract().then(result => {
        if (result.success) {
            console.log('🌟 FIXED ALGORAND CONTRACT DEPLOYED!');
            console.log('====================================');
            console.log('📱 Use App ID:', result.appId);
            console.log('🔗 Contract Address:', result.contractAddress);
            console.log('🗑️  Old App ID (buggy):', result.oldAppId);
        }
        process.exit(result.success ? 0 : 1);
    }).catch(console.error);
}

module.exports = deployFixedAlgorandContract; 