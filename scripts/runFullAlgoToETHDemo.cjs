#!/usr/bin/env node

/**
 * 🎬 FULL ALGO → ETH DEMO WITH MULTI-RESOLVER
 * 
 * Complete demonstration of:
 * 1. Creating ALGO → ETH intent
 * 2. Multi-resolver competitive bidding
 * 3. Atomic swap resolution
 */

const { spawn } = require('child_process');
const fs = require('fs');

class FullAlgoToETHDemo {
    constructor() {
        console.log('🎬 FULL ALGO → ETH DEMO WITH MULTI-RESOLVER');
        console.log('==========================================');
        console.log('✅ Step 1: Create ALGO → ETH intent');
        console.log('✅ Step 2: Start multi-resolver relayer');
        console.log('✅ Step 3: Monitor competitive bidding');
        console.log('✅ Step 4: Complete atomic swap');
        console.log('==========================================\n');
    }
    
    async runDemo() {
        try {
            console.log('🚀 STARTING FULL DEMO');
            console.log('=====================\n');
            
            // Step 1: Create the intent
            console.log('📝 Step 1: Creating ALGO → ETH swap intent...');
            console.log('==============================================');
            
            await this.createIntent();
            
            console.log('\n⏳ Waiting 5 seconds before starting relayer...\n');
            await this.sleep(5000);
            
            // Step 2: Start the multi-resolver relayer
            console.log('🤖 Step 2: Starting multi-resolver relayer...');
            console.log('==============================================');
            
            this.startRelayer();
            
            console.log('\n🎯 DEMO RUNNING');
            console.log('===============');
            console.log('✅ Intent created and saved to algo-to-eth-intent.json');
            console.log('🤖 Multi-resolver relayer is now monitoring for the order');
            console.log('⚡ Watch for competitive bidding from 4 different resolvers');
            console.log('🏆 The best bid will win and create an escrow');
            console.log('\n📊 Monitor the output above to see:');
            console.log('   - Order detection');
            console.log('   - Escrow creation');
            console.log('   - Competitive bidding');
            console.log('   - Atomic resolution (if secret is revealed)');
            console.log('\n⏹️  Press Ctrl+C to stop the demo\n');
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        }
    }
    
    async createIntent() {
        return new Promise((resolve, reject) => {
            const intentProcess = spawn('node', ['scripts/createAlgoToETHIntent.cjs'], {
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            intentProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Intent creation completed successfully');
                    resolve();
                } else {
                    reject(new Error(`Intent creation failed with code ${code}`));
                }
            });
            
            intentProcess.on('error', (error) => {
                reject(new Error(`Intent creation error: ${error.message}`));
            });
        });
    }
    
    startRelayer() {
        const relayerProcess = spawn('node', ['scripts/multiResolverRelayer.cjs'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        relayerProcess.on('error', (error) => {
            console.error('❌ Relayer error:', error.message);
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down demo...');
            relayerProcess.kill('SIGINT');
            process.exit(0);
        });
        
        return relayerProcess;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Show usage instructions
function showInstructions() {
    console.log('📋 DEMO INSTRUCTIONS');
    console.log('====================');
    console.log('');
    console.log('🔧 SETUP REQUIRED:');
    console.log('   1. Ensure .env.relayer has RELAYER_ETH_PRIVATE_KEY');
    console.log('   2. Ensure .env.resolvers has 4 resolver configurations');
    console.log('   3. Ensure main .env has USER_PRIVATE_KEY and USER_ALGO_MNEMONIC');
    console.log('   4. Authorize resolvers in the LOP contract if needed');
    console.log('');
    console.log('🚀 TO RUN:');
    console.log('   node scripts/runFullAlgoToETHDemo.cjs');
    console.log('');
    console.log('👀 WHAT TO EXPECT:');
    console.log('   - Intent creation with atomic swap parameters');
    console.log('   - Multi-resolver detection and competitive bidding');
    console.log('   - Escrow creation via 1inch factory');
    console.log('   - Real blockchain transactions');
    console.log('');
    console.log('📄 OUTPUT FILES:');
    console.log('   - algo-to-eth-intent.json (intent details)');
    console.log('');
}

// Check if this is a help request
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showInstructions();
    process.exit(0);
}

// Run the demo
async function main() {
    showInstructions();
    
    console.log('⏳ Starting demo in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const demo = new FullAlgoToETHDemo();
    await demo.runDemo();
}

main().catch(console.error);