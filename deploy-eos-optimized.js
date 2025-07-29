import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

console.log('🚀 OPTIMIZED EOS CONTRACT DEPLOYMENT')
console.log('=' .repeat(50))

// Configuration
const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
  account: process.env.EOS_ACCOUNT,
  privateKey: process.env.EOS_PRIVATE_KEY,
  contractName: 'fusionbridge'
}

async function deployOptimized() {
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

    // Check account info
    console.log(`💰 Checking account: ${config.account}`)
    const accountInfo = await rpc.get_account(config.account)
    console.log(`✅ Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 RAM usage: ${accountInfo.ram_usage} bytes`)
    console.log(`📊 RAM quota: ${accountInfo.ram_quota} bytes`)
    console.log(`📊 Available RAM: ${accountInfo.ram_quota - accountInfo.ram_usage} bytes`)

    // Load contract files
    console.log('📁 Loading contract files...')
    const wasmPath = path.join(process.cwd(), 'contracts', 'eos', 'fusionbridge.wasm')
    const abiPath = path.join(process.cwd(), 'contracts', 'eos', 'fusionbridge.abi')
    
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found: ${wasmPath}`)
    }
    if (!fs.existsSync(abiPath)) {
      throw new Error(`ABI file not found: ${abiPath}`)
    }

    const wasmBuffer = fs.readFileSync(wasmPath)
    const abiBuffer = fs.readFileSync(abiPath)
    console.log(`✅ Files loaded! WASM: ${wasmBuffer.length} bytes, ABI: ${abiBuffer.length} bytes`)

    // Try different deployment strategies
    console.log('\n🔄 Trying deployment strategies...')

    // Strategy 1: Try with minimal transaction settings
    console.log('\n📦 Strategy 1: Minimal transaction settings...')
    try {
      const setCodeResult = await api.transact({
        actions: [{
          account: 'eosio',
          name: 'setcode',
          authorization: [{
            actor: config.account,
            permission: 'active'
          }],
          data: {
            account: config.account,
            vmtype: 0,
            vmversion: 0,
            code: wasmBuffer
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
        maxNetUsageWords: 0, // Let the network decide
        maxCpuUsageMs: 0     // Let the network decide
      })

      console.log('✅ Contract code deployed!')
      console.log('Transaction ID:', setCodeResult.transaction_id)

      // Set contract ABI
      console.log('📋 Setting contract ABI...')
      const setAbiResult = await api.transact({
        actions: [{
          account: 'eosio',
          name: 'setabi',
          authorization: [{
            actor: config.account,
            permission: 'active'
          }],
          data: {
            account: config.account,
            abi: JSON.parse(abiBuffer.toString())
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      })

      console.log('✅ Contract ABI deployed!')
      console.log('Transaction ID:', setAbiResult.transaction_id)

      // Verify deployment
      console.log('🔍 Verifying deployment...')
      const code = await rpc.get_code(config.account)
      
      if (code.wasm) {
        console.log('🎉 CONTRACT DEPLOYMENT SUCCESSFUL!')
        console.log('=' .repeat(50))
        console.log(`📍 Account: ${config.account}`)
        console.log(`📜 Contract: ${config.contractName}`)
        console.log(`📊 WASM Size: ${code.wasm.length} bytes`)
        console.log(`🔗 Network: Jungle4 Testnet`)
        
        return true
      }

    } catch (error) {
      console.log('❌ Strategy 1 failed:', error.message)
    }

    // Strategy 2: Try with different RPC endpoint
    console.log('\n📦 Strategy 2: Different RPC endpoint...')
    try {
      const alternativeRpc = new JsonRpc('https://jungle4.eossweden.org', { fetch })
      const alternativeApi = new Api({
        rpc: alternativeRpc,
        signatureProvider,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
        chainId: config.chainId
      })

      const setCodeResult = await alternativeApi.transact({
        actions: [{
          account: 'eosio',
          name: 'setcode',
          authorization: [{
            actor: config.account,
            permission: 'active'
          }],
          data: {
            account: config.account,
            vmtype: 0,
            vmversion: 0,
            code: wasmBuffer
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      })

      console.log('✅ Contract code deployed via alternative RPC!')
      console.log('Transaction ID:', setCodeResult.transaction_id)

      // Set ABI
      const setAbiResult = await alternativeApi.transact({
        actions: [{
          account: 'eosio',
          name: 'setabi',
          authorization: [{
            actor: config.account,
            permission: 'active'
          }],
          data: {
            account: config.account,
            abi: JSON.parse(abiBuffer.toString())
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      })

      console.log('✅ Contract ABI deployed!')
      console.log('Transaction ID:', setAbiResult.transaction_id)

      // Verify
      const code = await alternativeRpc.get_code(config.account)
      if (code.wasm) {
        console.log('🎉 CONTRACT DEPLOYMENT SUCCESSFUL!')
        return true
      }

    } catch (error) {
      console.log('❌ Strategy 2 failed:', error.message)
    }

    // Strategy 3: Try with smaller chunks (simplified)
    console.log('\n📦 Strategy 3: Manual deployment instructions...')
    console.log('Since automated deployment failed, here are manual steps:')
    console.log('\n1. Install EOSIO software:')
    console.log('   - Download from: https://github.com/EOSIO/eos/releases')
    console.log('   - Extract to C:\\eosio')
    console.log('   - Add C:\\eosio\\bin to PATH')
    
    console.log('\n2. Deploy contract:')
    console.log('   cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts\\eos fusionbridge.wasm fusionbridge.abi')
    
    console.log('\n3. Or use online tools:')
    console.log('   - EOS Studio: https://eosstudio.io/')
    console.log('   - Bloks.io: https://jungle.bloks.io/')

    return false

  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    return false
  }
}

// Run deployment
deployOptimized()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Optimized deployment successful!')
    } else {
      console.log('\n⚠️  Manual deployment required')
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  }) 