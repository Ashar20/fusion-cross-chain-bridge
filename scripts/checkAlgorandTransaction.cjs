const algosdk = require('algosdk');
require('dotenv').config();

async function checkAlgorandTransaction() {
    try {
        // Initialize Algorand client
        const algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
        
        // Transaction ID from the previous test
        const txId = 'LGBCV55D6UPROOESFF4RN4VC3AMBOEWYTAVLM53VD25A7YFCAX6A';
        
        console.log('🔍 CHECKING ALGORAND TRANSACTION');
        console.log('================================');
        console.log(`📋 Transaction ID: ${txId}`);
        console.log(`🔗 Explorer: https://testnet.algoexplorer.io/tx/${txId}`);
        
        // Get transaction details
        const txInfo = await algoClient.pendingTransactionInformation(txId).do();
        
        console.log('\n📊 TRANSACTION DETAILS:');
        console.log('========================');
        console.log(`Status: ${txInfo.poolError || 'Confirmed'}`);
        console.log(`Round: ${txInfo['confirmed-round']}`);
        console.log(`Fee: ${txInfo.fee} microAlgos`);
        console.log(`Sender: ${txInfo.txn.txn.snd}`);
        console.log(`Receiver: ${txInfo.txn.txn.rcv}`);
        console.log(`Amount: ${txInfo.txn.txn.amt} microAlgos`);
        
        // Check if it's an application call
        if (txInfo.txn.txn.apid) {
            console.log(`App ID: ${txInfo.txn.txn.apid}`);
            console.log(`App Args: ${txInfo.txn.txn.apaa ? txInfo.txn.txn.apaa.map(arg => Buffer.from(arg, 'base64').toString('hex')) : 'None'}`);
        }
        
        // Check for application state changes
        if (txInfo['application-index']) {
            console.log(`Created App ID: ${txInfo['application-index']}`);
        }
        
        console.log('\n✅ Transaction verified on Algorand testnet!');
        
    } catch (error) {
        console.error('❌ Error checking transaction:', error.message);
        
        // Try to get transaction from indexer
        try {
            console.log('\n🔄 Trying Algorand Indexer...');
            const indexerUrl = 'https://testnet-idx.algonode.cloud';
            const response = await fetch(`${indexerUrl}/v2/transactions/${txId}`);
            const txData = await response.json();
            
            if (txData.transaction) {
                console.log('📊 TRANSACTION FOUND VIA INDEXER:');
                console.log('==================================');
                console.log(`Round: ${txData.transaction['confirmed-round']}`);
                console.log(`Sender: ${txData.transaction.sender}`);
                console.log(`Fee: ${txData.transaction.fee}`);
                console.log(`Type: ${txData.transaction['tx-type']}`);
                
                if (txData.transaction['application-transaction']) {
                    const appTx = txData.transaction['application-transaction'];
                    console.log(`App ID: ${appTx['application-id']}`);
                    console.log(`On Completion: ${appTx['on-completion']}`);
                    console.log(`App Args: ${appTx['application-args'] ? appTx['application-args'].length : 0} arguments`);
                }
                
                console.log('\n✅ Transaction verified via Algorand Indexer!');
            }
        } catch (indexerError) {
            console.error('❌ Indexer also failed:', indexerError.message);
        }
    }
}

checkAlgorandTransaction().catch(console.error); 