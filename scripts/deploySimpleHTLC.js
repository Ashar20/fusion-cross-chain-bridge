#!/usr/bin/env node

/**
 * 🚀 DEPLOY SIMPLE HTLC CONTRACT
 * 
 * Deploys the SimpleHTLC contract for production use
 */

import { ethers } from 'ethers'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

// Contract ABI and bytecode from compilation
const CONTRACT_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"escrowId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"initiator","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"hashlock","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"timelock","type":"uint256"}],"name":"HTLCEscrowCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"escrowId","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"secret","type":"bytes32"}],"name":"HTLCSecretRevealed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"escrowId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"HTLCWithdrawn","type":"event"},{"inputs":[],"name":"ONEINCH_ROUTER_V5","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ONEINCH_SETTLEMENT","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"authorizedResolvers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"address","name":"_resolver","type":"address"},{"internalType":"bytes32","name":"_hashlock","type":"bytes32"},{"internalType":"uint256","name":"_timelock","type":"uint256"},{"internalType":"uint256","name":"_resolverFeeRate","type":"uint256"}],"name":"createHTLCEscrow","outputs":[{"internalType":"bytes32","name":"escrowId","type":"bytes32"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"escrows","outputs":[{"internalType":"address","name":"initiator","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"address","name":"resolver","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32","name":"hashlock","type":"bytes32"},{"internalType":"uint256","name":"timelock","type":"uint256"},{"internalType":"bool","name":"withdrawn","type":"bool"},{"internalType":"bool","name":"refunded","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_escrowId","type":"bytes32"}],"name":"getEscrow","outputs":[{"components":[{"internalType":"address","name":"initiator","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"address","name":"resolver","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32","name":"hashlock","type":"bytes32"},{"internalType":"uint256","name":"timelock","type":"uint256"},{"internalType":"bool","name":"withdrawn","type":"bool"},{"internalType":"bool","name":"refunded","type":"bool"}],"internalType":"struct SimpleHTLC.Escrow","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOfficial1inchContracts","outputs":[{"internalType":"address","name":"settlement","type":"address"},{"internalType":"address","name":"routerV5","type":"address"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"_resolver","type":"address"}],"name":"isResolverAuthorized","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_escrowId","type":"bytes32"}],"name":"refundAfterTimeout","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_resolver","type":"address"},{"internalType":"bool","name":"_authorized","type":"bool"}],"name":"setResolverAuthorization","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_escrowId","type":"bytes32"},{"internalType":"bytes32","name":"_secret","type":"bytes32"}],"name":"withdrawWithSecret","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]

const CONTRACT_BYTECODE = "0x6080604052348015600e575f5ffd5b50600280546001600160a01b031916339081179091555f908152600160208190526040909120805460ff191690911790556110408061004c5f395ff3fe6080604052600436106100a5575f3560e01c80639da60eab116100625780639da60eab14610259578063b31b557314610290578063c5816ab2146102b7578063c649262f146102d8578063d794d2d9146102ff578063f023b8111461032d575f5ffd5b806313843404146100a957806315fa2336146100f55780632d83549c1461012457806352bfd9ff146101e25780638da5cb5b1461020157806391d1764614610238575b5f5ffd5b3480156100b4575f5ffd5b506040805173a88800cd213da5ae406ce248380802bd53b47647815273111111125434b319222cdbf8c261674adb56f3ae6020820152015b60405180910390f35b348015610100575f5ffd5b5061011461010f366004610e2c565b610416565b60405190151581526020016100ec565b34801561012f575f5ffd5b5061019461013e366004610e4c565b5f6020819052908152604090208054600182015460028301546003840154600485015460058601546006909601546001600160a01b03958616969486169590931693919290919060ff8082169161010090041688565b604080516001600160a01b03998a168152978916602089015295909716948601949094526060850192909252608084015260a0830152151560c082015290151560e0820152610100016100ec565b3480156101ed575f5ffd5b506101146101fc366004610e4c565b610701565b34801561020c575f5ffd5b50600254610220906001600160a01b031681565b6040516001600160a01b0390911681526020016100ec565b348015610243575f5ffd5b50610257610252366004610e7e565b6108e7565b005b348015610264575f5ffd5b50610114610273366004610eb7565b6001600160a01b03165f9081526001602052604090205460ff1690565b34801561029b575f5ffd5b5061022073111111125434b319222cdbf8c261674adb56f3ae81565b6102ca6102c5366004610ed7565b610958565b6040519081526020016100ec565b3480156102e3575f5ffd5b5061022073a88800cd213da5ae406ce248380802bd53b4764781565b34801561030a575f5ffd5b50610114610319366004610eb7565b60016020525f908152604090205460ff1681565b348015610338575f5ffd5b50610409610347366004610e4c565b60408051610100810182525f80825260208201819052918101829052606081018290526080810182905260a0810182905260c0810182905260e0810191909152505f90815260208181526040918290208251610100808201855282546001600160a01b03908116835260018401548116948301949094526002830154909316938101939093526003810154606084015260048101546080840152600581015460a08401526006015460ff808216151560c085015291900416151560e082015290565b6040516100ec9190610f20565b5f82815260208190526040812080546001600160a01b03166104725760405162461bcd60e51b815260206004820152601060248201526f115cd8dc9bddc81b9bdd08199bdd5b9960821b60448201526064015b60405180910390fd5b600681015460ff16156104bb5760405162461bcd60e51b815260206004820152601160248201527020b63932b0b23c903bb4ba34323930bbb760791b6044820152606401610469565b6006810154610100900460ff16156105085760405162461bcd60e51b815260206004820152601060248201526f105b1c9958591e481c99599d5b99195960821b6044820152606401610469565b8060050154421061054c5760405162461bcd60e51b815260206004820152600e60248201526d115cd8dc9bddc8195e1c1a5c995960921b6044820152606401610469565b5f8360405160200161056091815260200190565b604051602081830303815290604052805190602001209050816004015481146105bc5760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a59081cd958dc995d60921b6044820152606401610469565b60018201546001600160a01b03163314806105e3575060028201546001600160a01b031633145b61062f5760405162461bcd60e51b815260206004820152601760248201527f556e617574686f72697a6564207769746864726177616c0000000000000000006044820152606401610469565b60068201805460ff1916600190811790915582015460038301546040516001600160a01b039092169181156108fc0291905f818181858888f1935050505015801561067c573d5f5f3e3d5ffd5b50604051849086907f215d066639f0d2b05405b9a26031f00bf3686366042814f639326a21c5b80d20905f90a3600182015460038301546040519081526001600160a01b039091169086907fb1a5e0215b1da1438462d5699040b0f53694d7cf6acedd6cd8ea4e13cddd48569060200160405180910390a36001925050505b92915050565b5f81815260208190526040812080546001600160a01b03166107585760405162461bcd60e51b815260206004820152601060248201526f115cd8dc9bddc81b9bdd08199bdd5b9960821b6044820152606401610469565b600681015460ff16156107a15760405162461bcd60e51b815260206004820152601160248201527020b63932b0b23c903bb4ba34323930bbb760791b6044820152606401610469565b6006810154610100900460ff16156107ee5760405162461bcd60e51b815260206004820152601060248201526f105b1c9958591e481c99599d5b99195960821b6044820152606401610469565b80600501544210156108395760405162461bcd60e51b8152602060048201526014602482015273151a5b595b1bd8dac81b9bdd08195e1c1a5c995960621b6044820152606401610469565b80546001600160a01b031633146108925760405162461bcd60e51b815260206004820152601960248201527f4f6e6c7920696e69746961746f722063616e20726566756e64000000000000006044820152606401610469565b60068101805461ff001916610100179055805460038201546040516001600160a01b039092169181156108fc0291905f818181858888f193505050501580156108dd573d5f5f3e3d5ffd5b5060019392505050565b6002546001600160a01b0316331461092e5760405162461bcd60e51b815260206004820152600a60248201526927b7363c9037bbb732b960b11b6044820152606401610469565b6001600160a01b03919091165f908152600160205260409020805460ff1916911515919091179055565b5f6001600160a01b0386166109a35760405162461bcd60e51b8152602060048201526011602482015270125b9d985b1a59081c9958da5c1a595b9d607a1b6044820152606401610469565b6001600160a01b0385166109ec5760405162461bcd60e51b815260206004820152601060248201526f24b73b30b634b2103932b9b7b63b32b960811b6044820152606401610469565b6001600160a01b0385165f9081526001602052604090205460ff16610a535760405162461bcd60e51b815260206004820152601760248201527f5265736f6c766572206e6f7420617574686f72697a65640000000000000000006044820152606401610469565b5f3411610a975760405162461bcd60e51b81526020600482015260126024820152710416d6f756e74206d757374206265203e20360741b6044820152606401610469565b610aa342610708610fae565b8311610ae65760405162461bcd60e51b8152602060048201526012602482015271151a5b595b1bd8dac81d1bdbc81cda1bdc9d60721b6044820152606401610469565b83610b265760405162461bcd60e51b815260206004820152601060248201526f496e76616c696420686173686c6f636b60801b6044820152606401610469565b6101f4821115610b705760405162461bcd60e51b81526020600482015260156024820152740a4cae6ded8eccae440cccaca40e8dede40d0d2ced605b1b6044820152606401610469565b6040516bffffffffffffffffffffffff1933606090811b8216602084015288901b166034820152604881018590526068810184905242608882015260a80160408051601f1981840301815291815281516020928301205f818152928390529120549091506001600160a01b031615610c225760405162461bcd60e51b8152602060048201526015602482015274457363726f7720616c72656164792065786973747360581b6044820152606401610469565b5f612710610c308434610fc1565b610c3a9190610fd8565b90505f610c478234610ff7565b9050604051806101000160405280336001600160a01b03168152602001896001600160a01b03168152602001886001600160a01b031681526020018281526020018781526020018681526020015f151581526020015f15158152505f5f8581526020019081526020015f205f820151815f015f6101000a8154816001600160a01b0302191690836001600160a01b031602179055506020820151816001015f6101000a8154816001600160a01b0302191690836001600160a01b031602179055506040820151816002015f6101000a8154816001600160a01b0302191690836001600160a01b03160217905550606082015181600301556080820151816004015560a0820151816005015560c0820151816006015f6101000a81548160ff02191690831515021790555060e08201518160060160016101000a81548160ff0219169083151502179055509050505f821115610dd1576040516001600160a01b0388169083156108fc029084905f818181858888f19350505050158015610dcf573d5f5f3e3d5ffd5b505b60408051828152602081018890529081018690526001600160a01b03891690339085907f1e03fe7fcafc83e9e839f532fbd0ba43de0dadfddc5cb3297db6db67ac5059fd9060600160405180910390a4505095945050505050565b5f5f60408385031215610e3d575f5ffd5b50508035926020909101359150565b5f60208284031215610e5c575f5ffd5b5035919050565b80356001600160a01b0381168114610e79575f5ffd5b919050565b5f5f60408385031215610e8f575f5ffd5b610e9883610e63565b915060208301358015158114610eac575f5ffd5b809150509250929050565b5f60208284031215610ec7575f5ffd5b610ed082610e63565b9392505050565b5f5f5f5f5f60a08688031215610eeb575f5ffd5b610ef486610e63565b9450610f0260208701610e63565b94979496505050506040830135926060810135926080909101359150565b81516001600160a01b03908116825260208084015182169083015260408084015190911690820152606080830151908201526080808301519082015260a0828101519082015260c080830151610100830191610f7f9084018215159052565b5060e0830151610f9360e084018215159052565b5092915050565b634e487b7160e01b5f52601160045260245ffd5b808201808211156106fb576106fb610f9a565b80820281158282048414176106fb576106fb610f9a565b5f82610ff257634e487b7160e01b5f52601260045260245ffd5b500490565b818103818111156106fb576106fb610f9a56fea26469706673582212209cf813898529f0ec89e844951071cd36e950c96311c310f8debe00c6f853a29e64736f6c634300081e0033"

async function deployContract() {
  console.log('🚀 DEPLOYING SIMPLE HTLC CONTRACT')
  console.log('=' .repeat(60))
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  
  const network = await provider.getNetwork()
  const balance = await provider.getBalance(signer.address)
  
  console.log(`📡 Network: ${network.name} (${Number(network.chainId)})`)
  console.log(`💰 Deployer: ${signer.address}`)
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`)
  
  if (balance < ethers.parseEther('0.01')) {
    throw new Error('Insufficient ETH balance for contract deployment')
  }
  
  try {
    // Create contract factory
    const contractFactory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, signer)
    
    console.log('\n💰 Estimating deployment cost...')
    const gasEstimate = await contractFactory.getDeployTransaction().then(tx => 
      provider.estimateGas(tx)
    )
    
    const feeData = await provider.getFeeData()
    const deploymentCost = gasEstimate * feeData.gasPrice
    
    console.log(`⛽ Gas Estimate: ${gasEstimate.toLocaleString()}`)
    console.log(`💰 Deployment Cost: ${ethers.formatEther(deploymentCost)} ETH`)
    
    // Deploy the contract
    console.log('\n🔄 Deploying contract...')
    const contract = await contractFactory.deploy({
      gasLimit: gasEstimate + BigInt(50000), // Add buffer
      gasPrice: feeData.gasPrice
    })
    
    console.log('📡 Transaction sent! Waiting for confirmation...')
    console.log(`📍 TX Hash: ${contract.deploymentTransaction().hash}`)
    
    // Wait for deployment
    const deployedContract = await contract.waitForDeployment()
    const contractAddress = await deployedContract.getAddress()
    
    console.log('✅ SIMPLE HTLC CONTRACT DEPLOYED!')
    console.log(`📍 Contract Address: ${contractAddress}`)
    console.log(`🔗 Explorer: https://sepolia.etherscan.io/address/${contractAddress}`)
    
    // Test contract functionality
    console.log('\n🧪 Testing contract...')
    
    // Check owner
    const owner = await deployedContract.owner()
    console.log(`✅ Contract Owner: ${owner}`)
    
    // Check resolver authorization
    const isAuthorized = await deployedContract.isResolverAuthorized(signer.address)
    console.log(`✅ Deployer Authorized as Resolver: ${isAuthorized}`)
    
    // Check 1inch integration
    const [settlement, routerV5] = await deployedContract.getOfficial1inchContracts()
    console.log(`✅ 1inch Settlement: ${settlement}`)
    console.log(`✅ 1inch Router V5: ${routerV5}`)
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress: contractAddress,
      deploymentTxHash: contract.deploymentTransaction().hash,
      network: 'sepolia',
      deployer: signer.address,
      deployedAt: new Date().toISOString(),
      gasUsed: gasEstimate.toString(),
      deploymentCost: ethers.formatEther(deploymentCost),
      abi: CONTRACT_ABI,
      features: [
        'Simple HTLC Escrow',
        'Multi-party Support',
        'Official 1inch Integration',
        'Cross-chain Ready',
        'Resolver Authorization',
        'Timelock Protection'
      ]
    }
    
    fs.writeFileSync(
      './simple-htlc-deployment.json', 
      JSON.stringify(deploymentInfo, null, 2)
    )
    
    console.log('\n📄 Deployment info saved to simple-htlc-deployment.json')
    console.log('\n🎉 READY FOR PRODUCTION USE!')
    console.log(`Update your MultiPartySwapArchitecture to use: ${contractAddress}`)
    
    return {
      success: true,
      contractAddress: contractAddress,
      contract: deployedContract,
      deploymentInfo: deploymentInfo
    }
    
  } catch (error) {
    console.error('❌ Contract deployment failed:', error.message)
    throw error
  }
}

deployContract().catch(console.error)