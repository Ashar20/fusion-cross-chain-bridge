const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.resolvers' });

class ResolverWalletManager {
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
                strategy: process.env[`RESOLVER_${index}_STRATEGY`],
                riskTolerance: process.env[`RESOLVER_${index}_RISK`],
                funding: process.env[`RESOLVER_${index}_FUNDING`],
                description: process.env[`RESOLVER_${index}_DESCRIPTION`]
            });
            index++;
        }
    }

    async checkBalances() {
        console.log('💰 RESOLVER WALLET BALANCES');
        console.log('============================');
        
        for (const resolver of this.resolvers) {
            const balance = await this.provider.getBalance(resolver.address);
            console.log(`${resolver.name}: ${ethers.formatEther(balance)} ETH`);
        }
    }

    async fundResolver(resolverIndex, amount) {
        const resolver = this.resolvers[resolverIndex];
        if (!resolver) {
            throw new Error('Resolver not found');
        }

        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        const tx = await wallet.sendTransaction({
            to: resolver.address,
            value: ethers.parseEther(amount)
        });

        console.log(`💰 Funded ${resolver.name} with ${amount} ETH`);
        console.log(`📝 Transaction: ${tx.hash}`);
        
        return tx;
    }

    async withdrawFees(resolverIndex) {
        const resolver = this.resolvers[resolverIndex];
        if (!resolver) {
            throw new Error('Resolver not found');
        }

        const resolverWallet = new ethers.Wallet(resolver.privateKey, this.provider);
        const enhancedResolver = new ethers.Contract(
            process.env.ENHANCED_CROSS_CHAIN_RESOLVER,
            ['function withdrawResolverFees() external'],
            resolverWallet
        );

        const tx = await enhancedResolver.withdrawResolverFees();
        console.log(`💰 Withdrew fees from ${resolver.name}`);
        console.log(`📝 Transaction: ${tx.hash}`);
        
        return tx;
    }

    async getResolverInfo(resolverIndex) {
        const resolver = this.resolvers[resolverIndex];
        if (!resolver) {
            throw new Error('Resolver not found');
        }

        const balance = await this.provider.getBalance(resolver.address);
        
        console.log(`\n📊 ${resolver.name} Information:`);
        console.log(`📍 Address: ${resolver.address}`);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
        console.log(`📈 Strategy: ${resolver.strategy}`);
        console.log(`⚠️  Risk: ${resolver.riskTolerance}`);
        console.log(`📝 Description: ${resolver.description}`);
        
        return {
            ...resolver,
            balance: ethers.formatEther(balance)
        };
    }
}

module.exports = ResolverWalletManager;

// Usage example
if (require.main === module) {
    const manager = new ResolverWalletManager();
    manager.checkBalances();
}
