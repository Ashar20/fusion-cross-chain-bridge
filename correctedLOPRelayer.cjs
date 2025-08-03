#!/usr/bin/env node

/**
 * 🛰️ CORRECTED 1INCH LOP RELAYER
 * 
 * Based on actual working transaction:
 * https://sepolia.etherscan.io/tx/0xdd977251b02efc8d2478c2fcdf16f7b4cb22a009e25f393bf03310b543fa8768
 * 
 * Function: fillOrder(bytes order, bytes signature, bytes interaction, uint256 makingAmount, uint256 takingAmount, uint256 skipPermitAndThresholdAmount, address target)
 */

const { ethers } = require('ethers');
const fs = require('fs');

// Load environment configurations
require('dotenv').config({ path: '.env.relayer' });
require('dotenv').config({ path: '.env.resolvers.new' });

class CorrectedLOPRelayer {
    constructor() {
        console.log('🛰️ CORRECTED 1INCH LOP RELAYER');
        console.log('================================');
        console.log('✅ Based on actual working transaction');
        console.log('✅ Correct fillOrder function signature');
        console.log('✅ Dutch auction and partial fills');
        console.log('✅ Real-time order monitoring');
        console.log('✅ Profitability analysis');
        console.log('================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        // Load configurations
        this.loadConfigurations();
        
        // Initialize providers and wallets
        this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        this.relayerWallet = new ethers.Wallet(process.env.RELAYER_ETH_PRIVATE_KEY, this.provider);
        
        // Initialize contracts with correct ABI
        this.initializeContracts();
        
        // Initialize state
        this.state = {
            activeOrders: new Map(),
            executedOrders: [],
            totalProfit: ethers.parseEther('0'),
            totalGasUsed: 0,
            lastOrderCheck: 0
        };
        
        console.log('✅ Corrected LOP Relayer initialized');
        console.log(`📱 Relayer Address: ${this.relayerWallet.address}`);
        console.log(`🏦 LOP Contract: ${this.config.lopAddress}`);
        console.log(`💰 Min Profit Margin: ${this.config.profitability.minProfitMargin}%`);
        console.log(`⛽ Gas Estimate: ${this.config.profitability.gasEstimate}`);
    }
    
    loadConfigurations() {
        // Load from .env.relayer
        this.config = {
            lopAddress: '0x68b68381b76e705A7Ef8209800D0886e21b654FE',
            relayerAddress: process.env.RELAYER_ETH_ADDRESS,
            relayerPrivateKey: process.env.RELAYER_ETH_PRIVATE_KEY,
            
            // Dutch auction settings
            dutchAuction: {
                enabled: true,
                priceDecayRate: 0.001, // 0.1% per block
                minPriceRatio: 0.95, // 95% of original price
                maxWaitBlocks: 100
            },
            
            // Partial fill settings
            partialFill: {
                enabled: true,
                minFillRatio: 0.1, // 10% minimum fill
                maxFillRatio: 1.0, // 100% maximum fill
                preferredFillRatio: 0.5 // 50% preferred fill
            },
            
            // Profitability settings
            profitability: {
                minProfitMargin: 2.0, // 2% minimum profit
                gasEstimate: 300000,
                gasPriceBuffer: 1.1, // 10% gas price buffer
                slippageTolerance: 0.5 // 0.5% slippage tolerance
            },
            
            // Monitoring settings
            monitoring: {
                checkInterval: 5000, // 5 seconds
                orderFile: 'SIGNED_LOP_ORDER.json',
                stateFile: 'relayer-state.json'
            }
        };
        
        console.log('✅ Configurations loaded from .env.relayer');
    }
    
    initializeContracts() {
        // Correct LOP Contract ABI based on actual working transaction
        const lopABI = [
            'function fillOrder(bytes order, bytes signature, bytes interaction, uint256 makingAmount, uint256 takingAmount, uint256 skipPermitAndThresholdAmount, address target) external payable returns (uint256 makingAmount, uint256 takingAmount)',
            'function cancelOrder(bytes order) external',
            'event OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makerAmount, uint256 takerAmount)',
            'event OrderCancelled(bytes32 indexed orderHash, address indexed maker)'
        ];
        
        // ERC20 ABI for token approvals
        const erc20ABI = [
            'function approve(address spender, uint256 amount) external returns (bool)',
            'function allowance(address owner, address spender) external view returns (uint256)',
            'function balanceOf(address account) external view returns (uint256)',
            'function decimals() external view returns (uint8)'
        ];
        
        this.lopContract = new ethers.Contract(this.config.lopAddress, lopABI, this.relayerWallet);
        this.erc20Contracts = new Map();
        
        console.log('✅ Smart contracts initialized with correct ABI');
    }
    
    async loadSignedOrder() {
        console.log('📋 LOADING SIGNED ORDER');
        console.log('========================');
        
        try {
            if (!fs.existsSync(this.config.monitoring.orderFile)) {
                console.log(`❌ Order file not found: ${this.config.monitoring.orderFile}`);
                return null;
            }
            
            const orderData = JSON.parse(fs.readFileSync(this.config.monitoring.orderFile, 'utf8'));
            console.log('✅ Signed order loaded from file');
            console.log(`   Maker: ${orderData.maker}`);
            console.log(`   Maker Asset: ${orderData.makerAsset}`);
            console.log(`   Taker Asset: ${orderData.takerAsset}`);
            console.log(`   Maker Amount: ${ethers.formatEther(orderData.makerAmount)} ETH`);
            console.log(`   Taker Amount: ${ethers.formatUnits(orderData.takerAmount, 6)} USDC`);
            console.log(`   Deadline: ${new Date(parseInt(orderData.deadline) * 1000).toISOString()}`);
            
            return orderData;
            
        } catch (error) {
            console.log(`❌ Error loading signed order: ${error.message}`);
            return null;
        }
    }
    
    encodeOrderToBytes(order) {
        console.log('🔧 ENCODING ORDER TO BYTES');
        console.log('==========================');
        
        try {
            // Encode the order struct to bytes
            const orderStruct = {
                maker: order.maker,
                makerAsset: order.makerAsset,
                takerAsset: order.takerAsset,
                makerAmount: order.makerAmount,
                takerAmount: order.takerAmount,
                salt: order.salt,
                deadline: order.deadline
            };
            
            // Encode using ABI coder
            const encodedOrder = ethers.AbiCoder.defaultAbiCoder().encode(
                ['tuple(address,address,address,uint256,uint256,uint256,uint256)'],
                [[
                    orderStruct.maker,
                    orderStruct.makerAsset,
                    orderStruct.takerAsset,
                    orderStruct.makerAmount,
                    orderStruct.takerAmount,
                    orderStruct.salt,
                    orderStruct.deadline
                ]]
            );
            
            console.log('✅ Order encoded to bytes');
            console.log(`   Encoded length: ${encodedOrder.length} bytes`);
            
            return encodedOrder;
            
        } catch (error) {
            console.log(`❌ Error encoding order: ${error.message}`);
            throw error;
        }
    }
    
    async analyzeDutchAuctionPricing(order, currentBlock) {
        console.log('📊 ANALYZING DUTCH AUCTION PRICING');
        console.log('==================================');
        
        const orderBlock = parseInt(order.deadline) - this.config.dutchAuction.maxWaitBlocks;
        const blocksElapsed = currentBlock - orderBlock;
        
        if (blocksElapsed <= 0) {
            console.log('✅ Order is still at original price');
            
            // Calculate profitability even for original price
            const gasCost = await this.estimateGasCost();
            const orderValue = ethers.parseUnits(order.takerAmount, 6); // USDC value
            const profit = orderValue - gasCost;
            const profitMargin = (Number(profit) / Number(orderValue)) * 100;
            
            console.log(`   Gas cost: ${ethers.formatEther(gasCost)} ETH`);
            console.log(`   Order value: ${ethers.formatUnits(orderValue, 6)} USDC`);
            console.log(`   Profit: ${ethers.formatEther(profit)} ETH`);
            console.log(`   Profit margin: ${profitMargin.toFixed(2)}%`);
            
            const profitable = profitMargin >= this.config.profitability.minProfitMargin;
            
            return {
                profitable,
                priceRatio: 1.0,
                profitMargin,
                recommendedFillRatio: this.config.partialFill.preferredFillRatio
            };
        }
        
        // Calculate price decay
        const priceDecay = blocksElapsed * this.config.dutchAuction.priceDecayRate;
        const currentPriceRatio = Math.max(1.0 - priceDecay, this.config.dutchAuction.minPriceRatio);
        
        console.log(`   Blocks elapsed: ${blocksElapsed}`);
        console.log(`   Price decay: ${(priceDecay * 100).toFixed(2)}%`);
        console.log(`   Current price ratio: ${(currentPriceRatio * 100).toFixed(2)}%`);
        
        // Determine profitability
        const gasCost = await this.estimateGasCost();
        const orderValue = ethers.parseUnits(order.takerAmount, 6); // USDC value
        const currentValue = orderValue * BigInt(Math.floor(currentPriceRatio * 1000)) / 1000n;
        const profit = currentValue - gasCost;
        const profitMargin = (Number(profit) / Number(orderValue)) * 100;
        
        console.log(`   Gas cost: ${ethers.formatEther(gasCost)} ETH`);
        console.log(`   Order value: ${ethers.formatUnits(orderValue, 6)} USDC`);
        console.log(`   Current value: ${ethers.formatUnits(currentValue, 6)} USDC`);
        console.log(`   Profit: ${ethers.formatEther(profit)} ETH`);
        console.log(`   Profit margin: ${profitMargin.toFixed(2)}%`);
        
        const profitable = profitMargin >= this.config.profitability.minProfitMargin;
        
        // Determine fill ratio based on profitability
        let recommendedFillRatio = this.config.partialFill.minFillRatio;
        if (profitable) {
            if (profitMargin > 5.0) {
                recommendedFillRatio = this.config.partialFill.maxFillRatio; // Full fill for high profit
            } else if (profitMargin > 3.0) {
                recommendedFillRatio = this.config.partialFill.preferredFillRatio; // Preferred fill
            } else {
                recommendedFillRatio = this.config.partialFill.minFillRatio; // Minimum fill
            }
        }
        
        return {
            profitable,
            priceRatio: currentPriceRatio,
            profitMargin,
            recommendedFillRatio
        };
    }
    
    async estimateGasCost() {
        const gasPrice = await this.provider.getFeeData();
        const estimatedGas = this.config.profitability.gasEstimate;
        const gasCost = gasPrice.gasPrice * BigInt(estimatedGas);
        return gasCost;
    }
    
    async checkTokenApproval(tokenAddress, amount) {
        console.log('🔐 CHECKING TOKEN APPROVAL');
        console.log('==========================');
        
        try {
            if (!this.erc20Contracts.has(tokenAddress)) {
                const erc20ABI = [
                    'function approve(address spender, uint256 amount) external returns (bool)',
                    'function allowance(address owner, address spender) external view returns (uint256)'
                ];
                this.erc20Contracts.set(tokenAddress, new ethers.Contract(tokenAddress, erc20ABI, this.relayerWallet));
            }
            
            const tokenContract = this.erc20Contracts.get(tokenAddress);
            const allowance = await tokenContract.allowance(this.relayerWallet.address, this.config.lopAddress);
            
            console.log(`   Token: ${tokenAddress}`);
            console.log(`   Required amount: ${ethers.formatUnits(amount, 6)} USDC`);
            console.log(`   Current allowance: ${ethers.formatUnits(allowance, 6)} USDC`);
            
            if (allowance >= amount) {
                console.log('✅ Sufficient allowance');
                return true;
            } else {
                console.log('⚠️ Insufficient allowance - approving...');
                const approveTx = await tokenContract.approve(this.config.lopAddress, amount, {
                    gasLimit: 100000
                });
                await approveTx.wait();
                console.log('✅ Token approval completed');
                return true;
            }
            
        } catch (error) {
            console.log(`❌ Error checking token approval: ${error.message}`);
            return false;
        }
    }
    
    async executePartialFill(order, fillRatio) {
        console.log('🚀 EXECUTING PARTIAL FILL');
        console.log('=========================');
        
        try {
            // Calculate fill amounts
            const takerAmount = BigInt(order.takerAmount);
            const fillAmount = takerAmount * BigInt(Math.floor(fillRatio * 1000)) / 1000n;
            
            console.log(`   Original taker amount: ${ethers.formatUnits(takerAmount, 6)} USDC`);
            console.log(`   Fill ratio: ${(fillRatio * 100).toFixed(1)}%`);
            console.log(`   Fill amount: ${ethers.formatUnits(fillAmount, 6)} USDC`);
            
            // Check token approval
            const approvalOk = await this.checkTokenApproval(order.takerAsset, fillAmount);
            if (!approvalOk) {
                throw new Error('Token approval failed');
            }
            
            // Encode order to bytes
            const orderBytes = this.encodeOrderToBytes(order);
            
            // Prepare fillOrder parameters based on actual working transaction
            const signature = order.signature;
            const interaction = '0x'; // Empty interaction
            const makingAmount = order.makerAmount; // Full maker amount
            const takingAmount = fillAmount; // Partial taker amount
            const skipPermitAndThresholdAmount = '0x0000000000000000000000000000000000000000000000000000000000000000';
            const target = ethers.ZeroAddress; // No target
            
            console.log('📋 FILL ORDER PARAMETERS:');
            console.log(`   Order bytes length: ${orderBytes.length}`);
            console.log(`   Signature: ${signature.substring(0, 66)}...`);
            console.log(`   Interaction: ${interaction}`);
            console.log(`   Making amount: ${ethers.formatEther(makingAmount)} ETH`);
            console.log(`   Taking amount: ${ethers.formatUnits(takingAmount, 6)} USDC`);
            console.log(`   Target: ${target}`);
            
            // Execute fillOrder with correct signature
            const fillTx = await this.lopContract.fillOrder(
                orderBytes,
                signature,
                interaction,
                makingAmount,
                takingAmount,
                skipPermitAndThresholdAmount,
                target,
                {
                    gasLimit: this.config.profitability.gasEstimate,
                    value: order.makerAsset === ethers.ZeroAddress ? order.makerAmount : 0
                }
            );
            
            console.log(`✅ Fill transaction sent: ${fillTx.hash}`);
            console.log('⏳ Waiting for confirmation...');
            
            const receipt = await fillTx.wait();
            console.log(`✅ Fill transaction confirmed in block ${receipt.blockNumber}`);
            console.log(`💰 Gas used: ${receipt.gasUsed.toString()}`);
            
            // Update state
            this.state.executedOrders.push({
                orderHash: order.orderHash,
                fillAmount: fillAmount.toString(),
                fillRatio: fillRatio,
                gasUsed: receipt.gasUsed.toString(),
                blockNumber: receipt.blockNumber,
                timestamp: Date.now(),
                txHash: fillTx.hash
            });
            
            this.state.totalGasUsed += parseInt(receipt.gasUsed.toString());
            
            return {
                success: true,
                txHash: fillTx.hash,
                fillAmount: fillAmount.toString(),
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            console.log(`❌ Error executing partial fill: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    async monitorAndExecute() {
        console.log('📡 MONITORING FOR ORDERS');
        console.log('========================');
        
        while (true) {
            try {
                // Load signed order
                const order = await this.loadSignedOrder();
                if (!order) {
                    console.log('⏳ No signed order found, waiting...');
                    await new Promise(resolve => setTimeout(resolve, this.config.monitoring.checkInterval));
                    continue;
                }
                
                // Check if order is already processed
                const isProcessed = this.state.executedOrders.some(exec => exec.orderHash === order.orderHash);
                
                if (isProcessed) {
                    console.log('✅ Order already processed, waiting for new orders...');
                    await new Promise(resolve => setTimeout(resolve, this.config.monitoring.checkInterval));
                    continue;
                }
                
                // Get current block
                const currentBlock = await this.provider.getBlockNumber();
                
                // Analyze Dutch auction pricing
                const analysis = await this.analyzeDutchAuctionPricing(order, currentBlock);
                
                if (analysis.profitable) {
                    console.log('✅ PROFITABLE ORDER DETECTED!');
                    console.log(`   Profit margin: ${analysis.profitMargin ? analysis.profitMargin.toFixed(2) : 'N/A'}%`);
                    console.log(`   Recommended fill: ${(analysis.recommendedFillRatio * 100).toFixed(1)}%`);
                    
                    // Execute partial fill
                    const result = await this.executePartialFill(order, analysis.recommendedFillRatio);
                    
                    if (result.success) {
                        console.log('🎉 PARTIAL FILL EXECUTED SUCCESSFULLY!');
                        console.log(`   Transaction: ${result.txHash}`);
                        console.log(`   Fill amount: ${ethers.formatUnits(result.fillAmount, 6)} USDC`);
                        console.log(`   Gas used: ${result.gasUsed}`);
                        
                        // Save state
                        this.saveState();
                    } else {
                        console.log(`❌ Fill execution failed: ${result.error}`);
                    }
                } else {
                    console.log('❌ Order not profitable enough');
                    console.log(`   Profit margin: ${analysis.profitMargin ? analysis.profitMargin.toFixed(2) : 'N/A'}% (min: ${this.config.profitability.minProfitMargin}%)`);
                }
                
                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, this.config.monitoring.checkInterval));
                
            } catch (error) {
                console.log(`❌ Error in monitoring loop: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, this.config.monitoring.checkInterval));
            }
        }
    }
    
    saveState() {
        try {
            const stateData = {
                ...this.state,
                executedOrders: this.state.executedOrders,
                totalProfit: this.state.totalProfit.toString(),
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFileSync(this.config.monitoring.stateFile, JSON.stringify(stateData, null, 2));
            console.log('✅ State saved to file');
        } catch (error) {
            console.log(`❌ Error saving state: ${error.message}`);
        }
    }
    
    async startService() {
        console.log('🚀 STARTING CORRECTED LOP RELAYER SERVICE');
        console.log('==========================================');
        console.log('✅ Based on actual working transaction');
        console.log('✅ Correct fillOrder function signature');
        console.log('✅ Dutch auction monitoring enabled');
        console.log('✅ Partial fill execution ready');
        console.log('✅ Profitability analysis active');
        console.log('==========================================\n');
        
        // Start monitoring
        await this.monitorAndExecute();
    }
}

// Run the corrected relayer
async function main() {
    const relayer = new CorrectedLOPRelayer();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for initialization
    
    await relayer.startService();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CorrectedLOPRelayer }; 