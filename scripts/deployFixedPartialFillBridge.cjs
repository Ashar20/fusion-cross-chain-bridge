/**
 * DEPLOY FIXED ALGORAND PARTIAL FILL BRIDGE
 * Deploy the corrected PyTeal partial fill bridge contract
 */

const algosdk = require('algosdk');
const { spawn } = require('child_process');
const fs = require('fs');

async function deployFixedPartialFillBridge() {
    console.log('🚀 DEPLOYING FIXED ALGORAND PARTIAL FILL BRIDGE');
    console.log('===============================================');
    
    try {
        require('dotenv').config();
        
        // Initialize Algorand client
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        const algoAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
        
        console.log(`📍 Deployer: ${algoAccount.addr}`);
        console.log(`💰 Balance Check...`);
        
        // Check balance
        const accountInfo = await algodClient.accountInformation(algoAccount.addr).do();
        const balance = parseInt(accountInfo.amount.toString()) / 1000000;
        console.log(`💎 ALGO Balance: ${balance} ALGO`);
        
        if (balance < 0.1) {
            throw new Error('Insufficient ALGO balance for deployment');
        }
        
        // STEP 1: Compile the contract using Python
        console.log('\n🔧 STEP 1: COMPILE CONTRACT');
        console.log('===========================');
        
        const compileContract = () => {
            return new Promise((resolve, reject) => {
                const python = spawn('python3', ['contracts/algorand/FixedAlgorandPartialFillBridge.py'], {
                    cwd: process.cwd()
                });
                
                let stdout = '';
                let stderr = '';
                
                python.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                python.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                python.on('close', (code) => {
                    if (code === 0) {
                        resolve(stdout);
                    } else {
                        reject(new Error(`Compilation failed: ${stderr}`));
                    }
                });
            });
        };
        
        const compileOutput = await compileContract();
        console.log('✅ Contract compiled successfully');
        
        // Extract TEAL programs from compilation output
        const approvalMatch = compileOutput.match(/📝 APPROVAL PROGRAM TEAL:\n={50}\n([\s\S]*?)\n\n📝 CLEAR PROGRAM TEAL:/);
        const clearMatch = compileOutput.match(/📝 CLEAR PROGRAM TEAL:\n={50}\n([\s\S]*?)$/);
        
        if (!approvalMatch || !clearMatch) {
            throw new Error('Failed to extract TEAL programs from compilation output');
        }
        
        const approvalTeal = approvalMatch[1].trim();
        const clearTeal = clearMatch[1].trim();
        
        console.log(`📊 Approval Program: ${approvalTeal.length} characters`);
        console.log(`📊 Clear Program: ${clearTeal.length} characters`);
        
        // STEP 2: Compile TEAL to bytecode
        console.log('\n🔧 STEP 2: COMPILE TEAL TO BYTECODE');
        console.log('==================================');
        
        const approvalCompileResponse = await algodClient.compile(approvalTeal).do();
        const clearCompileResponse = await algodClient.compile(clearTeal).do();
        
        const approvalProgram = new Uint8Array(Buffer.from(approvalCompileResponse.result, 'base64'));
        const clearProgram = new Uint8Array(Buffer.from(clearCompileResponse.result, 'base64'));
        
        console.log(`✅ Approval bytecode: ${approvalProgram.length} bytes`);
        console.log(`✅ Clear bytecode: ${clearProgram.length} bytes`);
        
        // STEP 3: Deploy the contract
        console.log('\n🚀 STEP 3: DEPLOY CONTRACT');
        console.log('==========================');
        
        const suggestedParams = await algodClient.getTransactionParams().do();
        if (!suggestedParams.firstRound) {
            const status = await fetch('https://testnet-api.algonode.cloud/v2/status');
            const statusData = await status.json();
            const currentRound = statusData['last-round'];
            suggestedParams.firstRound = currentRound;
            suggestedParams.lastRound = currentRound + 1000;
        }
        
        // Define state schemas
        const localSchema = {
            numUints: 2,
            numByteSlices: 0
        };
        const globalSchema = {
            numUints: 7,  // total_deposited, total_filled, remaining_amount, executed, refunded, partial_fills_enabled, timelock
            numByteSlices: 4  // hashlock, recipient, maker, and one extra
        };
        
        const deployTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: algoAccount.addr,
            suggestedParams: suggestedParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: approvalProgram,
            clearProgram: clearProgram,
            numLocalInts: localSchema.numUints,
            numLocalByteSlices: localSchema.numByteSlices,
            numGlobalInts: globalSchema.numUints,
            numGlobalByteSlices: globalSchema.numByteSlices,
            extraPages: 0
        });
        
        // Sign and submit transaction
        const signedDeployTxn = deployTxn.signTxn(algoAccount.sk);
        const deployTxId = await algodClient.sendRawTransaction(signedDeployTxn).do();
        
        console.log(`📝 Deploy Transaction: ${deployTxId.txId}`);
        console.log('⏳ Waiting for confirmation...');
        
        // Wait for confirmation
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, deployTxId.txId, 4);
        const appId = confirmedTxn['application-index'];
        
        console.log(`🎉 CONTRACT DEPLOYED SUCCESSFULLY!`);
        console.log(`📱 App ID: ${appId}`);
        console.log(`🔗 Explorer: https://testnet.algoexplorer.io/application/${appId}`);
        console.log(`📋 Transaction: https://testnet.algoexplorer.io/tx/${deployTxId.txId}`);
        
        // STEP 4: Update environment file
        console.log('\n📝 STEP 4: UPDATE ENVIRONMENT');
        console.log('============================');
        
        // Read current .env file
        let envContent = '';
        if (fs.existsSync('.env')) {
            envContent = fs.readFileSync('.env', 'utf8');
        }
        
        // Update or add PARTIAL_FILL_APP_ID
        const partialFillAppIdRegex = /^PARTIAL_FILL_APP_ID=.*$/m;
        const newPartialFillAppIdLine = `PARTIAL_FILL_APP_ID=${appId}`;
        
        if (partialFillAppIdRegex.test(envContent)) {
            envContent = envContent.replace(partialFillAppIdRegex, newPartialFillAppIdLine);
        } else {
            envContent += `\\n${newPartialFillAppIdLine}`;
        }
        
        fs.writeFileSync('.env', envContent);
        console.log(`✅ Updated .env with PARTIAL_FILL_APP_ID=${appId}`);
        
        // STEP 5: Contract status verification
        console.log('\n✅ STEP 5: VERIFY DEPLOYMENT');
        console.log('============================');
        
        const appInfo = await algodClient.getApplicationByID(appId).do();
        console.log(`🔍 Contract Status: ACTIVE`);
        console.log(`👤 Creator: ${appInfo.params.creator}`);
        console.log(`🗂️  Global Schema: ${appInfo.params['global-state-schema']['num-uints']} uints, ${appInfo.params['global-state-schema']['num-byte-slices']} bytes`);
        console.log(`🏠 Local Schema: ${appInfo.params['local-state-schema']['num-uints']} uints, ${appInfo.params['local-state-schema']['num-byte-slices']} bytes`);
        
        console.log('\n🎊 DEPLOYMENT COMPLETE!');
        console.log('=======================');
        console.log('✅ Fixed Algorand Partial Fill Bridge deployed successfully');
        console.log('✅ PyTeal compilation errors resolved');
        console.log('✅ Contract ready for partial fill operations');
        console.log('✅ Environment updated with new App ID');
        
        return {
            success: true,
            appId: appId,
            transactionId: deployTxId.txId,
            creator: algoAccount.addr,
            approvalProgramSize: approvalProgram.length,
            clearProgramSize: clearProgram.length
        };
        
    } catch (error) {
        console.error('❌ DEPLOYMENT FAILED');
        console.error('====================');
        console.error(`Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Execute deployment
deployFixedPartialFillBridge().then(result => {
    if (result.success) {
        console.log('\\n🚀 FIXED PARTIAL FILL BRIDGE: DEPLOYED!');
        console.log('========================================');
        console.log(`📱 App ID: ${result.appId}`);
        console.log(`🎯 Ready for partial fill operations`);
    }
}).catch(console.error);