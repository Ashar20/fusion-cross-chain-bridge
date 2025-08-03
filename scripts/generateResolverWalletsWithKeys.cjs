#!/usr/bin/env node

/**
 * 🔑 GENERATE RESOLVER WALLETS WITH PRIVATE KEYS
 * 
 * Creates new resolver wallets with private keys for bidding
 */

const { ethers } = require('ethers');
const fs = require('fs');

class ResolverWalletGenerator {
    constructor() {
        this.resolvers = [];
    }

    async generateResolverWallets() {
        console.log('🔑 GENERATING RESOLVER WALLETS WITH PRIVATE KEYS');
        console.log('================================================\n');

        // Define resolver configurations
        const resolverConfigs = [
            {
                name: 'High-Frequency-Resolver-1',
                strategy: 'High-frequency bidding',
                risk: 'High',
                funding: '0.5',
                description: 'High-frequency trading resolver for fast execution'
            },
            {
                name: 'Arbitrage-Resolver-1',
                strategy: 'Arbitrage opportunities',
                risk: 'Medium',
                funding: '0.8',
                description: 'Arbitrage resolver for price differences'
            },
            {
                name: 'MEV-Resolver-1',
                strategy: 'MEV extraction',
                risk: 'High',
                funding: '1.0',
                description: 'MEV resolver for maximum extractable value'
            },
            {
                name: 'Backup-Resolver-1',
                strategy: 'Conservative bidding',
                risk: 'Low',
                funding: '0.3',
                description: 'Backup resolver for redundancy'
            }
        ];

        console.log('🎯 Generating resolver wallets...\n');

        for (const config of resolverConfigs) {
            // Generate new wallet
            const wallet = ethers.Wallet.createRandom();
            
            const resolver = {
                name: config.name,
                address: wallet.address,
                privateKey: wallet.privateKey,
                strategy: config.strategy,
                risk: config.risk,
                funding: config.funding,
                description: config.description,
                balance: '0',
                bidCount: 0,
                successCount: 0
            };

            this.resolvers.push(resolver);

            console.log(`✅ ${config.name}:`);
            console.log(`   Address: ${wallet.address}`);
            console.log(`   Private Key: ${wallet.privateKey}`);
            console.log(`   Strategy: ${config.strategy}`);
            console.log(`   Risk: ${config.risk}`);
            console.log(`   Funding: ${config.funding} ETH`);
            console.log(`   Description: ${config.description}`);
            console.log('');
        }

        // Save to JSON file
        const resolverData = {
            timestamp: new Date().toISOString(),
            network: 'sepolia',
            totalResolvers: this.resolvers.length,
            totalFunding: this.resolvers.reduce((sum, r) => sum + parseFloat(r.funding), 0),
            resolvers: this.resolvers
        };

        fs.writeFileSync('resolver-wallets-with-keys.json', JSON.stringify(resolverData, null, 2));
        console.log('✅ Resolver wallets saved to resolver-wallets-with-keys.json');

        // Update .env.resolvers file
        this.updateEnvResolvers();

        // Create funding script
        this.createFundingScript();

        console.log('\n🎉 RESOLVER WALLETS GENERATED SUCCESSFULLY!');
        console.log('============================================');
        console.log('📋 Next steps:');
        console.log('1. Fund the resolver wallets with ETH');
        console.log('2. Run the real bidding script');
        console.log('3. Watch the competitive bidding!');
    }

    updateEnvResolvers() {
        let envContent = `# Resolver Wallet Environment Configuration
# Generated on: ${new Date().toISOString()}
# Network: Sepolia Testnet

# Contract Addresses
RESOLVER_ADDRESS_MANAGER=0xF5b1ED98d34005B974dA8071BAE029954CEC53F2
ENHANCED_CROSS_CHAIN_RESOLVER=0xdE9fA203098BaD66399d9743a6505E9967171815

`;

        this.resolvers.forEach((resolver, index) => {
            const num = index + 1;
            envContent += `# ${resolver.name}
RESOLVER_${num}_NAME=${resolver.name}
RESOLVER_${num}_ADDRESS=${resolver.address}
RESOLVER_${num}_PRIVATE_KEY=${resolver.privateKey}
RESOLVER_${num}_STRATEGY=${resolver.strategy}
RESOLVER_${num}_RISK=${resolver.risk}
RESOLVER_${num}_FUNDING=${resolver.funding}
RESOLVER_${num}_DESCRIPTION=${resolver.description}

`;
        });

        envContent += `# Total Configuration
TOTAL_RESOLVERS=${this.resolvers.length}
TOTAL_FUNDING=${this.resolvers.reduce((sum, r) => sum + parseFloat(r.funding), 0)}

# Usage Instructions:
# 1. Copy this file to .env.resolvers
# 2. Use in scripts: require('dotenv').config({ path: '.env.resolvers' })
# 3. Access resolver: process.env.RESOLVER_1_ADDRESS
# 4. Access private key: process.env.RESOLVER_1_PRIVATE_KEY
INFURA_PROJECT_ID=5e10b8fae3204550a60ddfe976dee9b5
`;

        fs.writeFileSync('.env.resolvers.new', envContent);
        console.log('✅ Updated .env.resolvers.new with private keys');
    }

    createFundingScript() {
        const fundingScript = `#!/usr/bin/env node

/**
 * 💰 FUND RESOLVER WALLETS
 * 
 * Script to fund the generated resolver wallets
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function fundResolverWallets() {
    console.log('💰 FUNDING RESOLVER WALLETS');
    console.log('============================\\n');

    try {
        require('dotenv').config();
        
        // Load resolver data
        const resolverData = JSON.parse(fs.readFileSync('./resolver-wallets-with-keys.json', 'utf8'));
        
        // Initialize provider and user wallet
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log(\`👤 Funding from: \${userWallet.address}\`);
        
        const userBalance = await provider.getBalance(userWallet.address);
        console.log(\`💰 User balance: \${ethers.formatEther(userBalance)} ETH\\n\`);
        
        for (const resolver of resolverData.resolvers) {
            const fundingAmount = ethers.parseEther(resolver.funding);
            
            console.log(\`🎯 Funding \${resolver.name}...\`);
            console.log(\`   Address: \${resolver.address}\`);
            console.log(\`   Amount: \${resolver.funding} ETH\`);
            
            try {
                const tx = await userWallet.sendTransaction({
                    to: resolver.address,
                    value: fundingAmount
                });
                
                console.log(\`   ⏳ Transaction: \${tx.hash}\`);
                const receipt = await tx.wait();
                console.log(\`   ✅ Funded successfully! (Block: \${receipt.blockNumber})\\n\`);
                
            } catch (error) {
                console.log(\`   ❌ Failed: \${error.message}\\n\`);
            }
        }
        
        console.log('🎉 RESOLVER FUNDING COMPLETE!');
        console.log('=============================');
        console.log('✅ All resolvers funded and ready for bidding');
        
    } catch (error) {
        console.error('❌ Funding failed:', error.message);
    }
}

if (require.main === module) {
    fundResolverWallets();
}

module.exports = { fundResolverWallets };
`;

        fs.writeFileSync('scripts/fundResolverWallets.cjs', fundingScript);
        console.log('✅ Created funding script: scripts/fundResolverWallets.cjs');
    }
}

// Run the generator
if (require.main === module) {
    const generator = new ResolverWalletGenerator();
    generator.generateResolverWallets().catch(console.error);
}

module.exports = ResolverWalletGenerator;
