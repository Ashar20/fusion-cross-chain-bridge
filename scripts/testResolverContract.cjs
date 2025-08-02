const { ethers } = require('hardhat');
require('dotenv').config();

async function testResolverContract() {
    try {
        console.log('🔍 TESTING RESOLVER CONTRACT');
        console.log('============================');
        
        // Initialize provider and wallet
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        const resolverAddress = '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64';
        
        console.log(`🔗 Resolver Address: ${resolverAddress}`);
        console.log(`👤 Wallet Address: ${wallet.address}`);
        
        // Check if contract exists
        const code = await provider.getCode(resolverAddress);
        console.log(`📄 Contract Code Length: ${code.length}`);
        
        if (code === '0x') {
            console.log('❌ Contract not deployed at this address');
            return;
        }
        
        console.log('✅ Contract deployed at address');
        
        // Try to create a simple contract instance
        const resolver = new ethers.Contract(
            resolverAddress,
            [
                'function MIN_ORDER_VALUE() external view returns (uint256)',
                'function DEFAULT_TIMELOCK() external view returns (uint256)',
                'function ALGORAND_CHAIN_ID() external view returns (uint256)'
            ],
            wallet
        );
        
        // Test view functions
        console.log('\n📊 TESTING VIEW FUNCTIONS:');
        console.log('==========================');
        
        try {
            const minOrderValue = await resolver.MIN_ORDER_VALUE();
            console.log(`✅ MIN_ORDER_VALUE: ${minOrderValue}`);
        } catch (error) {
            console.log(`❌ MIN_ORDER_VALUE failed: ${error.message}`);
        }
        
        try {
            const defaultTimelock = await resolver.DEFAULT_TIMELOCK();
            console.log(`✅ DEFAULT_TIMELOCK: ${defaultTimelock}`);
        } catch (error) {
            console.log(`❌ DEFAULT_TIMELOCK failed: ${error.message}`);
        }
        
        try {
            const algorandChainId = await resolver.ALGORAND_CHAIN_ID();
            console.log(`✅ ALGORAND_CHAIN_ID: ${algorandChainId}`);
        } catch (error) {
            console.log(`❌ ALGORAND_CHAIN_ID failed: ${error.message}`);
        }
        
        // Test createCrossChainHTLC function signature
        console.log('\n🔧 TESTING FUNCTION SIGNATURE:');
        console.log('==============================');
        
        const testResolver = new ethers.Contract(
            resolverAddress,
            [
                'function createCrossChainHTLC(bytes32 hashlock, uint256 timelock, address token, uint256 amount, address recipient, string memory algorandAddress) external payable returns (bytes32)'
            ],
            wallet
        );
        
        // Try to estimate gas for the function call
        const testParams = {
            hashlock: '0x' + '1'.repeat(64), // Updated to use non-zero hashlock
            timelock: Math.floor(Date.now() / 1000) + 86400, // Updated to meet DEFAULT_TIMELOCK (24 hours)
            token: ethers.ZeroAddress,
            amount: ethers.parseEther('0.001'), // Updated to meet MIN_ORDER_VALUE
            recipient: wallet.address,
            algorandAddress: 'TESTADDRESS'
        };
        
        try {
            const gasEstimate = await testResolver.createCrossChainHTLC.estimateGas(
                testParams.hashlock,
                testParams.timelock,
                testParams.token,
                testParams.amount,
                testParams.recipient,
                testParams.algorandAddress,
                { value: testParams.amount }
            );
            console.log(`✅ Gas estimate successful: ${gasEstimate.toString()}`);
        } catch (error) {
            console.log(`❌ Gas estimate failed: ${error.message}`);
            console.log(`📋 Error details:`, error);
        }
        
        // Check current block timestamp
        console.log('\n⏰ CHECKING TIMELOCK REQUIREMENTS:');
        console.log('==================================');
        const currentBlock = await provider.getBlock('latest');
        const currentTimestamp = currentBlock.timestamp;
        const requiredTimelock = currentTimestamp + 86400; // DEFAULT_TIMELOCK
        
        console.log(`Current block timestamp: ${currentTimestamp}`);
        console.log(`Required timelock: ${requiredTimelock}`);
        console.log(`Required timelock (date): ${new Date(requiredTimelock * 1000)}`);
        console.log(`Test timelock: ${testParams.timelock}`);
        console.log(`Test timelock (date): ${new Date(testParams.timelock * 1000)}`);
        
        if (testParams.timelock >= requiredTimelock) {
            console.log('✅ Timelock meets requirement');
        } else {
            console.log('❌ Timelock too short');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testResolverContract().catch(console.error); 