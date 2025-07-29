import deployEOSContract from './scripts/deployEOSContract.js'

console.log('🚀 Starting EOS Contract Deployment...')
console.log('=' .repeat(50))

deployEOSContract()
  .then(result => {
    console.log('\n✅ Deployment completed successfully!')
    console.log('Result:', result)
  })
  .catch(error => {
    console.error('\n❌ Deployment failed:', error)
    process.exit(1)
  }) 