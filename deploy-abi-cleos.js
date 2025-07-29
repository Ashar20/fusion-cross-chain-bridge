import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

console.log('📋 DEPLOYING ABI USING CLEOS')
console.log('=' .repeat(50))

async function deployABIWithCleos() {
  try {
    // Check if ABI file exists
    const abiPath = path.join(process.cwd(), 'contracts', 'eos', 'fusionbridge.abi')
    if (!fs.existsSync(abiPath)) {
      throw new Error(`ABI file not found: ${abiPath}`)
    }

    console.log('✅ ABI file found:', abiPath)
    
    // Create temp directory if it doesn't exist
    const tempDir = 'C:/temp/eos-deploy'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    // Copy ABI file to temp directory
    fs.copyFileSync(abiPath, path.join(tempDir, 'fusionbridge.abi'))
    console.log('📦 ABI file copied to temp directory')

    // Try multiple approaches to run cleos
    console.log('\n🔄 Attempting ABI deployment...')

    // Method 1: Try with Docker and install cleos
    try {
      console.log('🐳 Method 1: Using Docker with cleos installation...')
      
      const dockerCmd = `& "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" run --rm -v "C:/temp/eos-deploy:/work" eosio/eosio.cdt:v1.8.1 bash -c "cd /work && apt-get update && apt-get install -y wget && wget https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-18.04_amd64.deb && dpkg -i eos_2.1.0-1-ubuntu-18.04_amd64.deb && cleos -u https://jungle4.cryptolions.io set abi quicksnake34 /work/fusionbridge.abi"`
      
      console.log('Executing Docker command...')
      const { stdout, stderr } = await execAsync(dockerCmd, { shell: 'powershell', timeout: 120000 })
      
      if (stdout) console.log('Output:', stdout)
      if (stderr) console.log('Errors:', stderr)
      
      console.log('✅ ABI deployment successful!')
      return true
      
    } catch (dockerError) {
      console.log('❌ Method 1 failed:', dockerError.message)
    }

    // Method 2: Try with a different Docker approach
    try {
      console.log('🐳 Method 2: Using alternative Docker approach...')
      
      const dockerCmd2 = `& "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" run --rm -v "${process.cwd()}/contracts/eos:/work" eosio/eosio.cdt:v1.8.1 bash -c "cd /work && echo 'ABI deployment would happen here' && cat fusionbridge.abi"`
      
      console.log('Executing alternative Docker command...')
      const { stdout, stderr } = await execAsync(dockerCmd2, { shell: 'powershell' })
      
      if (stdout) console.log('Output:', stdout)
      if (stderr) console.log('Errors:', stderr)
      
      console.log('✅ Alternative approach completed')
      
    } catch (dockerError2) {
      console.log('❌ Method 2 failed:', dockerError2.message)
    }

    // Method 3: Manual instructions
    console.log('\n📋 Manual ABI Deployment Instructions:')
    console.log('Since automated deployment failed, please follow these steps:')
    console.log('\n1. Install EOSIO software:')
    console.log('   - Download from: https://github.com/EOSIO/eos/releases')
    console.log('   - Extract to C:\\eosio')
    console.log('   - Add C:\\eosio\\bin to PATH')
    
    console.log('\n2. Deploy ABI manually:')
    console.log('   cleos -u https://jungle4.cryptolions.io set abi quicksnake34 contracts\\eos\\fusionbridge.abi')
    
    console.log('\n3. Or use online tools:')
    console.log('   - EOS Studio: https://eosstudio.io/')
    console.log('   - Bloks.io: https://jungle.bloks.io/')

    return false

  } catch (error) {
    console.error('❌ ABI deployment failed:', error.message)
    return false
  }
}

// Run ABI deployment
deployABIWithCleos()
  .then((success) => {
    if (success) {
      console.log('\n🎉 ABI deployment successful!')
      console.log('Your contract is now fully deployed with both code and ABI!')
    } else {
      console.log('\n⚠️  Manual ABI deployment required')
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  }) 