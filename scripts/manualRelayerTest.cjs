#!/usr/bin/env node

/**
 * 🧪 MANUAL RELAYER TEST
 * 
 * Manually tests the relayer with a specific order
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function manualRelayerTest() {
    console.log('🧪 MANUAL RELAYER TEST');
    console.log('======================\n');
    
    try {
        require('dotenv').config();
        
        // Load the fixed relayer
        const { FixedCrossChainRelayer } = require('./working-scripts/relayer/fixedCrossChainRelayer.cjs');
        
        console.log('🚀 Starting fixed relayer...');
        const relayer = new FixedCrossChainRelayer();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔍 Manually checking for recent orders...');
        
        // Check for the specific order we created
        const orderId = '0xbdbbfd80426f5ef4f510135228e6f834873a5bfd0d5f2c4b6933abf7f38ffc6f';
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        const abi = [
            'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock, bool allowPartialFills)'
        ];
        
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        // Get current block
        const currentBlock = await provider.getBlockNumber();
        console.log('Current block:', currentBlock);
        
        // Check for events in recent blocks
        const events = await contract.queryFilter('LimitOrderCreated', currentBlock - 10, currentBlock);
        console.log('Found', events.length, 'recent LimitOrderCreated events');
        
        for (const event of events) {
            console.log('\\n📋 ORDER DETECTED:');
            console.log('Order ID:', event.args.orderId);
            console.log('Maker:', event.args.maker);
            console.log('Amount:', ethers.formatEther(event.args.makerAmount), 'ETH');
            console.log('Block:', event.blockNumber);
            console.log('Allow Partial Fills:', event.args.allowPartialFills);
            
            // Simulate relayer processing
            console.log('\\n🔄 Simulating relayer processing...');
            await relayer.processNewLOPOrder(event);
        }
        
        console.log('\\n✅ Manual relayer test completed');
        
    } catch (error) {
        console.error('❌ Error in manual relayer test:', error.message);
    }
}

manualRelayerTest();
