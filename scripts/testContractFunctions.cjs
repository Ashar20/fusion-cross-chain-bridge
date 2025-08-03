#!/usr/bin/env node

const { ethers } = require('ethers');

async function testContractFunctions() {
    console.log('🧪 TESTING CONTRACT FUNCTIONS');
    console.log('=============================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL || 'https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    
    // Recent order ID from the test above
    const orderId = '0xe97ac7d0136eb7755cf822eaa751bb6603e947a898ded8a9bc9e3538e63c0e59';
    
    console.log(`📋 Testing Order ID: ${orderId}`);
    console.log(`🏦 Contract: ${contractAddress}\n`);
    
    // Test different function signatures
    const testFunctions = [
        {
            name: 'getBids',
            abi: ['function getBids(bytes32 orderId) external view returns (tuple(address resolver, uint256 inputAmount, uint256 outputAmount, uint256 timestamp, bool active, uint256 gasEstimate, uint256 totalCost)[])']
        },
        {
            name: 'getBidCount',
            abi: ['function getBidCount(bytes32 orderId) external view returns (uint256)']
        },
        {
            name: 'limitOrders',
            abi: ['function limitOrders(bytes32) external view returns (tuple(tuple(address,address,address,uint256,uint256,uint256,uint256,string,bytes32,bool,uint256),bytes32,uint256,uint256,uint256,bool,bool,uint256,address,uint256,tuple(address,uint256,uint256,uint256,bool,uint256,uint256)))']
        }
    ];
    
    for (const func of testFunctions) {
        console.log(`🔍 Testing ${func.name}...`);
        try {
            const contract = new ethers.Contract(contractAddress, func.abi, provider);
            
            if (func.name === 'getBids') {
                const result = await contract.getBids(orderId);
                console.log(`✅ ${func.name}: Found ${result.length} bids`);
                if (result.length > 0) {
                    result.forEach((bid, i) => {
                        console.log(`   Bid ${i + 1}: ${bid.resolver} - ${ethers.formatEther(bid.inputAmount)} ETH`);
                    });
                }
            } else if (func.name === 'getBidCount') {
                const result = await contract.getBidCount(orderId);
                console.log(`✅ ${func.name}: ${result.toString()} bids`);
            } else if (func.name === 'limitOrders') {
                const result = await contract.limitOrders(orderId);
                console.log(`✅ ${func.name}: Order exists`);
                console.log(`   Filled: ${result.filled}`);
                console.log(`   Cancelled: ${result.cancelled}`);
                console.log(`   Deposited: ${ethers.formatEther(result.depositedAmount)} ETH`);
            }
        } catch (error) {
            console.log(`❌ ${func.name}: ${error.message}`);
            if (error.data) {
                console.log(`   Error data: ${error.data}`);
            }
        }
        console.log('');
    }
    
    // Test if order exists at all
    console.log('🔍 Testing basic order existence...');
    try {
        const basicAbi = ['function orders(bytes32) external view returns (bool)'];
        const contract = new ethers.Contract(contractAddress, basicAbi, provider);
        const exists = await contract.orders(orderId);
        console.log(`✅ Order exists: ${exists}`);
    } catch (error) {
        console.log(`❌ Order check failed: ${error.message}`);
    }
}

testContractFunctions().catch(console.error);