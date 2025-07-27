import axios from 'axios'

class OneInchAPI {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseURL = 'https://api.1inch.dev'
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  // Fusion+ Quote for cross-chain swap
  async getFusionQuote(params) {
    try {
      const response = await this.client.get('/fusion-plus/quote', { params })
      return response.data
    } catch (error) {
      console.error('Fusion+ quote error:', error)
      throw error
    }
  }

  // Create Fusion+ order
  async createFusionOrder(orderData) {
    try {
      const response = await this.client.post('/fusion-plus/order', orderData)
      return response.data
    } catch (error) {
      console.error('Fusion+ order creation error:', error)
      throw error
    }
  }

  // Get order status
  async getOrderStatus(orderId) {
    try {
      const response = await this.client.get(`/fusion-plus/order/${orderId}`)
      return response.data
    } catch (error) {
      console.error('Order status error:', error)
      throw error
    }
  }

  // Submit order to orderbook
  async submitOrder(signedOrder) {
    try {
      const response = await this.client.post('/orderbook/submit', signedOrder)
      return response.data
    } catch (error) {
      console.error('Order submission error:', error)
      throw error
    }
  }

  // Get active orders
  async getActiveOrders(address) {
    try {
      const response = await this.client.get('/orderbook/orders', {
        params: { maker: address }
      })
      return response.data
    } catch (error) {
      console.error('Get orders error:', error)
      throw error
    }
  }

  // Price discovery
  async getTokenPrice(tokenAddress, chainId = 1) {
    try {
      const response = await this.client.get('/price', {
        params: { 
          tokenAddress,
          chainId 
        }
      })
      return response.data
    } catch (error) {
      console.error('Price discovery error:', error)
      throw error
    }
  }
}

// Export singleton instance
let oneInchAPI = null

export const getOneInchAPI = () => {
  if (!oneInchAPI && process.env.NEXT_PUBLIC_ONEINCH_API_KEY) {
    oneInchAPI = new OneInchAPI(process.env.NEXT_PUBLIC_ONEINCH_API_KEY)
  }
  return oneInchAPI
}

export default OneInchAPI