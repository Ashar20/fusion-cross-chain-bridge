/**
 * Debug Algorand Transaction Parameters
 */

const algosdk = require('algosdk');

async function debugParams() {
    require('dotenv').config();
    
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    
    console.log('Getting suggested params...');
    const suggestedParams = await algodClient.getTransactionParams().do();
    console.log('Suggested params:');
    console.log('  fee:', suggestedParams.fee, typeof suggestedParams.fee);
    console.log('  firstRound:', suggestedParams.firstRound, typeof suggestedParams.firstRound);
    console.log('  lastRound:', suggestedParams.lastRound, typeof suggestedParams.lastRound);
    console.log('  genesisID:', suggestedParams.genesisID);
    console.log('  genesisHash:', suggestedParams.genesisHash);
    
    console.log('Getting status...');
    const status = await algodClient.status().do();
    console.log('Current round:', status['last-round'], typeof status['last-round']);
    
    // Test account creation
    const envMnemonic = process.env.ALGORAND_MNEMONIC;
    console.log('Mnemonic exists:', !!envMnemonic);
    
    if (envMnemonic) {
        try {
            const account = algosdk.mnemonicToSecretKey(envMnemonic);
            console.log('Account address:', account.addr);
            console.log('Account has SK:', !!account.sk);
        } catch (error) {
            console.log('Mnemonic error:', error.message);
        }
    }
}

debugParams().catch(console.error);