import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

async function checkRAM() {
  try {
    console.log('🔍 Checking RAM status...')
    
    const rpc = new JsonRpc('https://jungle4.cryptolions.io', { fetch })
    const accountInfo = await rpc.get_account('quicksnake34')
    
    console.log('💰 Balance:', accountInfo.core_liquid_balance)
    console.log('📊 RAM usage:', accountInfo.ram_usage, 'bytes')
    console.log('📊 RAM quota:', accountInfo.ram_quota, 'bytes')
    console.log('📊 Available RAM:', accountInfo.ram_quota - accountInfo.ram_usage, 'bytes')
    
    const neededRAM = 594424 // bytes needed for deployment
    const availableRAM = accountInfo.ram_quota - accountInfo.ram_usage
    
    console.log('\n📋 Deployment Analysis:')
    console.log('📦 RAM needed for deployment:', neededRAM, 'bytes')
    console.log('📦 Available RAM:', availableRAM, 'bytes')
    
    if (availableRAM >= neededRAM) {
      console.log('✅ Sufficient RAM available!')
    } else {
      const additionalRAM = neededRAM - availableRAM
      console.log('❌ Need additional RAM:', additionalRAM, 'bytes')
      console.log('💰 Approximate cost:', Math.ceil(additionalRAM / 1000), 'EOS')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkRAM() 