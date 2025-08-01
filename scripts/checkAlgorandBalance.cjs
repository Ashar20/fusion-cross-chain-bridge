#!/usr/bin/env node

/**
 * 💰 Check Algorand Account Balance
 * 
 * Checks the balance of your Algorand testnet account
 */

require('dotenv').config();

async function checkAlgorandBalance() {
    console.log('💰 Checking Algorand Account Balance...');
    console.log('='.repeat(50));
    
    const address = process.env.ALGORAND_ACCOUNT_ADDRESS;
    const rpcUrl = process.env.ALGORAND_RPC_URL;
    
    if (!address) {
        console.error('❌ ALGORAND_ACCOUNT_ADDRESS not found in .env');
        return;
    }
    
    console.log(`📋 Account: ${address}`);
    console.log(`🌐 Network: ${rpcUrl}`);
    console.log('');
    
    try {
        const response = await fetch(`${rpcUrl}/v2/accounts/${address}`);
        const data = await response.json();
        
        if (response.ok) {
            const balance = data.amount / 1000000; // Convert microAlgos to Algos
            const minBalance = data['min-balance'] / 1000000;
            const available = balance - minBalance;
            
            console.log('✅ Account Information:');
            console.log(`   Balance: ${balance} ALGO`);
            console.log(`   Min Balance: ${minBalance} ALGO`);
            console.log(`   Available: ${available} ALGO`);
            console.log(`   Status: ${data.status}`);
            console.log('');
            
            if (balance === 0) {
                console.log('❌ Account is not funded!');
                console.log('');
                console.log('🚰 To fund your account:');
                console.log('1. Visit: https://testnet.algoexplorer.io/dispenser');
                console.log(`2. Enter address: ${address}`);
                console.log('3. Request 10 ALGO');
                console.log('4. Run this script again to verify funding');
                return false;
            } else if (available < 1) {
                console.log('⚠️  Account balance is very low!');
                console.log('You may want to request more testnet ALGO for contract deployment.');
                return false;
            } else {
                console.log('✅ Account is sufficiently funded for contract deployment!');
                console.log(`💰 You have ${available.toFixed(2)} ALGO available for transactions.`);
                return true;
            }
        } else {
            console.error('❌ Failed to fetch account info:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error checking balance:', error.message);
        return false;
    }
}

async function main() {
    const isFunded = await checkAlgorandBalance();
    
    if (isFunded) {
        console.log('');
        console.log('🚀 Ready to deploy Algorand contracts!');
        console.log('Run: npm run deploy-algorand-contract');
    }
    
    process.exit(isFunded ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkAlgorandBalance };