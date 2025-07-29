import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

console.log('🚀 EOS CONTRACT DEPLOYMENT (Split Transactions)')
console.log('=' .repeat(50))

// Configuration
const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
  account: process.env.EOS_ACCOUNT,
  privateKey: process.env.EOS_PRIVATE_KEY,
  contractName: 'fusionbridge'
}

async function deployContractSplit() {
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

    // Check account
    console.log(`💰 Checking account: ${config.account}`)
    const accountInfo = await rpc.get_account(config.account)
    console.log(`✅ Account found! Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)

    // Load WASM and ABI files
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
    const abi = JSON.parse(abiBuffer.toString())

    console.log(`✅ Files loaded! WASM: ${wasmBuffer.length} bytes, ABI: ${abiBuffer.length} bytes`)

    // Try alternative deployment method using cleos via Docker
    console.log('🔄 Trying Docker-based deployment...')
    
    // Create temporary directory
    const tempDir = 'C:/temp/eos-deploy'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    // Copy files to temp directory
    fs.copyFileSync(wasmPath, path.join(tempDir, 'fusionbridge.wasm'))
    fs.copyFileSync(abiPath, path.join(tempDir, 'fusionbridge.abi'))
    
    console.log('📦 Files copied to temp directory')
    
    // Try Docker deployment
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    try {
      console.log('🐳 Running Docker deployment...')
      
      // First, try to deploy using cleos in Docker
      const dockerCmd = `& "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" run --rm -v "C:/temp/eos-deploy:/work" eosio/eosio.cdt:v1.8.1 bash -c "cd /work && cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi"`
      
      console.log('Executing:', dockerCmd)
      const { stdout, stderr } = await execAsync(dockerCmd, { shell: 'powershell' })
      
      if (stdout) console.log('Output:', stdout)
      if (stderr) console.log('Errors:', stderr)
      
      console.log('✅ Docker deployment completed!')
      
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
      } else {
        throw new Error('Contract deployment verification failed')
      }
      
    } catch (dockerError) {
      console.log('❌ Docker deployment failed:', dockerError.message)
      console.log('🔄 Trying alternative method...')
      
      // Try using a different approach - manual deployment instructions
      console.log('📋 Manual deployment required:')
      console.log('1. Install cleos command line tool')
      console.log('2. Run: cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts/eos fusionbridge.wasm fusionbridge.abi')
      console.log('3. Or use online tools like EOS Studio or Bloks.io')
      
      return false
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    return false
  }
}

// Run deployment
deployContractSplit()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Deployment successful!')
    } else {
      console.log('\n⚠️  Deployment failed - manual deployment required')
    }
  })
  .catch(error => {
    console.error('\n💥 Deployment failed!')
    process.exit(1)
  }) 