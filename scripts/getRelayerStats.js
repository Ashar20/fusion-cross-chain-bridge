#!/usr/bin/env node

/**
 * 📊 GET RELAYER STATISTICS
 * 
 * Simple script to get relayer statistics and performance metrics
 */

import { ethers } from 'ethers'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function getRelayerStats() {
  console.log('📊 Getting Relayer Statistics...')
  console.log('=' .repeat(50))
  
  try {
    // Setup provider
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    
    // Load deployment info
    let relayerAddress = '0x0000000000000000000000000000000000000000'
    try {
      const deploymentInfo = JSON.parse(fs.readFileSync('./relayer-system-deployment.json', 'utf8'))
      relayerAddress = deploymentInfo.relayerSystem.address
    } catch (error) {
      console.log('⚠️ No deployment info found, using default address')
    }
    
    console.log(`📍 Relayer Address: ${relayerAddress}`)
    
    // Relayer contract ABI
    const relayerABI = [
      "function getRelayerStats() external view returns (uint256, uint256, uint256)"
    ]
    
    const relayer = new ethers.Contract(relayerAddress, relayerABI, provider)
    
    // Get stats
    const stats = await relayer.getRelayerStats()
    
    console.log('\n📊 Relayer Statistics:')
    console.log(`Total Executed Intents: ${stats[0]}`)
    console.log(`Batch Size: ${stats[1]}`)
    console.log(`Execution Delay: ${stats[2]}s`)
    
    // Get relayer balance
    const balance = await provider.getBalance(relayerAddress)
    console.log(`Relayer Balance: ${ethers.formatEther(balance)} ETH`)
    
    console.log('\n✅ Relayer stats retrieved successfully!')
    
  } catch (error) {
    console.error('❌ Failed to get relayer stats:', error.message)
  }
}

// Run the script
getRelayerStats().catch(console.error) 