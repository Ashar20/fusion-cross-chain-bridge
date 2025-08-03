#!/usr/bin/env node

/**
 * 🔍 DIAGNOSE 1INCH ESCROW FACTORY ISSUES
 */

const { ethers } = require('ethers');

async function diagnose1inchEscrow() {
    console.log('🔍 DIAGNOSING 1INCH ESCROW FACTORY');
    console.log('==================================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const escrowFactoryAddress = '0x0d8137727DB1aC0f7B10f7687D734CD027921bf6';
    
    console.log(`🏭 1inch Escrow Factory: ${escrowFactoryAddress}`);
    console.log(`💰 Relayer: ${wallet.address}`);
    
    // Load the EXACT ABI from deployment
    const escrowFactoryABI = [
        {
            "inputs": [
                {"internalType": "address", "name": "token", "type": "address"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"},
                {"internalType": "bytes32", "name": "orderHash", "type": "bytes32"},
                {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                {"internalType": "bytes", "name": "", "type": "bytes"}
            ],
            "name": "createEscrow",
            "outputs": [{"internalType": "address", "name": "escrow", "type": "address"}],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "bytes32", "name": "orderHash", "type": "bytes32"}],
            "name": "getEscrow",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
            "name": "escrows",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    const escrowFactory = new ethers.Contract(escrowFactoryAddress, escrowFactoryABI, wallet);
    
    try {
        // 1. Check if contract exists and is accessible
        console.log('🔍 Step 1: Contract Accessibility Check');
        const code = await provider.getCode(escrowFactoryAddress);
        console.log(`   Contract bytecode length: ${code.length} chars`);
        console.log(`   Contract exists: ${code !== '0x' ? '✅ YES' : '❌ NO'}`);
        
        // 2. Check relayer balance
        console.log('\n🔍 Step 2: Relayer Balance Check');
        const balance = await provider.getBalance(wallet.address);
        console.log(`   ETH Balance: ${ethers.formatEther(balance)} ETH`);
        console.log(`   Sufficient for escrow: ${balance > ethers.parseEther('0.002') ? '✅ YES' : '❌ NO'}`);
        
        // 3. Test existing escrow lookup
        console.log('\n🔍 Step 3: Testing Escrow Lookup Functions');
        const testOrderHash = '0x6a48d1435ad61ba43be3c1771ec262d01f9d3d289c3eec69391bde15f2dd0130';
        console.log(`   Testing with orderHash: ${testOrderHash}`);
        
        try {
            const existingEscrow1 = await escrowFactory.getEscrow(testOrderHash);
            console.log(`   getEscrow result: ${existingEscrow1}`);
            console.log(`   Escrow exists: ${existingEscrow1 !== ethers.ZeroAddress ? '✅ YES' : '❌ NO'}`);
        } catch (error) {
            console.log(`   getEscrow failed: ${error.message}`);
        }
        
        try {
            const existingEscrow2 = await escrowFactory.escrows(testOrderHash);
            console.log(`   escrows mapping: ${existingEscrow2}`);
        } catch (error) {
            console.log(`   escrows mapping failed: ${error.message}`);
        }
        
        // 4. Test createEscrow with minimal parameters
        console.log('\n🔍 Step 4: Testing Escrow Creation (DRY RUN)');
        
        // Generate a unique test orderHash
        const uniqueOrderHash = ethers.keccak256(ethers.toUtf8Bytes(`test-${Date.now()}`));
        console.log(`   Unique test orderHash: ${uniqueOrderHash}`);
        
        const testParams = {
            token: ethers.ZeroAddress, // ETH
            amount: ethers.parseEther('0.001'), // Very small amount
            orderHash: uniqueOrderHash,
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            data: '0x' // Empty bytes
        };
        
        console.log('   Test Parameters:');
        console.log(`     Token: ${testParams.token} (ETH)`);
        console.log(`     Amount: ${ethers.formatEther(testParams.amount)} ETH`);
        console.log(`     OrderHash: ${testParams.orderHash}`);
        console.log(`     Deadline: ${new Date(testParams.deadline * 1000).toISOString()}`);
        console.log(`     Data: ${testParams.data}`);
        
        // Test gas estimation first
        console.log('\n   Testing gas estimation...');
        try {
            const gasEstimate = await escrowFactory.createEscrow.estimateGas(
                testParams.token,
                testParams.amount,
                testParams.orderHash,
                testParams.deadline,
                testParams.data,
                { value: testParams.amount }
            );
            console.log(`   ✅ Gas estimation successful: ${gasEstimate.toString()}`);
            
            // If gas estimation works, try a real transaction with very small amount
            console.log('\n🚀 Step 5: ACTUAL ESCROW CREATION TEST');
            console.log('   Creating real escrow with minimal test amount...');
            
            const createTx = await escrowFactory.createEscrow(
                testParams.token,
                testParams.amount,
                testParams.orderHash,
                testParams.deadline,
                testParams.data,
                {
                    value: testParams.amount,
                    gasLimit: gasEstimate * 2n, // Double for safety
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                }
            );
            
            console.log(`   🔗 Transaction hash: ${createTx.hash}`);
            console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${createTx.hash}`);
            console.log('   ⏳ Waiting for confirmation...');
            
            const receipt = await createTx.wait();
            console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
            console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
            
            // Check if escrow was created
            const newEscrowAddress = await escrowFactory.getEscrow(testParams.orderHash);
            console.log(`   🏠 New escrow address: ${newEscrowAddress}`);
            console.log(`   🎉 SUCCESS: 1inch Escrow Factory is working!`);
            
            // Check escrow creation event
            const escrowCreatedTopic = ethers.id('EscrowCreated(bytes32,address,address,uint256)');
            const escrowEvent = receipt.logs.find(log => log.topics[0] === escrowCreatedTopic);
            if (escrowEvent) {
                console.log(`   📋 EscrowCreated event found`);
            }
            
        } catch (gasError) {
            console.log(`   ❌ Gas estimation failed: ${gasError.message}`);
            
            if (gasError.message.includes('execution reverted')) {
                console.log('\n🔍 REVERT ANALYSIS:');
                console.log('   Possible causes:');
                console.log('   - Contract has access restrictions');
                console.log('   - Invalid parameter format');
                console.log('   - Insufficient contract balance');
                console.log('   - Contract logic error');
                
                // Try to decode revert reason
                if (gasError.data) {
                    console.log(`   Raw error data: ${gasError.data}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
    }
}

diagnose1inchEscrow().catch(console.error);