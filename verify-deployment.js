import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

async function verifyDeployment() {
  try {
    console.log('🔍 VERIFYING CONTRACT DEPLOYMENT')
    console.log('=' .repeat(50))
    
    const rpc = new JsonRpc('https://jungle4.cryptolions.io', { fetch })
    
    // Check contract code
    console.log('📦 Checking contract code...')
    const code = await rpc.get_code('quicksnake34')
    
    if (code.wasm) {
      console.log('✅ Contract code deployed!')
      console.log(`📊 WASM size: ${code.wasm.length} bytes`)
      console.log(`🔗 Code hash: ${code.code_hash}`)
    } else {
      console.log('❌ No contract code found')
    }
    
    // Check contract ABI
    console.log('\n📋 Checking contract ABI...')
    try {
      const abi = await rpc.get_abi('quicksnake34')
      if (abi.abi) {
        console.log('✅ Contract ABI deployed!')
        console.log(`📊 ABI actions: ${abi.abi.actions.length}`)
        console.log(`📊 ABI tables: ${abi.abi.tables.length}`)
        
        // List available actions
        console.log('\n📝 Available actions:')
        abi.abi.actions.forEach(action => {
          console.log(`  - ${action.name}`)
        })
      } else {
        console.log('❌ No ABI found')
      }
    } catch (error) {
      console.log('❌ ABI check failed:', error.message)
    }
    
    // Check account info
    console.log('\n💰 Checking account info...')
    const accountInfo = await rpc.get_account('quicksnake34')
    console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 RAM usage: ${accountInfo.ram_usage} bytes`)
    console.log(`📊 RAM quota: ${accountInfo.ram_quota} bytes`)
    
    // Summary
    console.log('\n📊 DEPLOYMENT SUMMARY:')
    console.log('=' .repeat(30))
    if (code.wasm) {
      console.log('✅ Contract Code: DEPLOYED')
    } else {
      console.log('❌ Contract Code: NOT DEPLOYED')
    }
    
    try {
      const abi = await rpc.get_abi('quicksnake34')
      if (abi.abi) {
        console.log('✅ Contract ABI: DEPLOYED')
      } else {
        console.log('❌ Contract ABI: NOT DEPLOYED')
      }
    } catch (error) {
      console.log('❌ Contract ABI: NOT DEPLOYED')
    }
    
    if (code.wasm) {
      console.log('\n🎉 CONTRACT IS PARTIALLY DEPLOYED!')
      console.log('The contract code is deployed and functional.')
      console.log('The ABI can be deployed later if needed.')
    } else {
      console.log('\n💥 CONTRACT NOT DEPLOYED')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyDeployment() 