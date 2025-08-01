#!/usr/bin/env node

/**
 * 🔍 ACCOUNT FUNDING STATUS CHECKER
 * 
 * Checks which accounts need funding for contract deployments
 * Shows current balances and required amounts
 */

const { ethers } = require('hardhat');
const algosdk = require('algosdk');

async function checkAccountFunding() {
    console.log('🔍 ACCOUNT FUNDING STATUS CHECKER');
    console.log('=================================');
    console.log('✅ Checking which accounts need funding');
    console.log('✅ Showing current balances vs required amounts');
    console.log('=================================\n');

    // Check Ethereum account
    console.log('🔗 ETHEREUM DEPLOYMENT ACCOUNT:');
    console.log('==============================');

    try {
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        
        // The account used for previous deployments
        const ethAccount = '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53';
        const balance = await provider.getBalance(ethAccount);
        const balanceETH = ethers.formatEther(balance);
        
        const requiredETH = 0.06; // Required for LimitOrderBridge.sol deployment
        const hasEnoughETH = parseFloat(balanceETH) >= requiredETH;

        console.log(`📍 Account: ${ethAccount}`);
        console.log(`🌐 Network: Sepolia Testnet (Chain ID: 11155111)`);
        console.log(`💰 Current Balance: ${balanceETH} ETH`);
        console.log(`📊 Required: ${requiredETH} ETH (for LimitOrderBridge.sol)`);
        console.log(`✅ Status: ${hasEnoughETH ? '✅ FUNDED' : '❌ NEEDS FUNDING'}`);
        
        if (!hasEnoughETH) {
            const needed = (requiredETH - parseFloat(balanceETH)).toFixed(6);
            console.log(`🚨 Need to add: ${needed} ETH`);
            console.log('💡 Sepolia Faucets:');
            console.log('   • https://sepoliafaucet.com/');
            console.log('   • https://www.alchemy.com/faucets/ethereum-sepolia');
            console.log('   • https://cloud.google.com/application/web3/faucet/ethereum/sepolia');
        }

    } catch (error) {
        console.log(`❌ Error checking Ethereum account: ${error.message}`);
    }

    console.log('\n');

    // Check Algorand account
    console.log('🪙 ALGORAND DEPLOYMENT ACCOUNT:');
    console.log('==============================');

    try {
        // Algorand testnet client
        const algodToken = '';
        const algodServer = 'https://testnet-api.algonode.cloud';
        const algodPort = 443;
        const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

        const algoAccount = 'V2HHWIMPZMH4VMMB2KHNKKPJAI35Z3NUMVWFRE22DKQS7K4SBMYHHP6P7M';
        
        try {
            const accountInfo = await algodClient.accountInformation(algoAccount).do();
            const balanceAlgo = accountInfo.amount / 1000000; // Convert microAlgos to Algos
            
            const requiredAlgo = 3.069; // Required for AlgorandHTLCBridge.py deployment
            const hasEnoughAlgo = balanceAlgo >= requiredAlgo;

            console.log(`📍 Account: ${algoAccount}`);
            console.log(`🌐 Network: Algorand Testnet`);
            console.log(`💰 Current Balance: ${balanceAlgo.toFixed(6)} ALGO`);
            console.log(`📊 Required: ${requiredAlgo} ALGO (for AlgorandHTLCBridge.py)`);
            console.log(`✅ Status: ${hasEnoughAlgo ? '✅ FUNDED' : '❌ NEEDS FUNDING'}`);
            
            if (!hasEnoughAlgo) {
                const needed = (requiredAlgo - balanceAlgo).toFixed(6);
                console.log(`🚨 Need to add: ${needed} ALGO`);
                console.log('💡 Algorand Faucets:');
                console.log('   • https://testnet.algoexplorer.io/dispenser');
                console.log('   • https://bank.testnet.algorand.network/');
            }

        } catch (algoError) {
            if (algoError.message.includes('account does not exist')) {
                console.log(`📍 Account: ${algoAccount}`);
                console.log(`🌐 Network: Algorand Testnet`);
                console.log(`💰 Current Balance: 0 ALGO (Account not found)`);
                console.log(`📊 Required: 3.069 ALGO`);
                console.log(`✅ Status: ❌ NEEDS FUNDING (Account doesn't exist)`);
                console.log('🚨 Need to add: 3.069 ALGO');
                console.log('💡 This account needs to be created by sending ALGO to it');
            } else {
                console.log(`❌ Error checking account: ${algoError.message}`);
            }
        }

    } catch (error) {
        console.log(`❌ Error connecting to Algorand: ${error.message}`);
    }

    console.log('\n');

    // Summary
    console.log('📊 FUNDING SUMMARY:');
    console.log('==================');
    
    console.log('\n💰 ACCOUNTS THAT NEED FUNDING:');
    console.log('');
    console.log('1. 🔗 ETHEREUM (for LimitOrderBridge.sol):');
    console.log(`   📍 Account: 0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53`);
    console.log('   💰 Required: ~0.06 ETH (~$200)');
    console.log('   🌐 Network: Sepolia Testnet');
    console.log('   🎯 Purpose: Deploy LimitOrderBridge.sol contract');
    console.log('');
    
    console.log('2. 🪙 ALGORAND (for AlgorandHTLCBridge.py):');
    console.log(`   📍 Account: V2HHWIMPZMH4VMMB2KHNKKPJAI35Z3NUMVWFRE22DKQS7K4SBMYHHP6P7M`);
    console.log('   💰 Required: 3.069 ALGO (~$6)');
    console.log('   🌐 Network: Algorand Testnet');
    console.log('   🎯 Purpose: Deploy AlgorandHTLCBridge.py contract');
    console.log('');

    console.log('🚀 AFTER FUNDING BOTH ACCOUNTS:');
    console.log('1. Deploy LimitOrderBridge.sol: npx hardhat run scripts/deployLimitOrderBridge.cjs --network sepolia');
    console.log('2. Deploy AlgorandHTLCBridge.py: node scripts/deployAlgorandWithEnvAddress.cjs');
    console.log('3. Configure cross-chain integration');
    console.log('4. Test complete limit order workflow');
    console.log('');
    console.log('💡 Total cost: ~$206 for complete gasless cross-chain system!');
}

// Export for use in other modules
module.exports = { checkAccountFunding };

// Run if called directly
if (require.main === module) {
    checkAccountFunding().catch(console.error);
} 