const algosdk = require('algosdk');

async function checkBalance() {
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    const address = 'ICWQKP7BL3AWYODFEZFIRXK6X6SAM5MJYZUIYG6YDPSDTA37EWOIVGUP2M';
    
    try {
        console.log(`🔍 Checking balance for: ${address}`);
        const accountInfo = await algodClient.accountInformation(address).do();
        const balanceMicroAlgos = parseInt(accountInfo.amount.toString());
        const balanceAlgos = balanceMicroAlgos / 1000000;
        
        console.log(`💰 Balance: ${balanceAlgos} ALGO (${balanceMicroAlgos} microAlgos)`);
        console.log(`📊 Account exists: ${accountInfo.address ? 'YES' : 'NO'}`);
        
        if (balanceMicroAlgos > 0) {
            console.log('✅ Account is funded and ready for deployment!');
        } else {
            console.log('❌ Account needs funding');
            console.log('🔗 Fund at: https://dispenser.testnet.aws.algodev.network/');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('not found')) {
            console.log('🔗 Account not found. Fund at: https://dispenser.testnet.aws.algodev.network/');
        }
    }
}

checkBalance().catch(console.error); 