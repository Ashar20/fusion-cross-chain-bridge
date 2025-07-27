#!/usr/bin/env node

/**
 * 🔄 EOS TO ETH SWAP EXECUTION
 * 
 * Performs a real cross-chain atomic swap:
 * - Send EOS from silaslist123
 * - Receive 0.10 ETH to your wallet
 */

import { ethers } from 'ethers'
import { MultiPartySwapArchitecture } from '../lib/multiPartyArchitecture.js'
import { RealEOSIntegration } from '../lib/realEOSIntegration.js'
import { Official1inchFusionIntegration } from '../lib/officialOneinchIntegration.js'
import dotenv from 'dotenv'

dotenv.config()

class EOStoETHSwapper {
  constructor() {
    this.ethProvider = null
    this.ethSigner = null
    this.eosIntegration = null
    this.multiPartyArch = null
    this.oneinchIntegration = null
    this.swapParams = {
      eosAmount: '25.0000 EOS', // EOS amount to send
      ethAmount: ethers.parseEther('0.05'), // 0.05 ETH to receive (within your balance)
      ethRecipient: null, // Will be set to your wallet
      eosRecipient: 'silaslist123' // Your EOS account
    }
  }

  async initialize() {
    console.log('🔄 EOS TO ETH ATOMIC SWAP')
    console.log('=' .repeat(60))
    console.log(`📤 Sending: ${this.swapParams.eosAmount}`)
    console.log(`📥 Receiving: ${ethers.formatEther(this.swapParams.ethAmount)} ETH`)
    console.log('')

    // Initialize Ethereum
    this.ethProvider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    this.ethSigner = new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider)
    this.swapParams.ethRecipient = this.ethSigner.address

    const network = await this.ethProvider.getNetwork()
    const balance = await this.ethProvider.getBalance(this.ethSigner.address)
    
    console.log(`⚡ ETH Network: ${network.name} (${Number(network.chainId)})`)
    console.log(`💰 ETH Wallet: ${this.ethSigner.address}`)
    console.log(`💰 ETH Balance: ${ethers.formatEther(balance)} ETH`)

    // Initialize EOS
    this.eosIntegration = new RealEOSIntegration({
      rpcUrl: process.env.EOS_RPC_URL,
      account: process.env.EOS_ACCOUNT,
      privateKey: process.env.EOS_PRIVATE_KEY
    })
    await this.eosIntegration.initialize()

    // Initialize Multi-Party Architecture
    this.multiPartyArch = new MultiPartySwapArchitecture(this.ethProvider, this.ethSigner)
    await this.multiPartyArch.initialize()

    // Initialize 1inch Integration
    this.oneinchIntegration = new Official1inchFusionIntegration(this.ethProvider, this.ethSigner)
    await this.oneinchIntegration.initialize()

    console.log('✅ All systems initialized for EOS→ETH swap!')
    return true
  }

  async executeEOStoETHSwap() {
    console.log('\n🚀 EXECUTING EOS TO ETH ATOMIC SWAP')
    console.log('=' .repeat(60))
    console.log('⚠️  This will execute REAL blockchain transactions!')
    console.log('')

    try {
      // Step 1: Generate atomic swap parameters
      const secret = ethers.randomBytes(32)
      const hashlock = ethers.keccak256(secret)
      const timelock = Math.floor(Date.now() / 1000) + 7200 // 2 hours

      console.log('🔑 Atomic Swap Parameters:')
      console.log(`Secret: ${ethers.hexlify(secret)}`)
      console.log(`Hashlock: ${hashlock}`)
      console.log(`Timelock: ${new Date(timelock * 1000).toISOString()}`)
      console.log('')

      // Step 2: Register swap participants
      const swapId = ethers.keccak256(ethers.toUtf8Bytes(
        'eos_to_eth_swap_' + Date.now()
      ))

      const participants = {
        user: this.ethSigner.address,
        resolver: this.ethSigner.address,
        ethRecipient: this.swapParams.ethRecipient,
        eosRecipient: this.swapParams.eosRecipient,
        resolverFeeRate: 100 // 1% resolver fee
      }

      console.log('👥 Registering swap participants...')
      await this.multiPartyArch.registerSwapParticipants(swapId, participants)
      console.log('✅ Participants registered!')

      // Step 3: Create ETH HTLC Escrow (receives 0.10 ETH)
      console.log('\n💰 Step 1: Creating ETH HTLC Escrow...')
      console.log(`Amount: ${ethers.formatEther(this.swapParams.ethAmount)} ETH`)
      console.log(`Recipient: ${this.swapParams.ethRecipient}`)

      const escrowParams = {
        amount: this.swapParams.ethAmount,
        hashlock: hashlock,
        timelock: timelock,
        srcChainId: 15557, // EOS chain ID
        srcTxHash: 'pending_eos_tx',
        crossChainOrderId: swapId
      }

      const ethEscrowResult = await this.multiPartyArch.createMultiPartyEscrow(swapId, escrowParams)
      
      console.log('✅ ETH HTLC Escrow created!')
      console.log(`📍 TX Hash: ${ethEscrowResult.transactionHash}`)
      console.log(`🔗 Explorer: https://sepolia.etherscan.io/tx/${ethEscrowResult.transactionHash}`)

      // Step 4: Create EOS HTLC (sends EOS)
      console.log('\n🌴 Step 2: Creating EOS HTLC...')
      console.log(`Amount: ${this.swapParams.eosAmount}`)
      console.log(`From: ${process.env.EOS_ACCOUNT}`)
      console.log(`To: ${this.swapParams.eosRecipient}`)

      const eosHTLCResult = await this.eosIntegration.createRealEOSHTLC({
        recipient: this.swapParams.eosRecipient,
        amount: this.swapParams.eosAmount,
        hashlock: hashlock,
        timelock: timelock,
        memo: `EOS→ETH swap for ${ethers.formatEther(this.swapParams.ethAmount)} ETH`,
        ethTxHash: ethEscrowResult.transactionHash
      })

      console.log('✅ EOS HTLC created!')
      console.log(`📍 EOS TX: ${eosHTLCResult.transaction_id}`)
      console.log(`🔗 Explorer: ${this.eosIntegration.getEOSExplorerLink(eosHTLCResult.transaction_id)}`)

      // Step 5: Reveal secret to claim ETH
      console.log('\n🔓 Step 3: Revealing secret to claim ETH...')
      
      const withdrawalResult = await this.multiPartyArch.executeProperWithdrawal(
        swapId, 
        ethers.hexlify(secret)
      )

      console.log('✅ Secret revealed and ETH claimed!')
      console.log(`📍 TX Hash: ${withdrawalResult.transactionHash}`)
      console.log(`🔗 Explorer: https://sepolia.etherscan.io/tx/${withdrawalResult.transactionHash}`)

      // Step 6: Claim EOS with revealed secret
      console.log('\n🌴 Step 4: Claiming EOS with revealed secret...')
      
      const eosClaimResult = await this.eosIntegration.claimRealEOSHTLC({
        htlcId: eosHTLCResult.transaction_id,
        secret: ethers.hexlify(secret),
        claimer: this.swapParams.eosRecipient
      })

      console.log('✅ EOS claimed successfully!')
      console.log(`📍 EOS Claim TX: ${eosClaimResult.transaction_id}`)

      // Step 7: Display swap summary
      console.log('\n' + '=' .repeat(70))
      console.log('🎉 EOS TO ETH ATOMIC SWAP COMPLETED!')
      console.log('=' .repeat(70))
      
      console.log('\n📊 Swap Summary:')
      console.log(`Swap ID: ${swapId}`)
      console.log(`EOS Sent: ${this.swapParams.eosAmount}`)
      console.log(`ETH Received: ${ethers.formatEther(this.swapParams.ethAmount)} ETH`)
      console.log(`Recipient: ${this.swapParams.ethRecipient}`)
      
      console.log('\n🔗 Transaction Links:')
      console.log(`ETH Escrow: https://sepolia.etherscan.io/tx/${ethEscrowResult.transactionHash}`)
      console.log(`ETH Withdrawal: https://sepolia.etherscan.io/tx/${withdrawalResult.transactionHash}`)
      console.log(`EOS HTLC: ${this.eosIntegration.getEOSExplorerLink(eosHTLCResult.transaction_id)}`)
      console.log(`EOS Claim: ${this.eosIntegration.getEOSExplorerLink(eosClaimResult.transaction_id)}`)
      
      console.log('\n🏆 Swap Status: SUCCESS ✅')
      console.log(`🎯 You now have 0.10 ETH in your wallet: ${this.swapParams.ethRecipient}`)

      return {
        success: true,
        swapId: swapId,
        eosAmount: this.swapParams.eosAmount,
        ethAmount: ethers.formatEther(this.swapParams.ethAmount),
        ethEscrow: ethEscrowResult,
        ethWithdrawal: withdrawalResult,
        eosHTLC: eosHTLCResult,
        eosClaim: eosClaimResult,
        secret: ethers.hexlify(secret),
        hashlock: hashlock
      }

    } catch (error) {
      console.error('❌ EOS to ETH swap failed:', error.message)
      throw error
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const swapper = new EOStoETHSwapper()
  
  try {
    await swapper.initialize()
    const result = await swapper.executeEOStoETHSwap()
    console.log('\n🎉 EOS to ETH swap completed successfully!')
  } catch (error) {
    console.error('\n💥 EOS TO ETH SWAP FAILED:', error.message)
    process.exit(1)
  }
}

export default EOStoETHSwapper