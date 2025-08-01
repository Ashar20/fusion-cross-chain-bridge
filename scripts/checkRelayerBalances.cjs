/**
 * 🤖 CHECK DEDICATED RELAYER BALANCES
 * ✅ Verify funding of new relayer addresses
 * ✅ Confirm operational readiness
 */

const { ethers } = require('hardhat');
const algosdk = require('algosdk');

async function checkRelayerBalances() {
    console.log('🤖 CHECKING DEDICATED RELAYER BALANCES');
    console.log('======================================');
    console.log('✅ Verifying funding of new relayer addresses');
    console.log('✅ Confirming operational readiness');
    console.log('======================================\n');
    
    try {
        // New dedicated relayer addresses from generation
        const RELAYER_ETH_ADDRESS = '0x58924acDe600D5a0Fb3fb0AF49c8FE02060F79Ea';
        const RELAYER_ALGO_ADDRESS = 'BJDBVZITI7VRHJLMPY4C6BX5UVBHZVNT6PRD3ZZWO2E2HSDYGSF4KO6RR4';
        
        // 1. CHECK ETHEREUM RELAYER BALANCE
        console.log('🔗 ETHEREUM RELAYER STATUS:');
        console.log('============================');
        console.log(`📱 Address: ${RELAYER_ETH_ADDRESS}`);
        
        try {
            const ethProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
            const balance = await ethProvider.getBalance(RELAYER_ETH_ADDRESS);
            const balanceETH = ethers.formatEther(balance);
            
            console.log(`💰 Balance: ${balanceETH} ETH`);
            
            if (parseFloat(balanceETH) >= 0.1) {
                console.log('✅ Status: FUNDED & READY for gas payments!');
                console.log('✅ Sufficient balance for relayer operations');
            } else if (parseFloat(balanceETH) > 0) {
                console.log('⚠️ Status: PARTIALLY FUNDED (may need more ETH)');
                console.log(`⚠️ Recommended: 0.1+ ETH (current: ${balanceETH} ETH)`);
            } else {
                console.log('❌ Status: NOT FUNDED');
                console.log('❌ Needs ETH for gas payments');
            }
            
            console.log(`🔗 Explorer: https://sepolia.etherscan.io/address/${RELAYER_ETH_ADDRESS}`);
            
        } catch (error) {
            console.log('❌ Could not check Ethereum balance:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 2. CHECK ALGORAND RELAYER BALANCE
        console.log('🪙 ALGORAND RELAYER STATUS:');
        console.log('============================');
        console.log(`📱 Address: ${RELAYER_ALGO_ADDRESS}`);
        
        try {
            const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
            const accountInfo = await algodClient.accountInformation(RELAYER_ALGO_ADDRESS).do();
            const balanceMicroAlgos = parseInt(accountInfo.amount.toString());
            const balanceAlgos = balanceMicroAlgos / 1000000;
            
            console.log(`💰 Balance: ${balanceAlgos} ALGO`);
            
            if (balanceAlgos >= 10) {
                console.log('✅ Status: FUNDED & READY for transaction fees!');
                console.log('✅ Sufficient balance for relayer operations');
            } else if (balanceAlgos >= 1) {
                console.log('⚠️ Status: PARTIALLY FUNDED (may need more ALGO)');
                console.log(`⚠️ Recommended: 10+ ALGO (current: ${balanceAlgos} ALGO)`);
            } else if (balanceAlgos > 0) {
                console.log('⚠️ Status: MINIMAL FUNDING');
                console.log('⚠️ Needs more ALGO for sustainable operations');
            } else {
                console.log('❌ Status: NOT FUNDED');
                console.log('❌ Needs ALGO for transaction fees');
            }
            
            console.log(`🔗 Explorer: https://testnet.algoexplorer.io/address/${RELAYER_ALGO_ADDRESS}`);
            
        } catch (error) {
            console.log('❌ Could not check Algorand balance:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 3. OPERATIONAL READINESS SUMMARY
        console.log('🚀 RELAYER OPERATIONAL READINESS:');
        console.log('==================================');
        
        // Re-check both balances for summary
        try {
            const ethProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
            const ethBalance = await ethProvider.getBalance(RELAYER_ETH_ADDRESS);
            const ethBalanceETH = parseFloat(ethers.formatEther(ethBalance));
            
            const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
            const algoAccountInfo = await algodClient.accountInformation(RELAYER_ALGO_ADDRESS).do();
            const algoBalance = parseInt(algoAccountInfo.amount.toString()) / 1000000;
            
            const ethReady = ethBalanceETH >= 0.05; // Minimum operational threshold
            const algoReady = algoBalance >= 1; // Minimum operational threshold
            
            if (ethReady && algoReady) {
                console.log('🎉 BOTH RELAYERS: FUNDED & OPERATIONAL!');
                console.log('✅ Ethereum Relayer: Ready for gas payments');
                console.log('✅ Algorand Relayer: Ready for transaction fees');
                console.log('✅ Cross-Chain Bridge: READY FOR GASLESS SWAPS!');
                console.log('');
                console.log('🌉 NEXT STEPS:');
                console.log('==============');
                console.log('1. Deploy Algorand contract with dedicated relayer address');
                console.log('2. Start relayer service for gasless swap monitoring');
                console.log('3. Test end-to-end gasless cross-chain swaps');
                console.log('4. Begin processing user swap requests');
            } else {
                console.log('⚠️ RELAYER STATUS: NEEDS MORE FUNDING');
                if (!ethReady) {
                    console.log(`❌ Ethereum: Need more ETH (current: ${ethBalanceETH} ETH)`);
                }
                if (!algoReady) {
                    console.log(`❌ Algorand: Need more ALGO (current: ${algoBalance} ALGO)`);
                }
            }
            
        } catch (error) {
            console.log('⚠️ Could not verify operational readiness:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error checking relayer balances:', error.message);
    }
}

// Export for use in other modules
module.exports = { checkRelayerBalances };

// Run if called directly
if (require.main === module) {
    checkRelayerBalances();
} 