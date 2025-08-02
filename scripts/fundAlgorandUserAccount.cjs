const algosdk = require('algosdk');
require('dotenv').config();

async function fundAlgorandUserAccount() {
    console.log('💰 Funding Algorand User Account...');
    console.log('=====================================');

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2(
        process.env.ALGOD_TOKEN || '',
        process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
        process.env.ALGOD_PORT || '443'
    );

    // Get deployment account (funding source)
    const deploymentAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    console.log(`📤 Funding Source: ${deploymentAccount.addr}`);

    // Get user account (funding destination)
    const userAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_USER_MNEMONIC);
    console.log(`📥 Funding Destination: ${userAccount.addr}`);

    try {
        // Get account info
        const deploymentInfo = await algodClient.accountInformation(deploymentAccount.addr).do();
        const userInfo = await algodClient.accountInformation(userAccount.addr).do();

        console.log(`\n📊 Current Balances:`);
        console.log(`   Deployment Account: ${deploymentInfo.amount / 1e6} ALGO`);
        console.log(`   User Account: ${userInfo.amount / 1e6} ALGO`);

        // Calculate funding amount (send 5 ALGO to user)
        const fundingAmount = 5 * 1e6; // 5 ALGO in microAlgos
        const minBalance = userInfo['min-balance'] || 0;
        const requiredBalance = minBalance + fundingAmount;

        console.log(`\n💰 Funding Details:`);
        console.log(`   Amount to send: 5 ALGO`);
        console.log(`   User min balance: ${minBalance / 1e6} ALGO`);
        console.log(`   Required total: ${requiredBalance / 1e6} ALGO`);

        if (deploymentInfo.amount < fundingAmount + 1000) {
            console.log('❌ Deployment account has insufficient balance');
            return;
        }

        // Create payment transaction
        const suggestedParams = await algodClient.getTransactionParams().do();
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: deploymentAccount.addr,
            to: userAccount.addr,
            amount: fundingAmount,
            suggestedParams: suggestedParams
        });

        // Sign and submit transaction
        const signedTxn = txn.signTxn(deploymentAccount.sk);
        const txId = await algodClient.sendRawTransaction(signedTxn).do();

        console.log(`\n📤 Funding transaction submitted:`);
        console.log(`   Transaction ID: ${txId.txId}`);
        console.log(`   Explorer: https://testnet.algoexplorer.io/tx/${txId.txId}`);

        // Wait for confirmation
        console.log('\n⏳ Waiting for confirmation...');
        const confirmation = await algosdk.waitForConfirmation(algodClient, txId.txId, 10);
        console.log(`✅ Transaction confirmed in round ${confirmation['confirmed-round']}`);

        // Check final balances
        const finalDeploymentInfo = await algodClient.accountInformation(deploymentAccount.addr).do();
        const finalUserInfo = await algodClient.accountInformation(userAccount.addr).do();

        console.log(`\n📊 Final Balances:`);
        console.log(`   Deployment Account: ${finalDeploymentInfo.amount / 1e6} ALGO`);
        console.log(`   User Account: ${finalUserInfo.amount / 1e6} ALGO`);
        console.log(`   Available for HTLC: ${(finalUserInfo.amount - finalUserInfo['min-balance']) / 1e6} ALGO`);

        console.log('\n✅ User account funded successfully!');

    } catch (error) {
        console.error('❌ Error funding user account:', error);
        throw error;
    }
}

// Run the script
if (require.main === module) {
    fundAlgorandUserAccount()
        .then(() => {
            console.log('\n🎯 Ready for cross-chain swap testing!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = fundAlgorandUserAccount; 
require('dotenv').config();

async function fundAlgorandUserAccount() {
    console.log('💰 Funding Algorand User Account...');
    console.log('=====================================');

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2(
        process.env.ALGOD_TOKEN || '',
        process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
        process.env.ALGOD_PORT || '443'
    );

    // Get deployment account (funding source)
    const deploymentAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    console.log(`📤 Funding Source: ${deploymentAccount.addr}`);

    // Get user account (funding destination)
    const userAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_USER_MNEMONIC);
    console.log(`📥 Funding Destination: ${userAccount.addr}`);

    try {
        // Get account info
        const deploymentInfo = await algodClient.accountInformation(deploymentAccount.addr).do();
        const userInfo = await algodClient.accountInformation(userAccount.addr).do();

        console.log(`\n📊 Current Balances:`);
        console.log(`   Deployment Account: ${deploymentInfo.amount / 1e6} ALGO`);
        console.log(`   User Account: ${userInfo.amount / 1e6} ALGO`);

        // Calculate funding amount (send 5 ALGO to user)
        const fundingAmount = 5 * 1e6; // 5 ALGO in microAlgos
        const minBalance = userInfo['min-balance'] || 0;
        const requiredBalance = minBalance + fundingAmount;

        console.log(`\n💰 Funding Details:`);
        console.log(`   Amount to send: 5 ALGO`);
        console.log(`   User min balance: ${minBalance / 1e6} ALGO`);
        console.log(`   Required total: ${requiredBalance / 1e6} ALGO`);

        if (deploymentInfo.amount < fundingAmount + 1000) {
            console.log('❌ Deployment account has insufficient balance');
            return;
        }

        // Create payment transaction
        const suggestedParams = await algodClient.getTransactionParams().do();
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: deploymentAccount.addr,
            to: userAccount.addr,
            amount: fundingAmount,
            suggestedParams: suggestedParams
        });

        // Sign and submit transaction
        const signedTxn = txn.signTxn(deploymentAccount.sk);
        const txId = await algodClient.sendRawTransaction(signedTxn).do();

        console.log(`\n📤 Funding transaction submitted:`);
        console.log(`   Transaction ID: ${txId.txId}`);
        console.log(`   Explorer: https://testnet.algoexplorer.io/tx/${txId.txId}`);

        // Wait for confirmation
        console.log('\n⏳ Waiting for confirmation...');
        const confirmation = await algosdk.waitForConfirmation(algodClient, txId.txId, 10);
        console.log(`✅ Transaction confirmed in round ${confirmation['confirmed-round']}`);

        // Check final balances
        const finalDeploymentInfo = await algodClient.accountInformation(deploymentAccount.addr).do();
        const finalUserInfo = await algodClient.accountInformation(userAccount.addr).do();

        console.log(`\n📊 Final Balances:`);
        console.log(`   Deployment Account: ${finalDeploymentInfo.amount / 1e6} ALGO`);
        console.log(`   User Account: ${finalUserInfo.amount / 1e6} ALGO`);
        console.log(`   Available for HTLC: ${(finalUserInfo.amount - finalUserInfo['min-balance']) / 1e6} ALGO`);

        console.log('\n✅ User account funded successfully!');

    } catch (error) {
        console.error('❌ Error funding user account:', error);
        throw error;
    }
}

// Run the script
if (require.main === module) {
    fundAlgorandUserAccount()
        .then(() => {
            console.log('\n🎯 Ready for cross-chain swap testing!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = fundAlgorandUserAccount; 
 