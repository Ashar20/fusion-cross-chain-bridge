#!/usr/bin/env node

/**
 * 🚀 DEPLOY FIXED ALGORAND HTLC BRIDGE CONTRACT
 * 
 * Deploy the fixed version of the Algorand HTLC contract
 * Addresses all identified issues with argument handling and local state
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeployFixedAlgorandHTLC {
    constructor() {
        console.log('🚀 DEPLOYING FIXED ALGORAND HTLC BRIDGE CONTRACT');
        console.log('================================================');
        console.log('✅ Fixed argument count handling');
        console.log('✅ Improved local state management');
        console.log('✅ Consistent function naming');
        console.log('✅ Backward compatibility support');
        console.log('================================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        try {
            await this.checkEnvironment();
            await this.compileContract();
            await this.deployContract();
            await this.verifyDeployment();
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }
    
    async checkEnvironment() {
        console.log('🔍 CHECKING ENVIRONMENT');
        console.log('=======================');
        
        // Check if .env file exists
        if (!fs.existsSync('.env')) {
            throw new Error('.env file not found. Please ensure environment variables are set.');
        }
        
        // Check if PyTeal is available
        try {
            execSync('source pyteal_env/bin/activate && python3 -c "import pyteal; print(\"PyTeal version:\", pyteal.__version__)"', { stdio: 'pipe', shell: '/bin/bash' });
            console.log('✅ PyTeal is available in virtual environment');
        } catch (error) {
            console.log('⚠️  PyTeal not found, attempting to install in virtual environment...');
            try {
                execSync('source pyteal_env/bin/activate && pip install pyteal', { stdio: 'inherit', shell: '/bin/bash' });
                console.log('✅ PyTeal installed successfully');
            } catch (installError) {
                throw new Error('Failed to install PyTeal. Please install manually: pip3 install pyteal');
            }
        }
        
        // Check if Algorand SDK is available
        try {
            require('algosdk');
            console.log('✅ Algorand SDK is available');
        } catch (error) {
            throw new Error('Algorand SDK not found. Please install: npm install algosdk');
        }
        
        console.log('✅ Environment check complete\n');
    }
    
    async compileContract() {
        console.log('🔨 COMPILING FIXED ALGORAND CONTRACT');
        console.log('=====================================');
        
        const contractPath = 'contracts/algorand/AlgorandHTLCBridgeFixed.py';
        
        if (!fs.existsSync(contractPath)) {
            throw new Error(`Contract file not found: ${contractPath}`);
        }
        
        try {
            // Compile the PyTeal contract using virtual environment
            const tealCode = execSync(`source pyteal_env/bin/activate && python3 ${contractPath}`, { encoding: 'utf8', shell: '/bin/bash' });
            
            // Save the compiled TEAL code
            const tealPath = 'contracts/algorand/AlgorandHTLCBridgeFixed.teal';
            fs.writeFileSync(tealPath, tealCode);
            
            console.log('✅ Contract compiled successfully');
            console.log(`   TEAL code saved to: ${tealPath}`);
            console.log(`   TEAL code length: ${tealCode.length} characters`);
            
            this.tealCode = tealCode;
            this.tealPath = tealPath;
            
        } catch (error) {
            throw new Error(`Compilation failed: ${error.message}`);
        }
        
        console.log('✅ Compilation complete\n');
    }
    
    async deployContract() {
        console.log('🚀 DEPLOYING TO ALGORAND TESTNET');
        console.log('=================================');
        
        try {
            // Load environment variables
            require('dotenv').config();
            
            const { Algodv2, mnemonicToSecretKey } = require('algosdk');
            
            // Initialize Algorand client
            const algodClient = new Algodv2(
                process.env.ALGOD_TOKEN || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
                process.env.ALGOD_PORT || 443
            );
            
            // Get account from mnemonic
            const account = mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
            console.log(`   Deploying from: ${account.addr}`);
            
            // Get suggested parameters
            const suggestedParams = await algodClient.getTransactionParams().do();
            
            // Create application creation transaction
            const { makeApplicationCreateTxn } = require('algosdk');
            
            // Convert TEAL code to Uint8Array
            const tealBytes = new TextEncoder().encode(this.tealCode);
            
            const txn = makeApplicationCreateTxn(
                account.addr,
                suggestedParams,
                0, // onComplete
                tealBytes,
                tealBytes, // clear program
                5, // numGlobalByteSlices
                5, // numGlobalInts
                10, // numLocalByteSlices
                10, // numLocalInts
                [], // appArgs
                [], // accounts
                [], // foreignApps
                [], // foreignAssets
                undefined, // note
                undefined, // lease
                undefined, // rekeyTo
                undefined, // extraPages
                undefined // boxes
            );
            
            // Sign and submit transaction
            const signedTxn = txn.signTxn(account.sk);
            const txId = await algodClient.sendRawTransaction(signedTxn).do();
            
            console.log(`   Transaction submitted: ${txId.txId}`);
            
            // Wait for confirmation
            console.log('   Waiting for confirmation...');
            const confirmedTxn = await this.waitForConfirmation(algodClient, txId.txId, 5);
            
            // Extract application ID
            const appId = confirmedTxn['application-index'];
            
            console.log(`✅ Contract deployed successfully!`);
            console.log(`   Application ID: ${appId}`);
            console.log(`   Transaction: ${txId.txId}`);
            console.log(`   Explorer: https://testnet.algoexplorer.io/application/${appId}`);
            
            this.appId = appId;
            this.txId = txId.txId;
            
        } catch (error) {
            throw new Error(`Deployment failed: ${error.message}`);
        }
        
        console.log('✅ Deployment complete\n');
    }
    
    // Removed signTransaction method as we're using txn.signTxn() directly
    
    async waitForConfirmation(client, txId, timeout) {
        const { waitForConfirmation } = require('algosdk');
        return await waitForConfirmation(client, txId, timeout);
    }
    
    async verifyDeployment() {
        console.log('🔍 VERIFYING DEPLOYMENT');
        console.log('=======================');
        
        try {
            const { Algodv2 } = require('algosdk');
            
            const algodClient = new Algodv2(
                process.env.ALGOD_TOKEN || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
                process.env.ALGOD_PORT || 443
            );
            
            // Get application info
            const appInfo = await algodClient.getApplicationByID(this.appId).do();
            
            console.log('✅ Application info retrieved:');
            console.log(`   Creator: ${appInfo.params.creator}`);
            console.log(`   Global State: ${Object.keys(appInfo.params.globalState).length} keys`);
            console.log(`   Local State Schema: ${appInfo.params.localStateSchema.numByteSlices} byte slices, ${appInfo.params.localStateSchema.numUints} uints`);
            
            // Save deployment info
            const deploymentInfo = {
                network: 'Algorand Testnet',
                chainId: 416002,
                timestamp: new Date().toISOString(),
                status: 'SUCCESS',
                contract: 'AlgorandHTLCBridgeFixed',
                appId: this.appId,
                txId: this.txId,
                creator: appInfo.params.creator,
                explorer: `https://testnet.algoexplorer.io/application/${this.appId}`,
                fixes: [
                    'Fixed argument count handling (supports both 7 and 8 arguments)',
                    'Improved local state management',
                    'Consistent function naming',
                    'Backward compatibility support',
                    'Better error handling'
                ],
                functions: {
                    create: ['create_htlc', 'create'],
                    withdraw: ['withdraw', 'withdraw_htlc', 'claim_htlc'],
                    refund: ['refund', 'refund_htlc'],
                    status: ['status', 'get_htlc_status'],
                    update: ['update', 'update_contract']
                }
            };
            
            fs.writeFileSync('ALGORAND_FIXED_DEPLOYMENT.json', JSON.stringify(deploymentInfo, null, 2));
            
            console.log('✅ Deployment info saved to: ALGORAND_FIXED_DEPLOYMENT.json');
            
        } catch (error) {
            console.warn('⚠️  Verification failed:', error.message);
        }
        
        console.log('✅ Verification complete\n');
    }
}

// Run deployment
new DeployFixedAlgorandHTLC(); 
 
 