#!/usr/bin/env node

/**
 * 🔍 CHECK RELAYER STATUS
 * 
 * Checks if the relayer is working and monitoring orders
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function checkRelayerStatus() {
    console.log('🔍 CHECKING RELAYER STATUS');
    console.log('==========================\n');
    
    try {
        require('dotenv').config();
        
        // Check if relayer is running
        const { exec } = require('child_process');
        exec('ps aux | grep "startCompleteRelayer" | grep -v grep', (error, stdout, stderr) => {
            if (stdout) {
                console.log('✅ Relayer process is running:');
                console.log(stdout);
            } else {
                console.log('❌ Relayer process not found');
            }
        });
        
        // Check relayer database
        if (fs.existsSync('relayer-db.json')) {
            console.log('\n📊 RELAYER DATABASE:');
            const dbData = JSON.parse(fs.readFileSync('relayer-db.json', 'utf8'));
            console.log('   Order Mappings:', dbData.orderMappings?.length || 0);
            console.log('   HTLC Mappings:', dbData.htlcMappings?.length || 0);
            console.log('   Pending Swaps:', dbData.pendingSwaps?.length || 0);
            console.log('   Completed Swaps:', dbData.completedSwaps?.length || 0);
        } else {
            console.log('\n❌ Relayer database not found');
        }
        
        // Check successful swaps log
        if (fs.existsSync('successful-atomic-swaps.log')) {
            console.log('\n📝 SUCCESSFUL SWAPS LOG:');
            const swaps = fs.readFileSync('successful-atomic-swaps.log', 'utf8').split('\n').filter(line => line.trim());
            console.log('   Total successful swaps:', swaps.length);
            if (swaps.length > 0) {
                console.log('   Latest swap:', JSON.parse(swaps[swaps.length - 1]));
            }
        } else {
            console.log('\n❌ Successful swaps log not found');
        }
        
        // Check recent transactions
        console.log('\n🔍 RECENT TRANSACTIONS:');
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const currentBlock = await provider.getBlockNumber();
        console.log('   Current block:', currentBlock);
        
        // Check for any recent transactions from relayer address
        const relayerEnv = fs.readFileSync('.env.relayer', 'utf8');
        const relayerAddress = relayerEnv.split('\n').find(line => line.startsWith('RELAYER_ETH_ADDRESS='))?.split('=')[1];
        
        if (relayerAddress) {
            console.log('   Relayer address:', relayerAddress);
            
            // Get recent transactions for relayer
            const history = await provider.getHistory(relayerAddress, currentBlock - 100, currentBlock);
            console.log('   Recent relayer transactions:', history.length);
            
            for (const tx of history.slice(-5)) {
                console.log(`     ${tx.hash} - Block ${tx.blockNumber}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking relayer status:', error.message);
    }
}

checkRelayerStatus();
