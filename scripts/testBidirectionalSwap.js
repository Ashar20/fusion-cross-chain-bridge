#!/usr/bin/env node

/**
 * 🧪 TEST BIDIRECTIONAL SWAP
 * 
 * Test script for individual directions of the bidirectional swap system
 * Usage: node scripts/testBidirectionalSwap.js [direction] [amount]
 * 
 * Examples:
 * - node scripts/testBidirectionalSwap.js EOS_TO_ETH 0.0005
 * - node scripts/testBidirectionalSwap.js ETH_TO_EOS 0.1000
 */

import { BidirectionalSwap } from './bidirectionalSwap.js'
import dotenv from 'dotenv'

dotenv.config()

async function testBidirectionalSwap() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('🧪 TEST BIDIRECTIONAL SWAP')
    console.log('=' .repeat(50))
    console.log('Usage: node scripts/testBidirectionalSwap.js [direction] [amount]')
    console.log('')
    console.log('Directions:')
    console.log('  EOS_TO_ETH - Swap EOS for ETH')
    console.log('  ETH_TO_EOS - Swap ETH for EOS')
    console.log('')
    console.log('Examples:')
    console.log('  node scripts/testBidirectionalSwap.js EOS_TO_ETH 0.0005')
    console.log('  node scripts/testBidirectionalSwap.js ETH_TO_EOS 0.1000')
    console.log('')
    process.exit(1)
  }
  
  const direction = args[0].toUpperCase()
  const amount = parseFloat(args[1])
  
  if (!['EOS_TO_ETH', 'ETH_TO_EOS'].includes(direction)) {
    console.error('❌ Invalid direction. Must be EOS_TO_ETH or ETH_TO_EOS')
    process.exit(1)
  }
  
  if (isNaN(amount) || amount <= 0) {
    console.error('❌ Invalid amount. Must be a positive number')
    process.exit(1)
  }
  
  try {
    console.log('🧪 TESTING BIDIRECTIONAL SWAP')
    console.log('=' .repeat(50))
    console.log(`Direction: ${direction}`)
    console.log(`Amount: ${amount}`)
    console.log('')
    
    const swap = new BidirectionalSwap()
    await swap.initialize()
    
    const result = await swap.executeBidirectionalSwap(direction, amount)
    
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!')
    console.log('=' .repeat(50))
    console.log(`✅ Direction: ${result.direction}`)
    console.log(`✅ Success: ${result.profitAnalysis.success ? 'YES' : 'NO'}`)
    console.log(`✅ Profit: $${result.profitAnalysis.totalProfitUSD}`)
    
    return result
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testBidirectionalSwap() 