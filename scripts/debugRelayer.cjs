#!/usr/bin/env node

/**
 * 🔍 DEBUG RELAYER
 * 
 * Debug script to check what the relayer is monitoring
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function debugRelayer() {
    console.log('🔍 DEBUGGING RELAYER');
    console.log('====================\n');
    
    try {
        // Check relayer processes
        const { exec } = require('child_process');
        exec('ps aux | grep "startCompleteRelayer" | grep -v grep', (error, stdout, stderr) => {
            if (stdout) {
                console.log('✅ Relayer processes running:');
                console.log(stdout);
            } else {
                console.log('❌ No relayer processes found');
            }
        });
        
        // Check relayer database
        if (fs.existsSync('relayer-db.json')) {
            const dbData = JSON.parse(fs.readFileSync('relayer-db.json', 'utf8'));
            console.log('\n📊 RELAYER DATABASE:');
            console.log('   Order Mappings:', dbData.orderMappings?.length || 0);
            console.log('   HTLC Mappings:', dbData.htlcMappings?.length || 0);
            console.log('   Pending Swaps:', dbData.pendingSwaps?.length || 0);
            console.log('   Completed Swaps:', dbData.completedSwaps?.length || 0);
            
            // Show latest orders
            if (dbData.orderMappings && dbData.orderMappings.length > 0) {
                console.log('\n📋 LATEST ORDERS:');
                const recent = dbData.orderMappings.slice(-3);
                for (const [orderId, data] of recent) {
                    console.log(`   ${orderId}`);
                    console.log(`     Status: ${data.status}`);
                    console.log(`     Direction: ${data.direction}`);
                    console.log(`     Created: ${data.createdAt}`);
                }
            }
        }
        
        // Check for recent LimitOrderCreated events
        console.log('\n🔍 CHECKING RECENT EVENTS:');
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        const abi = [
            'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock)'
        ];
        
        const contract = new ethers.Contract(contractAddress, abi, provider);
        const currentBlock = await provider.getBlockNumber();
        
        console.log(`   Current block: ${currentBlock}`);
        console.log(`   Checking last 100 blocks...`);
        
        const events = await contract.queryFilter('LimitOrderCreated', currentBlock - 100, currentBlock);
        console.log(`   Found ${events.length} LimitOrderCreated events in last 100 blocks`);
        
        for (const event of events) {
            console.log(`   Order ID: ${event.args.orderId}`);
            console.log(`   Maker: ${event.args.maker}`);
            console.log(`   Amount: ${ethers.formatEther(event.args.makerAmount)} ETH`);
            console.log(`   Block: ${event.blockNumber}`);
            console.log(`   ---`);
        }
        
    } catch (error) {
        console.error('❌ Error debugging relayer:', error.message);
    }
}

debugRelayer();
