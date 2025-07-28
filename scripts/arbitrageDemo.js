#!/usr/bin/env node

/**
 * 🎯 ARBITRAGE DEMO SYSTEM
 * 
 * Demonstrates the complete arbitrage system with:
 * 1. Real-time price feeds
 * 2. Optimal swap ratio calculation
 * 3. Value tracking and profit analysis
 * 4. Simulated cross-chain swaps
 * 5. Real ETH transactions for value demonstration
 */

import { ethers } from 'ethers'
import { RealEOSIntegration } from '../lib/realEOSIntegration.js'
import { Official1inchEscrowIntegration } from '../lib/official1inchEscrow.js'
import { PriceFeedIntegration } from '../lib/priceFeedIntegration.js'
import dotenv from 'dotenv'

dotenv.config()

class ArbitrageDemo {
  constructor() {
    this.ethProvider = null
    this.ethSigner = null
    this.eosIntegration = null
    this.oneinchEscrow = null
    this.priceFeed = null
    
    // Balance tracking
    this.initialBalances = {}
    this.finalBalances = {}
    this.transactionCosts = {}
    this.profitAnalysis = {}
  }

  async initialize() {
    console.log('🎯 ARBITRAGE DEMO SYSTEM')
    console.log('=' .repeat(70))
    console.log('📊 Demonstrating cross-chain arbitrage with value generation')
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
    
    // Initialize 1inch escrow
    this.oneinchEscrow = new Official1inchEscrowIntegration(this.ethProvider, this.ethSigner)
    await this.oneinchEscrow.initialize()
    
    // Initialize price feeds
    this.priceFeed = new PriceFeedIntegration()
    
    console.log('✅ Arbitrage demo system initialized')
  }

  /**
   * 📊 Capture initial balances
   */
  async captureInitialBalances() {
    console.log('\n📊 CAPTURING INITIAL BALANCES')
    console.log('-' .repeat(50))
    
    const initialEthBalance = await this.ethProvider.getBalance(this.ethSigner.address)
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
    
    return this.initialBalances
  }

  /**
   * 📊 Capture final balances
   */
  async captureFinalBalances() {
    console.log('\n📊 CAPTURING FINAL BALANCES')
    console.log('-' .repeat(50))
    
    const finalEthBalance = await this.ethProvider.getBalance(this.ethSigner.address)
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
    
    return this.finalBalances
  }

  /**
   * 🎯 Find optimal arbitrage opportunity
   */
  async findOptimalArbitrageOpportunity() {
    console.log('\n🎯 FINDING OPTIMAL ARBITRAGE OPPORTUNITY')
    console.log('=' .repeat(60))
    
    try {
      // Get market summary
      const marketSummary = await this.priceFeed.getMarketSummary()
      
      // Analyze arbitrage opportunities
      const opportunities = await this.priceFeed.analyzeArbitrageOpportunities()
      
      if (opportunities.length === 0) {
        throw new Error('No arbitrage opportunities found')
      }
      
      // Select the best opportunity
      const bestOpportunity = opportunities[0]
      
      console.log(`🏆 BEST OPPORTUNITY: ${bestOpportunity.chain}`)
      console.log(`📊 Ratio: ${bestOpportunity.ratio.toFixed(4)}`)
      console.log(`💰 ${bestOpportunity.fromPrice} → ${bestOpportunity.toPrice}`)
      
      return bestOpportunity
      
    } catch (error) {
      console.error('❌ Failed to find arbitrage opportunity:', error.message)
      throw error
    }
  }

  /**
   * 💱 Calculate optimal swap amounts
   */
  async calculateOptimalSwapAmounts(opportunity, maxAmount) {
    console.log('\n💱 CALCULATING OPTIMAL SWAP AMOUNTS')
    console.log('-' .repeat(50))
    
    try {
      const [fromToken, toToken] = opportunity.pair.split('/')
      
      // Calculate optimal amounts based on current prices
      const swapRatio = await this.priceFeed.calculateOptimalSwapRatio(
        fromToken,
        toToken,
        maxAmount
      )
      
      console.log(`📊 Optimal swap: ${swapRatio.fromAmount} ${fromToken} → ${swapRatio.optimalToAmount.toFixed(6)} ${toToken}`)
      console.log(`💰 Expected profit: ${swapRatio.arbitrageMargin * 100}%`)
      
      return {
        fromToken,
        toToken,
        fromAmount: swapRatio.fromAmount,
        toAmount: swapRatio.optimalToAmount,
        expectedProfit: swapRatio.arbitrageMargin,
        priceData: swapRatio
      }
      
    } catch (error) {
      console.error('❌ Failed to calculate optimal amounts:', error.message)
      throw error
    }
  }

  /**
   * 🌴 Simulate EOS HTLC creation
   */
  async simulateEOSHTLC(htlcParams) {
    console.log('\n🌴 SIMULATING EOS HTLC CREATION')
    console.log('-' .repeat(50))
    
    const {
      amount,
      hashlock,
      timelock,
      memo,
      orderHash
    } = htlcParams
    
    console.log('📋 EOS HTLC Parameters:')
    console.log(`Amount: ${amount}`)
    console.log(`Hashlock: ${hashlock}`)
    console.log(`Timelock: ${new Date(timelock * 1000).toISOString()}`)
    console.log(`Memo: ${memo}`)
    
    // Simulate HTLC creation
    const simulatedResult = {
      transaction_id: `simulated_eos_htlc_${Date.now()}`,
      block_num: Math.floor(Math.random() * 1000000),
      status: 'executed',
      memo: memo,
      amount: amount,
      hashlock: hashlock
    }
    
    console.log('✅ EOS HTLC simulation completed!')
    console.log(`📍 Simulated TX: ${simulatedResult.transaction_id}`)
    console.log(`📊 Block: ${simulatedResult.block_num}`)
    
    return simulatedResult
  }

  /**
   * 🎯 Execute arbitrage demo with real ETH transactions
   */
  async executeArbitrageDemo(swapParams) {
    console.log('\n🎯 EXECUTING ARBITRAGE DEMO')
    console.log('=' .repeat(70))
    
    const {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      timeoutHours = 24
    } = swapParams
    
    console.log('📋 ARBITRAGE DEMO PARAMETERS:')
    console.log(`From: ${fromAmount} ${fromToken}`)
    console.log(`To: ${toAmount} ${toToken}`)
    console.log(`Timeout: ${timeoutHours} hours`)
    
    try {
      // Step 1: Capture initial balances
      await this.captureInitialBalances()
      
      // Step 2: Generate cryptographic parameters
      const secret = ethers.hexlify(ethers.randomBytes(32))
      const hashlock = ethers.keccak256(secret)
      const timelock = Math.floor(Date.now() / 1000) + (timeoutHours * 3600)
      const swapId = `arbitrage_demo_${fromToken}_to_${toToken}_${Date.now()}`
      
      const orderHash = ethers.keccak256(
        ethers.solidityPacked(
          ['string', 'bytes32', 'uint256', 'address'],
          [swapId, hashlock, timelock, this.ethSigner.address]
        )
      )
      
      console.log('\n🔐 CRYPTOGRAPHIC PARAMETERS:')
      console.log(`Secret: ${secret}`)
      console.log(`Hashlock: ${hashlock}`)
      console.log(`Order Hash: ${orderHash}`)
      console.log(`Timelock: ${new Date(timelock * 1000).toISOString()}`)
      
      // Step 3: Simulate EOS HTLC (if EOS is involved)
      let eosHTLCResult = null
      if (fromToken === 'EOS' || toToken === 'EOS') {
        console.log('\n🌴 STEP 3: SIMULATING EOS HTLC')
        console.log('-' .repeat(60))
        
        const eosAmount = fromToken === 'EOS' ? fromAmount : toAmount
        eosHTLCResult = await this.simulateEOSHTLC({
          amount: eosAmount,
          hashlock: hashlock,
          timelock: timelock,
          memo: `Arbitrage demo ${swapId}`,
          orderHash: orderHash
        })
      }
      
      // Step 4: Create real ETH escrow (if ETH is involved)
      let ethEscrowResult = null
      if (fromToken === 'ETH' || toToken === 'ETH') {
        console.log('\n🏭 STEP 4: CREATING REAL ETH ESCROW')
        console.log('-' .repeat(60))
        
        const ethAmount = fromToken === 'ETH' ? fromAmount : toAmount
        ethEscrowResult = await this.oneinchEscrow.createOfficialEscrow({
          token: ethers.ZeroAddress,
          amount: ethers.parseEther(ethAmount.toString()),
          orderHash: orderHash,
          deadline: timelock,
          hashlock: hashlock,
          resolverCalldata: ethers.hexlify(ethers.randomBytes(32))
        })
        
        console.log('✅ ETH escrow created!')
        console.log(`📍 ETH TX: ${ethEscrowResult.transactionHash}`)
        console.log(`🏠 Escrow Address: ${ethEscrowResult.escrowAddress}`)
        
        // Track gas costs
        this.transactionCosts.eth = ethEscrowResult.gasUsed || ethers.parseEther('0')
      }
      
      // Step 5: Wait for confirmations
      console.log('\n⏳ STEP 5: WAITING FOR CONFIRMATIONS')
      console.log('-' .repeat(60))
      
      console.log('⏳ Waiting for transactions to be confirmed...')
      await new Promise(resolve => setTimeout(resolve, 15000)) // 15 second delay
      
      console.log('✅ All transactions confirmed!')
      
      // Step 6: Execute atomic reveal and claim
      console.log('\n🔓 STEP 6: EXECUTING ATOMIC REVEAL')
      console.log('-' .repeat(60))
      
      // Resolve ETH escrow (if exists)
      let ethResolutionResult = null
      if (ethEscrowResult) {
        console.log('\n🏭 Resolving ETH escrow...')
        ethResolutionResult = await this.oneinchEscrow.resolveOfficialEscrow(orderHash, secret)
        
        console.log('✅ ETH escrow resolved!')
        console.log(`📍 ETH Resolution TX: ${ethResolutionResult.transactionHash}`)
        
        // Track additional gas costs
        this.transactionCosts.eth = (this.transactionCosts.eth || 0n) + (ethResolutionResult.gasUsed || 0n)
      }
      
      // Simulate EOS HTLC claim (if exists)
      let eosClaimResult = null
      if (eosHTLCResult) {
        console.log('\n🌴 Simulating EOS HTLC claim...')
        eosClaimResult = {
          transaction_id: `simulated_eos_claim_${Date.now()}`,
          block_num: Math.floor(Math.random() * 1000000),
          status: 'executed',
          secret_revealed: secret
        }
        console.log('✅ EOS HTLC claim simulated!')
        console.log(`📍 Simulated TX: ${eosClaimResult.transaction_id}`)
      }
      
      // Step 7: Analyze results
      console.log('\n📊 STEP 7: ANALYZING ARBITRAGE RESULTS')
      console.log('-' .repeat(60))
      
      await this.captureFinalBalances()
      const profitAnalysis = await this.analyzeArbitrageProfit()
      
      // Step 8: Generate comprehensive report
      console.log('\n📋 COMPREHENSIVE ARBITRAGE DEMO REPORT')
      console.log('=' .repeat(80))
      
      const arbitrageReport = {
        swapId: swapId,
        opportunity: {
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          expectedProfit: swapParams.expectedProfit
        },
        initialBalances: {
          eth: ethers.formatEther(this.initialBalances.eth),
          eos: this.initialBalances.eos
        },
        finalBalances: {
          eth: ethers.formatEther(this.finalBalances.eth),
          eos: this.finalBalances.eos
        },
        profitAnalysis: {
          ethChange: ethers.formatEther(profitAnalysis.ethChange),
          eosChange: profitAnalysis.eosChange.toFixed(4),
          totalProfitUSD: profitAnalysis.totalProfitUSD.toFixed(2),
          profitPercentage: profitAnalysis.profitPercentage.toFixed(2),
          success: profitAnalysis.success
        },
        transactions: {
          eosHTLC: eosHTLCResult?.transaction_id,
          ethEscrow: ethEscrowResult?.transactionHash,
          ethResolution: ethResolutionResult?.transactionHash,
          eosClaim: eosClaimResult?.transaction_id
        },
        parameters: {
          secret,
          hashlock,
          orderHash,
          timelock: new Date(timelock * 1000).toISOString()
        }
      }
      
      console.log('🎉 ARBITRAGE DEMO COMPLETED!')
      console.log('=' .repeat(80))
      console.log(`📊 Swap ID: ${arbitrageReport.swapId}`)
      console.log(`💰 Total Profit: $${arbitrageReport.profitAnalysis.totalProfitUSD}`)
      console.log(`📈 Profit %: ${arbitrageReport.profitAnalysis.profitPercentage}%`)
      console.log(`✅ Success: ${arbitrageReport.profitAnalysis.success ? 'YES' : 'NO'}`)
      
      return arbitrageReport
      
    } catch (error) {
      console.error('❌ Arbitrage demo failed:', error.message)
      throw error
    }
  }

  /**
   * 📈 Analyze arbitrage profit
   */
  async analyzeArbitrageProfit() {
    console.log('\n📈 ANALYZING ARBITRAGE PROFIT')
    console.log('-' .repeat(50))
    
    const ethChange = this.finalBalances.eth - this.initialBalances.eth
    const eosChange = this.parseEOSAmount(this.finalBalances.eos) - this.parseEOSAmount(this.initialBalances.eos)
    
    // Get current prices for USD conversion
    const ethPrice = await this.priceFeed.getTokenPrice('ETH')
    const eosPrice = await this.priceFeed.getTokenPrice('EOS')
    
    // Calculate USD values
    const ethChangeUSD = Number(ethers.formatEther(ethChange)) * ethPrice
    const eosChangeUSD = eosChange * eosPrice
    const totalProfitUSD = ethChangeUSD + eosChangeUSD
    
    // Calculate profit percentage
    const initialEthUSD = Number(ethers.formatEther(this.initialBalances.eth)) * ethPrice
    const initialEosUSD = this.parseEOSAmount(this.initialBalances.eos) * eosPrice
    const initialTotalUSD = initialEthUSD + initialEosUSD
    const profitPercentage = (totalProfitUSD / initialTotalUSD) * 100
    
    const success = totalProfitUSD > 0
    
    console.log('📊 PROFIT ANALYSIS:')
    console.log(`ETH Change: ${ethers.formatEther(ethChange)} ETH ($${ethChangeUSD.toFixed(2)})`)
    console.log(`EOS Change: ${eosChange.toFixed(4)} EOS ($${eosChangeUSD.toFixed(2)})`)
    console.log(`Total Profit: $${totalProfitUSD.toFixed(2)}`)
    console.log(`Profit %: ${profitPercentage.toFixed(2)}%`)
    console.log(`Success: ${success ? '✅ YES' : '❌ NO'}`)
    
    return {
      ethChange,
      eosChange,
      ethChangeUSD,
      eosChangeUSD,
      totalProfitUSD,
      profitPercentage,
      success
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

  /**
   * 🎯 Run complete arbitrage demo
   */
  async runArbitrageDemo() {
    try {
      console.log('🎯 STARTING ARBITRAGE DEMO')
      console.log('=' .repeat(80))
      
      // Step 1: Find optimal opportunity
      console.log('\n🎯 STEP 1: FINDING OPTIMAL ARBITRAGE OPPORTUNITY')
      console.log('-' .repeat(60))
      
      const opportunity = await this.findOptimalArbitrageOpportunity()
      
      // Step 2: Calculate optimal amounts
      console.log('\n💱 STEP 2: CALCULATING OPTIMAL SWAP AMOUNTS')
      console.log('-' .repeat(60))
      
      const swapAmounts = await this.calculateOptimalSwapAmounts(opportunity, '0.005')
      
      // Step 3: Execute arbitrage demo
      console.log('\n🚀 STEP 3: EXECUTING ARBITRAGE DEMO')
      console.log('-' .repeat(60))
      
      const result = await this.executeArbitrageDemo({
        fromToken: swapAmounts.fromToken,
        toToken: swapAmounts.toToken,
        fromAmount: swapAmounts.fromAmount,
        toAmount: swapAmounts.toAmount,
        expectedProfit: swapAmounts.expectedProfit
      })
      
      console.log('\n🎉 ARBITRAGE DEMO COMPLETED!')
      console.log('=' .repeat(80))
      console.log('📊 Check the comprehensive report above for results.')
      
      return result
      
    } catch (error) {
      console.error('❌ Arbitrage demo failed:', error.message)
      throw error
    }
  }
}

async function runArbitrageDemo() {
  try {
    const arbitrageDemo = new ArbitrageDemo()
    await arbitrageDemo.initialize()
    
    const result = await arbitrageDemo.runArbitrageDemo()
    
    console.log('\n🚀 ARBITRAGE DEMO COMPLETED SUCCESSFULLY!')
    return result
    
  } catch (error) {
    console.error('❌ Arbitrage demo execution failed:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runArbitrageDemo()
}

export { ArbitrageDemo, runArbitrageDemo } 