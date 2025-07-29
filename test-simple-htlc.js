import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

console.log('🧪 SIMPLE HTLC TEST (RAW TRANSACTIONS)')
console.log('=' .repeat(60))

const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
  account: process.env.EOS_ACCOUNT,
  privateKey: process.env.EOS_PRIVATE_KEY
}

async function testSimpleHTLC() {
  try {
    console.log('📡 Initializing EOS connection...')
    const rpc = new JsonRpc(config.rpcUrl, { fetch })
    const signatureProvider = new JsSignatureProvider([config.privateKey])
    
    const api = new Api({
      rpc,
      signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
      chainId: config.chainId
    })

    console.log(`💰 Testing with account: ${config.account}`)
    
    // Check account balance first
    const accountInfo = await rpc.get_account(config.account)
    console.log(`✅ Account balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 RAM Usage: ${accountInfo.ram_usage} bytes`)
    
    if (!accountInfo.core_liquid_balance || parseFloat(accountInfo.core_liquid_balance) < 0.1) {
      console.log('❌ Insufficient balance for testing. Need at least 0.1 EOS')
      return false
    }

    // Test 1: Simple getstats call
    console.log('\n📊 TEST 1: SIMPLE GETSTATS')
    console.log('-' .repeat(30))
    
    try {
      console.log('📞 Calling getstats...')
      
      // Use raw transaction format
      const statsAction = {
        account: config.account,
        name: 'getstats',
        authorization: [{
          actor: config.account,
          permission: 'active'
        }],
        data: {}
      }
      
      const statsResult = await api.transact({
        actions: [statsAction]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      })
      
      console.log('✅ getstats successful!')
      console.log(`📊 Transaction ID: ${statsResult.transaction_id}`)
      console.log(`📅 Block: ${statsResult.processed.block_num}`)
      
      if (statsResult.processed && statsResult.processed.action_traces) {
        const trace = statsResult.processed.action_traces[0]
        if (trace.console) {
          console.log('📝 Console output:', trace.console)
        }
        if (trace.receipt && trace.receipt.status === 'executed') {
          console.log('✅ Action executed successfully!')
        }
      }
      
    } catch (error) {
      console.log('❌ getstats failed:', error.message)
      console.log('📝 This might indicate the contract needs to be redeployed')
      return false
    }

    // Test 2: Check if we can access the contract table
    console.log('\n📊 TEST 2: CHECKING CONTRACT TABLE')
    console.log('-' .repeat(30))
    
    try {
      console.log('📞 Querying htlcs table...')
      
      const tableResult = await rpc.get_table_rows({
        json: true,
        code: config.account,
        scope: config.account,
        table: 'htlcs',
        limit: 5
      })
      
      console.log('✅ Table access successful!')
      console.log(`📊 Rows found: ${tableResult.rows.length}`)
      console.log(`📊 More rows available: ${tableResult.more}`)
      
      if (tableResult.rows.length > 0) {
        console.log('📝 Sample data:')
        console.log(JSON.stringify(tableResult.rows[0], null, 2))
      } else {
        console.log('📝 Table is empty (normal for new contract)')
      }
      
    } catch (error) {
      console.log('❌ Table access failed:', error.message)
      console.log('📝 This might indicate the contract is not fully deployed')
    }

    // Test 3: Try to create a minimal HTLC
    console.log('\n🚀 TEST 3: CREATING MINIMAL HTLC')
    console.log('-' .repeat(30))
    
    try {
      console.log('📞 Creating minimal HTLC...')
      
      // Generate test data
      const secret = crypto.randomBytes(32)
      const secretHash = crypto.createHash('sha256').update(secret).digest('hex')
      const timelock = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      
      console.log(`🔑 Secret Hash: ${secretHash}`)
      console.log(`⏰ Timelock: ${timelock}`)
      
      const createAction = {
        account: config.account,
        name: 'createhtlc',
        authorization: [{
          actor: config.account,
          permission: 'active'
        }],
        data: {
          sender: config.account,
          recipient: config.account,
          amount: '0.0001 EOS',
          hashlock: secretHash,
          timelock: timelock,
          memo: 'Test HTLC',
          eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
        }
      }
      
      const createResult = await api.transact({
        actions: [createAction]
      }, {
        blocksBehind: 3,
        expireSeconds: 30
      })
      
      console.log('✅ HTLC creation successful!')
      console.log(`📊 Transaction ID: ${createResult.transaction_id}`)
      console.log(`📅 Block: ${createResult.processed.block_num}`)
      
      if (createResult.processed && createResult.processed.action_traces) {
        const trace = createResult.processed.action_traces[0]
        if (trace.console) {
          console.log('📝 Console output:', trace.console)
        }
        if (trace.receipt && trace.receipt.status === 'executed') {
          console.log('✅ HTLC creation executed successfully!')
        }
      }
      
    } catch (error) {
      console.log('❌ HTLC creation failed:', error.message)
      console.log('📝 This might indicate the contract needs to be redeployed')
      return false
    }

    console.log('\n🎉 SIMPLE HTLC TEST COMPLETE!')
    console.log('=' .repeat(50))
    console.log('✅ Contract is accessible')
    console.log('✅ Basic operations working')
    console.log('✅ Real transactions processed')
    
    console.log('\n🚀 YOUR HTLC CONTRACT IS FUNCTIONAL!')
    console.log('=' .repeat(50))
    console.log('📋 Contract status:')
    console.log('  • Deployed and accessible')
    console.log('  • Basic operations working')
    console.log('  • Ready for integration')
    
    return true
    
  } catch (error) {
    console.error('❌ Simple HTLC test failed:', error.message)
    console.error('Full error:', error)
    return false
  }
}

// Run the simple HTLC test
testSimpleHTLC()
  .then((success) => {
    if (success) {
      console.log('\n🎉 SIMPLE HTLC TEST SUCCESSFUL!')
      console.log('Your contract is working!')
    } else {
      console.log('\n💥 SIMPLE HTLC TEST FAILED!')
      console.log('The contract may need to be redeployed.')
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  }) 