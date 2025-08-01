/**
 * 🤖 GENERATE DEDICATED RELAYER ADDRESSES
 * ✅ Separate from user testing accounts
 * ✅ Professional production setup
 * ✅ Dedicated addresses for relayer operations only
 */

const { ethers } = require('hardhat');
const algosdk = require('algosdk');
const fs = require('fs');

async function generateDedicatedRelayerAddresses() {
    console.log('🤖 GENERATING DEDICATED RELAYER ADDRESSES');
    console.log('=========================================');
    console.log('✅ Creating separate addresses for relayer operations');
    console.log('✅ Independent from user testing accounts');
    console.log('✅ Professional production setup');
    console.log('=========================================\n');
    
    // 1. GENERATE ETHEREUM RELAYER ADDRESS
    console.log('🔗 GENERATING ETHEREUM RELAYER:');
    console.log('================================');
    
    const ethRelayerWallet = ethers.Wallet.createRandom();
    console.log(`📱 New Ethereum Relayer Address: ${ethRelayerWallet.address}`);
    console.log(`🔑 Private Key: ${ethRelayerWallet.privateKey}`);
    console.log(`🌐 Network: Sepolia Testnet`);
    console.log(`🎯 Purpose: Dedicated relayer operations only`);
    console.log(`🔗 Explorer: https://sepolia.etherscan.io/address/${ethRelayerWallet.address}`);
    
    // 2. GENERATE ALGORAND RELAYER ADDRESS
    console.log('\n🪙 GENERATING ALGORAND RELAYER:');
    console.log('===============================');
    
    const algoRelayerAccount = algosdk.generateAccount();
    const algoRelayerMnemonic = algosdk.secretKeyToMnemonic(algoRelayerAccount.sk);
    
    console.log(`📱 New Algorand Relayer Address: ${algoRelayerAccount.addr}`);
    console.log(`🔑 Mnemonic: ${algoRelayerMnemonic}`);
    console.log(`🌐 Network: Algorand Testnet`);
    console.log(`🎯 Purpose: Dedicated relayer operations only`);
    console.log(`🔗 Explorer: https://testnet.algoexplorer.io/address/${algoRelayerAccount.addr}`);
    
    // 3. CREATE RELAYER CONFIGURATION
    console.log('\n⚙️ CREATING RELAYER CONFIGURATION:');
    console.log('===================================');
    
    const relayerConfig = {
        generated: new Date().toISOString(),
        purpose: "Dedicated addresses for relayer operations - separate from user accounts",
        ethereum: {
            network: "sepolia",
            address: ethRelayerWallet.address,
            privateKey: ethRelayerWallet.privateKey,
            purpose: "Pays Ethereum gas fees, locks ETH in HTLCs",
            explorer: `https://sepolia.etherscan.io/address/${ethRelayerWallet.address}`,
            needsFunding: true,
            recommendedBalance: "0.1 ETH for gas fees"
        },
        algorand: {
            network: "testnet", 
            address: algoRelayerAccount.addr,
            mnemonic: algoRelayerMnemonic,
            purpose: "Pays Algorand fees, locks ALGO in HTLCs", 
            explorer: `https://testnet.algoexplorer.io/address/${algoRelayerAccount.addr}`,
            needsFunding: true,
            recommendedBalance: "10 ALGO for transaction fees"
        },
        separation: {
            userAccounts: "Your original testing accounts remain separate",
            relayerAccounts: "These new addresses are for relayer operations only",
            security: "Proper separation of concerns and fund isolation"
        }
    };
    
    // 4. SAVE CONFIGURATION
    fs.writeFileSync('RELAYER-ADDRESSES.json', JSON.stringify(relayerConfig, null, 2));
    console.log('✅ Relayer configuration saved to RELAYER-ADDRESSES.json');
    
    // 5. CREATE NEW .ENV TEMPLATE
    const envTemplate = `# 🤖 DEDICATED RELAYER ADDRESSES (PRODUCTION)
# ============================================
# These are SEPARATE from your testing accounts
# Use these addresses ONLY for relayer operations

# Ethereum Relayer (Sepolia)
RELAYER_ETH_PRIVATE_KEY=${ethRelayerWallet.privateKey}
RELAYER_ETH_ADDRESS=${ethRelayerWallet.address}

# Algorand Relayer (Testnet)  
RELAYER_ALGO_MNEMONIC="${algoRelayerMnemonic}"
RELAYER_ALGO_ADDRESS=${algoRelayerAccount.addr}

# Your Original Testing Accounts (keep separate)
# USER_ETH_PRIVATE_KEY=your_original_key
# USER_ALGO_MNEMONIC=your_original_mnemonic

# Network Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104
ALGORAND_RPC_URL=https://testnet-api.algonode.cloud
`;
    
    fs.writeFileSync('.env.relayer', envTemplate);
    console.log('✅ Relayer .env template saved to .env.relayer');
    
    // 6. FUNDING INSTRUCTIONS
    console.log('\n💰 FUNDING INSTRUCTIONS:');
    console.log('========================');
    console.log('To make your relayer operational, fund these NEW addresses:');
    console.log('');
    console.log('🔗 ETHEREUM RELAYER:');
    console.log(`   Address: ${ethRelayerWallet.address}`);
    console.log(`   Amount: 0.1+ ETH (for gas fees)`);
    console.log(`   Faucets: https://sepoliafaucet.com/`);
    console.log('');
    console.log('🪙 ALGORAND RELAYER:');
    console.log(`   Address: ${algoRelayerAccount.addr}`);
    console.log(`   Amount: 10+ ALGO (for transaction fees)`);
    console.log(`   Faucet: https://dispenser.testnet.aws.algodev.network/`);
    
    console.log('\n🔐 SECURITY BENEFITS:');
    console.log('=====================');
    console.log('✅ Fund Separation: Relayer funds isolated from user funds');
    console.log('✅ Risk Management: Relayer-specific risk profile');  
    console.log('✅ Professional Setup: Production-grade address separation');
    console.log('✅ Access Control: Different keys for different purposes');
    console.log('✅ Audit Trail: Clear separation for transaction tracking');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. Fund the new relayer addresses above');
    console.log('2. Update your configuration to use .env.relayer');
    console.log('3. Deploy Algorand contract with dedicated relayer address');
    console.log('4. Test gasless swaps with proper address separation');
    
    return relayerConfig;
}

// Export for use in other modules
module.exports = { generateDedicatedRelayerAddresses };

// Run if called directly
if (require.main === module) {
    generateDedicatedRelayerAddresses()
        .then((config) => {
            console.log('\n🎉 DEDICATED RELAYER ADDRESSES GENERATED!');
            console.log('=========================================');
            console.log('✅ Professional production setup complete');
            console.log('✅ Proper separation from testing accounts');
            console.log('✅ Ready for production relayer operations');
        })
        .catch(error => {
            console.error('❌ Error generating relayer addresses:', error);
        });
} 