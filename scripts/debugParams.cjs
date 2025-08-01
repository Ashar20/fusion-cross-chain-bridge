/**
 * Debug Parameters
 */

const algosdk = require('algosdk');

async function debugParams() {
    require('dotenv').config();
    
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    const account = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    
    console.log('Getting suggested params...');
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    console.log('Checking each field:');
    console.log('fee:', suggestedParams.fee, typeof suggestedParams.fee, suggestedParams.fee === null, suggestedParams.fee === undefined);
    console.log('firstRound:', suggestedParams.firstRound, typeof suggestedParams.firstRound, suggestedParams.firstRound === null, suggestedParams.firstRound === undefined);
    console.log('lastRound:', suggestedParams.lastRound, typeof suggestedParams.lastRound, suggestedParams.lastRound === null, suggestedParams.lastRound === undefined);
    console.log('genesisID:', suggestedParams.genesisID, typeof suggestedParams.genesisID, suggestedParams.genesisID === null, suggestedParams.genesisID === undefined);
    console.log('genesisHash:', suggestedParams.genesisHash, typeof suggestedParams.genesisHash, suggestedParams.genesisHash === null, suggestedParams.genesisHash === undefined);
    
    // Get status manually
    const status = await fetch('https://testnet-api.algonode.cloud/v2/status');
    const statusData = await status.json();
    console.log('Current round from API:', statusData['last-round']);
    
    // Try to fix the params completely
    const fixedParams = {
        fee: 1000,
        firstRound: statusData['last-round'],
        lastRound: statusData['last-round'] + 1000,
        genesisID: 'testnet-v1.0',
        genesisHash: suggestedParams.genesisHash
    };
    
    console.log('Fixed params:');
    console.log('fee:', fixedParams.fee, typeof fixedParams.fee);
    console.log('firstRound:', fixedParams.firstRound, typeof fixedParams.firstRound);
    console.log('lastRound:', fixedParams.lastRound, typeof fixedParams.lastRound);
    console.log('genesisID:', fixedParams.genesisID, typeof fixedParams.genesisID);
    console.log('genesisHash:', fixedParams.genesisHash, typeof fixedParams.genesisHash);
    
    // Try the transaction creation
    console.log('\nTrying transaction creation...');
    try {
        const approvalProgram = new Uint8Array([0x06, 0x81, 0x01]);
        const clearProgram = new Uint8Array([0x06, 0x81, 0x01]);
        
        const txn = algosdk.makeApplicationCreateTxnFromObject({
            from: account.addr.toString(),
            suggestedParams: fixedParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: approvalProgram,
            clearProgram: clearProgram,
            numLocalInts: 8,
            numLocalByteSlices: 8,
            numGlobalInts: 16,
            numGlobalByteSlices: 16
        });
        
        console.log('✅ Transaction created successfully!');
        console.log('Transaction type:', typeof txn);
        
    } catch (error) {
        console.log('❌ Transaction creation failed:', error.message);
        console.log('Stack:', error.stack);
    }
}

debugParams().catch(console.error);