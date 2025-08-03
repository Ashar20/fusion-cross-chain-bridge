const { ethers } = require('ethers');

async function debugContractFunctions() {
    console.log('🔍 DEBUGGING CONTRACT FUNCTION ACCESS');
    console.log('====================================');
    
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    const orderId = '0x1128c1ac33bededc01f295c57f6ce6f04c23c41e0d6d151702cf02f9dbcbb8a0';
    
    // Test contract existence
    console.log('\n🔍 Testing contract existence...');
    try {
        const code = await provider.getCode(contractAddress);
        console.log(`Contract code length: ${code.length} bytes`);
        console.log(`Contract exists: ${code !== '0x' ? '✅ YES' : '❌ NO'}`);
    } catch (error) {
        console.log(`Contract check failed: ${error.message}`);
    }
    
    // Test different function signatures for bid checking
    console.log('\n🔍 Testing bid functions...');
    const bidFunctions = [
        {
            name: 'getBidCount',
            abi: 'function getBidCount(bytes32 orderId) external view returns (uint256)'
        },
        {
            name: 'getBids', 
            abi: 'function getBids(bytes32 orderId) external view returns (tuple(address resolver, uint256 inputAmount, uint256 outputAmount, uint256 timestamp, bool active, uint256 gasEstimate, uint256 totalCost)[])'
        },
        {
            name: 'limitOrders',
            abi: 'function limitOrders(bytes32 orderId) external view returns (tuple(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes32 hashlock, uint256 timelock, uint256 depositedAmount, uint256 remainingAmount, bool filled, bool cancelled, uint256 createdAt, address resolver, uint256 partialFills, tuple(address resolver, uint256 inputAmount, uint256 outputAmount, uint256 timestamp, bool active, uint256 gasEstimate, uint256 totalCost) winningBid))'
        }
    ];
    
    for (const func of bidFunctions) {
        try {
            console.log(`\nTesting ${func.name}...`);
            const abi = [func.abi];
            const contract = new ethers.Contract(contractAddress, abi, provider);
            
            if (func.name === 'getBidCount') {
                const result = await contract.getBidCount(orderId);
                console.log(`✅ ${func.name}: ${result.toString()}`);
            } else if (func.name === 'getBids') {
                const result = await contract.getBids(orderId);
                console.log(`✅ ${func.name}: ${result.length} bids`);
            } else if (func.name === 'limitOrders') {
                const result = await contract.limitOrders(orderId);
                console.log(`✅ ${func.name}: Order exists`);
                console.log(`   Filled: ${result.filled}`);
                console.log(`   Cancelled: ${result.cancelled}`);
                console.log(`   Deposited: ${ethers.formatEther(result.depositedAmount)} ETH`);
                console.log(`   Remaining: ${ethers.formatEther(result.remainingAmount)} ETH`);
            }
        } catch (error) {
            console.log(`❌ ${func.name}: ${error.message}`);
            
            if (error.message.includes('execution reverted')) {
                console.log('   → Function exists but call reverted');
                if (error.data) {
                    console.log(`   → Error data: ${error.data}`);
                }
            } else {
                console.log('   → Function may not exist or wrong signature');
            }
        }
    }
    
    // Test with a simpler order check
    console.log('\n🔍 Testing order existence with different approaches...');
    
    // Try to call the contract directly to see what functions are available
    try {
        const simpleOrderAbi = [
            'function orders(bytes32) external view returns (bool)',
            'function orderExists(bytes32) external view returns (bool)'
        ];
        
        for (const abi of simpleOrderAbi) {
            try {
                const contract = new ethers.Contract(contractAddress, [abi], provider);
                const funcName = abi.split(' ')[1].split('(')[0];
                const result = await contract[funcName](orderId);
                console.log(`✅ ${funcName}: ${result}`);
            } catch (error) {
                console.log(`❌ ${abi.split(' ')[1].split('(')[0]}: Not available`);
            }
        }
    } catch (error) {
        console.log(`Error testing simple functions: ${error.message}`);
    }
}

debugContractFunctions();