#!/usr/bin/env node

/**
 * Quick test order creation for relayer testing
 */

const { ethers } = require('ethers');

async function createQuickTestOrder() {
    console.log('⚡ QUICK TEST ORDER FOR RELAYER');
    console.log('==============================\n');
    
    require('dotenv').config();
    
    try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Very simple order parameters
        const makerAmount = ethers.parseEther('0.001'); // 0.001 ETH
        const takerAmount = ethers.parseEther('0.4');   // 0.4 ALGO (within relayer balance)
        
        const currentTime = Math.floor(Date.now() / 1000);
        const deadline = currentTime + 3600;
        const timelock = deadline + 3600;
        
        const salt = ethers.keccak256(ethers.randomBytes(32));
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        
        const intent = {
            maker: wallet.address,
            makerToken: ethers.ZeroAddress,
            takerToken: ethers.ZeroAddress,
            makerAmount: makerAmount,
            takerAmount: takerAmount,
            deadline: deadline,
            algorandChainId: 416001,
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: salt,
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.0001')
        };
        
        console.log(`📋 Creating order: ${ethers.formatEther(makerAmount)} ETH → ${ethers.formatEther(takerAmount)} ALGO`);
        console.log(`🧪 This should trigger relayer testing mode\n`);
        
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111,
            verifyingContract: '0x384B0011f6E6aA8C192294F36dCE09a3758Df788'
        };
        
        const types = {
            LimitOrderIntent: [
                { name: 'maker', type: 'address' },
                { name: 'makerToken', type: 'address' },
                { name: 'takerToken', type: 'address' },
                { name: 'makerAmount', type: 'uint256' },
                { name: 'takerAmount', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
                { name: 'algorandChainId', type: 'uint256' },
                { name: 'algorandAddress', type: 'string' },
                { name: 'salt', type: 'bytes32' },
                { name: 'allowPartialFills', type: 'bool' },
                { name: 'minPartialFill', type: 'uint256' }
            ]
        };
        
        const signature = await wallet.signTypedData(domain, types, intent);
        
        const abi = [
            'function submitLimitOrder(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes signature, bytes32 hashlock, uint256 timelock) external payable returns (bytes32)'
        ];
        
        const contract = new ethers.Contract('0x384B0011f6E6aA8C192294F36dCE09a3758Df788', abi, wallet);
        
        console.log('⏳ Submitting order...');
        const tx = await contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            timelock,
            { 
                value: makerAmount,
                gasLimit: 400000,
                maxFeePerGas: ethers.parseUnits('12', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
            }
        );
        
        console.log(`🔗 Transaction: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`✅ Order created in block ${receipt.blockNumber}`);
        
        // Extract order ID
        const orderEvent = receipt.logs.find(log => 
            log.topics[0] === ethers.id('LimitOrderCreated(bytes32,address,address,address,uint256,uint256,uint256,string,bytes32,uint256,bool)')
        );
        
        if (orderEvent) {
            const orderId = orderEvent.topics[1];
            console.log(`🆔 Order ID: ${orderId}`);
            console.log('\n🤖 RELAYER SHOULD NOW DETECT THIS ORDER!');
            console.log('🧪 Expected: "Order unprofitable but accepting for testing - placing bid!"');
            
            // Wait a bit and check for bids
            console.log('\n⏳ Waiting 15 seconds for relayer to process...');
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            // Check for bids
            const bidAbi = ['function getBids(bytes32) view returns (tuple(address,uint256,uint256,uint256,bool,uint256,uint256)[])'];
            const bidContract = new ethers.Contract('0x384B0011f6E6aA8C192294F36dCE09a3758Df788', bidAbi, provider);
            
            try {
                const bids = await bidContract.getBids(orderId);
                console.log(`🔍 Final check: ${bids.length} bid(s) found`);
                
                if (bids.length > 0) {
                    console.log('🎉 SUCCESS: Relayer placed a bid!');
                    bids.forEach((bid, i) => {
                        if (bid.active) {
                            console.log(`   Bid ${i+1}: ${bid.resolver} - ${ethers.formatEther(bid.inputAmount)} ETH`);
                        }
                    });
                } else {
                    console.log('⚠️  No bids yet - check relayer logs for processing status');
                }
            } catch (error) {
                console.log(`⚠️  Could not check bids: ${error.message}`);
            }
            
            return orderId;
        } else {
            throw new Error('Order event not found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

createQuickTestOrder().catch(console.error);