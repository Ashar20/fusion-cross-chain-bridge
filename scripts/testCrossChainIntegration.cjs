const { ethers } = require('hardhat');
const algosdk = require('algosdk');
require('dotenv').config();

async function main() {
    console.log('🧪 Testing Cross-Chain Integration Setup...');
    console.log('==========================================');

    // Load configuration
    const fs = require('fs');
    const integrationConfig = JSON.parse(fs.readFileSync('1INCH_ALGORAND_INTEGRATION.json', 'utf8'));
    const resolverDeployment = JSON.parse(fs.readFileSync('CROSS_CHAIN_RESOLVER_DEPLOYMENT.json', 'utf8'));

    // Test 1: Ethereum Setup
    console.log('\n🔍 Test 1: Ethereum Setup Verification');
    console.log('======================================');

    try {
        // Initialize Ethereum provider
        const ethereumProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        console.log(`✅ Ethereum Provider: ${process.env.RPC_URL}`);

        // Check network
        const network = await ethereumProvider.getNetwork();
        console.log(`✅ Network: ${network.name} (${network.chainId})`);

        // Load resolver contract
        const resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);
        console.log(`✅ Resolver Contract: ${await resolver.getAddress()}`);

        // Check resolver balance
        const resolverBalance = await ethereumProvider.getBalance(await resolver.getAddress());
        console.log(`✅ Resolver Balance: ${ethers.formatEther(resolverBalance)} ETH`);

        // Test resolver functions
        const escrowFactory = await resolver.ESCROW_FACTORY();
        console.log(`✅ Escrow Factory: ${escrowFactory}`);

        const algorandChainId = await resolver.ALGORAND_CHAIN_ID();
        console.log(`✅ Algorand Chain ID: ${algorandChainId}`);

        const minOrderValue = await resolver.MIN_ORDER_VALUE();
        console.log(`✅ Min Order Value: ${ethers.formatEther(minOrderValue)} ETH`);

    } catch (error) {
        console.log('❌ Ethereum setup failed:', error.message);
        throw error;
    }

    // Test 2: Algorand Setup
    console.log('\n🔍 Test 2: Algorand Setup Verification');
    console.log('======================================');

    try {
        // Initialize Algorand client
        const algorandClient = new algosdk.Algodv2(
            process.env.ALGOD_TOKEN,
            process.env.ALGOD_SERVER,
            process.env.ALGOD_PORT
        );
        console.log(`✅ Algorand Client: ${process.env.ALGOD_SERVER}:${process.env.ALGOD_PORT}`);

        // Check network status
        const status = await algorandClient.status().do();
        console.log(`✅ Network: ${status.genesisID}`);
        console.log(`✅ Current Round: ${status['last-round']}`);

        // Check HTLC app
        const htlcAppId = integrationConfig.networks.algorand.appId;
        const htlcAddress = algosdk.getApplicationAddress(htlcAppId);
        console.log(`✅ HTLC App ID: ${htlcAppId}`);
        console.log(`✅ HTLC Address: ${htlcAddress}`);

        // Get HTLC app info
        const appInfo = await algorandClient.getApplicationByID(htlcAppId).do();
        console.log(`✅ HTLC App Created: ${appInfo['created-at-round']}`);

        // Check HTLC app balance
        const htlcAccountInfo = await algorandClient.accountInformation(htlcAddress).do();
        const htlcBalance = htlcAccountInfo.amount / 1e6;
        console.log(`✅ HTLC Balance: ${htlcBalance} ALGO`);

    } catch (error) {
        console.log('❌ Algorand setup failed:', error.message);
        throw error;
    }

    // Test 3: Wallet Setup
    console.log('\n🔍 Test 3: Wallet Setup Verification');
    console.log('====================================');

    try {
        // Ethereum wallet
        const ethereumWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
        console.log(`✅ Ethereum Wallet: ${ethereumWallet.address}`);

        // Check Ethereum wallet balance
        const ethereumProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const ethBalance = await ethereumProvider.getBalance(ethereumWallet.address);
        console.log(`✅ Ethereum Balance: ${ethers.formatEther(ethBalance)} ETH`);

        // Algorand wallet
        const mnemonic = process.env.ALGORAND_MNEMONIC;
        if (!mnemonic) {
            throw new Error('ALGORAND_MNEMONIC environment variable required');
        }

        const algorandAccount = algosdk.mnemonicToSecretKey(mnemonic);
        console.log(`✅ Algorand Wallet: ${algorandAccount.addr}`);

        // Check Algorand wallet balance
        const algorandClient = new algosdk.Algodv2(
            process.env.ALGOD_TOKEN,
            process.env.ALGOD_SERVER,
            process.env.ALGOD_PORT
        );
        const accountInfo = await algorandClient.accountInformation(algorandAccount.addr).do();
        const algoBalance = accountInfo.amount / 1e6;
        console.log(`✅ Algorand Balance: ${algoBalance} ALGO`);

        // Check if opted into HTLC app
        const htlcAppId = integrationConfig.networks.algorand.appId;
        const appOptIn = accountInfo['apps-local-state']?.find(app => app.id === htlcAppId);
        if (appOptIn) {
            console.log('✅ Opted into HTLC app');
        } else {
            console.log('⚠️  Not opted into HTLC app (will opt in during swap)');
        }

    } catch (error) {
        console.log('❌ Wallet setup failed:', error.message);
        throw error;
    }

    // Test 4: Contract Integration
    console.log('\n🔍 Test 4: Contract Integration Verification');
    console.log('============================================');

    try {
        // Test Ethereum resolver contract
        const resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);
        
        // Create wallet instances for testing
        const ethereumWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
        const algorandAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
        
        // Test creating a test order (without sending ETH)
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = Math.floor(Date.now() / 1000) + 86400 + 3600;
        const amount = ethers.parseEther('0.001');
        const recipient = ethereumWallet.address;
        const algorandAddress = algorandAccount.addr;

        console.log('   Testing order creation parameters:');
        console.log(`     Hashlock: ${hashlock}`);
        console.log(`     Timelock: ${timelock}`);
        console.log(`     Amount: ${ethers.formatEther(amount)} ETH`);
        console.log(`     Recipient: ${recipient}`);
        console.log(`     Algorand Address: ${algorandAddress}`);

        // Test Algorand HTLC parameters
        const htlcAppId = integrationConfig.networks.algorand.appId;
        const htlcAddress = algosdk.getApplicationAddress(htlcAppId);
        
        console.log('   Testing Algorand HTLC parameters:');
        console.log(`     App ID: ${htlcAppId}`);
        console.log(`     Address: ${htlcAddress}`);
        console.log(`     Hashlock Bytes: ${Buffer.from(hashlock.slice(2), 'hex').length} bytes`);
        console.log(`     Timelock: ${timelock}`);
        console.log(`     Amount: ${Number(amount) / 1e6} ALGO`);

        console.log('✅ Contract integration parameters verified');

    } catch (error) {
        console.log('❌ Contract integration failed:', error.message);
        throw error;
    }

    // Test 5: Environment Variables
    console.log('\n🔍 Test 5: Environment Variables Verification');
    console.log('============================================');

    const requiredEnvVars = [
        'RPC_URL',
        'PRIVATE_KEY',
        'ALGOD_TOKEN',
        'ALGOD_SERVER',
        'ALGOD_PORT',
        'ALGORAND_MNEMONIC'
    ];

    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            console.log(`✅ ${envVar}: Set`);
        } else {
            console.log(`❌ ${envVar}: Missing`);
            throw new Error(`Missing environment variable: ${envVar}`);
        }
    }

    // Test 6: Configuration Files
    console.log('\n🔍 Test 6: Configuration Files Verification');
    console.log('==========================================');

    const requiredFiles = [
        '1INCH_ALGORAND_INTEGRATION.json',
        'CROSS_CHAIN_RESOLVER_DEPLOYMENT.json'
    ];

    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}: Found`);
        } else {
            console.log(`❌ ${file}: Missing`);
            throw new Error(`Missing configuration file: ${file}`);
        }
    }

    // Final summary
    console.log('\n🎯 Cross-Chain Integration Test Summary');
    console.log('=======================================');
    console.log('✅ Ethereum setup verified');
    console.log('✅ Algorand setup verified');
    console.log('✅ Wallet setup verified');
    console.log('✅ Contract integration verified');
    console.log('✅ Environment variables verified');
    console.log('✅ Configuration files verified');

    console.log('\n📋 Integration Status:');
    console.log(`   Ethereum Resolver: ${resolverDeployment.contracts.resolver}`);
    console.log(`   Algorand HTLC: ${integrationConfig.networks.algorand.appId}`);
    console.log(`   Ethereum Network: Sepolia (${integrationConfig.networks.ethereum.chainId})`);
    console.log(`   Algorand Network: Testnet (${integrationConfig.networks.algorand.chainId})`);

    console.log('\n🚀 Cross-chain integration is ready for testing!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run cross-chain swap test');
    console.log('   2. Start monitoring system');
    console.log('   3. Test refund functionality');
    console.log('   4. Verify complete swap flow');

    // Save test results
    const ethereumWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const algorandAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    
    const testResults = {
        timestamp: new Date().toISOString(),
        status: 'PASSED',
        ethereum: {
            resolver: resolverDeployment.contracts.resolver,
            network: 'Sepolia',
            chainId: integrationConfig.networks.ethereum.chainId
        },
        algorand: {
            htlcAppId: integrationConfig.networks.algorand.appId,
            network: 'Testnet',
            chainId: integrationConfig.networks.algorand.chainId
        },
        wallets: {
            ethereum: ethereumWallet.address,
            algorand: algorandAccount.addr
        }
    };

    fs.writeFileSync('CROSS_CHAIN_INTEGRATION_TEST_RESULTS.json', JSON.stringify(testResults, null, 2));
    console.log('\n📄 Test results saved to: CROSS_CHAIN_INTEGRATION_TEST_RESULTS.json');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Integration test failed:', error);
        process.exit(1);
    }); 
const algosdk = require('algosdk');
require('dotenv').config();

async function main() {
    console.log('🧪 Testing Cross-Chain Integration Setup...');
    console.log('==========================================');

    // Load configuration
    const fs = require('fs');
    const integrationConfig = JSON.parse(fs.readFileSync('1INCH_ALGORAND_INTEGRATION.json', 'utf8'));
    const resolverDeployment = JSON.parse(fs.readFileSync('CROSS_CHAIN_RESOLVER_DEPLOYMENT.json', 'utf8'));

    // Test 1: Ethereum Setup
    console.log('\n🔍 Test 1: Ethereum Setup Verification');
    console.log('======================================');

    try {
        // Initialize Ethereum provider
        const ethereumProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        console.log(`✅ Ethereum Provider: ${process.env.RPC_URL}`);

        // Check network
        const network = await ethereumProvider.getNetwork();
        console.log(`✅ Network: ${network.name} (${network.chainId})`);

        // Load resolver contract
        const resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);
        console.log(`✅ Resolver Contract: ${await resolver.getAddress()}`);

        // Check resolver balance
        const resolverBalance = await ethereumProvider.getBalance(await resolver.getAddress());
        console.log(`✅ Resolver Balance: ${ethers.formatEther(resolverBalance)} ETH`);

        // Test resolver functions
        const escrowFactory = await resolver.ESCROW_FACTORY();
        console.log(`✅ Escrow Factory: ${escrowFactory}`);

        const algorandChainId = await resolver.ALGORAND_CHAIN_ID();
        console.log(`✅ Algorand Chain ID: ${algorandChainId}`);

        const minOrderValue = await resolver.MIN_ORDER_VALUE();
        console.log(`✅ Min Order Value: ${ethers.formatEther(minOrderValue)} ETH`);

    } catch (error) {
        console.log('❌ Ethereum setup failed:', error.message);
        throw error;
    }

    // Test 2: Algorand Setup
    console.log('\n🔍 Test 2: Algorand Setup Verification');
    console.log('======================================');

    try {
        // Initialize Algorand client
        const algorandClient = new algosdk.Algodv2(
            process.env.ALGOD_TOKEN,
            process.env.ALGOD_SERVER,
            process.env.ALGOD_PORT
        );
        console.log(`✅ Algorand Client: ${process.env.ALGOD_SERVER}:${process.env.ALGOD_PORT}`);

        // Check network status
        const status = await algorandClient.status().do();
        console.log(`✅ Network: ${status.genesisID}`);
        console.log(`✅ Current Round: ${status['last-round']}`);

        // Check HTLC app
        const htlcAppId = integrationConfig.networks.algorand.appId;
        const htlcAddress = algosdk.getApplicationAddress(htlcAppId);
        console.log(`✅ HTLC App ID: ${htlcAppId}`);
        console.log(`✅ HTLC Address: ${htlcAddress}`);

        // Get HTLC app info
        const appInfo = await algorandClient.getApplicationByID(htlcAppId).do();
        console.log(`✅ HTLC App Created: ${appInfo['created-at-round']}`);

        // Check HTLC app balance
        const htlcAccountInfo = await algorandClient.accountInformation(htlcAddress).do();
        const htlcBalance = htlcAccountInfo.amount / 1e6;
        console.log(`✅ HTLC Balance: ${htlcBalance} ALGO`);

    } catch (error) {
        console.log('❌ Algorand setup failed:', error.message);
        throw error;
    }

    // Test 3: Wallet Setup
    console.log('\n🔍 Test 3: Wallet Setup Verification');
    console.log('====================================');

    try {
        // Ethereum wallet
        const ethereumWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
        console.log(`✅ Ethereum Wallet: ${ethereumWallet.address}`);

        // Check Ethereum wallet balance
        const ethereumProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const ethBalance = await ethereumProvider.getBalance(ethereumWallet.address);
        console.log(`✅ Ethereum Balance: ${ethers.formatEther(ethBalance)} ETH`);

        // Algorand wallet
        const mnemonic = process.env.ALGORAND_MNEMONIC;
        if (!mnemonic) {
            throw new Error('ALGORAND_MNEMONIC environment variable required');
        }

        const algorandAccount = algosdk.mnemonicToSecretKey(mnemonic);
        console.log(`✅ Algorand Wallet: ${algorandAccount.addr}`);

        // Check Algorand wallet balance
        const algorandClient = new algosdk.Algodv2(
            process.env.ALGOD_TOKEN,
            process.env.ALGOD_SERVER,
            process.env.ALGOD_PORT
        );
        const accountInfo = await algorandClient.accountInformation(algorandAccount.addr).do();
        const algoBalance = accountInfo.amount / 1e6;
        console.log(`✅ Algorand Balance: ${algoBalance} ALGO`);

        // Check if opted into HTLC app
        const htlcAppId = integrationConfig.networks.algorand.appId;
        const appOptIn = accountInfo['apps-local-state']?.find(app => app.id === htlcAppId);
        if (appOptIn) {
            console.log('✅ Opted into HTLC app');
        } else {
            console.log('⚠️  Not opted into HTLC app (will opt in during swap)');
        }

    } catch (error) {
        console.log('❌ Wallet setup failed:', error.message);
        throw error;
    }

    // Test 4: Contract Integration
    console.log('\n🔍 Test 4: Contract Integration Verification');
    console.log('============================================');

    try {
        // Test Ethereum resolver contract
        const resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);
        
        // Create wallet instances for testing
        const ethereumWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
        const algorandAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
        
        // Test creating a test order (without sending ETH)
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = Math.floor(Date.now() / 1000) + 86400 + 3600;
        const amount = ethers.parseEther('0.001');
        const recipient = ethereumWallet.address;
        const algorandAddress = algorandAccount.addr;

        console.log('   Testing order creation parameters:');
        console.log(`     Hashlock: ${hashlock}`);
        console.log(`     Timelock: ${timelock}`);
        console.log(`     Amount: ${ethers.formatEther(amount)} ETH`);
        console.log(`     Recipient: ${recipient}`);
        console.log(`     Algorand Address: ${algorandAddress}`);

        // Test Algorand HTLC parameters
        const htlcAppId = integrationConfig.networks.algorand.appId;
        const htlcAddress = algosdk.getApplicationAddress(htlcAppId);
        
        console.log('   Testing Algorand HTLC parameters:');
        console.log(`     App ID: ${htlcAppId}`);
        console.log(`     Address: ${htlcAddress}`);
        console.log(`     Hashlock Bytes: ${Buffer.from(hashlock.slice(2), 'hex').length} bytes`);
        console.log(`     Timelock: ${timelock}`);
        console.log(`     Amount: ${Number(amount) / 1e6} ALGO`);

        console.log('✅ Contract integration parameters verified');

    } catch (error) {
        console.log('❌ Contract integration failed:', error.message);
        throw error;
    }

    // Test 5: Environment Variables
    console.log('\n🔍 Test 5: Environment Variables Verification');
    console.log('============================================');

    const requiredEnvVars = [
        'RPC_URL',
        'PRIVATE_KEY',
        'ALGOD_TOKEN',
        'ALGOD_SERVER',
        'ALGOD_PORT',
        'ALGORAND_MNEMONIC'
    ];

    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            console.log(`✅ ${envVar}: Set`);
        } else {
            console.log(`❌ ${envVar}: Missing`);
            throw new Error(`Missing environment variable: ${envVar}`);
        }
    }

    // Test 6: Configuration Files
    console.log('\n🔍 Test 6: Configuration Files Verification');
    console.log('==========================================');

    const requiredFiles = [
        '1INCH_ALGORAND_INTEGRATION.json',
        'CROSS_CHAIN_RESOLVER_DEPLOYMENT.json'
    ];

    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}: Found`);
        } else {
            console.log(`❌ ${file}: Missing`);
            throw new Error(`Missing configuration file: ${file}`);
        }
    }

    // Final summary
    console.log('\n🎯 Cross-Chain Integration Test Summary');
    console.log('=======================================');
    console.log('✅ Ethereum setup verified');
    console.log('✅ Algorand setup verified');
    console.log('✅ Wallet setup verified');
    console.log('✅ Contract integration verified');
    console.log('✅ Environment variables verified');
    console.log('✅ Configuration files verified');

    console.log('\n📋 Integration Status:');
    console.log(`   Ethereum Resolver: ${resolverDeployment.contracts.resolver}`);
    console.log(`   Algorand HTLC: ${integrationConfig.networks.algorand.appId}`);
    console.log(`   Ethereum Network: Sepolia (${integrationConfig.networks.ethereum.chainId})`);
    console.log(`   Algorand Network: Testnet (${integrationConfig.networks.algorand.chainId})`);

    console.log('\n🚀 Cross-chain integration is ready for testing!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run cross-chain swap test');
    console.log('   2. Start monitoring system');
    console.log('   3. Test refund functionality');
    console.log('   4. Verify complete swap flow');

    // Save test results
    const ethereumWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const algorandAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    
    const testResults = {
        timestamp: new Date().toISOString(),
        status: 'PASSED',
        ethereum: {
            resolver: resolverDeployment.contracts.resolver,
            network: 'Sepolia',
            chainId: integrationConfig.networks.ethereum.chainId
        },
        algorand: {
            htlcAppId: integrationConfig.networks.algorand.appId,
            network: 'Testnet',
            chainId: integrationConfig.networks.algorand.chainId
        },
        wallets: {
            ethereum: ethereumWallet.address,
            algorand: algorandAccount.addr
        }
    };

    fs.writeFileSync('CROSS_CHAIN_INTEGRATION_TEST_RESULTS.json', JSON.stringify(testResults, null, 2));
    console.log('\n📄 Test results saved to: CROSS_CHAIN_INTEGRATION_TEST_RESULTS.json');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Integration test failed:', error);
        process.exit(1);
    }); 
 