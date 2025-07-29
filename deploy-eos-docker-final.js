import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'

dotenv.config()

console.log('🐳 DOCKER EOS CONTRACT DEPLOYMENT')
console.log('=' .repeat(50))

// Configuration
const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
  account: process.env.EOS_ACCOUNT,
  privateKey: process.env.EOS_PRIVATE_KEY,
  contractName: 'fusionbridge'
}

async function deployWithDocker() {
  try {
    console.log('📡 Connecting to EOS blockchain...')
    
    // Initialize EOS.js for verification
    const rpc = new JsonRpc(config.rpcUrl, { fetch })
    const signatureProvider = new JsSignatureProvider([config.privateKey])
    
    const api = new Api({
      rpc,
      signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
      chainId: config.chainId
    })

    // Check account and RAM
    console.log(`💰 Checking account: ${config.account}`)
    const accountInfo = await rpc.get_account(config.account)
    console.log(`✅ Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 RAM usage: ${accountInfo.ram_usage} bytes`)

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

    // Create temporary directory for Docker
    console.log('🔄 Setting up Docker deployment...')
    const tempDir = 'C:/temp/eos-deploy'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    // Copy files to temp directory
    fs.copyFileSync(wasmPath, path.join(tempDir, 'fusionbridge.wasm'))
    fs.copyFileSync(abiPath, path.join(tempDir, 'fusionbridge.abi'))
    console.log('📦 Files copied to temp directory')

    // Try multiple Docker deployment methods
    const execAsync = promisify(exec)
    
    // Method 1: Try with eosio/eosio.cdt and install cleos
    console.log('🐳 Method 1: Installing cleos in Docker container...')
    
    try {
      const dockerCmd = `& "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" run --rm -v "C:/temp/eos-deploy:/work" eosio/eosio.cdt:v1.8.1 bash -c "cd /work && apt-get update && apt-get install -y wget && wget https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-18.04_amd64.deb && dpkg -i eos_2.1.0-1-ubuntu-18.04_amd64.deb && cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi"`
      
      console.log('Executing Docker deployment...')
      const { stdout, stderr } = await execAsync(dockerCmd, { shell: 'powershell' })
      
      if (stdout) console.log('Output:', stdout)
      if (stderr) console.log('Errors:', stderr)
      
      console.log('✅ Docker deployment successful!')
      
    } catch (dockerError) {
      console.log('❌ Method 1 failed:', dockerError.message)
      
      // Method 2: Try with Node.js deployment (smaller chunks)
      console.log('🔄 Method 2: Using Node.js with smaller transactions...')
      
      try {
        // Split the WASM into smaller chunks and deploy
        const chunkSize = 15000 // Smaller than the 15912 limit
        const wasmArray = Array.from(wasmBuffer)
        const chunks = []
        
        for (let i = 0; i < wasmArray.length; i += chunkSize) {
          chunks.push(wasmArray.slice(i, i + chunkSize))
        }
        
        console.log(`📦 Splitting WASM into ${chunks.length} chunks...`)
        
        // Deploy chunks one by one (this is a simplified approach)
        // In reality, we need to use a different method
        
        console.log('⚠️  Chunked deployment not implemented - trying alternative...')
        
        // Method 3: Use a different approach - try with higher limits
        console.log('🔄 Method 3: Trying with higher transaction limits...')
        
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
          expireSeconds: 60,
          maxNetUsageWords: 100000, // Try higher limits
          maxCpuUsageMs: 100000
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
        
      } catch (nodeError) {
        console.log('❌ Method 2 & 3 failed:', nodeError.message)
        throw new Error('All deployment methods failed')
      }
    }

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
      
      // Test contract
      console.log('\n🧪 Testing contract...')
      try {
        const testResult = await api.transact({
          actions: [{
            account: config.account,
            name: 'getstats',
            authorization: [{
              actor: config.account,
              permission: 'active'
            }],
            data: {}
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 30
        })
        
        console.log('✅ Contract test successful!')
        console.log('Transaction ID:', testResult.transaction_id)
        
      } catch (testError) {
        console.log('⚠️  Contract test failed (normal for new deployment):', testError.message)
      }
      
      console.log('\n🎯 DEPLOYMENT COMPLETED!')
      console.log('Your HTLC contract is now live on Jungle4 testnet!')
      
      return true
      
    } else {
      throw new Error('Contract deployment verification failed')
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    return false
  }
}

// Run deployment
deployWithDocker()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Docker deployment successful!')
    } else {
      console.log('\n💥 Deployment failed - manual deployment required')
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  }) 