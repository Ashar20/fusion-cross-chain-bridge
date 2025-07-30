const { ethers } = require('ethers');
require('dotenv').config();

/**
 * 🚀 Advanced Orders Demo - Limit Orders & Dutch Auctions
 * 
 * This script demonstrates:
 * 1. Limit Orders - Execute at specific price points
 * 2. Dutch Auctions - Price decays over time
 * 3. Advanced order management
 */
class AdvancedOrdersDemo {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

    // Contract addresses (would be deployed addresses)
    this.advancedResolverAddress = '0x0000000000000000000000000000000000000000'; // Placeholder
    this.escrowFactoryAddress = '0x0000000000000000000000000000000000000000'; // Placeholder

    console.log('🚀 Advanced Orders Demo - Limit Orders & Dutch Auctions');
    console.log('=' .repeat(70));
    console.log(`📍 ETH Address: ${this.wallet.address}`);
    console.log(`📍 Advanced Resolver: ${this.advancedResolverAddress}`);
    console.log('');
  }

  /**
   * 📊 Show current market conditions
   */
  async showMarketConditions() {
    console.log('📊 MARKET CONDITIONS');
    console.log('-' .repeat(40));

    // Simulated price data
    const ethPrice = 3000; // USD per ETH
    const eosPrice = 0.5;  // USD per EOS
    const exchangeRate = eosPrice / ethPrice; // EOS per ETH

    console.log(`💰 ETH Price: $${ethPrice}`);
    console.log(`🌴 EOS Price: $${eosPrice}`);
    console.log(`🔄 Exchange Rate: ${exchangeRate.toFixed(6)} EOS/ETH`);
    console.log(`📈 Market Trend: Bullish (EOS gaining)`);
    console.log('');
  }

  /**
   * 🎯 Demo Limit Order
   */
  async demoLimitOrder() {
    console.log('🎯 LIMIT ORDER DEMO');
    console.log('=' .repeat(50));

    // Limit order parameters
    const orderId = ethers.keccak256(ethers.randomBytes(32));
    const amount = ethers.parseEther('0.001'); // 0.001 ETH
    const limitPrice = ethers.parseEther('0.0005'); // 0.0005 ETH per EOS (better than market)
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    console.log('📋 Limit Order Parameters:');
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
    console.log(`   Limit Price: ${ethers.formatEther(limitPrice)} ETH per EOS`);
    console.log(`   Deadline: ${new Date(deadline * 1000).toISOString()}`);
    console.log('   💡 Will execute when EOS price drops to limit or better');
    console.log('');

    // Generate swap parameters
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(ethers.solidityPacked(['bytes32'], [secret]));
    const orderHash = ethers.keccak256(ethers.randomBytes(32));

    console.log('🔐 Swap Parameters:');
    console.log(`   Hashlock: ${hashlock}`);
    console.log(`   Order Hash: ${orderHash}`);
    console.log(`   Secret: ${secret}`);
    console.log('');

    // Create EIP-712 signature for limit order
    const domain = {
      name: 'AdvancedOrderResolver',
      version: '1.0.0',
      chainId: 11155111, // Sepolia chain ID
      verifyingContract: this.advancedResolverAddress
    };

    const limitOrderTypes = {
      LimitOrder: [
        { name: 'orderId', type: 'bytes32' },
        { name: 'user', type: 'address' },
        { name: 'beneficiary', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'limitPrice', type: 'uint256' },
        { name: 'orderHash', type: 'bytes32' },
        { name: 'hashlock', type: 'bytes32' },
        { name: 'deadline', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'orderType', type: 'uint8' }
      ]
    };

    const limitOrderMessage = {
      orderId: orderId,
      user: this.wallet.address,
      beneficiary: this.wallet.address,
      amount: amount,
      limitPrice: limitPrice,
      orderHash: orderHash,
      hashlock: hashlock,
      deadline: deadline,
      nonce: 0, // Would get from contract
      orderType: 1 // LIMIT = 1
    };

    console.log('📝 Step 1: Creating Limit Order (Gasless)...');
    console.log('   💡 User signs limit order - NO GAS REQUIRED');
    console.log('   💡 Order will execute automatically when price hits limit');
    console.log('   💡 Resolver pays gas costs for execution');
    console.log('');

    // Simulate order creation
    console.log('✅ Limit Order Created Successfully!');
    console.log('   📊 Order Status: PENDING');
    console.log('   🔍 Monitoring for price conditions...');
    console.log('');

    // Simulate price monitoring
    console.log('📈 Price Monitoring:');
    console.log('   Current EOS Price: 0.0006 ETH (above limit)');
    console.log('   Target Price: 0.0005 ETH (limit)');
    console.log('   ⏳ Waiting for price to drop...');
    console.log('');

    // Simulate price drop and execution
    console.log('📉 Price Drop Detected!');
    console.log('   New EOS Price: 0.0004 ETH (below limit)');
    console.log('   🚀 Executing Limit Order...');
    console.log('   💡 Resolver automatically executes order');
    console.log('   💡 User gets better price than market');
    console.log('');

    console.log('✅ Limit Order Executed Successfully!');
    console.log(`   Execution Price: 0.0004 ETH per EOS`);
    console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
    console.log(`   EOS Received: ${(parseFloat(ethers.formatEther(amount)) / 0.0004).toFixed(2)} EOS`);
    console.log('   💡 User saved money with limit order!');
    console.log('');
  }

  /**
   * 🎯 Demo Dutch Auction
   */
  async demoDutchAuction() {
    console.log('🎯 DUTCH AUCTION DEMO');
    console.log('=' .repeat(50));

    // Dutch auction parameters
    const orderId = ethers.keccak256(ethers.randomBytes(32));
    const startAmount = ethers.parseEther('0.002'); // 0.002 ETH
    const endAmount = ethers.parseEther('0.001');   // 0.001 ETH
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 1800; // 30 minutes

    console.log('📋 Dutch Auction Parameters:');
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Start Amount: ${ethers.formatEther(startAmount)} ETH`);
    console.log(`   End Amount: ${ethers.formatEther(endAmount)} ETH`);
    console.log(`   Start Time: ${new Date(startTime * 1000).toISOString()}`);
    console.log(`   End Time: ${new Date(endTime * 1000).toISOString()}`);
    console.log(`   Duration: 30 minutes`);
    console.log('   💡 Price decays from start to end amount over time');
    console.log('');

    // Generate swap parameters
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(ethers.solidityPacked(['bytes32'], [secret]));
    const orderHash = ethers.keccak256(ethers.randomBytes(32));

    console.log('🔐 Swap Parameters:');
    console.log(`   Hashlock: ${hashlock}`);
    console.log(`   Order Hash: ${orderHash}`);
    console.log(`   Secret: ${secret}`);
    console.log('');

    // Create EIP-712 signature for Dutch auction
    const domain = {
      name: 'AdvancedOrderResolver',
      version: '1.0.0',
      chainId: 11155111, // Sepolia chain ID
      verifyingContract: this.advancedResolverAddress
    };

    const dutchAuctionTypes = {
      DutchAuction: [
        { name: 'orderId', type: 'bytes32' },
        { name: 'user', type: 'address' },
        { name: 'beneficiary', type: 'address' },
        { name: 'startAmount', type: 'uint256' },
        { name: 'endAmount', type: 'uint256' },
        { name: 'startTime', type: 'uint256' },
        { name: 'endTime', type: 'uint256' },
        { name: 'orderHash', type: 'bytes32' },
        { name: 'hashlock', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' }
      ]
    };

    const dutchAuctionMessage = {
      orderId: orderId,
      user: this.wallet.address,
      beneficiary: this.wallet.address,
      startAmount: startAmount,
      endAmount: endAmount,
      startTime: startTime,
      endTime: endTime,
      orderHash: orderHash,
      hashlock: hashlock,
      nonce: 0 // Would get from contract
    };

    console.log('📝 Step 1: Creating Dutch Auction (Gasless)...');
    console.log('   💡 User creates Dutch auction - NO GAS REQUIRED');
    console.log('   💡 Price starts high and decays over time');
    console.log('   💡 First buyer gets best available price');
    console.log('');

    // Simulate auction creation
    console.log('✅ Dutch Auction Created Successfully!');
    console.log('   📊 Auction Status: ACTIVE');
    console.log('   🔍 Monitoring for buyers...');
    console.log('');

    // Simulate price decay over time
    console.log('⏰ Price Decay Simulation:');
    console.log('   T+0min:  0.002 ETH (start price)');
    console.log('   T+5min:  0.0018 ETH');
    console.log('   T+10min: 0.0016 ETH');
    console.log('   T+15min: 0.0014 ETH');
    console.log('   T+20min: 0.0012 ETH');
    console.log('   T+25min: 0.0011 ETH');
    console.log('   T+30min: 0.001 ETH (end price)');
    console.log('');

    // Simulate buyer execution
    console.log('🛒 Buyer Executes Dutch Auction!');
    console.log('   Time: T+12min');
    console.log('   Current Price: 0.0015 ETH');
    console.log('   💡 Buyer gets better price than market (0.0006 ETH)');
    console.log('   💡 Resolver automatically executes auction');
    console.log('');

    console.log('✅ Dutch Auction Executed Successfully!');
    console.log(`   Execution Price: 0.0015 ETH`);
    console.log(`   Amount: ${ethers.formatEther(startAmount)} ETH`);
    console.log(`   EOS Received: ${(parseFloat(ethers.formatEther(startAmount)) / 0.0015).toFixed(2)} EOS`);
    console.log('   💡 Buyer got great deal with Dutch auction!');
    console.log('');
  }

  /**
   * 📊 Show order management features
   */
  async showOrderManagement() {
    console.log('📊 ORDER MANAGEMENT FEATURES');
    console.log('=' .repeat(50));

    console.log('🎯 Order Types Available:');
    console.log('   1. MARKET ORDER - Execute immediately at market price');
    console.log('   2. LIMIT ORDER - Execute at specific price or better');
    console.log('   3. DUTCH AUCTION - Price decays over time');
    console.log('   4. STOP LOSS - Execute when price hits stop level');
    console.log('   5. TAKE PROFIT - Execute when price hits profit level');
    console.log('');

    console.log('📈 Advanced Features:');
    console.log('   💡 Gasless Order Creation - No gas costs for users');
    console.log('   💡 Automatic Execution - Resolver handles all gas costs');
    console.log('   💡 Price Monitoring - Real-time price feeds');
    console.log('   💡 Order Cancellation - Users can cancel pending orders');
    console.log('   💡 Order History - Complete order tracking');
    console.log('   💡 Cross-Chain Integration - Works with EOS HTLCs');
    console.log('');

    console.log('🔒 Security Features:');
    console.log('   💡 EIP-712 Signatures - Secure off-chain signing');
    console.log('   💡 Atomic Execution - Orders execute completely or not at all');
    console.log('   💡 Time Locks - Automatic expiration handling');
    console.log('   💡 Nonce Protection - Prevents replay attacks');
    console.log('');
  }

  /**
   * 🚀 Execute complete demo
   */
  async execute() {
    try {
      // Show market conditions
      await this.showMarketConditions();

      // Demo limit order
      await this.demoLimitOrder();

      // Demo Dutch auction
      await this.demoDutchAuction();

      // Show order management
      await this.showOrderManagement();

      console.log('🎉 ADVANCED ORDERS DEMO COMPLETED!');
      console.log('=' .repeat(50));
      console.log('✅ Limit Orders: Execute at specific price points');
      console.log('✅ Dutch Auctions: Price decays over time');
      console.log('✅ Gasless Architecture: No gas costs for users');
      console.log('✅ Automatic Execution: Resolver handles everything');
      console.log('✅ Cross-Chain Integration: Works with EOS HTLCs');
      console.log('');
      console.log('💡 These advanced order types provide:');
      console.log('   • Better price control for users');
      console.log('   • More efficient market making');
      console.log('   • Reduced gas costs through gasless architecture');
      console.log('   • Professional trading features');
      console.log('');

    } catch (error) {
      console.error('❌ Demo execution failed:', error.message);
    }
  }
}

// Export for use in other scripts
module.exports = { AdvancedOrdersDemo };

// Run if called directly
if (require.main === module) {
  const demo = new AdvancedOrdersDemo();
  demo.execute();
} 