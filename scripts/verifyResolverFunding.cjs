const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.resolvers' });

class ResolverFundingVerifier {
    constructor() {
        this.provider = null;
        this.resolvers = [];
        this.initialize();
    }

    async initialize() {
        const infuraProjectId = process.env.INFURA_PROJECT_ID;
        const sepoliaUrl = process.env.SEPOLIA_URL || `https://sepolia.infura.io/v3/${infuraProjectId}`;
        this.provider = new ethers.JsonRpcProvider(sepoliaUrl);
        
        // Load resolvers from environment
        this.loadResolvers();
    }

    loadResolvers() {
        let index = 1;
        while (process.env[`RESOLVER_${index}_ADDRESS`]) {
            this.resolvers.push({
                name: process.env[`RESOLVER_${index}_NAME`],
                address: process.env[`RESOLVER_${index}_ADDRESS`],
                funding: process.env[`RESOLVER_${index}_FUNDING`],
                strategy: process.env[`RESOLVER_${index}_STRATEGY`]
            });
            index++;
        }
    }

    async verifyFunding() {
        console.log('🔍 VERIFYING RESOLVER FUNDING');
        console.log('==============================');
        
        let totalFunded = ethers.parseEther('0');
        let totalRequired = ethers.parseEther('0');
        
        for (const resolver of this.resolvers) {
            const balance = await this.provider.getBalance(resolver.address);
            const required = ethers.parseEther(resolver.funding);
            
            totalFunded += balance;
            totalRequired += required;
            
            const status = balance >= required ? '✅ FUNDED' : '❌ NEEDS FUNDING';
            const percentage = (balance * 100n) / required;
            
            console.log(`\n${resolver.name}:`);
            console.log(`  Address: ${resolver.address}`);
            console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
            console.log(`  Required: ${resolver.funding} ETH`);
            console.log(`  Status: ${status} (${percentage}%)`);
            console.log(`  Strategy: ${resolver.strategy}`);
        }
        
        console.log('\n📊 SUMMARY:');
        console.log(`Total Funded: ${ethers.formatEther(totalFunded)} ETH`);
        console.log(`Total Required: ${ethers.formatEther(totalRequired)} ETH`);
        
        if (totalFunded >= totalRequired) {
            console.log('🎉 ALL RESOLVERS ARE FUNDED AND READY!');
        } else {
            console.log('⚠️  SOME RESOLVERS NEED FUNDING');
        }
    }

    async checkEtherscanLinks() {
        console.log('\n🔗 ETHERSCAN LINKS:');
        console.log('==================');
        
        this.resolvers.forEach((resolver, index) => {
            console.log(`${index + 1}. ${resolver.name}:`);
            console.log(`   https://sepolia.etherscan.io/address/${resolver.address}`);
        });
    }
}

// Main execution
if (require.main === module) {
    const verifier = new ResolverFundingVerifier();
    verifier.verifyFunding().then(() => {
        verifier.checkEtherscanLinks();
    });
}

module.exports = ResolverFundingVerifier;
