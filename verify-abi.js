import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

async function verifyABI() {
  try {
    console.log('🔍 VERIFYING ABI DEPLOYMENT')
    console.log('=' .repeat(50))
    
    const rpc = new JsonRpc('https://jungle4.cryptolions.io', { fetch })
    
    // Check contract ABI
    console.log('📋 Checking contract ABI...')
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
        
        // List available tables
        console.log('\n📊 Available tables:')
        abi.abi.tables.forEach(table => {
          console.log(`  - ${table.name}`)
        })
        
        console.log('\n🎉 ABI DEPLOYMENT SUCCESSFUL!')
        console.log('Your contract is now fully deployed with both code and ABI!')
        
      } else {
        console.log('❌ No ABI found')
        console.log('\n📋 To deploy ABI, run:')
        console.log('cleos -u https://jungle4.cryptolions.io set abi quicksnake34 contracts\\eos\\fusionbridge.abi')
      }
    } catch (error) {
      console.log('❌ ABI check failed:', error.message)
      console.log('\n📋 To deploy ABI, run:')
      console.log('cleos -u https://jungle4.cryptolions.io set abi quicksnake34 contracts\\eos\\fusionbridge.abi')
    }
    
    // Check contract code
    console.log('\n📦 Checking contract code...')
    const code = await rpc.get_code('quicksnake34')
    
    if (code.wasm) {
      console.log('✅ Contract code deployed!')
      console.log(`📊 WASM size: ${code.wasm.length} bytes`)
    } else {
      console.log('❌ No contract code found')
    }
    
    // Summary
    console.log('\n📊 FINAL DEPLOYMENT STATUS:')
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
        console.log('\n🎉 FULLY DEPLOYED CONTRACT!')
      } else {
        console.log('❌ Contract ABI: NOT DEPLOYED')
        console.log('\n⚠️  PARTIALLY DEPLOYED - ABI needed')
      }
    } catch (error) {
      console.log('❌ Contract ABI: NOT DEPLOYED')
      console.log('\n⚠️  PARTIALLY DEPLOYED - ABI needed')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyABI() 