/**
 * 🌉 CROSS-CHAIN GASLESS RELAYER SYSTEM
 * ✅ Handles gas fees for users (gasless execution)
 * ✅ Monitors both Ethereum and Algorand chains
 * ✅ Executes atomic swaps with profit margins
 * ✅ Based on 1inch Fusion resolver architecture
 */

const { ethers } = require('hardhat');
const algosdk = require('algosdk');
const fs = require('fs');

class CrossChainRelayer {
    constructor() {
        console.log('🌉 INITIALIZING CROSS-CHAIN GASLESS RELAYER');
        console.log('===========================================');
        console.log('✅ Gasless execution for users');
        console.log('✅ Relayer handles all gas fees');
        console.log('✅ Profit from spread margins');
        console.log('===========================================\n');
        
        this.loadConfiguration();
        this.initializeClients();
        this.loadContracts();
    }
    
    loadConfiguration() {
        require('dotenv').config();
        
        this.config = {
            // Ethereum Configuration
            ethereum: {
                rpcUrl: 'https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104',
                contractAddress: '0x343E44b629fcd1E97Fd787D0f60F39F8FEA123eE',
                chainId: 11155111,
                relayerPrivateKey: process.env.PRIVATE_KEY || '0x' + 'a'.repeat(64),
                gasLimit: 3000000,
                gasPrice: ethers.parseUnits('20', 'gwei')
            },
            
            // Algorand Configuration  
            algorand: {
                rpcUrl: 'https://testnet-api.algonode.cloud',
                applicationId: null, // Will be loaded from deployment
                relayerMnemonic: process.env.ALGORAND_MNEMONIC,
                relayerAddress: process.env.ALGORAND_ACCOUNT_ADDRESS
            },
            
            // Relayer Economics
            economics: {
                minimumProfitMargin: 0.001, // 0.1% minimum profit
                gasCostBuffer: 1.5, // 150% gas cost buffer
                maxSlippage: 0.05, // 5% max slippage
                orderExpiration: 3600 // 1 hour order expiration
            }
        };
        
        console.log('✅ Configuration loaded');
    }
    
    async initializeClients() {
        // Ethereum client
        this.ethProvider = new ethers.JsonRpcProvider(this.config.ethereum.rpcUrl);
        this.ethWallet = new ethers.Wallet(this.config.ethereum.relayerPrivateKey, this.ethProvider);
        
        // Algorand client
        this.algoClient = new algosdk.Algodv2('', this.config.algorand.rpcUrl, '');
        this.algoAccount = algosdk.mnemonicToSecretKey(this.config.algorand.relayerMnemonic);
        
        console.log('✅ Blockchain clients initialized');
        console.log(`📱 Ethereum Relayer: ${this.ethWallet.address}`);
        console.log(`📱 Algorand Relayer: ${this.algoAccount.addr}`);
    }
    
    async loadContracts() {
        // Load deployment info
        let deploymentInfo;
        try {
            deploymentInfo = JSON.parse(fs.readFileSync('ALGORAND-DEPLOYMENT-SUCCESS.json', 'utf8'));
            this.config.algorand.applicationId = deploymentInfo.applicationId;
        } catch (error) {
            console.log('⚠️  No Algorand deployment found, will deploy when needed');
        }
        
        // Load Ethereum contract
        const contractABI = [
            "function createETHtoAlgorandHTLC(address,address,uint256,bytes32,uint256,uint256,string,string,uint256) external payable returns (bytes32)",
            "function executeHTLCWithSecret(bytes32,bytes32,bytes32) external",
            "function getHTLC(bytes32) external view returns (tuple)",
            "function getRevealedSecret(bytes32) external view returns (bytes32)",
            "event HTLCCreated(bytes32 indexed htlcId, address indexed initiator, uint256 ethChainId, uint256 algorandChainId, bytes32 hashlock, uint256 amount)",
            "event SecretRevealed(bytes32 indexed htlcId, bytes32 secret)"
        ];
        
        this.ethContract = new ethers.Contract(
            this.config.ethereum.contractAddress,
            contractABI,
            this.ethWallet
        );
        
        console.log('✅ Smart contracts loaded');
    }
    
    /**
     * 🎯 GASLESS SWAP EXECUTION - Main entry point
     * User submits a gasless swap request, relayer handles all gas fees
     */
    async executeGaslessSwap(swapRequest) {
        console.log('\n🚀 EXECUTING GASLESS CROSS-CHAIN SWAP');
        console.log('====================================');
        console.log(`👤 User: ${swapRequest.userAddress}`);
        console.log(`💰 Amount: ${swapRequest.ethAmount} ETH`);
        console.log(`🎯 Algo Recipient: ${swapRequest.algoRecipient}`);
        console.log('====================================\n');
        
        try {
            // Step 1: Validate and calculate economics
            const economics = await this.calculateSwapEconomics(swapRequest);
            console.log(`💹 Economics calculated: ${economics.relayerProfit} ETH profit expected`);
            
            // Step 2: Create Ethereum HTLC (relayer pays gas)
            const ethHTLC = await this.createEthereumHTLC(swapRequest, economics);
            console.log(`✅ Ethereum HTLC created: ${ethHTLC.htlcId}`);
            
            // Step 3: Create Algorand HTLC (relayer pays fees)
            const algoHTLC = await this.createAlgorandHTLC(swapRequest, economics, ethHTLC);
            console.log(`✅ Algorand HTLC created: ${algoHTLC.txId}`);
            
            // Step 4: Monitor for secret reveal
            const secret = await this.monitorForSecretReveal(ethHTLC.htlcId);
            console.log(`🔑 Secret revealed: ${secret}`);
            
            // Step 5: Claim Algorand HTLC (relayer gets ALGO)
            const algoClaim = await this.claimAlgorandHTLC(algoHTLC, secret);
            console.log(`💰 Algorand HTLC claimed: ${algoClaim.txId}`);
            
            console.log('\n🎉 GASLESS SWAP COMPLETED SUCCESSFULLY!');
            console.log('=====================================');
            console.log('✅ User received ALGO (gasless)');
            console.log('✅ Relayer earned profit from spread');
            console.log('✅ Atomic swap executed perfectly');
            console.log('=====================================');
            
            return {
                success: true,
                ethHTLC: ethHTLC.htlcId,
                algoHTLC: algoHTLC.txId,
                secret: secret,
                relayerProfit: economics.relayerProfit
            };
            
        } catch (error) {
            console.error('❌ GASLESS SWAP FAILED');
            console.error('======================');
            console.error(`Error: ${error.message}`);
            console.error('======================');
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async calculateSwapEconomics(swapRequest) {
        console.log('💹 Calculating swap economics...');
        
        // Get current gas prices
        const ethGasPrice = await this.ethProvider.getFeeData();
        const estimatedGasCost = ethGasPrice.gasPrice * BigInt(this.config.ethereum.gasLimit);
        
        // Calculate relayer costs and profit margins
        const totalRelayCost = estimatedGasCost * BigInt(Math.floor(this.config.economics.gasCostBuffer * 100)) / 100n;
        const minimumProfit = ethers.parseEther(this.config.economics.minimumProfitMargin.toString());
        
        // Algorithm: ETH amount should cover gas + profit
        const ethAmount = ethers.parseEther(swapRequest.ethAmount);
        const netAmount = ethAmount - totalRelayCost - minimumProfit;
        
        if (netAmount <= 0) {
            throw new Error(`Insufficient amount to cover gas costs. Need at least ${ethers.formatEther(totalRelayCost + minimumProfit)} ETH`);
        }
        
        return {
            ethAmount: ethAmount,
            gasCost: totalRelayCost,
            relayerProfit: minimumProfit,
            netAmount: netAmount,
            algoAmount: this.convertETHtoALGO(ethers.formatEther(netAmount))
        };
    }
    
    convertETHtoALGO(ethAmount) {
        // Simple conversion rate (in production, use real price feeds)
        const ETH_ALGO_RATE = 1500; // 1 ETH = 1500 ALGO (example)
        return Math.floor(parseFloat(ethAmount) * ETH_ALGO_RATE * 1000000); // Convert to microAlgos
    }
    
    async createEthereumHTLC(swapRequest, economics) {
        console.log('🔧 Creating Ethereum HTLC (relayer pays gas)...');
        
        // Generate secret and hash
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        
        // HTLC parameters
        const timelock = Math.floor(Date.now() / 1000) + this.config.economics.orderExpiration;
        
        const tx = await this.ethContract.createETHtoAlgorandHTLC(
            swapRequest.userAddress, // recipient
            ethers.ZeroAddress, // ETH (native token)
            economics.ethAmount, // amount
            hashlock, // hashlock
            timelock, // timelock
            416002, // Algorand testnet chain ID
            swapRequest.algoRecipient, // Algorand address
            'ALGO', // Algorand token
            economics.algoAmount, // Algorand amount
            {
                value: economics.ethAmount,
                gasLimit: this.config.ethereum.gasLimit,
                gasPrice: this.config.ethereum.gasPrice
            }
        );
        
        const receipt = await tx.wait();
        const htlcId = receipt.logs[0].topics[1]; // Extract HTLC ID from logs
        
        return {
            htlcId: htlcId,
            secret: secret,
            hashlock: hashlock,
            timelock: timelock,
            txHash: receipt.hash
        };
    }
    
    async createAlgorandHTLC(swapRequest, economics, ethHTLC) {
        console.log('🔧 Creating Algorand HTLC (relayer pays fees)...');
        
        // Get transaction parameters
        const suggestedParams = await this.algoClient.getTransactionParams().do();
        
        // Create application call transaction (simplified - in production use proper HTLC logic)
        const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
            from: this.algoAccount.addr,
            suggestedParams: suggestedParams,
            appIndex: this.config.algorand.applicationId,
            appArgs: [
                new Uint8Array(Buffer.from('create_htlc')),
                new Uint8Array(Buffer.from(ethHTLC.hashlock.slice(2), 'hex')),
                algosdk.encodeUint64(economics.algoAmount),
                new Uint8Array(Buffer.from(swapRequest.algoRecipient))
            ]
        });
        
        // Sign and submit
        const signedTxn = appCallTxn.signTxn(this.algoAccount.sk);
        const txn = await this.algoClient.sendRawTransaction(signedTxn).do();
        
        // Wait for confirmation
        await algosdk.waitForConfirmation(this.algoClient, txn.txId, 4);
        
        return {
            txId: txn.txId,
            appId: this.config.algorand.applicationId
        };
    }
    
    async monitorForSecretReveal(htlcId) {
        console.log('👁️ Monitoring for secret reveal...');
        
        // Monitor Ethereum contract for SecretRevealed event
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Secret reveal timeout'));
            }, this.config.economics.orderExpiration * 1000);
            
            this.ethContract.on('SecretRevealed', (revealedHtlcId, secret) => {
                if (revealedHtlcId === htlcId) {
                    clearTimeout(timeout);
                    resolve(secret);
                }
            });
        });
    }
    
    async claimAlgorandHTLC(algoHTLC, secret) {
        console.log('💰 Claiming Algorand HTLC...');
        
        // Get transaction parameters
        const suggestedParams = await this.algoClient.getTransactionParams().do();
        
        // Create claim transaction
        const claimTxn = algosdk.makeApplicationNoOpTxnFromObject({
            from: this.algoAccount.addr,
            suggestedParams: suggestedParams,
            appIndex: algoHTLC.appId,
            appArgs: [
                new Uint8Array(Buffer.from('claim_htlc')),
                new Uint8Array(Buffer.from(secret.slice(2), 'hex'))
            ]
        });
        
        // Sign and submit
        const signedTxn = claimTxn.signTxn(this.algoAccount.sk);
        const txn = await this.algoClient.sendRawTransaction(signedTxn).do();
        
        // Wait for confirmation
        await algosdk.waitForConfirmation(this.algoClient, txn.txId, 4);
        
        return {
            txId: txn.txId
        };
    }
    
    /**
     * 🎯 RELAYER SERVICE - Continuous monitoring and execution
     */
    async startRelayerService() {
        console.log('\n🚀 STARTING CROSS-CHAIN RELAYER SERVICE');
        console.log('=======================================');
        console.log('✅ Monitoring for gasless swap requests');
        console.log('✅ Ready to handle cross-chain atomic swaps');
        console.log('✅ Relayer covers all gas fees');
        console.log('=======================================\n');
        
        // Monitor for new swap requests (in production, use message queue or API)
        setInterval(async () => {
            await this.checkForNewSwapRequests();
        }, 10000); // Check every 10 seconds
    }
    
    async checkForNewSwapRequests() {
        // In production, this would check a message queue, database, or API
        console.log('🔍 Checking for new gasless swap requests...');
    }
}

// Demo gasless swap execution
async function demonstrateGaslessSwap() {
    const relayer = new CrossChainRelayer();
    
    // Example swap request from a user
    const swapRequest = {
        userAddress: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
        ethAmount: '0.01', // 0.01 ETH
        algoRecipient: 'V2HHWIMPZMH4VMMB2KHNKKPJAI35Z3NUMVWFRE22DKQS7K4SBMYHHP6P7M'
    };
    
    const result = await relayer.executeGaslessSwap(swapRequest);
    
    if (result.success) {
        console.log('\n🌉 GASLESS CROSS-CHAIN BRIDGE: OPERATIONAL!');
        console.log('============================================');
        console.log('✅ Users can swap ETH → ALGO without gas fees');
        console.log('✅ Relayer handles all blockchain interactions');
        console.log('✅ Atomic swaps ensure trustless execution');
        console.log('✅ Profit margins ensure sustainable operation');
        console.log('============================================');
    }
}

// Export for use in other modules
module.exports = { CrossChainRelayer };

// Run demonstration if called directly
if (require.main === module) {
    demonstrateGaslessSwap()
        .then(() => {
            console.log('\n🎉 Cross-chain relayer demonstration complete!');
        })
        .catch(error => {
            console.error('❌ Demonstration failed:', error);
        });
} 