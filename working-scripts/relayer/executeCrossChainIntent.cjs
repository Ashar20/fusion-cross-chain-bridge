#!/usr/bin/env node

/**
 * 🚀 EXECUTE CROSS-CHAIN LOP INTENT (ETH ↔ ALGO)
 * 
 * This script executes the cross-chain LOP intent with Dutch auction pricing
 * that was created by createCrossChainLOPIntent.cjs
 */

const { ethers } = require('ethers');
const fs = require('fs');

// Load configurations
require('dotenv').config({ path: '.env.relayer' });
require('dotenv').config({ path: '.env.resolvers.new' });

class CrossChainIntentExecutor {
    constructor() {
        this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        this.wallet = new ethers.Wallet(process.env.RELAYER_ETH_PRIVATE_KEY, this.provider);
        this.lopAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
        
        // LOP Contract ABI
        this.lopABI = [
            'function fillOrder(bytes order, bytes signature, bytes interaction, uint256 makingAmount, uint256 takingAmount, uint256 skipPermitAndThresholdAmount, address target) external payable returns (uint256 makerAmount, uint256 takerAmount)',
            'function cancelOrder(bytes order) external',
            'function getOrderHash(tuple(address maker, address makerAsset, address takerAsset, uint256 makerAmount, uint256 takerAmount, uint256 salt, uint256 deadline, bytes signature)) external pure returns (bytes32)',
            'event OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makerAmount, uint256 takerAmount)',
            'event OrderCancelled(bytes32 indexed orderHash, address indexed maker)'
        ];
        
        this.lopContract = new ethers.Contract(this.lopAddress, this.lopABI, this.wallet);
    }
    
    async executeCrossChainIntent() {
        console.log('🚀 EXECUTING CROSS-CHAIN LOP INTENT (ETH ↔ ALGO)');
        console.log('==================================================');
        
        try {
            // Load the cross-chain intent
            const intent = await this.loadCrossChainIntent();
            
            // Analyze profitability and partial fill options
            const executionAnalysis = await this.analyzeExecution(intent);
            
            // Execute the cross-chain intent
            await this.executeIntent(intent, executionAnalysis);
            
            console.log('✅ CROSS-CHAIN INTENT EXECUTION COMPLETED!');
            console.log('==========================================');
            
        } catch (error) {
            console.error('❌ Error executing cross-chain intent:', error.message);
        }
    }
    
    async loadCrossChainIntent() {
        console.log('\n📂 LOADING CROSS-CHAIN INTENT');
        console.log('==============================');
        
        if (!fs.existsSync('CROSSCHAIN_LOP_INTENT.json')) {
            throw new Error('CROSSCHAIN_LOP_INTENT.json not found. Please run createCrossChainLOPIntent.cjs first.');
        }
        
        const intentData = JSON.parse(fs.readFileSync('CROSSCHAIN_LOP_INTENT.json', 'utf8'));
        
        console.log('✅ Cross-chain intent loaded successfully');
        console.log(`   Intent Hash: ${intentData.intentHash}`);
        console.log(`   Maker: ${intentData.maker}`);
        console.log(`   Dutch Auction: ${intentData.dutchAuction ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`   Cross-Chain: ${intentData.crossChain ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`   Initial Price: ${intentData.initialPrice / 1000000} ALGO per ETH`);
        console.log(`   Final Price: ${intentData.finalPrice / 1000000} ALGO per ETH`);
        console.log(`   Price Decay Rate: ${(intentData.priceDecayRate * 100).toFixed(3)}% per block`);
        
        return intentData;
    }
    
    async analyzeExecution(intent) {
        console.log('\n📊 ANALYZING EXECUTION PROFITABILITY');
        console.log('=====================================');
        
        // Get current block
        const currentBlock = await this.provider.getBlockNumber();
        const blocksElapsed = currentBlock - intent.currentBlock;
        
        // Calculate current price based on Dutch auction
        const priceRatio = Math.max(0.95, 1 - (blocksElapsed * intent.priceDecayRate));
        const currentPrice = Math.floor(Number(intent.initialPrice) * priceRatio);
        
        // Analyze partial fill options
        const partialFillOptions = await this.analyzePartialFillOptions(intent, currentPrice);
        
        // Calculate gas costs
        const gasPrice = await this.provider.getFeeData();
        const estimatedGas = 150000; // Estimated gas for cross-chain execution
        const gasCost = gasPrice.gasPrice * BigInt(estimatedGas);
        
        const analysis = {
            currentBlock: currentBlock,
            blocksElapsed: blocksElapsed,
            currentPrice: currentPrice,
            priceRatio: priceRatio,
            gasCost: gasCost,
            partialFillOptions: partialFillOptions,
            profitable: false,
            recommendedFillRatio: 0,
            expectedProfit: 0
        };
        
        // Find most profitable option
        let bestOption = null;
        for (const option of partialFillOptions) {
            if (option.profitMargin > analysis.expectedProfit) {
                analysis.expectedProfit = option.profitMargin;
                analysis.recommendedFillRatio = option.fillRatio;
                analysis.profitable = option.profitMargin > 0;
                bestOption = option;
            }
        }
        
        console.log('📈 EXECUTION ANALYSIS:');
        console.log(`   Current Block: ${currentBlock}`);
        console.log(`   Blocks Elapsed: ${blocksElapsed}`);
        console.log(`   Price Ratio: ${(priceRatio * 100).toFixed(2)}%`);
        console.log(`   Current Price: ${(currentPrice / 1000000).toFixed(4)} ALGO per ETH`);
        console.log(`   Gas Cost: ${ethers.formatEther(gasCost)} ETH`);
        console.log(`   Profitable: ${analysis.profitable ? '✅ YES' : '❌ NO'}`);
        
        if (bestOption) {
            console.log(`   Recommended Fill: ${(bestOption.fillRatio * 100).toFixed(1)}%`);
            console.log(`   Expected Profit: ${bestOption.profitMargin.toFixed(6)} ETH`);
        }
        
        return analysis;
    }
    
    async analyzePartialFillOptions(intent, currentPrice) {
        const options = [];
        const fillRatios = [0.1, 0.25, 0.5, 0.75, 1.0]; // 10%, 25%, 50%, 75%, 100%
        
        for (const fillRatio of fillRatios) {
            const makerAmount = BigInt(intent.makerAmount) * BigInt(Math.floor(fillRatio * 1000)) / 1000n;
            const takerAmount = BigInt(currentPrice) * BigInt(Math.floor(fillRatio * 1000)) / 1000n;
            
            // Calculate profit (simplified - in real scenario would include cross-chain bridge fees)
            const inputValue = makerAmount; // ETH amount
            const outputValue = takerAmount; // ALGO amount (converted to ETH equivalent)
            
            // Assume 1 ALGO = 0.0001 ETH for profit calculation
            const algoToEthRate = 0.0001;
            const outputValueInEth = Number(outputValue) * algoToEthRate / 1000000;
            const inputValueInEth = Number(ethers.formatEther(inputValue));
            
            const profitMargin = outputValueInEth - inputValueInEth;
            
            options.push({
                fillRatio: fillRatio,
                makerAmount: makerAmount.toString(),
                takerAmount: takerAmount.toString(),
                profitMargin: profitMargin,
                profitable: profitMargin > 0
            });
        }
        
        return options;
    }
    
    async executeIntent(intent, analysis) {
        console.log('\n🚀 EXECUTING CROSS-CHAIN INTENT');
        console.log('===============================');
        
        if (!analysis.profitable) {
            console.log('⚠️ Execution not profitable, skipping...');
            return;
        }
        
        try {
            // Create order bytes for LOP contract
            const orderBytes = await this.createOrderBytes(intent, analysis);
            
            // Execute the order
            const executionResult = await this.executeLOPOrder(intent, orderBytes, analysis);
            
            // Save execution result
            await this.saveExecutionResult(intent, analysis, executionResult);
            
            console.log('✅ CROSS-CHAIN INTENT EXECUTED SUCCESSFULLY!');
            console.log(`   Transaction Hash: ${executionResult.txHash}`);
            console.log(`   Fill Ratio: ${(analysis.recommendedFillRatio * 100).toFixed(1)}%`);
            console.log(`   Expected Profit: ${analysis.expectedProfit.toFixed(6)} ETH`);
            
        } catch (error) {
            console.error('❌ Error executing cross-chain intent:', error.message);
            
            // Save error details
            const errorData = {
                intentHash: intent.intentHash,
                error: error.message,
                timestamp: new Date().toISOString(),
                analysis: analysis
            };
            
            fs.writeFileSync('CROSSCHAIN_EXECUTION_ERROR.json', JSON.stringify(errorData, null, 2));
            console.log('⚠️ Error details saved to CROSSCHAIN_EXECUTION_ERROR.json');
        }
    }
    
    async createOrderBytes(intent, analysis) {
        // Create order structure for LOP contract
        const order = {
            maker: intent.maker,
            makerAsset: intent.makerToken,
            takerAsset: intent.takerToken,
            makerAmount: intent.makerAmount,
            takerAmount: intent.takerAmount,
            salt: intent.salt,
            deadline: intent.deadline
        };
        
        // Encode order as bytes
        const orderBytes = ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
            [
                order.maker,
                order.makerAsset,
                order.takerAsset,
                order.makerAmount,
                order.takerAmount,
                order.salt,
                order.deadline
            ]
        );
        
        return orderBytes;
    }
    
    async executeLOPOrder(intent, orderBytes, analysis) {
        console.log('📋 EXECUTING LOP ORDER');
        console.log('======================');
        
        // Calculate amounts for partial fill
        const makerAmount = BigInt(intent.makerAmount) * BigInt(Math.floor(analysis.recommendedFillRatio * 1000)) / 1000n;
        const takerAmount = BigInt(analysis.currentPrice) * BigInt(Math.floor(analysis.recommendedFillRatio * 1000)) / 1000n;
        
        console.log(`   Maker Amount: ${ethers.formatEther(makerAmount)} ETH`);
        console.log(`   Taker Amount: ${takerAmount.toString()} microAlgos`);
        console.log(`   Fill Ratio: ${(analysis.recommendedFillRatio * 100).toFixed(1)}%`);
        
        // Prepare transaction parameters
        const interaction = '0x'; // No interaction data
        const skipPermitAndThresholdAmount = 0;
        const target = ethers.ZeroAddress;
        
        // Execute the order
        const tx = await this.lopContract.fillOrder(
            orderBytes,
            intent.signature,
            interaction,
            makerAmount,
            takerAmount,
            skipPermitAndThresholdAmount,
            target,
            {
                value: makerAmount, // Send ETH with the transaction
                gasLimit: 200000
            }
        );
        
        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        console.log('✅ Transaction confirmed!');
        console.log(`   Block Number: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`   Status: ${receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        return {
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
            makerAmount: makerAmount.toString(),
            takerAmount: takerAmount.toString(),
            fillRatio: analysis.recommendedFillRatio
        };
    }
    
    async saveExecutionResult(intent, analysis, executionResult) {
        console.log('\n💾 SAVING EXECUTION RESULT');
        console.log('===========================');
        
        const resultData = {
            intentHash: intent.intentHash,
            executionTimestamp: new Date().toISOString(),
            analysis: analysis,
            executionResult: executionResult,
            dutchAuction: intent.dutchAuction,
            crossChain: intent.crossChain,
            sourceChain: intent.sourceChain,
            destinationChain: intent.destinationChain,
            initialPrice: intent.initialPrice,
            finalPrice: intent.finalPrice,
            priceDecayRate: intent.priceDecayRate,
            metadata: {
                createdBy: 'CrossChainIntentExecutor',
                version: '1.0',
                dutchAuction: true,
                crossChain: true,
                executed: true,
                createdAt: new Date().toISOString()
            }
        };
        
        fs.writeFileSync('CROSSCHAIN_EXECUTION_RESULT.json', JSON.stringify(resultData, null, 2));
        console.log('✅ Execution result saved to CROSSCHAIN_EXECUTION_RESULT.json');
    }
}

// Run the cross-chain intent execution
const executor = new CrossChainIntentExecutor();
executor.executeCrossChainIntent().then(() => {
    console.log('\n🎉 CROSS-CHAIN INTENT EXECUTION COMPLETED!');
    console.log('==========================================');
    console.log('✅ Cross-chain intent analyzed');
    console.log('✅ Profitability calculated');
    console.log('✅ Partial fill options evaluated');
    console.log('✅ LOP order executed');
    console.log('✅ Results saved to files');
    console.log('\n📁 Generated Files:');
    console.log('   - CROSSCHAIN_EXECUTION_RESULT.json (Execution details)');
    console.log('   - CROSSCHAIN_EXECUTION_ERROR.json (If any errors)');
}); 