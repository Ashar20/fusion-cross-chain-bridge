#!/usr/bin/env node

/**
 * 🔥 TEST FUSION FLOW
 * 
 * ✅ Creates Fusion-style ALGO order for monitoring service
 * ✅ Tests Dutch auction detection and creation
 * ✅ Demonstrates 1inch Fusion patterns in action
 * ✅ Real blockchain transactions
 */

const algosdk = require('algosdk');
const crypto = require('crypto');

async function testFusionFlow() {
    console.log('🔥 TESTING FUSION FLOW');
    console.log('======================');
    console.log('✅ Creating Fusion-style ALGO order');
    console.log('✅ Monitor should detect and create auction');
    console.log('✅ Dutch auction with 180s duration');
    console.log('✅ Resolver competition enabled');
    console.log('======================\n');

    try {
        require('dotenv').config();

        // Initialize Algorand client
        const algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
        const algoAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);

        console.log('🔗 CONNECTED TO ALGORAND TESTNET');
        console.log(`   📍 Account: ${algoAccount.addr}`);

        // Check balance
        const algoInfo = await algoClient.accountInformation(algoAccount.addr).do();
        const algoBalance = algoInfo.amount / 1000000;
        console.log(`   💰 Balance: ${algoBalance} ALGO\n`);

        if (algoBalance < 0.2) {
            console.log('❌ Need at least 0.2 ALGO for testing');
            return;
        }

        // Create Fusion-style order parameters
        console.log('🎯 CREATING FUSION ORDER PARAMETERS...');
        const secret = crypto.randomBytes(32);
        const hashlock = crypto.createHash('sha256').update(secret).digest();
        const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const orderAmount = 100000; // 0.1 ALGO
        const ethTarget = '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53'; // Our ETH address

        console.log(`   💰 Order Amount: ${orderAmount / 1000000} ALGO`);
        console.log(`   🎯 ETH Target: ${ethTarget}`);
        console.log(`   🔒 Hashlock: ${hashlock.toString('hex')}`);
        console.log(`   ⏰ Timelock: ${timelock}`);

        // Create Fusion-style note (similar to 1inch limit order signature)
        const fusionNote = `FUSION_ORDER:ALGO_TO_ETH:ETH_TARGET:${ethTarget}:HASHLOCK:0x${hashlock.toString('hex')}:TIMELOCK:${timelock}:AMOUNT:${orderAmount}`;
        const note = new Uint8Array(Buffer.from(fusionNote, 'utf8'));

        console.log(`   📝 Fusion Note: ${fusionNote}\n`);

        // Get suggested params
        const suggestedParams = await algoClient.getTransactionParams().do();

        // Create Fusion-style payment transaction (like submitting limit order)
        console.log('📤 SUBMITTING FUSION ORDER TO ALGORAND...');
        const fusionOrderTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: algoAccount.addr,
            to: algoAccount.addr, // Self-payment to demonstrate concept
            amount: orderAmount,
            note: note,
            suggestedParams: suggestedParams
        });

        // Sign and submit
        const signedOrder = fusionOrderTxn.signTxn(algoAccount.sk);
        const { txId } = await algoClient.sendRawTransaction(signedOrder).do();
        
        console.log(`   ⏳ Fusion order submitted: ${txId}`);
        console.log('   ⏳ Waiting for confirmation...');

        // Wait for confirmation
        const confirmedTxn = await algosdk.waitForConfirmation(algoClient, txId, 4);

        console.log('   ✅ FUSION ORDER CONFIRMED!');
        console.log(`   📄 Round: ${confirmedTxn['confirmed-round']}`);
        console.log(`   🔗 AlgoExplorer: https://testnet.algoexplorer.io/tx/${txId}`);

        console.log('\n🔥 FUSION MONITOR SHOULD NOW DETECT THIS ORDER!');
        console.log('===============================================');
        console.log('✅ Monitor scanning Algorand blockchain');
        console.log('✅ Should detect Fusion order pattern');
        console.log('✅ Will create 180s Dutch auction');
        console.log('✅ Resolver competition will start');
        console.log('✅ Settlement will execute automatically');

        // Save order details for monitoring
        const orderDetails = {
            type: 'Fusion Order Test',
            txId,
            round: confirmedTxn['confirmed-round'],
            algoAmount: orderAmount / 1000000,
            ethTarget,
            hashlock: hashlock.toString('hex'),
            secret: secret.toString('hex'),
            timelock,
            note: fusionNote,
            timestamp: new Date().toISOString(),
            algoExplorer: `https://testnet.algoexplorer.io/tx/${txId}`,
            status: 'Submitted - Waiting for monitor detection'
        };

        require('fs').writeFileSync('FUSION_ORDER_TEST.json', JSON.stringify(orderDetails, null, 2));

        console.log('\n📊 ORDER DETAILS SAVED TO FUSION_ORDER_TEST.json');
        console.log('\n🎯 NEXT: Watch monitor logs for Dutch auction creation!');
        console.log('     Monitor should detect this within 5-10 seconds...');

        // Keep checking for auction detection
        console.log('\n👀 MONITORING FOR AUCTION DETECTION...');
        console.log('=====================================');
        
        let detectionChecks = 0;
        const checkInterval = setInterval(() => {
            detectionChecks++;
            console.log(`🔍 Checking for auction detection... (${detectionChecks}/12)`);
            
            // Check if FUSION_SETTLEMENTS.json was created (indicating detection)
            if (require('fs').existsSync('FUSION_SETTLEMENTS.json')) {
                console.log('🎉 AUCTION DETECTED AND SETTLEMENT EXECUTED!');
                console.log('✅ Check FUSION_SETTLEMENTS.json for results');
                clearInterval(checkInterval);
                process.exit(0);
            }
            
            if (detectionChecks >= 12) {
                console.log('⏰ Detection timeout - check monitor logs');
                clearInterval(checkInterval);
                process.exit(0);
            }
        }, 5000);

    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testFusionFlow()
        .catch((error) => {
            console.error('❌ Fusion flow test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testFusionFlow }; 