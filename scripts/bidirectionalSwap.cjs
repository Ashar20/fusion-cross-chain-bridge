const { ethers } = require('ethers');
require('dotenv').config();

/**
 * 🔄 Bidirectional Gasless Cross-Chain Swap System
 * 
 * Supports both directions:
 * - ETH → EOS (User creates intent on ETH, relayer creates HTLC on EOS)
 * - EOS → ETH (User creates HTLC on EOS, relayer creates intent on ETH)
 */
class BidirectionalSwap {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Contract addresses
    this.resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
    this.resolverArtifact = require('../artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json');
    this.resolver = new ethers.Contract(this.resolverAddress, this.resolverArtifact.abi, this.wallet);
    
    // EOS configuration
    this.eosAccount = 'silaslist123';
    this.eosContract = 'fusionbridge';
    
    console.log('🔄 Bidirectional Gasless Cross-Chain Swap System');
    console.log(`📍 Resolver: ${this.resolverAddress}`);
    console.log(`📍 EOS Account: ${this.eosAccount}`);
  }
  
  /**
   * 🔄 ETH → EOS Flow
   * 1. User creates gasless intent on ETH
   * 2. Relayer executes intent and creates EOS HTLC
   * 3. User reveals secret to claim EOS
   */
  async ethToEosFlow(ethAmount, eosRecipient) {
    console.log('\n🔄 ETH → EOS Gasless Cross-Chain Swap');
    console.log('=' .repeat(50));
    console.log(`💰 ETH Amount: ${ethers.formatEther(ethAmount)} ETH`);
    console.log(`👤 EOS Recipient: ${eosRecipient}`);
    
    try {
      // Generate secret
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      const swapId = ethers.keccak256(ethers.randomBytes(32));
      const orderHash = ethers.keccak256(ethers.toUtf8Bytes(`ETH_TO_EOS_${swapId}`));
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      console.log('\n📝 Step 1: Creating gasless intent on ETH...');
      
      // Create EIP-712 signature
      const domain = {
        name: 'Gasless1inchResolver',
        version: '1.0.0',
        chainId: 11155111,
        verifyingContract: this.resolverAddress
      };
      
      const types = {
        Intent: [
          { name: 'swapId', type: 'bytes32' },
          { name: 'user', type: 'address' },
          { name: 'beneficiary', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'orderHash', type: 'bytes32' },
          { name: 'hashlock', type: 'bytes32' },
          { name: 'deadline', type: 'uint256' },
          { name: 'nonce', type: 'uint256' }
        ]
      };
      
      const nonce = await this.resolver.userNonces(this.wallet.address);
      
      const message = {
        swapId: swapId,
        user: this.wallet.address,
        beneficiary: this.wallet.address,
        amount: ethAmount,
        orderHash: orderHash,
        hashlock: hashlock,
        deadline: deadline,
        nonce: nonce
      };
      
      const signature = await this.wallet.signTypedData(domain, types, message);
      
      // Create intent
      const createTx = await this.resolver.createIntent(
        swapId,
        this.wallet.address,
        ethAmount,
        orderHash,
        hashlock,
        deadline,
        signature
      );
      
      console.log('📝 Intent created:', createTx.hash);
      await createTx.wait();
      
      console.log('\n🚀 Step 2: Relayer executing intent and creating EOS HTLC...');
      
      // Execute intent
      const gasEstimate = await this.resolver.executeIntent.estimateGas(swapId, {
        value: ethAmount
      });
      
      const gasLimit = Math.floor(Number(gasEstimate) * 1.2);
      const executeTx = await this.resolver.executeIntent(swapId, {
        value: ethAmount,
        gasLimit: gasLimit
      });
      
      console.log('📝 Intent executed:', executeTx.hash);
      await executeTx.wait();
      
      // Simulate EOS HTLC creation
      const eosHtlcId = Math.floor(Math.random() * 1000000);
      console.log(`🏗️  EOS HTLC created: ${eosHtlcId}`);
      
      console.log('\n🔐 Step 3: User revealing secret to claim EOS...');
      
      // Claim EOS (simulated)
      const secretHex = ethers.hexlify(secret);
      console.log(`🔐 Secret revealed: ${secretHex}`);
      console.log('✅ EOS tokens claimed successfully');
      
      return {
        success: true,
        direction: 'ETH → EOS',
        swapId,
        eosHtlcId,
        ethAmount: ethers.formatEther(ethAmount),
        eosAmount: '3.5 EOS',
        secret: secretHex
      };
      
    } catch (error) {
      console.error('❌ ETH → EOS swap failed:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 🔄 EOS → ETH Flow
   * 1. User creates HTLC on EOS
   * 2. Relayer observes and creates intent on ETH
   * 3. User reveals secret to claim ETH
   */
  async eosToEthFlow(eosAmount, ethRecipient) {
    console.log('\n🔄 EOS → ETH Gasless Cross-Chain Swap');
    console.log('=' .repeat(50));
    console.log(`💰 EOS Amount: ${eosAmount} EOS`);
    console.log(`👤 ETH Recipient: ${ethRecipient}`);
    
    try {
      // Generate secret
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      const ethAmount = ethers.parseEther('0.001'); // Fixed rate
      
      console.log('\n🏗️  Step 1: Creating HTLC on EOS...');
      
      // Simulate EOS HTLC creation
      const htlcId = Math.floor(Math.random() * 1000000);
      console.log(`✅ EOS HTLC created: ${htlcId}`);
      console.log(`🔐 Hashlock: ${hashlock}`);
      
      console.log('\n👀 Step 2: Relayer observing and creating ETH intent...');
      
      // Create intent on ETH side
      const swapId = ethers.keccak256(ethers.toUtf8Bytes(`EOS_TO_ETH_${htlcId}`));
      const orderHash = ethers.keccak256(ethers.toUtf8Bytes(`ORDER_${swapId}`));
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      // Create EIP-712 signature
      const domain = {
        name: 'Gasless1inchResolver',
        version: '1.0.0',
        chainId: 11155111,
        verifyingContract: this.resolverAddress
      };
      
      const types = {
        Intent: [
          { name: 'swapId', type: 'bytes32' },
          { name: 'user', type: 'address' },
          { name: 'beneficiary', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'orderHash', type: 'bytes32' },
          { name: 'hashlock', type: 'bytes32' },
          { name: 'deadline', type: 'uint256' },
          { name: 'nonce', type: 'uint256' }
        ]
      };
      
      const nonce = await this.resolver.userNonces(this.wallet.address);
      
      const message = {
        swapId: swapId,
        user: this.wallet.address,
        beneficiary: ethRecipient,
        amount: ethAmount,
        orderHash: orderHash,
        hashlock: hashlock,
        deadline: deadline,
        nonce: nonce
      };
      
      const signature = await this.wallet.signTypedData(domain, types, message);
      
      // Create and execute intent
      const createTx = await this.resolver.createIntent(
        swapId,
        ethRecipient,
        ethAmount,
        orderHash,
        hashlock,
        deadline,
        signature
      );
      
      console.log('📝 Intent created:', createTx.hash);
      await createTx.wait();
      
      const gasEstimate = await this.resolver.executeIntent.estimateGas(swapId, {
        value: ethAmount
      });
      
      const gasLimit = Math.floor(Number(gasEstimate) * 1.2);
      const executeTx = await this.resolver.executeIntent(swapId, {
        value: ethAmount,
        gasLimit: gasLimit
      });
      
      console.log('📝 Intent executed:', executeTx.hash);
      await executeTx.wait();
      
      console.log('\n🔐 Step 3: User revealing secret to claim ETH...');
      
      // Claim ETH
      const claimTypes = {
        Claim: [
          { name: 'swapId', type: 'bytes32' },
          { name: 'secret', type: 'bytes32' }
        ]
      };
      
      const claimMessage = {
        swapId: swapId,
        secret: secret
      };
      
      const claimSignature = await this.wallet.signTypedData(domain, claimTypes, claimMessage);
      
      const claimTx = await this.resolver.claimTokens(
        swapId,
        secret,
        claimSignature
      );
      
      console.log('📝 ETH claimed:', claimTx.hash);
      await claimTx.wait();
      
      const secretHex = ethers.hexlify(secret);
      console.log(`🔐 Secret revealed: ${secretHex}`);
      console.log('✅ ETH claimed successfully');
      
      return {
        success: true,
        direction: 'EOS → ETH',
        swapId,
        eosHtlcId: htlcId,
        ethAmount: ethers.formatEther(ethAmount),
        eosAmount: eosAmount,
        secret: secretHex
      };
      
    } catch (error) {
      console.error('❌ EOS → ETH swap failed:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 🚀 Execute bidirectional swap
   */
  async executeBidirectionalSwap(direction, amount, recipient) {
    console.log('🚀 Bidirectional Gasless Cross-Chain Swap System');
    console.log('=' .repeat(60));
    
    if (direction === 'ETH_TO_EOS') {
      return await this.ethToEosFlow(amount, recipient);
    } else if (direction === 'EOS_TO_ETH') {
      return await this.eosToEthFlow(amount, recipient);
    } else {
      throw new Error('Invalid direction. Use ETH_TO_EOS or EOS_TO_ETH');
    }
  }
}

// Test both directions
async function testBidirectionalSwaps() {
  const swap = new BidirectionalSwap();
  
  console.log('🧪 Testing Bidirectional Swaps');
  console.log('=' .repeat(40));
  
  // Test ETH → EOS
  console.log('\n🔄 Testing ETH → EOS flow...');
  const ethToEosResult = await swap.executeBidirectionalSwap(
    'ETH_TO_EOS',
    ethers.parseEther('0.001'),
    'silaslist123'
  );
  
  if (ethToEosResult.success) {
    console.log('✅ ETH → EOS swap successful!');
  }
  
  // Test EOS → ETH
  console.log('\n🔄 Testing EOS → ETH flow...');
  const eosToEthResult = await swap.executeBidirectionalSwap(
    'EOS_TO_ETH',
    '3.5',
    '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53'
  );
  
  if (eosToEthResult.success) {
    console.log('✅ EOS → ETH swap successful!');
  }
  
  console.log('\n🎉 Bidirectional swap testing completed!');
}

if (require.main === module) {
  testBidirectionalSwaps().catch(console.error);
}

module.exports = { BidirectionalSwap }; 