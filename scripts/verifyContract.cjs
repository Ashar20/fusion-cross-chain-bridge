#!/usr/bin/env node

const { ethers } = require('hardhat');

async function verifyContract() {
    console.log('🔍 VERIFYING ENHANCED LIMIT ORDER BRIDGE CONTRACT...\n');

    try {
        // Contract details
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        const contractName = 'EnhancedLimitOrderBridge';
        
        console.log(`📋 Contract Address: ${contractAddress}`);
        console.log(`📋 Contract Name: ${contractName}`);
        console.log(`🌐 Network: Sepolia Testnet`);

        // Get constructor arguments (if any)
        const constructorArguments = [];
        
        console.log('\n🔧 Constructor Arguments:');
        if (constructorArguments.length > 0) {
            constructorArguments.forEach((arg, index) => {
                console.log(`  Arg ${index}: ${arg}`);
            });
        } else {
            console.log('  No constructor arguments (default constructor)');
        }

        // Verify the contract
        console.log('\n🚀 Starting verification...');
        
        try {
            await hre.run('verify:verify', {
                address: contractAddress,
                constructorArguments: constructorArguments,
                contract: `contracts/${contractName}.sol:${contractName}`
            });
            
            console.log('✅ Contract verified successfully!');
            console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
            
        } catch (error) {
            if (error.message.includes('Already Verified')) {
                console.log('✅ Contract is already verified on Etherscan!');
                console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
            } else {
                console.error('❌ Verification failed:', error.message);
                throw error;
            }
        }

        // Save verification info
        const verificationInfo = {
            timestamp: new Date().toISOString(),
            contractAddress: contractAddress,
            contractName: contractName,
            network: 'sepolia',
            constructorArguments: constructorArguments,
            etherscanUrl: `https://sepolia.etherscan.io/address/${contractAddress}#code`,
            status: 'VERIFIED'
        };

        require('fs').writeFileSync(
            'CONTRACT_VERIFICATION_INFO.json',
            JSON.stringify(verificationInfo, null, 2)
        );

        console.log('\n📄 Verification info saved to: CONTRACT_VERIFICATION_INFO.json');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    }
}

// Run verification
async function main() {
    await verifyContract();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { verifyContract }; 