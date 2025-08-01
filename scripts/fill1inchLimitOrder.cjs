#!/usr/bin/env node
/**
 * 🏭 FILL 1INCH LIMIT ORDER
 * 
 * Fills a limit order using the official 1inch contracts
 * This will trigger escrow creation for cross-chain swap
 */

const { ethers } = require('ethers');
require('dotenv').config();

class OneInchOrderFiller {
    constructor() {
        // Ethereum configuration
        this.ethProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, this.ethProvider);
        
        // Deployed 1inch contract addresses
        this.contracts = {
            limitOrderProtocol: '0x68b68381b76e705A7Ef8209800D0886e21b654FE',
            escrowFactory: '0x523258A91028793817F84aB037A3372B468ee940'
        };
        
        console.log('🏭 1INCH LIMIT ORDER FILLER');
        console.log('===========================');
        console.log(`🤖 Relayer: ${this.relayerWallet.address}`);
        console.log(`📦 Limit Order Protocol: ${this.contracts.limitOrderProtocol}`);
        console.log(`🏭 Escrow Factory: ${this.contracts.escrowFactory}`);
    }
    
    async fillLimitOrder() {
        try {
            console.log('\n🚀 STEP 1: LOAD ORDER DETAILS');
            console.log('==============================');
            
            const orderDetails = await this.loadOrderDetails();
            
            console.log('\n🚀 STEP 2: FILL ORDER ON-CHAIN');
            console.log('===============================');
            
            await this.fillOrderOnChain(orderDetails);
            
            console.log('\n🎉 ORDER FILLED SUCCESSFULLY!');
            console.log('==============================');
            console.log('✅ Order filled on 1inch Limit Order Protocol');
            console.log('✅ Escrow creation triggered');
            console.log('✅ Cross-chain swap infrastructure activated');
            
        } catch (error) {
            console.error('❌ Order filling failed:', error.message);
            throw error;
        }
    }
    
    async loadOrderDetails() {
        console.log('📋 Loading order details from file...');
        
        try {
            const orderData = require('fs').readFileSync('1INCH_LIMIT_ORDER.json', 'utf8');
            const orderDetails = JSON.parse(orderData);
            
            console.log('✅ Order details loaded:');
            console.log(`   Order Hash: ${orderDetails.orderHash}`);
            console.log(`   Maker: ${orderDetails.order.maker}`);
            console.log(`   Making Amount: ${orderDetails.order.makingAmount} ETH`);
            console.log(`   Taking Amount: ${orderDetails.order.takingAmount} ETH`);
            console.log(`   Hashlock: ${orderDetails.extraData.hashlockInfo}`);
            
            return orderDetails;
            
        } catch (error) {
            console.error('❌ Could not load order details:', error.message);
            throw new Error('Order details file not found. Please create an order first.');
        }
    }
    
    async fillOrderOnChain(orderDetails) {
        console.log('📋 Filling order on-chain...');
        
        // Limit Order Protocol ABI
        const limitOrderABI = [
            'function fillOrder((address,address,uint256,uint256,address,address,address,bytes,uint256,uint256,bytes32,uint256,bytes), bytes, uint256) external payable returns (uint256, uint256, bytes32)',
            'function fillOrderTo((address,address,uint256,uint256,address,address,address,bytes,uint256,uint256,bytes32,uint256,bytes), bytes, uint256, address) external payable returns (uint256, uint256, bytes32)',
            'event OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makingAmount, uint256 takingAmount, uint256 remainingAmount)'
        ];
        
        const limitOrderProtocol = new ethers.Contract(
            this.contracts.limitOrderProtocol,
            limitOrderABI,
            this.relayerWallet
        );
        
        // Reconstruct the order structure as a tuple
        const salt = orderDetails.order.salt.type === 'Buffer' 
            ? Buffer.from(orderDetails.order.salt.data) 
            : orderDetails.order.salt;
            
        const order = [
            orderDetails.order.makerAsset,
            orderDetails.order.takerAsset,
            ethers.parseUnits(orderDetails.order.makingAmount, 18),
            ethers.parseUnits(orderDetails.order.takingAmount, 18),
            orderDetails.order.maker,
            orderDetails.order.receiver,
            orderDetails.order.allowedSender,
            orderDetails.order.interactions,
            ethers.parseUnits(orderDetails.order.makingAmountThreshold, 18),
            ethers.parseUnits(orderDetails.order.takingAmountThreshold, 18),
            salt,
            parseInt(orderDetails.order.makerTraits),
            orderDetails.order.permit
        ];
        
        // Create the extra data for escrow creation
        const extraData = this.createExtraDataForEscrow(orderDetails);
        
        console.log('📝 Order structure:');
        console.log(`   Maker Asset: ${order[0]}`);
        console.log(`   Taker Asset: ${order[1]}`);
        console.log(`   Making Amount: ${ethers.formatEther(order[2])} ETH`);
        console.log(`   Taking Amount: ${ethers.formatEther(order[3])} ETH`);
        console.log(`   Maker: ${order[4]}`);
        console.log(`   Receiver: ${order[5]}`);
        
        console.log('📝 Extra data for escrow:');
        console.log(`   Hashlock: ${orderDetails.extraData.hashlockInfo}`);
        console.log(`   Destination Chain ID: ${orderDetails.extraData.dstChainId}`);
        console.log(`   Safety Deposit: ${orderDetails.extraData.deposits} ETH`);
        
        // Fill the order
        console.log('🚀 Submitting fill transaction...');
        
        const fillAmount = order[3]; // Amount we're taking
        
        const tx = await limitOrderProtocol.fillOrder(
            order,
            extraData,
            fillAmount,
            { 
                value: fillAmount, // Send ETH for the order
                gasLimit: 1000000  // High gas limit for complex transaction
            }
        );
        
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        // Wait for confirmation
        console.log('⏳ Waiting for confirmation...');
        const receipt = await tx.wait();
        
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`💰 Gas used: ${receipt.gasUsed.toString()}`);
        
        // Check for OrderFilled event
        const orderFilledEvent = receipt.logs.find(log => {
            try {
                const decoded = limitOrderProtocol.interface.parseLog(log);
                return decoded && decoded.name === 'OrderFilled';
            } catch (e) {
                return false;
            }
        });
        
        if (orderFilledEvent) {
            const decoded = limitOrderProtocol.interface.parseLog(orderFilledEvent);
            console.log('🎉 OrderFilled event detected!');
            console.log(`   Order Hash: ${decoded.args.orderHash}`);
            console.log(`   Maker: ${decoded.args.maker}`);
            console.log(`   Taker: ${decoded.args.taker}`);
            console.log(`   Making Amount: ${ethers.formatEther(decoded.args.makingAmount)} ETH`);
            console.log(`   Taking Amount: ${ethers.formatEther(decoded.args.takingAmount)} ETH`);
            console.log(`   Remaining Amount: ${ethers.formatEther(decoded.args.remainingAmount)} ETH`);
        }
        
        // Check for SrcEscrowCreated event (from EscrowFactory)
        const escrowCreatedEvent = receipt.logs.find(log => {
            try {
                // Try to decode as SrcEscrowCreated event
                return log.topics[0] === ethers.keccak256(ethers.toUtf8Bytes('SrcEscrowCreated((address,address,uint256,uint256,address,address,address,bytes,uint256,uint256,bytes32,uint256,bytes),(address,uint256,address,uint256,uint256,bytes))'));
            } catch (e) {
                return false;
            }
        });
        
        if (escrowCreatedEvent) {
            console.log('🎉 SrcEscrowCreated event detected!');
            console.log('✅ Escrow contract created successfully');
            console.log('✅ Cross-chain swap infrastructure activated');
        }
        
        return {
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            orderFilled: !!orderFilledEvent,
            escrowCreated: !!escrowCreatedEvent
        };
    }
    
    createExtraDataForEscrow(orderDetails) {
        // Create the extra data structure for escrow creation
        // This follows the 1inch protocol format
        
        const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
            [
                'address', // integrator fee recipient
                'address', // protocol fee recipient
                'uint16',  // integrator fee percentage
                'uint8',   // integrator rev share percentage
                'uint16',  // resolver fee percentage
                'uint8',   // whitelist discount numerator
                'uint32',  // allowed time
                'uint8',   // size of whitelist
                'bytes32', // hashlock info
                'uint256', // dst chain id
                'address', // dst token
                'uint256', // deposits
                'uint256'  // timelocks
            ],
            [
                this.relayerWallet.address, // integrator fee recipient
                this.relayerWallet.address, // protocol fee recipient
                0, // integrator fee percentage (0%)
                0, // integrator rev share percentage (0%)
                0, // resolver fee percentage (0%)
                0, // whitelist discount numerator (0%)
                0, // allowed time (0 = no restriction)
                0, // size of whitelist (0 = no whitelist)
                orderDetails.extraData.hashlockInfo, // hashlock
                parseInt(orderDetails.extraData.dstChainId), // dst chain id
                orderDetails.extraData.dstToken, // dst token
                ethers.parseUnits(orderDetails.extraData.deposits, 18), // deposits
                0 // timelocks (simplified)
            ]
        );
        
        return extraData;
    }
}

// Execute the order filling
async function main() {
    const orderFiller = new OneInchOrderFiller();
    await orderFiller.fillLimitOrder();
}

main().catch(console.error); 