const { ethers } = require('hardhat');
require('dotenv').config();

async function extractOrderHash() {
    try {
        console.log('🔍 EXTRACTING ORDER HASH FROM TRANSACTION');
        console.log('==========================================');
        
        const txHash = '0x7dae4384e0137325d806eab0cdd80e58343c4290ccc8721510c8ac434985249e';
        const resolverAddress = '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64';
        
        // Initialize provider
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        
        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);
        console.log(`📋 Transaction: ${txHash}`);
        console.log(`📊 Logs count: ${receipt.logs.length}`);
        
        // Parse the CrossChainOrderCreated event
        const resolver = new ethers.Contract(
            resolverAddress,
            [
                'event CrossChainOrderCreated(bytes32 indexed orderHash, address indexed maker, address token, uint256 amount, bytes32 hashlock, uint256 timelock, string algorandAddress)'
            ],
            provider
        );
        
        // Find the CrossChainOrderCreated event
        const event = receipt.logs.find(log => {
            try {
                const parsed = resolver.interface.parseLog(log);
                return parsed.name === 'CrossChainOrderCreated';
            } catch {
                return false;
            }
        });
        
        if (event) {
            const parsed = resolver.interface.parseLog(event);
            const orderHash = parsed.args.orderHash;
            console.log(`✅ Order Hash: ${orderHash}`);
            console.log(`👤 Maker: ${parsed.args.maker}`);
            console.log(`🪙 Token: ${parsed.args.token}`);
            console.log(`💰 Amount: ${ethers.formatEther(parsed.args.amount)} ETH`);
            console.log(`🔒 Hashlock: ${parsed.args.hashlock}`);
            console.log(`⏰ Timelock: ${parsed.args.timelock}`);
            console.log(`🌉 Algorand Address: ${parsed.args.algorandAddress}`);
            
            return orderHash;
        } else {
            console.log('❌ CrossChainOrderCreated event not found');
            
            // Try to decode the raw log
            console.log('\n🔍 RAW LOG DATA:');
            console.log('================');
            const log = receipt.logs[0];
            console.log(`Topics: ${log.topics.join(', ')}`);
            console.log(`Data: ${log.data}`);
            
            // The first topic should be the event signature
            // The second topic should be the orderHash (indexed)
            const orderHash = log.topics[1];
            console.log(`\n✅ Extracted Order Hash: ${orderHash}`);
            
            return orderHash;
        }
        
    } catch (error) {
        console.error('❌ Error extracting order hash:', error);
    }
}

extractOrderHash().catch(console.error); 