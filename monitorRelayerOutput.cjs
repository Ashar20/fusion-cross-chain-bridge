#!/usr/bin/env node

/**
 * 📊 RELAYER OUTPUT MONITOR
 * 
 * Monitors the relayer's status and output without interfering
 */

const fs = require('fs');
const { ethers } = require('ethers');

class RelayerOutputMonitor {
    constructor() {
        console.log('📊 RELAYER OUTPUT MONITOR');
        console.log('==========================');
        this.monitorRelayer();
    }
    
    async monitorRelayer() {
        while (true) {
            try {
                console.clear();
                console.log('📊 RELAYER STATUS MONITOR');
                console.log('==========================');
                console.log(`⏰ ${new Date().toISOString()}`);
                console.log('');
                
                // Check if relayer process is running
                const { execSync } = require('child_process');
                try {
                    const processes = execSync('ps aux | grep correctedLOPRelayer | grep -v grep', { encoding: 'utf8' });
                    const lines = processes.trim().split('\n').filter(line => line.length > 0);
                    
                    if (lines.length > 0) {
                        console.log('✅ RELAYER STATUS: RUNNING');
                        console.log(`   Found ${lines.length} relayer process(es)`);
                        for (const line of lines) {
                            const parts = line.split(/\s+/);
                            const pid = parts[1];
                            const cpu = parts[2];
                            const mem = parts[3];
                            console.log(`   PID: ${pid}, CPU: ${cpu}%, MEM: ${mem}%`);
                        }
                    } else {
                        console.log('❌ RELAYER STATUS: NOT RUNNING');
                    }
                } catch (error) {
                    console.log('❌ RELAYER STATUS: NOT RUNNING');
                }
                
                console.log('');
                
                // Check order file
                if (fs.existsSync('SIGNED_LOP_ORDER.json')) {
                    const stats = fs.statSync('SIGNED_LOP_ORDER.json');
                    console.log('📋 ORDER FILE: EXISTS');
                    console.log(`   Size: ${stats.size} bytes`);
                    console.log(`   Modified: ${stats.mtime.toISOString()}`);
                    
                    try {
                        const orderData = JSON.parse(fs.readFileSync('SIGNED_LOP_ORDER.json', 'utf8'));
                        console.log(`   Maker: ${orderData.maker}`);
                        console.log(`   Maker Amount: ${ethers.formatEther(orderData.makerAmount)} ETH`);
                        console.log(`   Taker Amount: ${ethers.formatUnits(orderData.takerAmount, 6)} USDC`);
                        console.log(`   Deadline: ${new Date(parseInt(orderData.deadline) * 1000).toISOString()}`);
                    } catch (error) {
                        console.log(`   Error reading order: ${error.message}`);
                    }
                } else {
                    console.log('❌ ORDER FILE: NOT FOUND');
                }
                
                console.log('');
                
                // Check relayer state file
                if (fs.existsSync('relayer-state.json')) {
                    const stats = fs.statSync('relayer-state.json');
                    console.log('📊 RELAYER STATE: EXISTS');
                    console.log(`   Size: ${stats.size} bytes`);
                    console.log(`   Modified: ${stats.mtime.toISOString()}`);
                    
                    try {
                        const stateData = JSON.parse(fs.readFileSync('relayer-state.json', 'utf8'));
                        console.log(`   Executed Orders: ${stateData.executedOrders?.length || 0}`);
                        console.log(`   Total Gas Used: ${stateData.totalGasUsed || 0}`);
                        console.log(`   Last Updated: ${stateData.lastUpdated || 'N/A'}`);
                    } catch (error) {
                        console.log(`   Error reading state: ${error.message}`);
                    }
                } else {
                    console.log('📊 RELAYER STATE: NOT FOUND (normal for new relayer)');
                }
                
                console.log('');
                console.log('🔄 Refreshing in 10 seconds... (Ctrl+C to exit)');
                
                await new Promise(resolve => setTimeout(resolve, 10000));
                
            } catch (error) {
                console.log(`❌ Error in monitoring: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
}

// Run the monitor
async function main() {
    const monitor = new RelayerOutputMonitor();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { RelayerOutputMonitor }; 