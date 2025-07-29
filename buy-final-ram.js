import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

console.log('💰 BUYING FINAL RAM FOR DEPLOYMENT')
console.log('=' .repeat(50))

// Configuration
const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
  account: process.env.EOS_ACCOUNT,
  privateKey: process.env.EOS_PRIVATE_KEY
}

async function buyFinalRAM() {
  try {
    console.log('📡 Connecting to EOS blockchain...')
    
    // Initialize EOS.js
    const rpc = new JsonRpc(config.rpcUrl, { fetch })
    const signatureProvider = new JsSignatureProvider([config.privateKey])
    
    const api = new Api({
      rpc,
      signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
      chainId: config.chainId
    })

    // Check current account info
    console.log(`💰 Checking account: ${config.account}`)
    const accountInfo = await rpc.get_account(config.account)
    console.log(`✅ Current balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 Current RAM usage: ${accountInfo.ram_usage} bytes`)
    console.log(`📊 Current RAM quota: ${accountInfo.ram_quota} bytes`)
    console.log(`📊 Available RAM: ${accountInfo.ram_quota - accountInfo.ram_usage} bytes`)

    // Calculate final RAM needed
    const neededRAM = 594424 // bytes needed for deployment
    const availableRAM = accountInfo.ram_quota - accountInfo.ram_usage
    const additionalRAMNeeded = neededRAM - availableRAM

    console.log(`\n📋 Final RAM Analysis:`)
    console.log(`📦 RAM needed for deployment: ${neededRAM} bytes`)
    console.log(`📦 Available RAM: ${availableRAM} bytes`)
    console.log(`📦 Additional RAM needed: ${additionalRAMNeeded} bytes`)

    if (additionalRAMNeeded <= 0) {
      console.log('✅ Already have sufficient RAM!')
      return true
    }

    // Use most of remaining balance for final RAM purchase
    const balance = parseFloat(accountInfo.core_liquid_balance.replace(' EOS', ''))
    const eosForRAM = Math.min(balance - 1, 7) // Use up to 7 EOS, leave 1 for deployment
    
    console.log(`\n🔄 Buying final RAM...`)
    console.log(`💰 EOS amount for RAM: ${eosForRAM.toFixed(4)} EOS`)
    console.log(`💰 Balance after RAM purchase: ~1.0000 EOS`)

    // Buy RAM
    const buyRamResult = await api.transact({
      actions: [{
        account: 'eosio',
        name: 'buyram',
        authorization: [{
          actor: config.account,
          permission: 'active'
        }],
        data: {
          payer: config.account,
          receiver: config.account,
          quant: `${eosForRAM.toFixed(4)} EOS`
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })

    console.log('✅ Final RAM purchase successful!')
    console.log('Transaction ID:', buyRamResult.transaction_id)

    // Check updated account info
    console.log('\n🔍 Checking updated account info...')
    const updatedAccountInfo = await rpc.get_account(config.account)
    console.log(`💰 New balance: ${updatedAccountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 New RAM usage: ${updatedAccountInfo.ram_usage} bytes`)
    console.log(`📊 New RAM quota: ${updatedAccountInfo.ram_quota} bytes`)
    console.log(`📊 New available RAM: ${updatedAccountInfo.ram_quota - updatedAccountInfo.ram_usage} bytes`)

    const newAvailableRAM = updatedAccountInfo.ram_quota - updatedAccountInfo.ram_usage
    
    if (newAvailableRAM >= neededRAM) {
      console.log('\n🎉 SUFFICIENT RAM ACQUIRED!')
      console.log('Ready for contract deployment!')
      return true
    } else {
      console.log('\n⚠️  Still need more RAM')
      console.log(`📦 Still need: ${neededRAM - newAvailableRAM} bytes`)
      return false
    }

  } catch (error) {
    console.error('❌ Final RAM purchase failed:', error.message)
    console.error('Full error:', error)
    return false
  }
}

// Run RAM purchase
buyFinalRAM()
  .then((success) => {
    if (success) {
      console.log('\n🚀 Now ready for Docker deployment!')
    } else {
      console.log('\n💥 Need more EOS for RAM')
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  }) 