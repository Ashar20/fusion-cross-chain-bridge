#!/usr/bin/env node

/**
 * 🔍 INSPECT TRANSACTION LOGS
 * 
 * Inspects the transaction logs to find the exact escrow ID
 */

import { ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

const TX_HASH = '0xebac80c3e2b0768fd7faabe2cd752fdc7cd3f99fe42da0947ee79c0803efdb57'
const CONTRACT_ADDRESS = '0x583F57CA7b2AEdaF2A34480C70BD22764d72AaD2'

async function inspectTransaction() {
  console.log('🔍 INSPECTING TRANSACTION LOGS')
  console.log('=' .repeat(60))
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  
  try {
    const receipt = await provider.getTransactionReceipt(TX_HASH)
    if (!receipt) {
      throw new Error('Transaction receipt not found')
    }
    
    console.log(`📍 Transaction: ${TX_HASH}`)
    console.log(`📦 Block: ${receipt.blockNumber}`)
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`)
    console.log(`📋 Contract: ${CONTRACT_ADDRESS}`)
    console.log(`🏷️  Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`)
    
    console.log('\n📄 TRANSACTION LOGS:')
    console.log('-' .repeat(50))
    
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i]
      console.log(`\nLog ${i}:`)
      console.log(`  Address: ${log.address}`)
      console.log(`  Topics:`)
      log.topics.forEach((topic, j) => {
        console.log(`    [${j}]: ${topic}`)
      })
      console.log(`  Data: ${log.data}`)
      
      // Check if this log is from our contract
      if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
        console.log(`  ✅ This log is from our HTLC contract!`)
        
        // HTLCEscrowCreated event signature
        const escrowCreatedSig = ethers.id('HTLCEscrowCreated(bytes32,address,address,uint256,bytes32,uint256)')
        console.log(`  Expected event signature: ${escrowCreatedSig}`)
        
        if (log.topics[0] === escrowCreatedSig) {
          console.log(`  🎯 This is the HTLCEscrowCreated event!`)
          console.log(`  📋 Event Details:`)
          console.log(`    Escrow ID (topic[1]): ${log.topics[1]}`)
          console.log(`    Initiator (topic[2]): ${log.topics[2]}`)
          console.log(`    Recipient (topic[3]): ${log.topics[3]}`)
          
          // Decode the data field for non-indexed parameters
          const abiCoder = new ethers.AbiCoder()
          try {
            const decoded = abiCoder.decode(['uint256', 'bytes32', 'uint256'], log.data)
            console.log(`    Amount: ${ethers.formatEther(decoded[0])} ETH`)
            console.log(`    Hashlock: ${decoded[1]}`)
            console.log(`    Timelock: ${decoded[2]} (${new Date(Number(decoded[2]) * 1000).toISOString()})`)
          } catch (e) {
            console.log(`    Could not decode data: ${e.message}`)
          }
          
          // The escrow ID is in topics[1]
          const escrowId = log.topics[1]
          console.log(`\n🔑 FOUND ESCROW ID: ${escrowId}`)
          
          // Now let's verify this escrow exists in the contract
          const contractABI = [
            "function getEscrow(bytes32 _escrowId) external view returns (tuple(address initiator, address recipient, address resolver, uint256 amount, bytes32 hashlock, uint256 timelock, bool withdrawn, bool refunded))"
          ]
          
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)
          
          try {
            const escrowDetails = await contract.getEscrow(escrowId)
            console.log(`\n✅ ESCROW VERIFICATION:`)
            console.log(`  Initiator: ${escrowDetails.initiator}`)
            console.log(`  Recipient: ${escrowDetails.recipient}`)
            console.log(`  Resolver: ${escrowDetails.resolver}`)
            console.log(`  Amount: ${ethers.formatEther(escrowDetails.amount)} ETH`)
            console.log(`  Hashlock: ${escrowDetails.hashlock}`)
            console.log(`  Timelock: ${new Date(Number(escrowDetails.timelock) * 1000).toISOString()}`)
            console.log(`  Withdrawn: ${escrowDetails.withdrawn}`)
            console.log(`  Refunded: ${escrowDetails.refunded}`)
            
            return escrowId
            
          } catch (e) {
            console.log(`❌ Could not verify escrow: ${e.message}`)
          }
        }
      }
    }
    
    console.log('\n📄 RAW LOG ANALYSIS COMPLETE')
    
  } catch (error) {
    console.error('❌ Transaction inspection failed:', error.message)
    throw error
  }
}

inspectTransaction().then((escrowId) => {
  if (escrowId) {
    console.log(`\n🎯 SUCCESS: Found escrow ID ${escrowId}`)
  } else {
    console.log('\n❌ Could not find escrow ID')
  }
}).catch(console.error)