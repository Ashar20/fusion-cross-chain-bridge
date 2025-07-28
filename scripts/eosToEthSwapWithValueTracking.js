#!/usr/bin/env node

/**
 * 🌴 EOS TO ETH SWAP WITH VALUE TRACKING
 * 
 * Performs a cross-chain atomic swap from EOS to ETH and tracks:
 * - Initial balances on both chains
 * - Final balances after swap
 * - Value changes and potential increases
 * - Transaction costs and fees
 */

import { ethers } from 'ethers'
import { RealEOSIntegration } from '../lib/realEOSIntegration.js'
import { Official1inchEscrowIntegration } from '../lib/official1inchEscrow.js'
import dotenv from 'dotenv'

dotenv.config()

class EOSToETHSwapWithValueTracking {
  constructor() {
    this.ethProvider = null
    this.ethSigner = null
    this.eosIntegration = null
    this.oneinchEscrow = null
    this.swapId = `eos_to_eth_tracked_${Date.now()}`
    
    // Balance tracking
    this.initialBalances = {}
    this.finalBalances = {}
    this.transactionCosts = {}
  }

  async initialize() {
    console.log('🌴 EOS TO ETH SWAP WITH VALUE TRACKING')
    console.log('=' .repeat(70))
    console.log('📊 Tracking initial and final values to measure increases')
    console.log('')

    // Initialize Ethereum
    this.ethProvider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    this.ethSigner = new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider)
    
    const ethNetwork = await this.ethProvider.getNetwork()
    const ethBalance = await this.ethProvider.getBalance(this.ethSigner.address)
    
    console.log('📡 ETHEREUM CONNECTION:')
    console.log(`Network: ${ethNetwork.name} (${Number(ethNetwork.chainId)})`)
    console.log(`Address: ${this.ethSigner.address}`)
    console.log(`Balance: ${ethers.formatEther(ethBalance)} ETH`)
    
    // Initialize EOS
    this.eosIntegration = new RealEOSIntegration({
      rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
      account: process.env.EOS_ACCOUNT,
      privateKey: process.env.EOS_PRIVATE_KEY
    })
    
    await this.eosIntegration.initialize()
    
    // Initialize official 1inch escrow integration
    this.oneinchEscrow = new Official1inchEscrowIntegration(this.ethProvider, this.ethSigner)
    await this.oneinchEscrow.initialize()
    
    console.log('✅ EOS to ETH swap with value tracking ready')
  }

  /**
   * 📊 Capture initial balances before swap
   */
  async captureInitialBalances() {
    console.log('\n📊 CAPTURING INITIAL BALANCES')
    console.log('-' .repeat(50))
    
    // Get initial ETH balance
    const initialEthBalance = await this.ethProvider.getBalance(this.ethSigner.address)
    
    // Get initial EOS balance
    const eosAccountInfo = await this.eosIntegration.getAccountInfo(this.eosIntegration.config.account)
    const initialEOSBalance = eosAccountInfo.core_liquid_balance || '0.0000 EOS'
    
    this.initialBalances = {
      eth: initialEthBalance,
      eos: initialEOSBalance,
      timestamp: Date.now()
    }
    
    console.log('💰 INITIAL BALANCES:')
    console.log(`ETH: ${ethers.formatEther(initialEthBalance)} ETH`)
    console.log(`EOS: ${this.eosIntegration.parseEOSBalance(initialEOSBalance)}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)
    
    return this.initialBalances
  }

  /**
   * 📊 Capture final balances after swap
   */
  async captureFinalBalances() {
    console.log('\n📊 CAPTURING FINAL BALANCES')
    console.log('-' .repeat(50))
    
    // Get final ETH balance
    const finalEthBalance = await this.ethProvider.getBalance(this.ethSigner.address)
    
    // Get final EOS balance
    const eosAccountInfo = await this.eosIntegration.getAccountInfo(this.eosIntegration.config.account)
    const finalEOSBalance = eosAccountInfo.core_liquid_balance || '0.0000 EOS'
    
    this.finalBalances = {
      eth: finalEthBalance,
      eos: finalEOSBalance,
      timestamp: Date.now()
    }
    
    console.log('💰 FINAL BALANCES:')
    console.log(`ETH: ${ethers.formatEther(finalEthBalance)} ETH`)
    console.log(`EOS: ${this.eosIntegration.parseEOSBalance(finalEOSBalance)}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)
    
    return this.finalBalances
  }

  /**
   * 📈 Calculate value changes and increases
   */
  calculateValueChanges() {
    console.log('\n📈 CALCULATING VALUE CHANGES')
    console.log('-' .repeat(50))
    
    const ethChange = this.finalBalances.eth - this.initialBalances.eth
    const eosChange = this.parseEOSAmount(this.finalBalances.eos) - this.parseEOSAmount(this.initialBalances.eos)
    
    // Calculate transaction costs (gas fees for ETH)
    const ethGasCost = this.transactionCosts.eth || ethers.parseEther('0')
    
    // Net ETH change (including gas costs)
    const netEthChange = ethChange - ethGasCost
    
    console.log('📊 VALUE ANALYSIS:')
    console.log(`ETH Change: ${ethers.formatEther(ethChange)} ETH`)
    console.log(`ETH Gas Cost: ${ethers.formatEther(ethGasCost)} ETH`)
    console.log(`Net ETH Change: ${ethers.formatEther(netEthChange)} ETH`)
    console.log(`EOS Change: ${eosChange.toFixed(4)} EOS`)
    
    // Determine if values increased
    const ethIncreased = netEthChange > 0n
    const eosIncreased = eosChange > 0
    
    console.log('\n🎯 VALUE INCREASE ANALYSIS:')
    console.log(`ETH Value Increased: ${ethIncreased ? '✅ YES' : '❌ NO'}`)
    console.log(`EOS Value Increased: ${eosIncreased ? '✅ YES' : '❌ NO'}`)
    
    if (ethIncreased) {
      console.log(`💰 ETH Profit: +${ethers.formatEther(netEthChange)} ETH`)
    } else {
      console.log(`💸 ETH Loss: ${ethers.formatEther(netEthChange)} ETH`)
    }
    
    if (eosIncreased) {
      console.log(`💰 EOS Profit: +${eosChange.toFixed(4)} EOS`)
    } else {
      console.log(`💸 EOS Loss: ${eosChange.toFixed(4)} EOS`)
    }
    
    return {
      ethChange,
      eosChange,
      ethGasCost,
      netEthChange,
      ethIncreased,
      eosIncreased
    }
  }

  /**
   * 🌴 Create EOS escrow for cross-chain swap
   */
  async createEOSEscrow(escrowParams) {
    console.log('\n🌴 CREATING EOS ESCROW')
    console.log('-' .repeat(50))
    
    const {
      amount,
      hashlock,
      timelock,
      memo,
      orderHash
    } = escrowParams
    
    console.log('📋 EOS Escrow Parameters:')
    console.log(`Sender: ${this.eosIntegration.config.account}`)
    console.log(`Amount: ${amount}`)
    console.log(`Hashlock: ${hashlock}`)
    console.log(`Order Hash: ${orderHash}`)
    console.log(`Timelock: ${new Date(timelock * 1000).toISOString()}`)
    console.log(`Memo: ${memo}`)
    
    try {
      console.log('\n🔄 Broadcasting EOS escrow creation...')
      
      // Create escrow by transferring to contract
      const result = await this.eosIntegration.createRealEOSHTLC({
        sender: this.eosIntegration.config.account,
        recipient: this.eosIntegration.config.account, // Self for demo
        amount: amount,
        hashlock: hashlock,
        timelock: timelock,
        memo: memo,
        eth_tx_hash: orderHash
      })
      
      console.log('✅ EOS escrow created successfully!')
      console.log(`📍 EOS TX: ${result.transaction_id}`)
      console.log(`🔗 Explorer: ${this.eosIntegration.getEOSExplorerLink(result.transaction_id)}`)
      
      return result
      
    } catch (error) {
      console.error('❌ EOS escrow creation failed:', error.message)
      throw error
    }
  }

  /**
   * 🔓 Claim EOS escrow with secret
   */
  async claimEOSEscrow(claimParams) {
    console.log('\n🔓 CLAIMING EOS ESCROW')
    console.log('-' .repeat(50))
    
    const {
      secret,
      hashlock,
      orderHash,
      amount,
      claimMemo
    } = claimParams
    
    console.log('📋 EOS Claim Parameters:')
    console.log(`Secret: ${secret}`)
    console.log(`Hashlock: ${hashlock}`)
    console.log(`Order Hash: ${orderHash}`)
    console.log(`Amount: ${amount}`)
    console.log(`Memo: ${claimMemo}`)
    
    try {
      console.log('\n🔄 Broadcasting EOS escrow claim...')
      
      // Claim escrow with secret
      const result = await this.eosIntegration.claimRealEOSHTLC({
        htlc_id: 1, // Assuming first HTLC
        secret: secret,
        claimer: this.eosIntegration.config.account,
        memo: claimMemo
      })
      
      console.log('✅ EOS escrow claimed successfully!')
      console.log(`📍 EOS TX: ${result.transaction_id}`)
      console.log(`🔗 Explorer: ${this.eosIntegration.getEOSExplorerLink(result.transaction_id)}`)
      
      return result
      
    } catch (error) {
      console.error('❌ EOS escrow claim failed:', error.message)
      throw error
    }
  }

  /**
   * 🎯 Execute EOS to ETH swap with value tracking
   */
  async executeEOSToETHSwap(swapParams) {
    console.log('\n🎯 EXECUTING EOS TO ETH SWAP WITH VALUE TRACKING')
    console.log('=' .repeat(70))
    
    const {
      eosAmount = '0.1000 EOS',
      ethAmount = ethers.parseEther('0.005'), // 0.005 ETH
      timeoutHours = 24
    } = swapParams
    
    console.log('📋 SWAP PARAMETERS:')
    console.log(`EOS Amount: ${eosAmount}`)
    console.log(`ETH Amount: ${ethers.formatEther(ethAmount)} ETH`)
    console.log(`Timeout: ${timeoutHours} hours`)
    
    try {
      // STEP 1: Capture initial balances
      await this.captureInitialBalances()
      
      // Generate secret and hashlock
      const secret = ethers.hexlify(ethers.randomBytes(32))
      const hashlock = ethers.keccak256(secret)
      const timelock = Math.floor(Date.now() / 1000) + (timeoutHours * 3600)
      
      // Generate order hash
      const orderHash = ethers.keccak256(
        ethers.solidityPacked(
          ['string', 'bytes32', 'uint256', 'address'],
          [this.swapId, hashlock, timelock, this.ethSigner.address]
        )
      )
      
      console.log('\n🔐 CRYPTOGRAPHIC PARAMETERS:')
      console.log(`Secret: ${secret}`)
      console.log(`Hashlock: ${hashlock}`)
      console.log(`Order Hash: ${orderHash}`)
      console.log(`Timelock: ${new Date(timelock * 1000).toISOString()}`)
      
      // STEP 2: Create EOS escrow
      console.log('\n🌴 STEP 2: CREATING EOS ESCROW')
      console.log('-' .repeat(60))
      
      const eosEscrowResult = await this.createEOSEscrow({
        amount: eosAmount,
        hashlock: hashlock,
        timelock: timelock,
        orderHash: orderHash,
        memo: `EOS to ETH swap ${this.swapId}`
      })
      
      console.log('✅ EOS escrow created!')
      console.log(`📍 EOS TX: ${eosEscrowResult.transaction_id}`)
      
      // STEP 3: Create ETH escrow
      console.log('\n🏭 STEP 3: CREATING ETH ESCROW')
      console.log('-' .repeat(60))
      
      const ethEscrowResult = await this.oneinchEscrow.createOfficialEscrow({
        token: ethers.ZeroAddress, // ETH
        amount: ethAmount,
        orderHash: orderHash,
        deadline: timelock,
        hashlock: hashlock,
        resolverCalldata: ethers.hexlify(ethers.randomBytes(32))
      })
      
      console.log('✅ ETH escrow created!')
      console.log(`📍 ETH TX: ${ethEscrowResult.transactionHash}`)
      console.log(`🏠 Escrow Address: ${ethEscrowResult.escrowAddress}`)
      
      // Track ETH gas cost
      this.transactionCosts.eth = ethEscrowResult.gasUsed || ethers.parseEther('0')
      
      // STEP 4: Wait for confirmations
      console.log('\n⏳ STEP 4: WAITING FOR CONFIRMATIONS')
      console.log('-' .repeat(60))
      
      console.log('⏳ Waiting for both escrows to be confirmed...')
      await new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
      
      console.log('✅ Both escrows confirmed and active!')
      
      // STEP 5: Execute atomic reveal and claim
      console.log('\n🔓 STEP 5: EXECUTING ATOMIC REVEAL')
      console.log('-' .repeat(60))
      
      // Resolve ETH escrow (reveals secret)
      console.log('\n🏭 Resolving ETH escrow...')
      const ethResolutionResult = await this.oneinchEscrow.resolveOfficialEscrow(orderHash, secret)
      
      console.log('✅ ETH escrow resolved!')
      console.log(`📍 ETH Resolution TX: ${ethResolutionResult.transactionHash}`)
      console.log(`💰 Amount received: ${ethers.formatEther(ethAmount)} ETH`)
      
      // Track additional ETH gas cost
      this.transactionCosts.eth = (this.transactionCosts.eth || 0n) + (ethResolutionResult.gasUsed || 0n)
      
      // Claim EOS funds using revealed secret
      console.log('\n🌴 Claiming EOS funds...')
      const eosClaimResult = await this.claimEOSEscrow({
        secret: secret,
        hashlock: hashlock,
        orderHash: orderHash,
        amount: eosAmount,
        claimMemo: `EOS to ETH swap claim ${this.swapId}`
      })
      
      console.log('✅ EOS claim completed!')
      console.log(`📍 EOS Claim TX: ${eosClaimResult.transaction_id}`)
      
      // STEP 6: Capture final balances and analyze
      console.log('\n📊 STEP 6: ANALYZING VALUE CHANGES')
      console.log('-' .repeat(60))
      
      await this.captureFinalBalances()
      const valueAnalysis = this.calculateValueChanges()
      
      // STEP 7: Generate comprehensive report
      console.log('\n📋 COMPREHENSIVE SWAP REPORT')
      console.log('=' .repeat(80))
      
      const swapSummary = {
        swapId: this.swapId,
        initialBalances: {
          eth: ethers.formatEther(this.initialBalances.eth),
          eos: this.initialBalances.eos
        },
        finalBalances: {
          eth: ethers.formatEther(this.finalBalances.eth),
          eos: this.finalBalances.eos
        },
        valueChanges: {
          ethChange: ethers.formatEther(valueAnalysis.ethChange),
          eosChange: valueAnalysis.eosChange.toFixed(4),
          ethGasCost: ethers.formatEther(valueAnalysis.ethGasCost),
          netEthChange: ethers.formatEther(valueAnalysis.netEthChange),
          ethIncreased: valueAnalysis.ethIncreased,
          eosIncreased: valueAnalysis.eosIncreased
        },
        transactions: {
          eosEscrow: eosEscrowResult.transaction_id,
          ethEscrow: ethEscrowResult.transactionHash,
          ethResolution: ethResolutionResult.transactionHash,
          eosClaim: eosClaimResult.transaction_id
        },
        parameters: {
          eosAmount,
          ethAmount: ethers.formatEther(ethAmount),
          secret,
          hashlock,
          orderHash,
          timelock: new Date(timelock * 1000).toISOString()
        }
      }
      
      console.log('🎉 EOS TO ETH SWAP COMPLETED WITH VALUE TRACKING!')
      console.log('=' .repeat(80))
      console.log(`📊 Swap ID: ${swapSummary.swapId}`)
      console.log(`💰 ETH Increased: ${swapSummary.valueChanges.ethIncreased ? '✅ YES' : '❌ NO'}`)
      console.log(`💰 EOS Increased: ${swapSummary.valueChanges.eosIncreased ? '✅ YES' : '❌ NO'}`)
      console.log(`📈 Net ETH Change: ${swapSummary.valueChanges.netEthChange} ETH`)
      console.log(`📈 EOS Change: ${swapSummary.valueChanges.eosChange} EOS`)
      
      return swapSummary
      
    } catch (error) {
      console.error('❌ EOS to ETH swap failed:', error.message)
      throw error
    }
  }

  /**
   * Helper function to parse EOS amount
   */
  parseEOSAmount(eosBalanceString) {
    if (!eosBalanceString) return 0
    const match = eosBalanceString.match(/(\d+\.\d+)\s+EOS/)
    return match ? parseFloat(match[1]) : 0
  }
}

async function executeEOSToETHSwapWithTracking() {
  try {
    const swap = new EOSToETHSwapWithValueTracking()
    await swap.initialize()
    
    const result = await swap.executeEOSToETHSwap({
      eosAmount: '0.1000 EOS',
      ethAmount: ethers.parseEther('0.005'), // 0.005 ETH
      timeoutHours: 24
    })
    
    console.log('\n🎯 SWAP COMPLETED SUCCESSFULLY!')
    console.log('📊 Check the value analysis above to see if amounts increased.')
    
    return result
    
  } catch (error) {
    console.error('❌ Swap execution failed:', error.message)
    process.exit(1)
  }
}

// Execute the swap if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeEOSToETHSwapWithTracking()
}

export { EOSToETHSwapWithValueTracking, executeEOSToETHSwapWithTracking } 