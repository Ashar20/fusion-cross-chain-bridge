#!/usr/bin/env node

/**
 * 📊 MONITOR CROSS-CHAIN SWAPS
 * 
 * Monitor 1inch and Algorand for cross-chain swap events
 */

const { ethers } = require('hardhat');
const algosdk = require('algosdk');
require('dotenv').config();

class CrossChainMonitor {
    constructor() {
        this.ethereumProvider = null;
        this.algorandClient = null;
        this.resolver = null;
        this.algorandHTLC = null;
        this.monitoring = false;
        this.swaps = new Map();
    }

    async initialize() {
        console.log('🔍 Initializing Cross-Chain Swap Monitor...');
        console.log('==========================================');

        // Load configuration
        const fs = require('fs');
        const integrationConfig = JSON.parse(fs.readFileSync('1INCH_ALGORAND_INTEGRATION.json', 'utf8'));
        const resolverDeployment = JSON.parse(fs.readFileSync('CROSS_CHAIN_RESOLVER_DEPLOYMENT.json', 'utf8'));

        // Initialize Ethereum
        this.ethereumProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);
        console.log(`✅ Ethereum initialized - Resolver: ${await this.resolver.getAddress()}`);

        // Initialize Algorand
        this.algorandClient = new algosdk.Algodv2(
            process.env.ALGOD_TOKEN,
            process.env.ALGOD_SERVER,
            process.env.ALGOD_PORT
        );
        this.algorandHTLC = {
            appId: integrationConfig.networks.algorand.appId,
            address: algosdk.getApplicationAddress(integrationConfig.networks.algorand.appId)
        };
        console.log(`✅ Algorand initialized - HTLC App ID: ${this.algorandHTLC.appId}`);

        console.log('✅ Cross-chain monitor initialized successfully');
    }

    async startMonitoring() {
        console.log('\n🚀 Starting Cross-Chain Swap Monitoring...');
        console.log('==========================================');
        
        this.monitoring = true;
        
        // Set up Ethereum event listeners
        await this.setupEthereumListeners();
        
        // Set up Algorand monitoring
        await this.setupAlgorandMonitoring();
        
        console.log('✅ Monitoring started - Press Ctrl+C to stop');
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping monitoring...');
            this.monitoring = false;
            process.exit(0);
        });
    }

    async setupEthereumListeners() {
        console.log('\n📡 Setting up Ethereum event listeners...');
        
        // Listen for CrossChainOrderCreated events
        this.resolver.on('CrossChainOrderCreated', async (orderHash, maker, token, amount, hashlock, timelock, recipient, algorandAddress, event) => {
            console.log('\n🆕 New Cross-Chain Order Created:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Maker: ${maker}`);
            console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   Recipient: ${recipient}`);
            console.log(`   Algorand Address: ${algorandAddress}`);
            console.log(`   Block: ${event.blockNumber}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            // Store swap info
            this.swaps.set(orderHash, {
                orderHash,
                maker,
                amount,
                hashlock,
                timelock,
                recipient,
                algorandAddress,
                status: 'ORDER_CREATED',
                ethereumTx: event.transactionHash,
                createdAt: new Date().toISOString()
            });
            
            // Monitor this swap
            this.monitorSwap(orderHash);
        });

        // Listen for EscrowCreated events
        this.resolver.on('EscrowCreated', async (orderHash, escrowSrc, escrowDst, token, amount, event) => {
            console.log('\n🏦 Escrow Created:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   EscrowSrc: ${escrowSrc}`);
            console.log(`   EscrowDst: ${escrowDst}`);
            console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            const swap = this.swaps.get(orderHash);
            if (swap) {
                swap.status = 'ESCROW_CREATED';
                swap.escrowSrc = escrowSrc;
                swap.escrowDst = escrowDst;
                swap.escrowTx = event.transactionHash;
            }
        });

        // Listen for SwapCommitted events
        this.resolver.on('SwapCommitted', async (orderHash, hashlock, secret, recipient, event) => {
            console.log('\n✅ Swap Committed:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Secret: ${secret}`);
            console.log(`   Recipient: ${recipient}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            const swap = this.swaps.get(orderHash);
            if (swap) {
                swap.status = 'SWAP_COMMITTED';
                swap.secret = secret;
                swap.commitTx = event.transactionHash;
            }
        });

        // Listen for SecretRevealed events
        this.resolver.on('SecretRevealed', async (orderHash, secret, event) => {
            console.log('\n🔓 Secret Revealed:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Secret: ${secret}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            const swap = this.swaps.get(orderHash);
            if (swap) {
                swap.status = 'SECRET_REVEALED';
                swap.secretRevealedTx = event.transactionHash;
            }
        });

        // Listen for OrderRefunded events
        this.resolver.on('OrderRefunded', async (orderHash, maker, event) => {
            console.log('\n💸 Order Refunded:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Maker: ${maker}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            const swap = this.swaps.get(orderHash);
            if (swap) {
                swap.status = 'REFUNDED';
                swap.refundTx = event.transactionHash;
            }
        });

        console.log('✅ Ethereum event listeners set up');
    }

    async setupAlgorandMonitoring() {
        console.log('\n📡 Setting up Algorand monitoring...');
        
        // Start monitoring Algorand transactions for the HTLC app
        this.monitorAlgorandHTLC();
        
        console.log('✅ Algorand monitoring set up');
    }

    async monitorAlgorandHTLC() {
        if (!this.monitoring) return;
        
        try {
            // Get the latest round
            const status = await this.algorandClient.status().do();
            const currentRound = status['last-round'];
            
            // Get transactions for the HTLC app
            const transactions = await this.algorandClient.searchForTransactions()
                .applicationID(this.algorandHTLC.appId)
                .round(currentRound - 10, currentRound) // Check last 10 rounds
                .do();
            
            for (const tx of transactions.transactions) {
                await this.processAlgorandTransaction(tx);
            }
            
        } catch (error) {
            console.log('⚠️  Error monitoring Algorand:', error.message);
        }
        
        // Continue monitoring
        setTimeout(() => this.monitorAlgorandHTLC(), 5000); // Check every 5 seconds
    }

    async processAlgorandTransaction(tx) {
        try {
            if (tx['application-transaction'] && tx['application-transaction']['application-args']) {
                const args = tx['application-transaction']['application-args'];
                
                if (args.length > 0) {
                    const method = Buffer.from(args[0], 'base64').toString();
                    
                    if (method === 'create_htlc') {
                        console.log('\n🏗️  Algorand HTLC Created:');
                        console.log(`   Transaction: ${tx.id}`);
                        console.log(`   Sender: ${tx.sender}`);
                        console.log(`   Round: ${tx['confirmed-round']}`);
                        
                        // Try to match with Ethereum order
                        await this.matchAlgorandHTLC(tx);
                        
                    } else if (method === 'claim_htlc') {
                        console.log('\n💰 Algorand HTLC Claimed:');
                        console.log(`   Transaction: ${tx.id}`);
                        console.log(`   Sender: ${tx.sender}`);
                        console.log(`   Round: ${tx['confirmed-round']}`);
                        
                        // Try to match with Ethereum order
                        await this.matchAlgorandClaim(tx);
                    }
                }
            }
        } catch (error) {
            console.log('⚠️  Error processing Algorand transaction:', error.message);
        }
    }

    async matchAlgorandHTLC(tx) {
        // Try to find matching Ethereum order
        for (const [orderHash, swap] of this.swaps) {
            if (swap.status === 'ORDER_CREATED' && !swap.algorandTx) {
                // This is a potential match - we'd need to verify the hashlock
                console.log(`   Potential match with Ethereum order: ${orderHash}`);
                swap.algorandTx = tx.id;
                swap.status = 'ALGORAND_HTLC_CREATED';
                break;
            }
        }
    }

    async matchAlgorandClaim(tx) {
        // Try to find matching Ethereum order
        for (const [orderHash, swap] of this.swaps) {
            if (swap.status === 'SECRET_REVEALED' && !swap.algorandClaimTx) {
                // This is a potential match
                console.log(`   Potential match with Ethereum order: ${orderHash}`);
                swap.algorandClaimTx = tx.id;
                swap.status = 'COMPLETED';
                break;
            }
        }
    }

    async monitorSwap(orderHash) {
        console.log(`\n📊 Monitoring swap: ${orderHash}`);
        
        // Check swap status periodically
        const checkStatus = async () => {
            if (!this.monitoring) return;
            
            try {
                const swap = this.swaps.get(orderHash);
                if (!swap) return;
                
                // Check if timelock has expired
                const currentTime = Math.floor(Date.now() / 1000);
                if (currentTime > swap.timelock && swap.status !== 'REFUNDED' && swap.status !== 'COMPLETED') {
                    console.log(`\n⏰ Timelock expired for swap: ${orderHash}`);
                    console.log(`   Current time: ${currentTime}`);
                    console.log(`   Timelock: ${swap.timelock}`);
                    console.log(`   Status: ${swap.status}`);
                    
                    // Check if order can be refunded
                    try {
                        const order = await this.resolver.getCrossChainOrder(orderHash);
                        if (!order.executed && !order.refunded) {
                            console.log(`   Order can be refunded`);
                        }
                    } catch (error) {
                        console.log(`   Error checking order status: ${error.message}`);
                    }
                }
                
                // Continue monitoring
                setTimeout(checkStatus, 30000); // Check every 30 seconds
                
            } catch (error) {
                console.log(`⚠️  Error monitoring swap ${orderHash}:`, error.message);
            }
        };
        
        checkStatus();
    }

    async getSwapStatus(orderHash) {
        const swap = this.swaps.get(orderHash);
        if (!swap) {
            console.log(`❌ Swap not found: ${orderHash}`);
            return null;
        }
        
        console.log(`\n📊 Swap Status: ${orderHash}`);
        console.log('================================');
        console.log(`   Status: ${swap.status}`);
        console.log(`   Maker: ${swap.maker}`);
        console.log(`   Amount: ${ethers.formatEther(swap.amount)} ETH`);
        console.log(`   Hashlock: ${swap.hashlock}`);
        console.log(`   Timelock: ${swap.timelock} (${new Date(swap.timelock * 1000).toISOString()})`);
        console.log(`   Recipient: ${swap.recipient}`);
        console.log(`   Algorand Address: ${swap.algorandAddress}`);
        console.log(`   Created: ${swap.createdAt}`);
        
        if (swap.ethereumTx) {
            console.log(`   Ethereum TX: ${swap.ethereumTx}`);
        }
        if (swap.algorandTx) {
            console.log(`   Algorand TX: ${swap.algorandTx}`);
        }
        if (swap.algorandClaimTx) {
            console.log(`   Algorand Claim TX: ${swap.algorandClaimTx}`);
        }
        if (swap.secret) {
            console.log(`   Secret: ${swap.secret}`);
        }
        
        return swap;
    }

    async getAllSwaps() {
        console.log(`\n📋 All Monitored Swaps (${this.swaps.size} total)`);
        console.log('==========================================');
        
        for (const [orderHash, swap] of this.swaps) {
            console.log(`\n   Order: ${orderHash}`);
            console.log(`   Status: ${swap.status}`);
            console.log(`   Amount: ${ethers.formatEther(swap.amount)} ETH`);
            console.log(`   Created: ${swap.createdAt}`);
        }
        
        return Array.from(this.swaps.values());
    }

    async saveSwapData() {
        const fs = require('fs');
        const swapData = {
            timestamp: new Date().toISOString(),
            totalSwaps: this.swaps.size,
            swaps: Array.from(this.swaps.entries())
        };
        
        fs.writeFileSync('CROSS_CHAIN_SWAP_MONITOR_DATA.json', JSON.stringify(swapData, null, 2));
        console.log('\n📄 Swap monitoring data saved to: CROSS_CHAIN_SWAP_MONITOR_DATA.json');
    }
}

async function main() {
    const monitor = new CrossChainMonitor();
    
    try {
        // Initialize the monitor
        await monitor.initialize();
        
        // Start monitoring
        await monitor.startMonitoring();
        
        // Set up periodic data saving
        setInterval(() => {
            monitor.saveSwapData();
        }, 60000); // Save every minute
        
    } catch (error) {
        console.error('❌ Cross-chain monitoring failed:', error);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = CrossChainMonitor;

if (require.main === module) {
    main()
        .then(() => {
            // Keep the process running
            console.log('🔄 Monitoring active...');
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

    }

    async startMonitoring() {
        console.log('\n🚀 Starting Cross-Chain Swap Monitoring...');
        console.log('==========================================');
        
        this.monitoring = true;
        
        // Set up Ethereum event listeners
        await this.setupEthereumListeners();
        
        // Set up Algorand monitoring
        await this.setupAlgorandMonitoring();
        
        console.log('✅ Monitoring started - Press Ctrl+C to stop');
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping monitoring...');
            this.monitoring = false;
            process.exit(0);
        });
    }

    async setupEthereumListeners() {
        console.log('\n📡 Setting up Ethereum event listeners...');
        
        // Listen for CrossChainOrderCreated events
        this.resolver.on('CrossChainOrderCreated', async (orderHash, maker, token, amount, hashlock, timelock, recipient, algorandAddress, event) => {
            console.log('\n🆕 New Cross-Chain Order Created:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Maker: ${maker}`);
            console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
            console.log(`   Recipient: ${recipient}`);
            console.log(`   Algorand Address: ${algorandAddress}`);
            console.log(`   Block: ${event.blockNumber}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            // Store swap info
            this.swaps.set(orderHash, {
                orderHash,
                maker,
                amount,
                hashlock,
                timelock,
                recipient,
                algorandAddress,
                status: 'ORDER_CREATED',
                ethereumTx: event.transactionHash,
                createdAt: new Date().toISOString()
            });
            
            // Monitor this swap
            this.monitorSwap(orderHash);
        });

        // Listen for EscrowCreated events
        this.resolver.on('EscrowCreated', async (orderHash, escrowSrc, escrowDst, token, amount, event) => {
            console.log('\n🏦 Escrow Created:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   EscrowSrc: ${escrowSrc}`);
            console.log(`   EscrowDst: ${escrowDst}`);
            console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            const swap = this.swaps.get(orderHash);
            if (swap) {
                swap.status = 'ESCROW_CREATED';
                swap.escrowSrc = escrowSrc;
                swap.escrowDst = escrowDst;
                swap.escrowTx = event.transactionHash;
            }
        });

        // Listen for SwapCommitted events
        this.resolver.on('SwapCommitted', async (orderHash, hashlock, secret, recipient, event) => {
            console.log('\n✅ Swap Committed:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Secret: ${secret}`);
            console.log(`   Recipient: ${recipient}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            const swap = this.swaps.get(orderHash);
            if (swap) {
                swap.status = 'SWAP_COMMITTED';
                swap.secret = secret;
                swap.commitTx = event.transactionHash;
            }
        });

        // Listen for SecretRevealed events
        this.resolver.on('SecretRevealed', async (orderHash, secret, event) => {
            console.log('\n🔓 Secret Revealed:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Secret: ${secret}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            const swap = this.swaps.get(orderHash);
            if (swap) {
                swap.status = 'SECRET_REVEALED';
                swap.secretRevealedTx = event.transactionHash;
            }
        });

        // Listen for OrderRefunded events
        this.resolver.on('OrderRefunded', async (orderHash, maker, event) => {
            console.log('\n💸 Order Refunded:');
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Maker: ${maker}`);
            console.log(`   Transaction: ${event.transactionHash}`);
            
            const swap = this.swaps.get(orderHash);
            if (swap) {
                swap.status = 'REFUNDED';
                swap.refundTx = event.transactionHash;
            }
        });

        console.log('✅ Ethereum event listeners set up');
    }

    async setupAlgorandMonitoring() {
        console.log('\n📡 Setting up Algorand monitoring...');
        
        // Start monitoring Algorand transactions for the HTLC app
        this.monitorAlgorandHTLC();
        
        console.log('✅ Algorand monitoring set up');
    }

    async monitorAlgorandHTLC() {
        if (!this.monitoring) return;
        
        try {
            // Get the latest round
            const status = await this.algorandClient.status().do();
            const currentRound = status['last-round'];
            
            // Get transactions for the HTLC app
            const transactions = await this.algorandClient.searchForTransactions()
                .applicationID(this.algorandHTLC.appId)
                .round(currentRound - 10, currentRound) // Check last 10 rounds
                .do();
            
            for (const tx of transactions.transactions) {
                await this.processAlgorandTransaction(tx);
            }
            
        } catch (error) {
            console.log('⚠️  Error monitoring Algorand:', error.message);
        }
        
        // Continue monitoring
        setTimeout(() => this.monitorAlgorandHTLC(), 5000); // Check every 5 seconds
    }

    async processAlgorandTransaction(tx) {
        try {
            if (tx['application-transaction'] && tx['application-transaction']['application-args']) {
                const args = tx['application-transaction']['application-args'];
                
                if (args.length > 0) {
                    const method = Buffer.from(args[0], 'base64').toString();
                    
                    if (method === 'create_htlc') {
                        console.log('\n🏗️  Algorand HTLC Created:');
                        console.log(`   Transaction: ${tx.id}`);
                        console.log(`   Sender: ${tx.sender}`);
                        console.log(`   Round: ${tx['confirmed-round']}`);
                        
                        // Try to match with Ethereum order
                        await this.matchAlgorandHTLC(tx);
                        
                    } else if (method === 'claim_htlc') {
                        console.log('\n💰 Algorand HTLC Claimed:');
                        console.log(`   Transaction: ${tx.id}`);
                        console.log(`   Sender: ${tx.sender}`);
                        console.log(`   Round: ${tx['confirmed-round']}`);
                        
                        // Try to match with Ethereum order
                        await this.matchAlgorandClaim(tx);
                    }
                }
            }
        } catch (error) {
            console.log('⚠️  Error processing Algorand transaction:', error.message);
        }
    }

    async matchAlgorandHTLC(tx) {
        // Try to find matching Ethereum order
        for (const [orderHash, swap] of this.swaps) {
            if (swap.status === 'ORDER_CREATED' && !swap.algorandTx) {
                // This is a potential match - we'd need to verify the hashlock
                console.log(`   Potential match with Ethereum order: ${orderHash}`);
                swap.algorandTx = tx.id;
                swap.status = 'ALGORAND_HTLC_CREATED';
                break;
            }
        }
    }

    async matchAlgorandClaim(tx) {
        // Try to find matching Ethereum order
        for (const [orderHash, swap] of this.swaps) {
            if (swap.status === 'SECRET_REVEALED' && !swap.algorandClaimTx) {
                // This is a potential match
                console.log(`   Potential match with Ethereum order: ${orderHash}`);
                swap.algorandClaimTx = tx.id;
                swap.status = 'COMPLETED';
                break;
            }
        }
    }

    async monitorSwap(orderHash) {
        console.log(`\n📊 Monitoring swap: ${orderHash}`);
        
        // Check swap status periodically
        const checkStatus = async () => {
            if (!this.monitoring) return;
            
            try {
                const swap = this.swaps.get(orderHash);
                if (!swap) return;
                
                // Check if timelock has expired
                const currentTime = Math.floor(Date.now() / 1000);
                if (currentTime > swap.timelock && swap.status !== 'REFUNDED' && swap.status !== 'COMPLETED') {
                    console.log(`\n⏰ Timelock expired for swap: ${orderHash}`);
                    console.log(`   Current time: ${currentTime}`);
                    console.log(`   Timelock: ${swap.timelock}`);
                    console.log(`   Status: ${swap.status}`);
                    
                    // Check if order can be refunded
                    try {
                        const order = await this.resolver.getCrossChainOrder(orderHash);
                        if (!order.executed && !order.refunded) {
                            console.log(`   Order can be refunded`);
                        }
                    } catch (error) {
                        console.log(`   Error checking order status: ${error.message}`);
                    }
                }
                
                // Continue monitoring
                setTimeout(checkStatus, 30000); // Check every 30 seconds
                
            } catch (error) {
                console.log(`⚠️  Error monitoring swap ${orderHash}:`, error.message);
            }
        };
        
        checkStatus();
    }

    async getSwapStatus(orderHash) {
        const swap = this.swaps.get(orderHash);
        if (!swap) {
            console.log(`❌ Swap not found: ${orderHash}`);
            return null;
        }
        
        console.log(`\n📊 Swap Status: ${orderHash}`);
        console.log('================================');
        console.log(`   Status: ${swap.status}`);
        console.log(`   Maker: ${swap.maker}`);
        console.log(`   Amount: ${ethers.formatEther(swap.amount)} ETH`);
        console.log(`   Hashlock: ${swap.hashlock}`);
        console.log(`   Timelock: ${swap.timelock} (${new Date(swap.timelock * 1000).toISOString()})`);
        console.log(`   Recipient: ${swap.recipient}`);
        console.log(`   Algorand Address: ${swap.algorandAddress}`);
        console.log(`   Created: ${swap.createdAt}`);
        
        if (swap.ethereumTx) {
            console.log(`   Ethereum TX: ${swap.ethereumTx}`);
        }
        if (swap.algorandTx) {
            console.log(`   Algorand TX: ${swap.algorandTx}`);
        }
        if (swap.algorandClaimTx) {
            console.log(`   Algorand Claim TX: ${swap.algorandClaimTx}`);
        }
        if (swap.secret) {
            console.log(`   Secret: ${swap.secret}`);
        }
        
        return swap;
    }

    async getAllSwaps() {
        console.log(`\n📋 All Monitored Swaps (${this.swaps.size} total)`);
        console.log('==========================================');
        
        for (const [orderHash, swap] of this.swaps) {
            console.log(`\n   Order: ${orderHash}`);
            console.log(`   Status: ${swap.status}`);
            console.log(`   Amount: ${ethers.formatEther(swap.amount)} ETH`);
            console.log(`   Created: ${swap.createdAt}`);
        }
        
        return Array.from(this.swaps.values());
    }

    async saveSwapData() {
        const fs = require('fs');
        const swapData = {
            timestamp: new Date().toISOString(),
            totalSwaps: this.swaps.size,
            swaps: Array.from(this.swaps.entries())
        };
        
        fs.writeFileSync('CROSS_CHAIN_SWAP_MONITOR_DATA.json', JSON.stringify(swapData, null, 2));
        console.log('\n📄 Swap monitoring data saved to: CROSS_CHAIN_SWAP_MONITOR_DATA.json');
    }
}

async function main() {
    const monitor = new CrossChainMonitor();
    
    try {
        // Initialize the monitor
        await monitor.initialize();
        
        // Start monitoring
        await monitor.startMonitoring();
        
        // Set up periodic data saving
        setInterval(() => {
            monitor.saveSwapData();
        }, 60000); // Save every minute
        
    } catch (error) {
        console.error('❌ Cross-chain monitoring failed:', error);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = CrossChainMonitor;

if (require.main === module) {
    main()
        .then(() => {
            // Keep the process running
            console.log('🔄 Monitoring active...');
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}
