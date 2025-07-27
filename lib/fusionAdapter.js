import { ethers } from 'ethers'
import { getOneInchAPI } from './oneinch'

export class FusionEOSAdapter {
  constructor() {
    this.oneInch = getOneInchAPI()
  }

  // Adapt Fusion+ order for EOS cross-chain
  async createCrossChainOrder(params) {
    const {
      fromToken,
      toToken,
      amount,
      fromChain, // ethereum
      toChain,   // eos
      recipient,
      eosAccount
    } = params

    // Get Fusion+ quote first
    const quote = await this.oneInch.getFusionQuote({
      src: fromToken,
      dst: toToken,
      amount: amount,
      from: recipient
    })

    // Generate HTLC parameters
    const secret = ethers.randomBytes(32)
    const hashlock = ethers.keccak256(secret)
    const timelock = Math.floor(Date.now() / 1000) + 3600 // 1 hour

    // Create order structure compatible with Fusion+
    const order = {
      makerAsset: fromToken,
      takerAsset: toToken,
      makingAmount: amount,
      takingAmount: quote.dstAmount,
      maker: recipient,
      
      // Cross-chain specific fields
      crossChain: {
        targetChain: 'eos',
        targetAccount: eosAccount,
        hashlock: hashlock,
        timelock: timelock
      },
      
      // Fusion+ extensions
      extension: {
        hashlock: hashlock,
        timelock: timelock,
        eosTarget: eosAccount
      }
    }

    return {
      order,
      secret: ethers.hexlify(secret),
      hashlock,
      quote
    }
  }

  // Submit to 1inch resolver network
  async submitToResolvers(order) {
    try {
      const result = await this.oneInch.submitOrder(order)
      return result
    } catch (error) {
      console.error('Resolver submission failed:', error)
      throw error
    }
  }

  // Check order status via 1inch
  async getOrderStatus(orderId) {
    return await this.oneInch.getOrderStatus(orderId)
  }

  // Price discovery using 1inch aggregation
  async getOptimalRate(fromToken, toToken, amount) {
    try {
      const quote = await this.oneInch.getFusionQuote({
        src: fromToken,
        dst: toToken,
        amount: amount
      })
      
      return {
        rate: quote.dstAmount / amount,
        gasEstimate: quote.gas,
        protocols: quote.protocols
      }
    } catch (error) {
      console.error('Rate discovery failed:', error)
      return null
    }
  }
}

export default FusionEOSAdapter