#!/usr/bin/env node

/**
 * 🎯 CREATE ALGO → ETH SWAP INTENT
 * 
 * Creates a 1 ALGO → ETH limit order that will be detected
 * and processed by the multi-resolver relayer system
 */

const { ethers } = require('ethers');
const algosdk = require('algosdk');

class AlgoToETHIntent {
    constructor() {
        console.log('🎯 ALGO → ETH SWAP INTENT CREATOR');
        console.log('================================');
        console.log('✅ Creates 1 ALGO → ETH limit order');
        console.log('✅ Generates proper hashlock/secret');
        console.log('✅ Compatible with multi-resolver system');
        console.log('✅ Uses .env.relayer configuration');
        console.log('================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        // Load environment configurations
        require('dotenv').config({ path: '.env.relayer' });
        require('dotenv').config();
        
        this.config = {
            ethereum: {
                rpcUrl: process.env.ETHEREUM_RPC_URL || process.env.SEPOLIA_RPC_URL || process.env.SEPOLIA_URL || 'https://ethereum-sepolia.publicnode.com',
                limitOrderBridgeAddress: '0x384B0011f6E6aA8C192294F36dCE09a3758Df788',
                chainId: 11155111 // Sepolia
            },
            algorand: {
                rpcUrl: process.env.ALGORAND_RPC_URL || 'https://testnet-api.algonode.cloud',
                chainId: 416002, // Testnet
                port: 443
            }
        };
        
        // Initialize Ethereum
        this.provider = new ethers.JsonRpcProvider(this.config.ethereum.rpcUrl);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY || process.env.USER_PRIVATE_KEY, this.provider);
        
        // Initialize Algorand
        this.algodClient = new algosdk.Algodv2('', this.config.algorand.rpcUrl, this.config.algorand.port);
        
        // Get Algorand mnemonic from various possible environment variables
        const algoMnemonic = process.env.ALGORAND_MNEMONIC || 
                           process.env.ALGO_MNEMONIC || 
                           process.env.USER_ALGO_MNEMONIC ||
                           process.env.RELAYER_ALGO_MNEMONIC;
        
        if (!algoMnemonic) {
            console.log('⚠️  No Algorand mnemonic found in environment');
            console.log('📝 Available variables to set:');
            console.log('   - ALGORAND_MNEMONIC');
            console.log('   - ALGO_MNEMONIC'); 
            console.log('   - USER_ALGO_MNEMONIC');
            console.log('   - RELAYER_ALGO_MNEMONIC');
            
            // Use a default Algorand address for demonstration
            this.algoAccount = {
                addr: 'BJDBVZITI7VRHJLMPY4C6BX5UVBHZVNT6PRD3ZZWO2E2HSDYGSF4KO6RR4'
            };
            console.log(`🔷 Using default Algorand address: ${this.algoAccount.addr}`);
        } else {
            this.algoAccount = algosdk.mnemonicToSecretKey(algoMnemonic.replace(/"/g, ''));
        }
        
        await this.loadContracts();
        
        console.log('🎯 INTENT CREATOR CONFIGURATION:');
        console.log('===============================');
        console.log(`🌐 Ethereum RPC: ${this.config.ethereum.rpcUrl}`);
        console.log(`🏦 LOP Contract: ${this.config.ethereum.limitOrderBridgeAddress}`);
        console.log(`💰 User ETH: ${this.wallet.address}`);
        console.log(`🔷 Algorand RPC: ${this.config.algorand.rpcUrl}`);
        console.log(`💎 User ALGO: ${this.algoAccount.addr}\n`);
    }
    
    async loadContracts() {
        const lopBridgeABI = [
            'function createLimitOrder(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes32 hashlock, uint256 timelock) external payable returns (bytes32 orderId)',
            'function limitOrders(bytes32 orderId) external view returns (tuple(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes32 hashlock, uint256 timelock, uint256 depositedAmount, uint256 remainingAmount, bool filled, bool cancelled, uint256 createdAt, address resolver, uint256 partialFills, tuple(address resolver, uint256 inputAmount, uint256 outputAmount, uint256 timestamp, bool active, uint256 gasEstimate, uint256 totalCost) winningBid))',
            'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock, bool allowPartialFills)',
            'function getOrderId(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes32 hashlock, uint256 timelock) external view returns (bytes32)'
        ];
        
        this.lopBridge = new ethers.Contract(
            this.config.ethereum.limitOrderBridgeAddress,
            lopBridgeABI,
            this.wallet
        );
        
        console.log('✅ Contracts loaded for intent creation');
    }
    
    async createAlgoToETHIntent() {
        console.log('🚀 CREATING 1 ALGO → ETH SWAP INTENT');
        console.log('===================================\n');
        
        try {
            // Step 1: Generate secret and hashlock for atomic swap
            console.log('🔐 Step 1: Generating atomic swap secret...');
            const secret = ethers.randomBytes(32);
            const hashlock = ethers.keccak256(secret);
            
            console.log(`🔑 Secret: ${ethers.hexlify(secret)}`);
            console.log(`🔒 Hashlock: ${hashlock}`);
            
            // Step 2: Define swap parameters
            console.log('\n📊 Step 2: Defining swap parameters...');
            
            const swapParams = {
                // 1 ALGO → 0.001 ETH (example rate)
                algoAmount: 1000000, // 1 ALGO (microAlgos)
                ethAmount: ethers.parseEther('0.001'), // 0.001 ETH
                deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
                timelock: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
                salt: ethers.randomBytes(32)
            };
            
            console.log(`💎 ALGO Amount: ${swapParams.algoAmount / 1000000} ALGO`);
            console.log(`💰 ETH Amount: ${ethers.formatEther(swapParams.ethAmount)} ETH`);
            console.log(`⏰ Deadline: ${new Date(swapParams.deadline * 1000).toISOString()}`);
            console.log(`🔒 Timelock: ${new Date(swapParams.timelock * 1000).toISOString()}`);
            
            // Step 3: Create limit order intent
            console.log('\n🎯 Step 3: Creating limit order intent...');
            
            const intent = {
                maker: this.wallet.address,
                makerToken: ethers.ZeroAddress, // ETH
                takerToken: '0x0000000000000000000000000000000000000000', // ALGO (represented as zero address)
                makerAmount: swapParams.ethAmount, // ETH we want to receive
                takerAmount: ethers.parseUnits(swapParams.algoAmount.toString(), 0), // ALGO we're offering (converted to wei units)
                deadline: swapParams.deadline,
                algorandChainId: this.config.algorand.chainId,
                algorandAddress: this.algoAccount.addr,
                salt: swapParams.salt,
                allowPartialFills: true,
                minPartialFill: ethers.parseEther('0.0001') // Minimum 0.0001 ETH
            };
            
            console.log('📋 Intent Parameters:');
            console.log(`   Maker: ${intent.maker}`);
            console.log(`   Maker Token: ${intent.makerToken} (ETH)`);
            console.log(`   Taker Token: ${intent.takerToken} (ALGO)`);
            console.log(`   Maker Amount: ${ethers.formatEther(intent.makerAmount)} ETH`);
            console.log(`   Taker Amount: ${intent.takerAmount.toString()} microALGO`);
            console.log(`   Algorand Address: ${intent.algorandAddress}`);
            console.log(`   Partial Fills: ${intent.allowPartialFills}`);
            
            // Step 4: Check balances
            console.log('\n💰 Step 4: Checking balances...');
            
            const ethBalance = await this.provider.getBalance(this.wallet.address);
            console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
            
            // Only check ALGO balance if we have a real account with mnemonic
            if (this.algoAccount && this.algoAccount.sk) {
                try {
                    const algoBalance = await this.algodClient.accountInformation(this.algoAccount.addr).do();
                    console.log(`ALGO Balance: ${algoBalance.amount / 1000000} ALGO`);
                    
                    if (algoBalance.amount < swapParams.algoAmount) {
                        console.log(`⚠️  Warning: Insufficient ALGO balance. Need ${swapParams.algoAmount / 1000000} ALGO, have ${algoBalance.amount / 1000000} ALGO`);
                        console.log('💡 This is a demonstration - continuing with intent creation...');
                    }
                } catch (error) {
                    console.log(`⚠️  Could not check ALGO balance: ${error.message}`);
                }
            } else {
                console.log(`ALGO Address: ${this.algoAccount.addr} (demo mode)`);
            }
            
            // Step 5: Predict order ID
            console.log('\n🆔 Step 5: Predicting order ID...');
            const predictedOrderId = await this.lopBridge.getOrderId(intent, hashlock, swapParams.timelock);
            console.log(`Predicted Order ID: ${predictedOrderId}`);
            
            // Step 6: Create the limit order on Ethereum
            console.log('\n🚀 Step 6: Creating limit order on Ethereum...');
            
            const createTx = await this.lopBridge.createLimitOrder(
                intent,
                hashlock,
                swapParams.timelock,
                {
                    gasLimit: 500000,
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                }
            );
            
            console.log(`🔗 Transaction: ${createTx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${createTx.hash}`);
            console.log('⏳ Waiting for confirmation...');
            
            const receipt = await createTx.wait();
            console.log(`✅ Limit order created in block ${receipt.blockNumber}`);
            
            // Step 7: Extract order ID from events
            console.log('\n📋 Step 7: Extracting order details...');
            
            const orderCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.lopBridge.interface.parseLog(log);
                    return parsed.name === 'LimitOrderCreated';
                } catch {
                    return false;
                }
            });
            
            if (orderCreatedEvent) {
                const parsedEvent = this.lopBridge.interface.parseLog(orderCreatedEvent);
                const actualOrderId = parsedEvent.args.orderId;
                
                console.log(`🆔 Actual Order ID: ${actualOrderId}`);
                console.log(`✅ Order ID matches prediction: ${actualOrderId === predictedOrderId}`);
                
                // Step 8: Verify order creation
                console.log('\n🔍 Step 8: Verifying order creation...');
                const orderDetails = await this.lopBridge.limitOrders(actualOrderId);
                
                console.log('📊 Order Verification:');
                console.log(`   Created At: ${new Date(Number(orderDetails.createdAt) * 1000).toISOString()}`);
                console.log(`   Deposited Amount: ${ethers.formatEther(orderDetails.depositedAmount)} ETH`);
                console.log(`   Remaining Amount: ${ethers.formatEther(orderDetails.remainingAmount)} ETH`);
                console.log(`   Filled: ${orderDetails.filled}`);
                console.log(`   Cancelled: ${orderDetails.cancelled}`);
                
                // Step 9: Save intent details for relayer
                console.log('\n💾 Step 9: Saving intent details...');
                const intentDetails = {
                    orderId: actualOrderId,
                    secret: ethers.hexlify(secret),
                    hashlock: hashlock,
                    intent: intent,
                    timelock: swapParams.timelock,
                    createdAt: new Date().toISOString(),
                    transactionHash: createTx.hash,
                    blockNumber: receipt.blockNumber,
                    algoAccount: this.algoAccount.addr,
                    ethAccount: this.wallet.address
                };
                
                // Save to JSON file for reference
                const fs = require('fs');
                fs.writeFileSync('algo-to-eth-intent.json', JSON.stringify(intentDetails, null, 2));
                console.log('💾 Intent details saved to: algo-to-eth-intent.json');
                
                console.log('\n🎉 SUCCESS: ALGO → ETH INTENT CREATED');
                console.log('====================================');
                console.log(`🆔 Order ID: ${actualOrderId}`);
                console.log(`🔑 Secret: ${ethers.hexlify(secret)}`);
                console.log(`🔒 Hashlock: ${hashlock}`);
                console.log(`💎 Offering: ${swapParams.algoAmount / 1000000} ALGO`);
                console.log(`💰 Requesting: ${ethers.formatEther(intent.makerAmount)} ETH`);
                console.log(`⏰ Valid until: ${new Date(intent.deadline * 1000).toISOString()}`);
                console.log('\n🤖 Multi-resolver relayer should detect this order and start bidding!');
                console.log('🔍 Monitor the relayer output to see competitive bidding in action.');
                
                return {
                    orderId: actualOrderId,
                    secret: ethers.hexlify(secret),
                    hashlock: hashlock,
                    transactionHash: createTx.hash
                };
                
            } else {
                throw new Error('LimitOrderCreated event not found in transaction receipt');
            }
            
        } catch (error) {
            console.error('❌ Intent creation failed:', error.message);
            
            if (error.message.includes('insufficient funds')) {
                console.log('\n💡 SOLUTION: Add more ETH to your account for gas fees');
                console.log(`   Your address: ${this.wallet.address}`);
            } else if (error.message.includes('execution reverted')) {
                console.log('\n💡 POSSIBLE CAUSES:');
                console.log('   - Invalid parameters');
                console.log('   - Contract access restrictions');
                console.log('   - Insufficient balance for deposits');
            }
            
            throw error;
        }
    }
}

// Execute intent creation
async function main() {
    const intentCreator = new AlgoToETHIntent();
    await intentCreator.createAlgoToETHIntent();
}

main().catch(console.error);