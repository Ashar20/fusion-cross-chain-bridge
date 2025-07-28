import { ethers } from 'ethers';

export interface EOSWalletConfig {
  accountName: string;
  privateKey: string;
  rpcUrl?: string;
  network?: 'mainnet' | 'testnet';
}

export class EOSWalletIntegration {
  private config: EOSWalletConfig | null = null;
  private isConnected: boolean = false;

  constructor() {}

  async connect(config: EOSWalletConfig): Promise<boolean> {
    try {
      // Validate the config
      if (!config.accountName || !config.privateKey) {
        throw new Error('Account name and private key are required');
      }

      // Basic validation for EOS account name format
      if (!/^[a-z1-5]{1,12}$/.test(config.accountName)) {
        throw new Error('Invalid EOS account name format');
      }

      // Basic validation for private key format (WIF format)
      if (!/^5[HJK][1-9A-HJ-NP-Za-km-z]{49}$/.test(config.privateKey)) {
        throw new Error('Invalid EOS private key format (WIF)');
      }

      // Set default RPC URL based on network
      const network = config.network || 'testnet';
      const defaultRpcUrl = network === 'mainnet' 
        ? 'https://eos.greymass.com'  // EOS mainnet RPC
        : 'https://jungle4.cryptolions.io'; // Jungle testnet RPC

      this.config = {
        ...config,
        network,
        rpcUrl: config.rpcUrl || defaultRpcUrl
      };

      this.isConnected = true;
      console.log(`🌴 Connected to EOS ${network}: ${config.accountName}`);
      return true;
    } catch (error) {
      console.error('EOS wallet connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.config = null;
  }

  async getAccountInfo(): Promise<any> {
    if (!this.isConnected || !this.config) {
      throw new Error('EOS wallet not connected');
    }

    try {
      // Simulate fetching account info from EOS RPC
      const response = await fetch(`${this.config.rpcUrl}/v1/chain/get_account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_name: this.config.accountName })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get account info:', error);
      // Return simulated data for demo purposes
      return {
        account_name: this.config.accountName,
        core_liquid_balance: this.config.network === 'mainnet' ? '100.0000 EOS' : '1000.0000 EOS',
        cpu_limit: { available: '1000', used: '0', max: '1000' },
        net_limit: { available: '1000', used: '0', max: '1000' },
        ram_usage: 1000
      };
    }
  }

  async getBalance(): Promise<string> {
    try {
      const accountInfo = await this.getAccountInfo();
      return accountInfo.core_liquid_balance || '0.0000 EOS';
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0.0000 EOS';
    }
  }

  async transferEOS(toAccount: string, amount: string, memo: string = ''): Promise<any> {
    if (!this.isConnected || !this.config) {
      throw new Error('EOS wallet not connected');
    }

    try {
      console.log(`🌴 Simulating EOS transfer: ${amount} EOS to ${toAccount}`);
      console.log(`📝 Memo: ${memo}`);
      console.log(`🌐 Network: ${this.config.network}`);
      
      // Simulate transfer delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        txHash: `eos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: this.config.accountName,
        to: toAccount,
        amount,
        memo,
        network: this.config.network
      };
    } catch (error) {
      console.error('EOS transfer failed:', error);
      throw error;
    }
  }

  isWalletConnected(): boolean {
    return this.isConnected;
  }

  getAccountName(): string | null {
    return this.config?.accountName || null;
  }

  getNetwork(): string | null {
    return this.config?.network || null;
  }

  getRpcUrl(): string | null {
    return this.config?.rpcUrl || null;
  }
}

export const eosWallet = new EOSWalletIntegration(); 