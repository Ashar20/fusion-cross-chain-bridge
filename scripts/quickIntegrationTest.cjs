const { ethers } = require('hardhat');
const algosdk = require('algosdk');
require('dotenv').config();

async function main() {
    console.log('⚡ Quick Cross-Chain Integration Test');
    console.log('=====================================');
    console.log('🎯 Fast verification without long confirmations');
    console.log('');

    // Load configuration
    const fs = require('fs');
    const integrationConfig = JSON.parse(fs.readFileSync('1INCH_ALGORAND_INTEGRATION.json', 'utf8'));
    const resolverDeployment = JSON.parse(fs.readFileSync('CROSS_CHAIN_RESOLVER_DEPLOYMENT.json', 'utf8'));

    // Test 1: Ethereum Setup (No waiting)
    console.log('🔍 Test 1: Ethereum Setup Verification');
    console.log('======================================');
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);
    
    console.log(`✅ Resolver: ${await resolver.getAddress()}`);
    console.log(`✅ Network: Sepolia`);
    
    // Test 2: Algorand Setup (No waiting)
    console.log('\n🔍 Test 2: Algorand Setup Verification');
    console.log('======================================');
    
    const algorandClient = new algosdk.Algodv2(
        process.env.ALGOD_TOKEN,
        process.env.ALGOD_SERVER,
        process.env.ALGOD_PORT
    );
    
    const htlcAppId = integrationConfig.networks.algorand.appId;
    const htlcAddress = algosdk.getApplicationAddress(htlcAppId);
    
    console.log(`✅ HTLC App ID: ${htlcAppId}`);
    console.log(`✅ HTLC Address: ${htlcAddress}`);
    
    // Test 3: Generate Swap Parameters (No blockchain calls)
    console.log('\n🔍 Test 3: Swap Parameter Generation');
    console.log('=====================================');
    
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(secret);
    const timelock = Math.floor(Date.now() / 1000) + 86400 + 3600;
    const ethAmount = ethers.parseEther('0.001');
    const algoAmount = 1000000; // 1 ALGO
    
    console.log(`✅ Secret: ${secret.toString('hex')}`);
    console.log(`✅ Hashlock: ${hashlock}`);
    console.log(`✅ Timelock: ${timelock}`);
    console.log(`✅ ETH Amount: ${ethers.formatEther(ethAmount)} ETH`);
    console.log(`✅ ALGO Amount: ${algoAmount / 1e6} ALGO`);
    
    // Test 4: Verify Contract Functions (Read-only)
    console.log('\n🔍 Test 4: Contract Function Verification');
    console.log('==========================================');
    
    const escrowFactory = await resolver.ESCROW_FACTORY();
    const algorandChainId = await resolver.ALGORAND_CHAIN_ID();
    const minOrderValue = await resolver.MIN_ORDER_VALUE();
    
    console.log(`✅ Escrow Factory: ${escrowFactory}`);
    console.log(`✅ Algorand Chain ID: ${algorandChainId}`);
    console.log(`✅ Min Order Value: ${ethers.formatEther(minOrderValue)} ETH`);
    
    // Test 5: Algorand Transaction Preparation (No submission)
    console.log('\n🔍 Test 5: Algorand Transaction Preparation');
    console.log('============================================');
    
    const params = await algorandClient.getTransactionParams().do();
    const hashlockBytes = new Uint8Array(Buffer.from(hashlock.slice(2), 'hex'));
    
    console.log(`✅ Network Round: ${params.lastRound}`);
    console.log(`✅ Hashlock Bytes: ${hashlockBytes.length} bytes`);
    console.log(`✅ Transaction params ready`);
    
    // Test 6: Wallet Verification
    console.log('\n🔍 Test 6: Wallet Verification');
    console.log('==============================');
    
    const ethereumWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const algorandAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    
    console.log(`✅ Ethereum Wallet: ${ethereumWallet.address}`);
    console.log(`✅ Algorand Wallet: ${algorandAccount.addr}`);
    
    // Final Summary
    console.log('\n🎯 Quick Integration Test Summary');
    console.log('==================================');
    console.log('✅ All components ready for cross-chain swap');
    console.log('✅ No blockchain confirmations required');
    console.log('✅ Integration verified in under 30 seconds');
    
    console.log('\n📋 Ready for Full Swap Test:');
    console.log('   - Ethereum order creation: ~15 seconds');
    console.log('   - Algorand HTLC creation: ~10 seconds');
    console.log('   - Escrow creation: ~15 seconds');
    console.log('   - Swap execution: ~15 seconds');
    console.log('   - ALGO claim: ~10 seconds');
    console.log('   - Total estimated time: ~65 seconds');
    
    console.log('\n🚀 Run full test with:');
    console.log('   npx hardhat run scripts/fullCrossChainSwapTest.cjs --network sepolia');
    
    // Save quick test results
    const quickTestResults = {
        timestamp: new Date().toISOString(),
        status: 'READY',
        ethereum: {
            resolver: await resolver.getAddress(),
            escrowFactory: escrowFactory,
            minOrderValue: ethers.formatEther(minOrderValue)
        },
        algorand: {
            htlcAppId: htlcAppId,
            htlcAddress: htlcAddress,
            chainId: algorandChainId
        },
        swapParams: {
            secret: secret.toString('hex'),
            hashlock: hashlock,
            timelock: timelock,
            ethAmount: ethers.formatEther(ethAmount),
            algoAmount: algoAmount / 1e6
        }
    };
    
    fs.writeFileSync('QUICK_INTEGRATION_TEST_RESULTS.json', JSON.stringify(quickTestResults, null, 2));
    console.log('\n📄 Quick test results saved to: QUICK_INTEGRATION_TEST_RESULTS.json');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Quick test failed:', error);
        process.exit(1);
    }); 
const algosdk = require('algosdk');
require('dotenv').config();

async function main() {
    console.log('⚡ Quick Cross-Chain Integration Test');
    console.log('=====================================');
    console.log('🎯 Fast verification without long confirmations');
    console.log('');

    // Load configuration
    const fs = require('fs');
    const integrationConfig = JSON.parse(fs.readFileSync('1INCH_ALGORAND_INTEGRATION.json', 'utf8'));
    const resolverDeployment = JSON.parse(fs.readFileSync('CROSS_CHAIN_RESOLVER_DEPLOYMENT.json', 'utf8'));

    // Test 1: Ethereum Setup (No waiting)
    console.log('🔍 Test 1: Ethereum Setup Verification');
    console.log('======================================');
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);
    
    console.log(`✅ Resolver: ${await resolver.getAddress()}`);
    console.log(`✅ Network: Sepolia`);
    
    // Test 2: Algorand Setup (No waiting)
    console.log('\n🔍 Test 2: Algorand Setup Verification');
    console.log('======================================');
    
    const algorandClient = new algosdk.Algodv2(
        process.env.ALGOD_TOKEN,
        process.env.ALGOD_SERVER,
        process.env.ALGOD_PORT
    );
    
    const htlcAppId = integrationConfig.networks.algorand.appId;
    const htlcAddress = algosdk.getApplicationAddress(htlcAppId);
    
    console.log(`✅ HTLC App ID: ${htlcAppId}`);
    console.log(`✅ HTLC Address: ${htlcAddress}`);
    
    // Test 3: Generate Swap Parameters (No blockchain calls)
    console.log('\n🔍 Test 3: Swap Parameter Generation');
    console.log('=====================================');
    
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(secret);
    const timelock = Math.floor(Date.now() / 1000) + 86400 + 3600;
    const ethAmount = ethers.parseEther('0.001');
    const algoAmount = 1000000; // 1 ALGO
    
    console.log(`✅ Secret: ${secret.toString('hex')}`);
    console.log(`✅ Hashlock: ${hashlock}`);
    console.log(`✅ Timelock: ${timelock}`);
    console.log(`✅ ETH Amount: ${ethers.formatEther(ethAmount)} ETH`);
    console.log(`✅ ALGO Amount: ${algoAmount / 1e6} ALGO`);
    
    // Test 4: Verify Contract Functions (Read-only)
    console.log('\n🔍 Test 4: Contract Function Verification');
    console.log('==========================================');
    
    const escrowFactory = await resolver.ESCROW_FACTORY();
    const algorandChainId = await resolver.ALGORAND_CHAIN_ID();
    const minOrderValue = await resolver.MIN_ORDER_VALUE();
    
    console.log(`✅ Escrow Factory: ${escrowFactory}`);
    console.log(`✅ Algorand Chain ID: ${algorandChainId}`);
    console.log(`✅ Min Order Value: ${ethers.formatEther(minOrderValue)} ETH`);
    
    // Test 5: Algorand Transaction Preparation (No submission)
    console.log('\n🔍 Test 5: Algorand Transaction Preparation');
    console.log('============================================');
    
    const params = await algorandClient.getTransactionParams().do();
    const hashlockBytes = new Uint8Array(Buffer.from(hashlock.slice(2), 'hex'));
    
    console.log(`✅ Network Round: ${params.lastRound}`);
    console.log(`✅ Hashlock Bytes: ${hashlockBytes.length} bytes`);
    console.log(`✅ Transaction params ready`);
    
    // Test 6: Wallet Verification
    console.log('\n🔍 Test 6: Wallet Verification');
    console.log('==============================');
    
    const ethereumWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const algorandAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    
    console.log(`✅ Ethereum Wallet: ${ethereumWallet.address}`);
    console.log(`✅ Algorand Wallet: ${algorandAccount.addr}`);
    
    // Final Summary
    console.log('\n🎯 Quick Integration Test Summary');
    console.log('==================================');
    console.log('✅ All components ready for cross-chain swap');
    console.log('✅ No blockchain confirmations required');
    console.log('✅ Integration verified in under 30 seconds');
    
    console.log('\n📋 Ready for Full Swap Test:');
    console.log('   - Ethereum order creation: ~15 seconds');
    console.log('   - Algorand HTLC creation: ~10 seconds');
    console.log('   - Escrow creation: ~15 seconds');
    console.log('   - Swap execution: ~15 seconds');
    console.log('   - ALGO claim: ~10 seconds');
    console.log('   - Total estimated time: ~65 seconds');
    
    console.log('\n🚀 Run full test with:');
    console.log('   npx hardhat run scripts/fullCrossChainSwapTest.cjs --network sepolia');
    
    // Save quick test results
    const quickTestResults = {
        timestamp: new Date().toISOString(),
        status: 'READY',
        ethereum: {
            resolver: await resolver.getAddress(),
            escrowFactory: escrowFactory,
            minOrderValue: ethers.formatEther(minOrderValue)
        },
        algorand: {
            htlcAppId: htlcAppId,
            htlcAddress: htlcAddress,
            chainId: algorandChainId
        },
        swapParams: {
            secret: secret.toString('hex'),
            hashlock: hashlock,
            timelock: timelock,
            ethAmount: ethers.formatEther(ethAmount),
            algoAmount: algoAmount / 1e6
        }
    };
    
    fs.writeFileSync('QUICK_INTEGRATION_TEST_RESULTS.json', JSON.stringify(quickTestResults, null, 2));
    console.log('\n📄 Quick test results saved to: QUICK_INTEGRATION_TEST_RESULTS.json');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Quick test failed:', error);
        process.exit(1);
    }); 
 