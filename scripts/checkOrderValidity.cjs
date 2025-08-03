#!/usr/bin/env node

/**
 * Check if order is valid for bidding
 */

const { ethers } = require('ethers');

async function checkOrderValidity() {
    console.log('🔍 CHECKING ORDER VALIDITY FOR BIDDING');
    console.log('======================================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
    
    // Recent order from workingEndToEndFlow.cjs
    const orderId = '0x2cb62a2c79e4938d1f43ecc97723c8cbb1a7a657c1f134f5dc9ce46fe502b758';
    
    console.log(`🆔 Order ID: ${orderId}`);
    console.log(`🏦 Contract: ${contractAddress}\n`);
    
    try {
        // Check if order exists using getBids (which we know works)
        const bidABI = [
            'function getBids(bytes32) external view returns (tuple(address,uint256,uint256,uint256,bool,uint256,uint256)[])'
        ];
        const contract = new ethers.Contract(contractAddress, bidABI, provider);
        const bids = await contract.getBids(orderId);
        
        console.log(`🔍 Current bids: ${bids.length}`);
        
        if (bids.length > 0) {
            console.log('📊 Existing bids:');
            bids.forEach((bid, i) => {
                console.log(`   Bid ${i + 1}: ${bid.resolver} - Active: ${bid.active}`);
                console.log(`     Input: ${ethers.formatEther(bid.inputAmount)} ETH`);
                console.log(`     Output: ${ethers.formatEther(bid.outputAmount)} ALGO`);
            });
        }
        
        // Try different validation functions
        const validationTests = [
            {
                name: 'Check if order exists',
                abi: ['function orders(bytes32) external view returns (bool)'],
                method: 'orders'
            },
            {
                name: 'Check order validity with modifier',
                abi: ['function isValidOrder(bytes32) external view returns (bool)'],
                method: 'isValidOrder'
            }
        ];
        
        for (const test of validationTests) {
            try {
                const testContract = new ethers.Contract(contractAddress, test.abi, provider);
                const result = await testContract[test.method](orderId);
                console.log(`✅ ${test.name}: ${result}`);
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message.split(':')[0]}`);
            }
        }
        
        // Check current block time vs deadline
        const currentBlock = await provider.getBlock('latest');
        console.log(`\n⏰ Current time: ${new Date(currentBlock.timestamp * 1000).toISOString()}`);
        console.log(`⏰ Block number: ${currentBlock.number}`);
        
        // Test a small bid to see exact error
        console.log('\n🧪 TESTING MINIMAL BID...');
        
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        const bidAbi = [
            'function placeBid(bytes32 orderId, uint256 inputAmount, uint256 outputAmount, uint256 gasEstimate) external payable'
        ];
        const bidContract = new ethers.Contract(contractAddress, bidAbi, wallet);
        
        const testParams = {
            orderId: orderId,
            inputAmount: ethers.parseEther('0.001'),
            outputAmount: ethers.parseEther('1.0'),
            gasEstimate: 150000
        };
        
        console.log('📊 Test bid parameters:');
        console.log(`   Order ID: ${testParams.orderId}`);
        console.log(`   Input: ${ethers.formatEther(testParams.inputAmount)} ETH`);
        console.log(`   Output: ${ethers.formatEther(testParams.outputAmount)} ALGO`);
        console.log(`   Gas Estimate: ${testParams.gasEstimate}`);
        
        // Try to estimate gas first
        try {
            const gasEstimate = await bidContract.placeBid.estimateGas(
                testParams.orderId,
                testParams.inputAmount,
                testParams.outputAmount,
                testParams.gasEstimate,
                { value: ethers.parseEther('0.001') }
            );
            console.log(`✅ Gas estimate successful: ${gasEstimate.toString()}`);
            
            // If gas estimation works, try the actual transaction
            console.log('⏳ Attempting actual bid...');
            const tx = await bidContract.placeBid(
                testParams.orderId,
                testParams.inputAmount,
                testParams.outputAmount,
                testParams.gasEstimate,
                {
                    value: ethers.parseEther('0.001'),
                    gasLimit: gasEstimate,
                    maxFeePerGas: ethers.parseUnits('10', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
                }
            );
            
            console.log(`🔗 Transaction: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Bid placed successfully in block ${receipt.blockNumber}`);
            
        } catch (gasError) {
            console.log(`❌ Gas estimation failed: ${gasError.message}`);
            
            if (gasError.message.includes('execution reverted')) {
                console.log('\n🔍 POSSIBLE REASONS FOR REVERT:');
                console.log('- Order may be expired (deadline passed)');
                console.log('- Order may be filled or cancelled');
                console.log('- Bid parameters may be invalid');
                console.log('- Input/output amounts may not meet requirements');
                console.log('- Relayer may not have sufficient balance');
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking order validity:', error.message);
    }
}

checkOrderValidity().catch(console.error);