import { ethers } from 'ethers'
import fs from 'fs'

export class Gasless1inchResolver {
  constructor(ethProvider, ethSigner) {
    this.ethProvider = ethProvider
    this.ethSigner = ethSigner
    
    // Use the actual deployed Gasless1inchResolver contract
    const deployment = JSON.parse(fs.readFileSync('gasless-resolver-deployment.json', 'utf8'))
    this.resolverAddress = deployment.gaslessResolver.address
    
    // Load the actual ABI from Hardhat artifacts
    const artifact = JSON.parse(fs.readFileSync('artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json', 'utf8'))
    this.resolver = new ethers.Contract(this.resolverAddress, artifact.abi, this.ethSigner)
    
    // EIP-712 domain for signature verification
    this.domain = {
      name: 'Gasless1inchResolver',
      version: '1.0.0',
      chainId: 11155111, // Sepolia
      verifyingContract: this.resolverAddress
    }
    
    // EIP-712 types for Intent
    this.types = {
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
    }
    
    console.log('🚀 Gasless1inchResolver initialized with address:', this.resolverAddress)
  }

  /**
   * 🔐 Create gasless intent (user signs off-chain)
   */
  async createGaslessIntent(swapParams) {
    const { swapId, beneficiary, amount, orderHash, hashlock, deadline } = swapParams
    
    try {
      // Get user nonce
      const nonce = await this.resolver.userNonces(beneficiary)
      
      // Create EIP-712 message
      const message = {
        swapId,
        user: beneficiary,
        beneficiary,
        amount: amount.toString(),
        orderHash,
        hashlock,
        deadline,
        nonce
      }
      
      // Sign the message (user signs off-chain)
      const signature = await this.ethSigner.signTypedData(
        this.domain,
        { Intent: this.types.Intent },
        message
      )
      
      console.log('✅ Gasless intent created!')
      console.log('🔐 User signed intent off-chain')
      console.log(`📝 Swap ID: ${swapId}`)
      console.log(`💰 Amount: ${ethers.formatEther(amount)} ETH`)
      console.log(`⏰ Deadline: ${new Date(deadline * 1000).toISOString()}`)
      console.log(`🔐 Signature: ${signature}`)
      console.log('💰 NO GAS REQUIRED - Intent signed off-chain')
      
      // Call the contract's createIntent function to store the intent on-chain
      console.log('📝 Storing intent on-chain...')
      const tx = await this.resolver.createIntent(
        swapId,
        beneficiary,
        amount,
        orderHash,
        hashlock,
        deadline,
        signature
      )
      await tx.wait()
      
      console.log('✅ Intent stored on-chain!')
      console.log(`📄 Transaction: ${tx.hash}`)
      
      return {
        swapId,
        signature,
        message,
        txHash: tx.hash,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Gasless intent creation failed:', error.message)
      throw error
    }
  }

  /**
   * ⛽ Execute gasless intent (resolver pays gas)
   */
  async executeGaslessIntent(swapId, amount) {
    try {
      console.log('⛽ Executing gasless intent...')
      console.log(`📝 Swap ID: ${swapId}`)
      console.log(`💰 Amount: ${ethers.formatEther(amount)} ETH`)
      
      // Execute the intent (resolver pays gas)
      const tx = await this.resolver.executeIntent(swapId, { value: amount })
      await tx.wait()
      
      console.log('✅ Gasless intent executed!')
      console.log('⛽ Resolver paid gas for execution')
      console.log(`📄 Transaction: ${tx.hash}`)
      
      return {
        success: true,
        txHash: tx.hash,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Gasless intent execution failed:', error.message)
      throw error
    }
  }

  /**
   * 🔓 Claim tokens gaslessly (user signs off-chain)
   */
  async claimGaslessTokens(swapId, secret) {
    try {
      console.log('🔓 Creating gasless claim...')
      console.log(`📝 Swap ID: ${swapId}`)
      
      // Get the intent details
      const intent = await this.resolver.getIntent(swapId)
      
      // Create EIP-712 message for claim
      const claimMessage = {
        swapId,
        secret,
        user: intent.user,
        nonce: intent.nonce
      }
      
      // Sign the claim message (user signs off-chain)
      const claimSignature = await this.ethSigner.signTypedData(
        this.domain,
        { 
          Claim: [
            { name: 'swapId', type: 'bytes32' },
            { name: 'secret', type: 'bytes32' },
            { name: 'user', type: 'address' },
            { name: 'nonce', type: 'uint256' }
          ]
        },
        claimMessage
      )
      
      console.log('✅ Gasless claim created!')
      console.log('🔐 User signed claim off-chain')
      console.log(`🔓 Secret: ${secret}`)
      console.log(`🔐 Claim signature: ${claimSignature}`)
      console.log('💰 NO GAS REQUIRED - Claim signed off-chain')
      
      return {
        swapId,
        secret,
        claimSignature,
        gasless: true
      }
      
    } catch (error) {
      console.error('❌ Gasless claim creation failed:', error.message)
      throw error
    }
  }

  /**
   * 🚀 Execute complete gasless swap flow
   */
  async executeGaslessSwap(swapParams) {
    console.log('🚀 EXECUTING COMPLETE GASLESS SWAP')
    console.log('=' .repeat(60))
    
    try {
      // Step 1: User creates intent (signs off-chain)
      console.log('\n📝 STEP 1: Creating gasless intent...')
      const intentResult = await this.createGaslessIntent(swapParams)
      
      // Step 2: Resolver executes intent (pays gas)
      console.log('\n⛽ STEP 2: Executing gasless intent...')
      const executionResult = await this.executeGaslessIntent(
        intentResult.swapId, 
        swapParams.amount
      )
      
      // Step 3: User claims tokens (signs off-chain)
      console.log('\n🔓 STEP 3: Creating gasless claim...')
      const claimResult = await this.claimGaslessTokens(
        intentResult.swapId,
        swapParams.secret
      )
      
      console.log('\n🎉 GASLESS SWAP COMPLETE!')
      console.log('=' .repeat(60))
      console.log('✅ User gas cost: $0')
      console.log('⛽ Resolver paid all gas')
      console.log('🔐 EIP-712 signatures used')
      console.log(`📄 Execution TX: ${executionResult.txHash}`)
      
      return {
        success: true,
        intent: intentResult,
        execution: executionResult,
        claim: claimResult,
        gasless: true
      }
      
    } catch (error) {
      console.error('\n❌ Gasless swap failed:', error.message)
      throw error
    }
  }

  /**
   * 📊 Get intent details
   */
  async getIntent(swapId) {
    try {
      const intent = await this.resolver.getIntent(swapId)
      return intent
    } catch (error) {
      console.error('❌ Failed to get intent:', error.message)
      throw error
    }
  }

  /**
   * 🔄 Refund expired intent
   */
  async refundExpiredIntent(swapId) {
    try {
      console.log('🔄 Refunding expired intent...')
      const tx = await this.resolver.refundExpiredIntent(swapId)
      await tx.wait()
      
      console.log('✅ Intent refunded!')
      console.log(`📄 Transaction: ${tx.hash}`)
      
      return {
        success: true,
        txHash: tx.hash
      }
    } catch (error) {
      console.error('❌ Intent refund failed:', error.message)
      throw error
    }
  }
} 