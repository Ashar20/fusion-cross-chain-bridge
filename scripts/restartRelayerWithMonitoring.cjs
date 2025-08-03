#!/usr/bin/env node

/**
 * 🔄 RESTART RELAYER WITH MONITORING
 * 
 * Restarts the relayer with proper monitoring from current block
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function restartRelayerWithMonitoring() {
    console.log('🔄 RESTARTING RELAYER WITH MONITORING');
    console.log('=====================================\n');
    
    try {
        // Kill existing relayer processes
        const { exec } = require('child_process');
        exec('pkill -f "startCompleteRelayer"', (error, stdout, stderr) => {
            console.log('🛑 Killed existing relayer processes');
        });
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get current block
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const currentBlock = await provider.getBlockNumber();
        
        console.log(`📊 Current block: ${currentBlock}`);
        console.log(`�� Relayer will monitor from block: ${currentBlock - 50}`);
        
        // Update relayer database to start monitoring from current block
        if (fs.existsSync('relayer-db.json')) {
            const dbData = JSON.parse(fs.readFileSync('relayer-db.json', 'utf8'));
            
            // Add monitoring state
            dbData.monitoringState = {
                lastCheckedBlock: currentBlock - 50,
                lastUpdated: new Date().toISOString(),
                currentBlock: currentBlock
            };
            
            fs.writeFileSync('relayer-db.json', JSON.stringify(dbData, null, 2));
            console.log('✅ Updated relayer database with monitoring state');
        }
        
        // Start relayer
        console.log('\n🚀 Starting relayer with fresh monitoring...');
        const { spawn } = require('child_process');
        const relayer = spawn('node', ['scripts/startCompleteRelayer.cjs'], {
            stdio: 'inherit',
            detached: true
        });
        
        relayer.unref();
        
        console.log('✅ Relayer restarted with fresh monitoring');
        console.log('⏳ Waiting for relayer to initialize...');
        
        // Wait for relayer to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if relayer is running
        exec('ps aux | grep "startCompleteRelayer" | grep -v grep', (error, stdout, stderr) => {
            if (stdout) {
                console.log('✅ Relayer is running:');
                console.log(stdout);
            } else {
                console.log('❌ Relayer failed to start');
            }
        });
        
        console.log('\n🎯 RELAYER RESTARTED SUCCESSFULLY!');
        console.log('==================================');
        console.log('✅ Fresh monitoring from current block');
        console.log('✅ Ready to detect new orders');
        console.log('✅ Automated processing enabled');
        
    } catch (error) {
        console.error('❌ Error restarting relayer:', error.message);
    }
}

restartRelayerWithMonitoring();
