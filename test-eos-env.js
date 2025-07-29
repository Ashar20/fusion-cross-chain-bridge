import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 Testing EOS Environment Variables...')
console.log('=' .repeat(50))

console.log('EOS_ACCOUNT:', process.env.EOS_ACCOUNT)
console.log('EOS_RPC_URL:', process.env.EOS_RPC_URL)
console.log('EOS_PRIVATE_KEY:', process.env.EOS_PRIVATE_KEY ? 'SET' : 'NOT SET')

if (!process.env.EOS_ACCOUNT || !process.env.EOS_PRIVATE_KEY) {
  console.error('❌ Missing required environment variables!')
  process.exit(1)
}

console.log('\n🌴 Testing EOS RPC Connection...')
console.log('-' .repeat(40))

const rpc = new JsonRpc(process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io', { fetch })

async function testConnection() {
  try {
    console.log('📡 Connecting to EOS blockchain...')
    
    // Test basic RPC connection
    const info = await rpc.get_info()
    console.log('✅ RPC Connection successful!')
    console.log('🔗 Chain ID:', info.chain_id)
    console.log('📊 Head Block:', info.head_block_num)
    
    // Test account info
    console.log('\n💰 Getting account info...')
    const accountInfo = await rpc.get_account(process.env.EOS_ACCOUNT)
    console.log('✅ Account found!')
    console.log('💰 Balance:', accountInfo.core_liquid_balance || '0.0000 EOS')
    console.log('📊 RAM Usage:', accountInfo.ram_usage, 'bytes')
    console.log('⚡ CPU Available:', accountInfo.cpu_limit?.available || 'N/A')
    console.log('🌐 NET Available:', accountInfo.net_limit?.available || 'N/A')
    
    console.log('\n🎉 All tests passed! Ready for deployment.')
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }
}

testConnection() 