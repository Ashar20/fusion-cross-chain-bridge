#!/usr/bin/env node

/**
 * 🔍 CHECK RELAYER STATUS
 * 
 * Checks if the relayer is running and monitoring transactions
 */

const { ethers } = require('ethers');
const fs = require('fs');

class RelayerStatusChecker {
    constructor() {
        console.log('🔍 CHECKING RELAYER STATUS');
        console.log('==========================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        // Load relayer addresses from .env.relayer
        const relayerEnv = fs.readFileSync('.env.relayer', 'utf8');
        const relayerLines = relayerEnv.split('\n');
        
        // Extract relayer addresses
        let ethRelayerAddress, ethRelayerPrivateKey;
        
        for (const line of relayerLines) {
            if (line.startsWith('RELAYER_ETH_ADDRESS=')) {
                ethRelayerAddress = line.split('=')[1];
            } else if (line.startsWith('RELAYER_ETH_PRIVATE_KEY=')) {
                ethRelayerPrivateKey = line.split('=')[1];
            }
        }
        
        // Network configurations
        this.ethProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        
        // Account setup
        this.relayer = {
            ethWallet: new ethers.Wallet(ethRelayerPrivateKey, this.ethProvider)
        };
        
        console.log(`🤖 Relayer ETH Address: ${ethRelayerAddress}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${ethRelayerAddress}\n`);
    }
    
    async checkRelayerBalance() {
        console.log('💰 CHECKING RELAYER BALANCE');
        console.log('===========================');
        
        const balance = await this.ethProvider.getBalance(this.relayer.ethWallet.address);
        console.log(`🤖 Relayer ETH Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (parseFloat(ethers.formatEther(balance)) < 0.01) {
            console.log('⚠️  WARNING: Relayer has low ETH balance for gas fees!');
        } else {
            console.log('✅ Relayer has sufficient ETH for gas fees');
        }
        console.log('');
        
        return balance;
    }
    
    async checkRecentTransactions() {
        console.log('📊 CHECKING RECENT TRANSACTIONS');
        console.log('===============================');
        
        try {
            // Get recent transactions for the relayer
            const currentBlock = await this.ethProvider.getBlockNumber();
            console.log(`📦 Current Block: ${currentBlock}`);
            
            // Check last 10 blocks for relayer transactions
            let relayerTxCount = 0;
            for (let i = 0; i < 10; i++) {
                const block = await this.ethProvider.getBlock(currentBlock - i, true);
                if (block && block.transactions) {
                    for (const tx of block.transactions) {
                        if (tx.from && tx.from.toLowerCase() === this.relayer.ethWallet.address.toLowerCase()) {
                            relayerTxCount++;
                            console.log(`🔍 Found relayer transaction in block ${block.number}:`);
                            console.log(`   📝 Hash: ${tx.hash}`);
                            console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
                            console.log(`   💰 Gas Used: ${tx.gasLimit.toString()}`);
                            console.log('');
                        }
                    }
                }
            }
            
            if (relayerTxCount === 0) {
                console.log('❌ No recent relayer transactions found');
                console.log('⚠️  Relayer may not be actively processing transactions');
            } else {
                console.log(`✅ Found ${relayerTxCount} recent relayer transactions`);
            }
            
        } catch (error) {
            console.error('❌ Error checking recent transactions:', error.message);
        }
        
        console.log('');
    }
    
    async checkContractEvents() {
        console.log('📋 CHECKING CONTRACT EVENTS');
        console.log('===========================');
        
        try {
            // Resolver contract ABI for events
            const resolverABI = [
                'event CrossChainOrderCreated(bytes32 indexed orderHash, address indexed maker, address token, uint256 amount, bytes32 hashlock, uint256 timelock, string algorandAddress)',
                'event CrossChainSwapExecuted(bytes32 indexed orderHash, address indexed taker, bytes32 secret)'
            ];
            
            const resolverContract = new ethers.Contract(
                '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64',
                resolverABI,
                this.ethProvider
            );
            
            // Get recent events
            const currentBlock = await this.ethProvider.getBlockNumber();
            const fromBlock = currentBlock - 100; // Last 100 blocks
            
            console.log(`🔍 Checking events from block ${fromBlock} to ${currentBlock}`);
            
            const orderCreatedEvents = await resolverContract.queryFilter(
                resolverContract.filters.CrossChainOrderCreated(),
                fromBlock,
                currentBlock
            );
            
            const swapExecutedEvents = await resolverContract.queryFilter(
                resolverContract.filters.CrossChainSwapExecuted(),
                fromBlock,
                currentBlock
            );
            
            console.log(`📊 Found ${orderCreatedEvents.length} order creation events`);
            console.log(`📊 Found ${swapExecutedEvents.length} swap execution events`);
            
            if (orderCreatedEvents.length > 0) {
                console.log('\n📋 RECENT ORDERS:');
                for (const event of orderCreatedEvents.slice(-3)) { // Last 3 events
                    console.log(`   🔗 Order Hash: ${event.args.orderHash}`);
                    console.log(`   👤 Maker: ${event.args.maker}`);
                    console.log(`   💰 Amount: ${ethers.formatEther(event.args.amount)} ETH`);
                    console.log(`   🔒 Hashlock: ${event.args.hashlock}`);
                    console.log('');
                }
            }
            
            if (swapExecutedEvents.length > 0) {
                console.log('\n📋 RECENT SWAPS:');
                for (const event of swapExecutedEvents.slice(-3)) { // Last 3 events
                    console.log(`   🔗 Order Hash: ${event.args.orderHash}`);
                    console.log(`   👤 Taker: ${event.args.taker}`);
                    console.log(`   🔑 Secret: ${event.args.secret}`);
                    console.log('');
                }
            }
            
        } catch (error) {
            console.error('❌ Error checking contract events:', error.message);
        }
        
        console.log('');
    }
    
    async runStatusCheck() {
        try {
            await this.checkRelayerBalance();
            await this.checkRecentTransactions();
            await this.checkContractEvents();
            
            console.log('🎯 RELAYER STATUS SUMMARY');
            console.log('=========================');
            console.log('✅ Relayer status check completed');
            console.log('📊 Check the output above for details');
            
        } catch (error) {
            console.error('❌ Error during status check:', error.message);
        }
    }
}

// Execute the status check
async function main() {
    const checker = new RelayerStatusChecker();
    await checker.runStatusCheck();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RelayerStatusChecker;
