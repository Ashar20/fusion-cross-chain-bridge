const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.resolvers' });

class ResolverBidding {
    constructor(resolverIndex) {
        this.resolverIndex = resolverIndex;
        this.provider = null;
        this.resolver = null;
        this.enhancedResolver = null;
        this.initialize();
    }

    async initialize() {
        const infuraProjectId = process.env.INFURA_PROJECT_ID;
        const sepoliaUrl = process.env.SEPOLIA_URL || `https://sepolia.infura.io/v3/${infuraProjectId}`;
        this.provider = new ethers.JsonRpcProvider(sepoliaUrl);
        
        // Load resolver
        this.resolver = {
            name: process.env[`RESOLVER_${this.resolverIndex}_NAME`],
            address: process.env[`RESOLVER_${this.resolverIndex}_ADDRESS`],
            strategy: process.env[`RESOLVER_${this.resolverIndex}_STRATEGY`],
            riskTolerance: process.env[`RESOLVER_${this.resolverIndex}_RISK`],
            funding: process.env[`RESOLVER_${this.resolverIndex}_FUNDING`]
        };

        // Initialize EnhancedCrossChainResolver
        const enhancedResolverArtifact = require('../artifacts/contracts/EnhancedCrossChainResolver.sol/EnhancedCrossChainResolver.json');
        this.enhancedResolver = new ethers.Contract(
            process.env.ENHANCED_CROSS_CHAIN_RESOLVER,
            enhancedResolverArtifact.abi,
            new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
        );
    }

    async checkBalance() {
        const balance = await this.provider.getBalance(this.resolver.address);
        console.log(`${this.resolver.name} balance: ${ethers.formatEther(balance)} ETH`);
        return balance;
    }

    async placeBid(orderHash, bidAmount) {
        const balance = await this.checkBalance();
        const gasCost = ethers.parseEther('0.01'); // Estimate gas cost
        
        if (balance >= bidAmount + gasCost) {
            const tx = await this.enhancedResolver.placeBid(orderHash, bidAmount);
            console.log(`${this.resolver.name} placed bid: ${ethers.formatEther(bidAmount)} ETH`);
            console.log(`📝 Transaction: ${tx.hash}`);
            return tx;
        } else {
            throw new Error('Insufficient funds for bidding');
        }
    }

    async executePartialFill(orderHash, fillAmount, secret, algoAmount) {
        const tx = await this.enhancedResolver.executePartialFill(
            orderHash, fillAmount, secret, algoAmount
        );
        console.log(`${this.resolver.name} executed partial fill`);
        console.log(`📝 Transaction: ${tx.hash}`);
        return tx;
    }

    async getResolverInfo() {
        console.log(`\n📊 ${this.resolver.name} Information:`);
        console.log(`📍 Address: ${this.resolver.address}`);
        console.log(`📈 Strategy: ${this.resolver.strategy}`);
        console.log(`⚠️  Risk: ${this.resolver.riskTolerance}`);
        console.log(`💰 Required Funding: ${this.resolver.funding} ETH`);
        
        const balance = await this.checkBalance();
        return {
            ...this.resolver,
            balance: ethers.formatEther(balance)
        };
    }
}

module.exports = ResolverBidding;

// Usage example
if (require.main === module) {
    const bidding = new ResolverBidding(1); // Use resolver 1
    bidding.getResolverInfo();
}
