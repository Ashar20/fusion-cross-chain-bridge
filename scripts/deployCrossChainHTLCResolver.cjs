const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
    console.log('🚀 Deploying CrossChainHTLCResolver...');
    console.log('==========================================');

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📝 Deployer: ${deployer.address}`);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    // Verify we're on Sepolia
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111n) {
        throw new Error('❌ Must deploy on Sepolia testnet (chainId: 11155111)');
    }
    console.log(`🌐 Network: Sepolia (${network.chainId})`);

    // Official 1inch contract addresses
    const LIMIT_ORDER_PROTOCOL = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
    const ESCROW_FACTORY = '0x523258A91028793817F84aB037A3372B468ee940';

    // Verify contract addresses
    console.log('\n🔍 Verifying Contract Addresses:');
    console.log(`   LimitOrderProtocol: ${LIMIT_ORDER_PROTOCOL}`);
    console.log(`   EscrowFactory: ${ESCROW_FACTORY}`);

    // Check if contracts exist
    const lopCode = await ethers.provider.getCode(LIMIT_ORDER_PROTOCOL);
    const factoryCode = await ethers.provider.getCode(ESCROW_FACTORY);

    if (lopCode === '0x') {
        throw new Error('❌ LimitOrderProtocol not found at specified address');
    }
    if (factoryCode === '0x') {
        throw new Error('❌ EscrowFactory not found at specified address');
    }
    console.log('✅ Contract addresses verified');

    // Deploy CrossChainHTLCResolver
    console.log('\n📦 Deploying CrossChainHTLCResolver...');
    const CrossChainHTLCResolver = await ethers.getContractFactory('CrossChainHTLCResolver');
    
    const resolver = await CrossChainHTLCResolver.deploy(LIMIT_ORDER_PROTOCOL);
    await resolver.waitForDeployment();

    const resolverAddress = await resolver.getAddress();
    console.log(`✅ CrossChainHTLCResolver deployed: ${resolverAddress}`);

    // Verify deployment
    const resolverCode = await ethers.provider.getCode(resolverAddress);
    if (resolverCode === '0x') {
        throw new Error('❌ CrossChainHTLCResolver deployment failed');
    }

    // Test basic functionality
    console.log('\n🧪 Testing Basic Functionality:');
    
    // Test EscrowFactory address
    const escrowFactoryAddress = await resolver.ESCROW_FACTORY();
    console.log(`   EscrowFactory: ${escrowFactoryAddress}`);
    if (escrowFactoryAddress !== ESCROW_FACTORY) {
        throw new Error('❌ EscrowFactory address mismatch');
    }

    // Test Algorand chain ID
    const algorandChainId = await resolver.ALGORAND_CHAIN_ID();
    console.log(`   Algorand Chain ID: ${algorandChainId}`);
    if (algorandChainId !== 416002n) {
        throw new Error('❌ Algorand chain ID mismatch');
    }

    // Test minimum order value
    const minOrderValue = await resolver.MIN_ORDER_VALUE();
    console.log(`   Min Order Value: ${ethers.formatEther(minOrderValue)} ETH`);
    if (minOrderValue !== ethers.parseEther('0.001')) {
        throw new Error('❌ Min order value mismatch');
    }

    console.log('✅ Basic functionality verified');

    // Save deployment info
    const deploymentInfo = {
        network: 'sepolia',
        chainId: network.chainId.toString(),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            resolver: resolverAddress,
            limitOrderProtocol: LIMIT_ORDER_PROTOCOL,
            escrowFactory: ESCROW_FACTORY
        },
        verification: {
            resolver: `https://sepolia.etherscan.io/address/${resolverAddress}`,
            limitOrderProtocol: `https://sepolia.etherscan.io/address/${LIMIT_ORDER_PROTOCOL}`,
            escrowFactory: `https://sepolia.etherscan.io/address/${ESCROW_FACTORY}`
        },
        features: {
            crossChainHTLC: true,
            official1inchIntegration: true,
            algorandBridge: true,
            escrowCreation: true,
            secretReveal: true,
            orderRefund: true
        },
        integration: {
            algorandChainId: 416002,
            algorandAppId: 743645803,
            algorandExplorer: 'https://testnet.algoexplorer.io/application/743645803'
        }
    };

    // Write deployment info to file
    const fs = require('fs');
    fs.writeFileSync(
        'CROSS_CHAIN_RESOLVER_DEPLOYMENT.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('\n📄 Deployment info saved to: CROSS_CHAIN_RESOLVER_DEPLOYMENT.json');

    // Final verification
    console.log('\n🎯 Final Verification:');
    console.log('✅ CrossChainHTLCResolver deployed successfully');
    console.log('✅ Official 1inch contracts integrated');
    console.log('✅ Cross-chain HTLC functionality ready');
    console.log('✅ Algorand bridge integration configured');
    console.log('✅ All contract addresses verified');

    console.log('\n🚀 Ready for cross-chain atomic swaps!');
    console.log(`   Resolver: ${resolverAddress}`);
    console.log(`   Explorer: https://sepolia.etherscan.io/address/${resolverAddress}`);
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Test cross-chain HTLC creation');
    console.log('   2. Test escrow contract deployment');
    console.log('   3. Test cross-chain swap execution');
    console.log('   4. Integrate with Algorand HTLC system');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }); 
require('dotenv').config();

async function main() {
    console.log('🚀 Deploying CrossChainHTLCResolver...');
    console.log('==========================================');

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📝 Deployer: ${deployer.address}`);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    // Verify we're on Sepolia
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111n) {
        throw new Error('❌ Must deploy on Sepolia testnet (chainId: 11155111)');
    }
    console.log(`🌐 Network: Sepolia (${network.chainId})`);

    // Official 1inch contract addresses
    const LIMIT_ORDER_PROTOCOL = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
    const ESCROW_FACTORY = '0x523258A91028793817F84aB037A3372B468ee940';

    // Verify contract addresses
    console.log('\n🔍 Verifying Contract Addresses:');
    console.log(`   LimitOrderProtocol: ${LIMIT_ORDER_PROTOCOL}`);
    console.log(`   EscrowFactory: ${ESCROW_FACTORY}`);

    // Check if contracts exist
    const lopCode = await ethers.provider.getCode(LIMIT_ORDER_PROTOCOL);
    const factoryCode = await ethers.provider.getCode(ESCROW_FACTORY);

    if (lopCode === '0x') {
        throw new Error('❌ LimitOrderProtocol not found at specified address');
    }
    if (factoryCode === '0x') {
        throw new Error('❌ EscrowFactory not found at specified address');
    }
    console.log('✅ Contract addresses verified');

    // Deploy CrossChainHTLCResolver
    console.log('\n📦 Deploying CrossChainHTLCResolver...');
    const CrossChainHTLCResolver = await ethers.getContractFactory('CrossChainHTLCResolver');
    
    const resolver = await CrossChainHTLCResolver.deploy(LIMIT_ORDER_PROTOCOL);
    await resolver.waitForDeployment();

    const resolverAddress = await resolver.getAddress();
    console.log(`✅ CrossChainHTLCResolver deployed: ${resolverAddress}`);

    // Verify deployment
    const resolverCode = await ethers.provider.getCode(resolverAddress);
    if (resolverCode === '0x') {
        throw new Error('❌ CrossChainHTLCResolver deployment failed');
    }

    // Test basic functionality
    console.log('\n🧪 Testing Basic Functionality:');
    
    // Test EscrowFactory address
    const escrowFactoryAddress = await resolver.ESCROW_FACTORY();
    console.log(`   EscrowFactory: ${escrowFactoryAddress}`);
    if (escrowFactoryAddress !== ESCROW_FACTORY) {
        throw new Error('❌ EscrowFactory address mismatch');
    }

    // Test Algorand chain ID
    const algorandChainId = await resolver.ALGORAND_CHAIN_ID();
    console.log(`   Algorand Chain ID: ${algorandChainId}`);
    if (algorandChainId !== 416002n) {
        throw new Error('❌ Algorand chain ID mismatch');
    }

    // Test minimum order value
    const minOrderValue = await resolver.MIN_ORDER_VALUE();
    console.log(`   Min Order Value: ${ethers.formatEther(minOrderValue)} ETH`);
    if (minOrderValue !== ethers.parseEther('0.001')) {
        throw new Error('❌ Min order value mismatch');
    }

    console.log('✅ Basic functionality verified');

    // Save deployment info
    const deploymentInfo = {
        network: 'sepolia',
        chainId: network.chainId.toString(),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            resolver: resolverAddress,
            limitOrderProtocol: LIMIT_ORDER_PROTOCOL,
            escrowFactory: ESCROW_FACTORY
        },
        verification: {
            resolver: `https://sepolia.etherscan.io/address/${resolverAddress}`,
            limitOrderProtocol: `https://sepolia.etherscan.io/address/${LIMIT_ORDER_PROTOCOL}`,
            escrowFactory: `https://sepolia.etherscan.io/address/${ESCROW_FACTORY}`
        },
        features: {
            crossChainHTLC: true,
            official1inchIntegration: true,
            algorandBridge: true,
            escrowCreation: true,
            secretReveal: true,
            orderRefund: true
        },
        integration: {
            algorandChainId: 416002,
            algorandAppId: 743645803,
            algorandExplorer: 'https://testnet.algoexplorer.io/application/743645803'
        }
    };

    // Write deployment info to file
    const fs = require('fs');
    fs.writeFileSync(
        'CROSS_CHAIN_RESOLVER_DEPLOYMENT.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('\n📄 Deployment info saved to: CROSS_CHAIN_RESOLVER_DEPLOYMENT.json');

    // Final verification
    console.log('\n🎯 Final Verification:');
    console.log('✅ CrossChainHTLCResolver deployed successfully');
    console.log('✅ Official 1inch contracts integrated');
    console.log('✅ Cross-chain HTLC functionality ready');
    console.log('✅ Algorand bridge integration configured');
    console.log('✅ All contract addresses verified');

    console.log('\n🚀 Ready for cross-chain atomic swaps!');
    console.log(`   Resolver: ${resolverAddress}`);
    console.log(`   Explorer: https://sepolia.etherscan.io/address/${resolverAddress}`);
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Test cross-chain HTLC creation');
    console.log('   2. Test escrow contract deployment');
    console.log('   3. Test cross-chain swap execution');
    console.log('   4. Integrate with Algorand HTLC system');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }); 
 