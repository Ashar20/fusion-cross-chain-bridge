#!/usr/bin/env node

/**
 * 🔄 COMPLETE ATOMIC SWAP (FIXED)
 * 
 * Completes the atomic swap by calculating the escrow ID and claiming funds
 */

import { ethers } from 'ethers'
import { RealEOSIntegration } from '../lib/realEOSIntegration.js'
import dotenv from 'dotenv'

dotenv.config()

// Contract details
const CONTRACT_ADDRESS = '0x583F57CA7b2AEdaF2A34480C70BD22764d72AaD2'
const CONTRACT_ABI = [
  "function withdrawWithSecret(bytes32 _escrowId, bytes32 _secret) external returns (bool)",
  "function getEscrow(bytes32 _escrowId) external view returns (tuple(address initiator, address recipient, address resolver, uint256 amount, bytes32 hashlock, uint256 timelock, bool withdrawn, bool refunded))",
  "event HTLCSecretRevealed(bytes32 indexed escrowId, bytes32 indexed secret)",
  "event HTLCWithdrawn(bytes32 indexed escrowId, address indexed recipient, uint256 amount)"
]

// From the previous swap execution
const SWAP_PARAMS = {
  secret: '0x629bdb0a46c8f211efa5b9326a14a800795e4bf02de79911cf6489d57dc7090f',
  hashlock: '0x85b44f77b40adf1579f44f932fba7eb8e090c8fc23befda64e7c03099450cebd',
  timelock: 1753603576, // 2025-07-27T12:46:16.000Z converted to timestamp
  escrowTxHash: '0xebac80c3e2b0768fd7faabe2cd752fdc7cd3f99fe42da0947ee79c0803efdb57',
  initiator: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
  recipient: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
  blockTimestamp: 1735297576 // Approximate timestamp from the transaction
}

async function completeAtomicSwap() {
  console.log('🔄 COMPLETING ATOMIC SWAP')
  console.log('=' .repeat(60))
  console.log('⚠️  This will reveal the secret and claim funds!')
  console.log('')

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  
  console.log(`👤 Signer: ${signer.address}`)
  console.log(`📋 Contract: ${CONTRACT_ADDRESS}`)
  console.log(`🔑 Secret: ${SWAP_PARAMS.secret}`)
  console.log(`🔒 Hashlock: ${SWAP_PARAMS.hashlock}`)
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  
  try {
    console.log('\n🔍 STEP 1: CALCULATING ESCROW ID')
    console.log('-' .repeat(50))
    
    // The contract generates escrowId like this:
    // keccak256(abi.encodePacked(msg.sender, _recipient, _hashlock, _timelock, block.timestamp))
    // We need to try different timestamps around the block time
    
    const possibleEscrowIds = []
    
    // Try a range of timestamps around the transaction time
    for (let offset = -10; offset <= 10; offset++) {
      const timestamp = SWAP_PARAMS.blockTimestamp + offset
      const escrowId = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'address', 'bytes32', 'uint256', 'uint256'],
          [
            SWAP_PARAMS.initiator,
            SWAP_PARAMS.recipient, 
            SWAP_PARAMS.hashlock,
            SWAP_PARAMS.timelock,
            timestamp
          ]
        )
      )
      possibleEscrowIds.push({ escrowId, timestamp })
    }
    
    console.log(`🔍 Trying ${possibleEscrowIds.length} possible escrow IDs...`)
    
    let validEscrowId = null
    let escrowDetails = null
    
    for (const { escrowId, timestamp } of possibleEscrowIds) {
      try {
        const details = await contract.getEscrow(escrowId)
        // Check if this escrow exists (initiator won't be zero address)
        if (details.initiator !== '0x0000000000000000000000000000000000000000') {
          console.log(`✅ Found valid escrow ID: ${escrowId}`)
          console.log(`📅 Timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})`)
          validEscrowId = escrowId
          escrowDetails = details
          break
        }
      } catch (e) {
        // This escrow ID doesn't exist, continue
      }
    }
    
    if (!validEscrowId) {
      // Let's try to get the actual transaction and read logs more carefully
      console.log('🔍 Trying to parse transaction logs more carefully...')
      
      const tx = await provider.getTransaction(SWAP_PARAMS.escrowTxHash)
      const receipt = await provider.getTransactionReceipt(SWAP_PARAMS.escrowTxHash)
      
      console.log(`📦 Block Number: ${receipt.blockNumber}`)
      console.log(`📅 Transaction timestamp from block...`)
      
      const block = await provider.getBlock(receipt.blockNumber)
      const actualTimestamp = block.timestamp
      console.log(`📅 Actual block timestamp: ${actualTimestamp} (${new Date(actualTimestamp * 1000).toISOString()})`)
      
      // Try with the actual block timestamp
      const escrowId = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'address', 'bytes32', 'uint256', 'uint256'],
          [
            SWAP_PARAMS.initiator,
            SWAP_PARAMS.recipient,
            SWAP_PARAMS.hashlock,
            SWAP_PARAMS.timelock,
            actualTimestamp
          ]
        )
      )
      
      console.log(`🔍 Trying escrow ID with actual timestamp: ${escrowId}`)
      
      try {
        const details = await contract.getEscrow(escrowId)
        if (details.initiator !== '0x0000000000000000000000000000000000000000') {
          console.log(`✅ Found valid escrow ID with actual timestamp!`)
          validEscrowId = escrowId
          escrowDetails = details
        }
      } catch (e) {
        console.log('❌ Still no valid escrow found')
      }
    }
    
    if (!validEscrowId) {
      throw new Error('Could not find valid escrow ID. The escrow may not exist or parameters may be incorrect.')
    }
    
    console.log('\n🔍 STEP 2: VERIFYING ESCROW DETAILS')
    console.log('-' .repeat(50))
    
    console.log('📋 Escrow Details:')
    console.log(`Escrow ID: ${validEscrowId}`)
    console.log(`Initiator: ${escrowDetails.initiator}`)
    console.log(`Recipient: ${escrowDetails.recipient}`)
    console.log(`Resolver: ${escrowDetails.resolver}`)
    console.log(`Amount: ${ethers.formatEther(escrowDetails.amount)} ETH`)
    console.log(`Hashlock: ${escrowDetails.hashlock}`)
    console.log(`Timelock: ${new Date(Number(escrowDetails.timelock) * 1000).toISOString()}`)
    console.log(`Withdrawn: ${escrowDetails.withdrawn}`)
    console.log(`Refunded: ${escrowDetails.refunded}`)
    
    // Verify the hashlock matches our secret
    const computedHash = ethers.keccak256(SWAP_PARAMS.secret)
    console.log('\n🔐 Secret Verification:')
    console.log(`Expected: ${escrowDetails.hashlock}`)
    console.log(`Computed: ${computedHash}`)
    console.log(`Match: ${computedHash === escrowDetails.hashlock ? '✅' : '❌'}`)
    
    if (computedHash !== escrowDetails.hashlock) {
      throw new Error('Secret does not match hashlock!')
    }
    
    if (escrowDetails.withdrawn) {
      console.log('⚠️  Escrow already withdrawn!')
      return { success: false, reason: 'Already withdrawn' }
    }
    
    if (escrowDetails.refunded) {
      console.log('⚠️  Escrow already refunded!')
      return { success: false, reason: 'Already refunded' }
    }
    
    // Check if timelock has expired
    const now = Math.floor(Date.now() / 1000)
    if (now >= Number(escrowDetails.timelock)) {
      throw new Error('Escrow has expired! Use refund function instead.')
    }
    
    console.log('\n💰 STEP 3: WITHDRAWING ETH WITH SECRET')
    console.log('-' .repeat(50))
    console.log(`Amount to withdraw: ${ethers.formatEther(escrowDetails.amount)} ETH`)
    console.log(`Recipient: ${escrowDetails.recipient}`)
    
    // Get balance before withdrawal
    const balanceBefore = await provider.getBalance(escrowDetails.recipient)
    console.log(`Balance before: ${ethers.formatEther(balanceBefore)} ETH`)
    
    // Execute withdrawal
    console.log('🔄 Executing withdrawal...')
    const withdrawTx = await contract.withdrawWithSecret(validEscrowId, SWAP_PARAMS.secret, {
      gasLimit: 300000
    })
    
    console.log('✅ Withdrawal transaction broadcast!')
    console.log(`📍 TX Hash: ${withdrawTx.hash}`)
    console.log(`🔗 Explorer: https://sepolia.etherscan.io/tx/${withdrawTx.hash}`)
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...')
    const receipt = await withdrawTx.wait()
    console.log('✅ Transaction confirmed!')
    console.log(`📦 Block: ${receipt.blockNumber}`)
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`)
    
    // Check balance after withdrawal
    const balanceAfter = await provider.getBalance(escrowDetails.recipient)
    const gained = balanceAfter - balanceBefore
    console.log(`Balance after: ${ethers.formatEther(balanceAfter)} ETH`)
    console.log(`💰 NET GAINED: ${ethers.formatEther(gained)} ETH`)
    
    // Parse withdrawal events
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log)
        if (parsedLog.name === 'HTLCSecretRevealed') {
          console.log(`🔓 Secret revealed: ${parsedLog.args.secret}`)
        }
        if (parsedLog.name === 'HTLCWithdrawn') {
          console.log(`💰 Withdrawn amount: ${ethers.formatEther(parsedLog.args.amount)} ETH`)
          console.log(`👤 Withdrawn to: ${parsedLog.args.recipient}`)
        }
      } catch (e) {
        // Ignore unparseable logs
      }
    }
    
    console.log('\n🌴 STEP 4: CLAIMING EOS WITH REVEALED SECRET')
    console.log('-' .repeat(50))
    
    // Initialize EOS integration
    const eosIntegration = new RealEOSIntegration({
      rpcUrl: process.env.EOS_RPC_URL,
      account: process.env.EOS_ACCOUNT,
      privateKey: process.env.EOS_PRIVATE_KEY
    })
    await eosIntegration.initialize()
    
    // Claim EOS with the revealed secret
    const eosClaimResult = await eosIntegration.claimRealEOSHTLC({
      htlcId: 'eos_753357553d7a2b382ec5be3a395bb01d3aea859693945137d55cce9ba356be22',
      secret: SWAP_PARAMS.secret,
      claimer: 'silaslist123'
    })
    
    console.log('✅ EOS claim completed!')
    console.log(`📍 EOS TX: ${eosClaimResult.transaction_id}`)
    console.log(`🔗 Explorer: ${eosIntegration.getEOSExplorerLink(eosClaimResult.transaction_id)}`)
    
    console.log('\n' + '=' .repeat(70))
    console.log('🎉 ATOMIC SWAP COMPLETED SUCCESSFULLY!')
    console.log('=' .repeat(70))
    
    console.log('\n📊 Final Summary:')
    console.log(`✅ ETH Withdrawn: ${ethers.formatEther(escrowDetails.amount)} ETH`)
    console.log(`✅ ETH Recipient: ${escrowDetails.recipient}`)
    console.log(`✅ EOS Claimed: 25.0000 EOS`)
    console.log(`✅ EOS Recipient: silaslist123`)
    console.log(`✅ Secret Revealed: ${SWAP_PARAMS.secret}`)
    
    console.log('\n🔗 Transaction Links:')
    console.log(`ETH Escrow: https://sepolia.etherscan.io/tx/${SWAP_PARAMS.escrowTxHash}`)
    console.log(`ETH Withdrawal: https://sepolia.etherscan.io/tx/${withdrawTx.hash}`)
    console.log(`EOS Claim: ${eosIntegration.getEOSExplorerLink(eosClaimResult.transaction_id)}`)
    
    console.log('\n🏆 CROSS-CHAIN ATOMIC SWAP STATUS: SUCCESS ✅')
    console.log(`💰 YOU RECEIVED ${ethers.formatEther(escrowDetails.amount)} ETH!`)
    
    return {
      success: true,
      ethWithdrawal: {
        txHash: withdrawTx.hash,
        amount: ethers.formatEther(escrowDetails.amount),
        recipient: escrowDetails.recipient,
        escrowId: validEscrowId
      },
      eosClaim: {
        txId: eosClaimResult.transaction_id,
        amount: '25.0000 EOS',
        recipient: 'silaslist123'
      },
      secretRevealed: SWAP_PARAMS.secret
    }
    
  } catch (error) {
    console.error('❌ Atomic swap completion failed:', error.message)
    throw error
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeAtomicSwap().then((result) => {
    if (result && result.success) {
      console.log('\n🎉 Atomic swap completed successfully!')
    }
  }).catch(error => {
    console.error('\n💥 ATOMIC SWAP FAILED:', error.message)
    process.exit(1)
  })
}

export default completeAtomicSwap