'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BlockchainIntegration } from '@/lib/blockchain';
import { EOSWalletIntegration, EOSWalletConfig } from '@/lib/eos-wallet';
import { ethers } from 'ethers';

export default function GaslessSwapInterface() {
  // Swap state
  const [swapDirection, setSwapDirection] = useState<'eth-to-eos' | 'eos-to-eth'>('eth-to-eos');
  const [ethAmount, setEthAmount] = useState('0.01');
  const [eosAmount, setEosAmount] = useState('35.0');
  const [swapStatus, setSwapStatus] = useState<string>('');
  const [swapId, setSwapId] = useState<string>('');
  const [hashlock, setHashlock] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Conversion rate (for demo purposes - in real app this would come from price feeds)
  const [conversionRate, setConversionRate] = useState(3500); // New state for conversion
  const [ethTxHash, setEthTxHash] = useState<string>('');
  const [eosTxHash, setEosTxHash] = useState<string>('');
  const [gasPrice, setGasPrice] = useState<string>('~15 Gwei');
  const [gasLimit, setGasLimit] = useState<string>('~200,000');
  const [estimatedGasCost, setEstimatedGasCost] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [revealedSecret, setRevealedSecret] = useState<string>('');
  const [showSecretForm, setShowSecretForm] = useState(false);
  
  // HTLC State Management
  const [htlcData, setHtlcData] = useState<{
    hashlock: string;
    timelock: number;
    orderHash: string;
    beneficiary: string;
    amount: string;
    deadline: number;
    escrowAddress: string;
    executed: boolean;
    claimed: boolean;
    refunded: boolean;
  } | null>(null);

  // Resolver Balance State
  const [resolverBalance, setResolverBalance] = useState<{
    address: string;
    balance: string;
    balanceWei: string;
    isFunded: boolean;
  } | null>(null);

  // Store the exact amount used when creating intent
  const [intentAmount, setIntentAmount] = useState<string>('');

  // Calculate equivalent amounts
  const calculateEquivalent = (amount: string, fromCurrency: 'eth' | 'eos') => {
    const numAmount = parseFloat(amount) || 0;
    if (fromCurrency === 'eth') {
      return (numAmount * conversionRate).toFixed(2);
    } else {
      return (numAmount / conversionRate).toFixed(4);
    }
  };

  // Handle ETH amount change
  const handleEthAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEthAmount(value);
    const equivalentEos = calculateEquivalent(value, 'eth');
    setEosAmount(equivalentEos);
  };

  // Handle EOS amount change
  const handleEosAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEosAmount(value);
    const equivalentEth = calculateEquivalent(value, 'eos');
    setEthAmount(equivalentEth);
  };

  // Wallet connection state
  const [isConnected, setIsConnected] = useState(false);
  const [ethAddress, setEthAddress] = useState('');
  const [ethBalance, setEthBalance] = useState('');
  const [loading, setLoading] = useState(false);

  // EOS wallet state
  const [eosAccountName, setEosAccountName] = useState('');
  const [eosPrivateKey, setEosPrivateKey] = useState('');
  const [isEosConnected, setIsEosConnected] = useState(false);
  const [eosBalance, setEosBalance] = useState('');
  const [showEosWalletForm, setShowEosWalletForm] = useState(false);
  const [eosNetwork, setEosNetwork] = useState<'mainnet' | 'testnet'>('testnet');

  // Blockchain integrations
  const [blockchain] = useState(new BlockchainIntegration());
  const [eosWallet] = useState(new EOSWalletIntegration());

  // Auto-retrieve secret when swapId is available
  useEffect(() => {
    if (swapId && !revealedSecret) {
      getStoredSecret();
    }
  }, [swapId]);

  // Auto-check status and fetch HTLC data
  useEffect(() => {
    if (swapId) {
      const interval = setInterval(async () => {
        try {
          const status = await blockchain.getRealIntentStatus(swapId);
          if (status) {
            if (status.executed && status.claimed) {
              setSwapStatus('Claimed');
            } else if (status.executed) {
              setSwapStatus('Executed');
            } else {
              setSwapStatus('Pending');
            }
            
            // Also refresh HTLC data for UI display
            await fetchHTLCData(swapId);
          }
        } catch (error) {
          console.log('Intent not found yet');
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [swapId, blockchain]);

  // Auto-connect wallet
  useEffect(() => {
    const connectWallet = async () => {
      try {
        const result = await blockchain.connect();
        if (result.success) {
          setIsConnected(true);
          setSwapStatus(`Connected to ${result.network} (${result.chainId})`);
          fetchGasInfo(); // Fetch gas info when connected
          // Auto-check resolver balance when connecting
          await checkResolverBalance();
        }
      } catch (error) {
        console.log('Wallet not connected');
      }
    };
    connectWallet();
  }, [blockchain]);

  // Fetch gas info periodically
  useEffect(() => {
    if (isConnected) {
      fetchGasInfo();
      const interval = setInterval(fetchGasInfo, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const connectWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await blockchain.connect();
      if (result.success) {
        setIsConnected(true);
        setSwapStatus(`Connected to ${result.network} (${result.chainId})`);
        // Auto-check resolver balance when connecting
        await checkResolverBalance();
        await fetchGasInfo();
      } else {
        setError(result.error || 'Failed to connect wallet');
      }
    } catch (error) {
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const connectEOSWallet = async () => {
    if (!eosAccountName || !eosPrivateKey) {
      setError('Please enter EOS account name and private key');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const config: EOSWalletConfig = {
        accountName: eosAccountName,
        privateKey: eosPrivateKey,
        network: 'testnet' // Custom tab is for testnet only
      };
      
      const success = await eosWallet.connect(config);
      if (success) {
        setIsEosConnected(true);
        setShowEosWalletForm(false);
        const balance = await eosWallet.getBalance();
        setEosBalance(balance);
        setSwapStatus(`Connected to EOS testnet`);
      } else {
        setError('Failed to connect EOS wallet');
      }
    } catch (error) {
      setError('Failed to connect EOS wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectEOSWallet = () => {
    eosWallet.disconnect();
    setIsEosConnected(false);
    setEosBalance('');
    setEosAccountName('');
    setEosPrivateKey('');
    setSwapStatus('EOS wallet disconnected');
  };

  const createIntent = async () => {
    if (!isConnected || !ethAmount) {
      setError('Please connect wallet and enter amount');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('🔍 Creating intent with amount:', ethAmount);
      
      const result = await blockchain.createRealIntent(ethAmount);
      setSwapId(result.swapId);
      setSwapStatus(result.message);
      setHashlock(ethers.keccak256(ethers.randomBytes(32)));
      setDeadline((Math.floor(Date.now() / 1000) + 3600).toString());
      setEthTxHash(result.txHash || '');
      setIntentAmount(ethAmount); // Store the amount used for intent creation

      console.log('✅ Intent created successfully:', {
        swapId: result.swapId,
        storedIntentAmount: ethAmount
      });

      // Fetch HTLC data after creation
      await fetchHTLCData(result.swapId);
      // Check resolver balance after creating intent
      await checkResolverBalance();

    } catch (error) {
      console.error('❌ Create intent error:', error);
      setError('Failed to create intent');
    } finally {
      setLoading(false);
    }
  };

  const executeRealIntent = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('🔍 Executing intent with:', {
        swapId,
        intentAmount,
        currentEthAmount: ethAmount
      });
      
      // Fetch the actual amount from the contract to ensure we use the correct amount
      const intentDetails = await blockchain.getIntentDetails(swapId);
      const contractAmount = intentDetails.amountEth;
      
      console.log('📋 Using contract amount for execution:', contractAmount);
      
      const result = await blockchain.executeRealIntent(swapId, contractAmount); // Use contract amount
      setSwapStatus(result.message);
      setEthTxHash(result.txHash || '');
      
      // Update the stored intent amount to match the contract
      setIntentAmount(contractAmount);
      
    } catch (error) {
      console.error('❌ Execute intent error:', error);
      setError('Failed to execute intent');
    } finally {
      setLoading(false);
    }
  };

  const manualExecuteIntent = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('🚀 Manual intent execution initiated');
      
      const result = await blockchain.manualExecuteIntent(swapId);
      
      if (result.success) {
        setSwapStatus(result.message || 'Intent executed successfully');
        setEthTxHash(result.txHash || '');
        setSuccess('Intent manually executed successfully!');
        
        // Refresh HTLC data after execution
        await fetchHTLCData(swapId);
      } else {
        setError(result.error || 'Manual execution failed');
      }
      
    } catch (error) {
      console.error('❌ Manual execute intent error:', error);
      setError('Failed to manually execute intent');
    } finally {
      setLoading(false);
    }
  };

  const updateIntentAmount = async () => {
    if (!swapId || !ethAmount) {
      setError('No swap ID or amount found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Create a new intent with the updated amount
      const result = await blockchain.createRealIntent(ethAmount); // Fix: pass ethAmount directly, not as object
      setSwapId(result.swapId);
      setIntentAmount(ethAmount); // Update the stored intent amount
      setSwapStatus(`Intent updated with new amount: ${ethAmount} ETH`);
      setEthTxHash(result.txHash || '');
      
      // Fetch HTLC data after creation
      await fetchHTLCData(result.swapId);
      // Check resolver balance after creating intent
      await checkResolverBalance();
    } catch (error) {
      setError('Failed to update intent amount');
    } finally {
      setLoading(false);
    }
  };

  const performEOSTransfer = async () => {
    if (!isEosConnected) {
      setError('Please connect your EOS wallet first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await eosWallet.transferEOS('recipient123', `${eosAmount} EOS`, `Swap ${swapId.slice(0, 8)}`);
      setSwapStatus(`EOS transfer completed: ${result.txHash}`);
      setTxHash(result.txHash);
      setEosTxHash(result.txHash);
    } catch (error) {
      setError('Failed to perform EOS transfer');
    } finally {
      setLoading(false);
    }
  };

  const revealSecret = async () => {
    if (!secret) {
      setError('Please enter the secret');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Generate hashlock from secret
      const hashlock = ethers.keccak256(ethers.toUtf8Bytes(secret));
      setHashlock(hashlock);
      setRevealedSecret(secret);
      setShowSecretForm(false);
      setSwapStatus('Secret revealed - Ready to claim tokens');
    } catch (error) {
      setError('Failed to reveal secret');
    } finally {
      setLoading(false);
    }
  };

  const claimTokens = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Use empty string as secret parameter since blockchain.claimTokens will get the stored secret
      const result = await blockchain.claimTokens(swapId, '');
      setSwapStatus(result.message);
      setTxHash(result.txHash || '');
      // Refresh HTLC data after claiming
      await fetchHTLCData(swapId);
    } catch (error: any) {
      setError('Failed to claim tokens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refundHTLC = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await blockchain.refundHTLC(swapId);
      setSwapStatus(result.message);
      setTxHash(result.txHash || '');
      // Refresh HTLC data after refund
      await fetchHTLCData(swapId);
    } catch (error) {
      setError('Failed to refund HTLC');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const status = await blockchain.getRealIntentStatus(swapId);
      if (status) {
        setSwapStatus(status.status);
        setTxHash(status.txHash || '');
        // Also fetch HTLC data when checking status
        await fetchHTLCData(swapId);
      } else {
        console.log('Intent not found yet');
      }
    } catch (error) {
      console.log('Status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContracts = () => {
    return blockchain.getContracts();
  };

  const fetchGasInfo = async () => {
    if (isConnected) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const feeData = await provider.getFeeData();
        const gasPriceGwei = ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
        setGasPrice(`${parseFloat(gasPriceGwei).toFixed(1)} Gwei`);
        
        // Estimate gas cost for executeIntent function
        const gasLimitEstimate = 200000; // Approximate gas limit for executeIntent
        const gasCostWei = (feeData.gasPrice || BigInt(0)) * BigInt(gasLimitEstimate);
        const gasCostEth = ethers.formatEther(gasCostWei);
        setEstimatedGasCost(`~${parseFloat(gasCostEth).toFixed(4)} ETH`);
        setGasLimit(`~${gasLimitEstimate.toLocaleString()}`);
      } catch (error) {
        console.log('Could not fetch gas info:', error);
      }
    }
  };

  const fetchHTLCData = async (swapId: string) => {
    if (!isConnected || !swapId) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a'; // New fundable contract
      const abi = [
        "function getIntent(bytes32 swapId) external view returns (tuple(address user, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, uint256 nonce, bool executed, bool claimed, address escrowAddress))"
      ];
      
      const contract = new ethers.Contract(resolverAddress, abi, provider);
      const intent = await contract.getIntent(swapId);
      
      if (intent && intent.user !== ethers.ZeroAddress) {
        setHtlcData({
          hashlock: intent.hashlock,
          timelock: Number(intent.deadline),
          orderHash: intent.orderHash,
          beneficiary: intent.beneficiary,
          amount: ethers.formatEther(intent.amount),
          deadline: Number(intent.deadline),
          escrowAddress: intent.escrowAddress,
          executed: intent.executed,
          claimed: intent.claimed,
          refunded: false // Will be determined by checking if deadline passed and not claimed
        });
      }
    } catch (error) {
      console.log('Could not fetch HTLC data:', error);
    }
  };

  const checkResolverBalance = async () => {
    if (!isConnected) return;
    
    try {
      const balance = await blockchain.getResolverBalance();
      setResolverBalance(balance);
    } catch (error) {
      console.log('Could not check resolver balance:', error);
    }
  };

  const getIntentDetails = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const details = await blockchain.getIntentDetails(swapId);
      console.log('📋 Contract Intent Details:', details);
      
      // Show the details in the UI
      setSwapStatus(`Intent Details: Amount=${details.amountEth} ETH, Executed=${details.executed}, Claimed=${details.claimed}`);
      
      // Update the stored intent amount to match what's in the contract
      if (details.amountEth !== intentAmount) {
        console.log('🔄 Updating stored intent amount to match contract:', details.amountEth);
        setIntentAmount(details.amountEth);
      }
      
    } catch (error) {
      console.error('❌ Get intent details error:', error);
      setError('Failed to get intent details');
    } finally {
      setLoading(false);
    }
  };

  const renderContractInfo = () => {
    const contracts = getContracts();
    if (contracts.mode === 'mainnet') {
  return (
        <div className="space-y-1">
          <p><span className="font-mono">Fusion Resolver:</span> {(contracts as any).LOP_V4}</p>
          <p><span className="font-mono">LOP V4:</span> {(contracts as any).LOP_V4}</p>
        </div>
      );
    } else {
      return (
        <div className="space-y-1">
          <p><span className="font-mono">Escrow Factory:</span> {(contracts as any).escrowFactory}</p>
          <p><span className="font-mono">Gasless Resolver:</span> {(contracts as any).gaslessResolver}</p>
        </div>
      );
    }
  };

  const testContractConnection = async () => {
    if (!isConnected) {
      setError('Please connect wallet first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Direct contract test without relying on blockchain integration
      const { ethers } = await import('ethers');
      const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
      console.log('🧪 Testing contract connection directly...');
      
      const abi = [
        "function userNonces(address user) external view returns (uint256)"
      ];
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const resolver = new ethers.Contract(resolverAddress, abi, signer);
      const testAddress = await signer.getAddress();
      const nonce = await resolver.userNonces(testAddress);
      
      console.log('✅ Contract connection test successful:', {
        address: resolverAddress,
        testAddress,
        nonce: nonce.toString()
      });
      
      setSwapStatus(`Contract test successful: Nonce = ${nonce.toString()}`);
    } catch (error: any) {
      console.error('❌ Contract test failed:', error);
      setError('Contract test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testExecuteIntent = async () => {
    if (!isConnected || !swapId) {
      setError('Please connect wallet and create an intent first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Direct executeIntent test
      const { ethers } = await import('ethers');
      const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
      console.log('🧪 Testing executeIntent directly...');
      
      const abi = [
        "function executeIntent(bytes32 swapId) external payable",
        "function getIntent(bytes32 swapId) external view returns (tuple(address user, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, uint256 nonce, bool executed, bool claimed, address escrowAddress))"
      ];
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const resolver = new ethers.Contract(resolverAddress, abi, signer);
      
      // Get intent details first
      const intent = await resolver.getIntent(swapId);
      const amount = intent.amount;
      console.log('📋 Intent details:', {
        amount: ethers.formatEther(amount),
        executed: intent.executed,
        claimed: intent.claimed
      });
      
      if (intent.executed) {
        setError('Intent already executed');
        return;
      }
      
      // Execute the intent
      console.log('🎯 Executing intent with amount:', ethers.formatEther(amount));
      const tx = await resolver.executeIntent(swapId, { 
        value: amount 
      });
      console.log('📝 Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);
      
      setSwapStatus(`Intent executed successfully! TX: ${receipt.hash}`);
      setEthTxHash(receipt.hash);
      
    } catch (error: any) {
      console.error('❌ Execute intent test failed:', error);
      setError('Execute intent test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshIntentStatus = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { ethers } = await import('ethers');
      const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
      
      const abi = [
        "function getIntent(bytes32 swapId) external view returns (tuple(address user, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, uint256 nonce, bool executed, bool claimed, address escrowAddress))"
      ];
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const resolver = new ethers.Contract(resolverAddress, abi, signer);
      
      const intent = await resolver.getIntent(swapId);
      
      console.log('📋 Current intent status:', {
        executed: intent.executed,
        claimed: intent.claimed,
        amount: ethers.formatEther(intent.amount),
        escrowAddress: intent.escrowAddress
      });
      
      // Update UI state based on intent status
      if (intent.executed) {
        setSwapStatus('Intent executed successfully! Ready for claiming.');
        if (intent.claimed) {
          setSwapStatus('Tokens claimed successfully!');
        }
      } else {
        setSwapStatus('Intent created - Ready for execution');
      }
      
      // Update stored intent amount
      setIntentAmount(ethers.formatEther(intent.amount));
      
      // Update HTLC data for the UI display
      await fetchHTLCData(swapId);
      
    } catch (error: any) {
      console.error('❌ Failed to refresh intent status:', error);
      setError('Failed to refresh status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { ethers } = await import('ethers');
      
      // Generate a random secret
      const randomSecret = ethers.randomBytes(32);
      const secretHex = ethers.hexlify(randomSecret);
      
      // Generate hashlock from secret
      const hashlock = ethers.keccak256(randomSecret);
      
      console.log('🔐 Generated Secret:', {
        secretHex,
        hashlock
      });
      
      // Store the secret (use hex format for display)
      setSecret(secretHex);
      setHashlock(hashlock);
      setRevealedSecret(secretHex);
      setShowSecretForm(false);
      
      setSwapStatus(`Secret generated! Hashlock: ${hashlock.slice(0, 10)}...`);
      
    } catch (error: any) {
      console.error('❌ Failed to generate secret:', error);
      setError('Failed to generate secret: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifySecret = async () => {
    if (!swapId || !secret) {
      setError('Please enter a secret to verify');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { ethers } = await import('ethers');
      const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a';
      
      const abi = [
        "function getIntent(bytes32 swapId) external view returns (tuple(address user, address beneficiary, uint256 amount, bytes32 orderHash, bytes32 hashlock, uint256 deadline, uint256 nonce, bool executed, bool claimed, address escrowAddress))"
      ];
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const resolver = new ethers.Contract(resolverAddress, abi, signer);
      
      // Get the hashlock from the contract
      const intent = await resolver.getIntent(swapId);
      const contractHashlock = intent.hashlock;
      
      // Generate hashlock from the provided secret (assuming it's hex)
      const secretBytes = ethers.getBytes(secret);
      const secretHashlock = ethers.keccak256(secretBytes);
      
      console.log('🔍 Secret Verification:', {
        providedSecret: secret,
        contractHashlock: contractHashlock,
        secretHashlock: secretHashlock,
        matches: contractHashlock === secretHashlock
      });
      
      if (contractHashlock === secretHashlock) {
        setHashlock(secretHashlock);
        setRevealedSecret(secret);
        setShowSecretForm(false);
        setSwapStatus('✅ Secret verified! Ready to claim tokens.');
      } else {
        setError('❌ Secret does not match the hashlock. Please check your secret.');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to verify secret:', error);
      setError('Failed to verify secret: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStoredSecret = async () => {
    if (!swapId) {
      setError('No swap ID found');
      return;
    }

    try {
      const storedSecretHex = localStorage.getItem(`secret_${swapId}`);
      if (!storedSecretHex) {
        setError('No secret found for this swap. Please check if the intent was created properly.');
        return;
      }

      // Convert hex to readable format
      const { ethers } = await import('ethers');
      const secretBytes = ethers.getBytes(storedSecretHex);
      const hashlock = ethers.keccak256(secretBytes);

      console.log('🔐 Retrieved stored secret:', {
        swapId,
        secretHex: storedSecretHex,
        hashlock
      });

      setSecret(storedSecretHex);
      setHashlock(hashlock);
      setRevealedSecret(storedSecretHex);
      setShowSecretForm(false);
      setSwapStatus('✅ Stored secret retrieved! Ready to claim tokens.');

    } catch (error: any) {
      console.error('❌ Failed to retrieve stored secret:', error);
      setError('Failed to retrieve stored secret: ' + error.message);
    }
  };

  const copySecretToClipboard = async () => {
    if (!revealedSecret) {
      setError('No secret to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(revealedSecret);
      setSwapStatus('Secret copied to clipboard!');
    } catch (error) {
      setError('Failed to copy secret to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏭 Fusion Cross-Chain Bridge
          </h1>
          <p className="text-lg text-gray-600">
            Gasless Cross-Chain Atomic Swaps with 1inch Fusion+
          </p>
        </div>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom (EOS↔ETH)</TabsTrigger>
            <TabsTrigger value="mainnet">Mainnet Swaps</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🔄 Bidirectional Gasless Swap (Custom)</CardTitle>
                <CardDescription>
                  Cross-chain atomic swaps using real deployed 1inch-compatible contracts (Sepolia Testnet) - Resolver pays gas fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Swap Direction Selection */}
                <div className="space-y-2">
                  <Label>Swap Direction</Label>
                  <div className="flex space-x-4">
                    <Button
                      variant={swapDirection === 'eth-to-eos' ? 'default' : 'outline'}
                      onClick={() => setSwapDirection('eth-to-eos')}
                    >
                      ETH → EOS
                    </Button>
                    <Button
                      variant={swapDirection === 'eos-to-eth' ? 'default' : 'outline'}
                      onClick={() => setSwapDirection('eos-to-eth')}
                    >
                      EOS → ETH
                    </Button>
                  </div>
                </div>

                {/* Conversion Rate Display */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                      <strong>💱 Conversion Rate:</strong> 1 ETH = {conversionRate.toLocaleString()} EOS
                    </div>
                  </div>

                  {/* Gasless Indicator */}
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-sm text-green-800">
                      <strong>💸 REAL GASLESS TRANSACTIONS:</strong> Using deployed contracts - Resolver pays gas fees
                    </div>
                  </div>
                </div>

                {/* Amount Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ethAmount">ETH Amount</Label>
                    <Input
                      id="ethAmount"
                      type="number"
                      step="0.001"
                      value={ethAmount}
                      onChange={handleEthAmountChange}
                      placeholder="0.01"
                    />
                    {intentAmount && intentAmount !== ethAmount && (
                      <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                        ⚠️ Intent was created with {intentAmount} ETH. Use "Execute Intent" to proceed with the stored amount.
                        <Button 
                          onClick={updateIntentAmount} 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full text-orange-700 border-orange-300"
                        >
                          🔄 Update Intent Amount
                        </Button>
        </div>
                    )}
                    
                    {/* Debug Info */}
                    {swapId && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                        <div className="font-semibold">🔍 Debug Info:</div>
                        <div>Current Input: {ethAmount} ETH</div>
                        <div>Stored Intent: {intentAmount} ETH</div>
                        <div>Swap ID: {swapId.slice(0, 8)}...</div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            onClick={getIntentDetails} 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs"
                          >
                            📋 Get Details
                          </Button>
                          <Button 
                            onClick={() => {
                              getIntentDetails();
                              setError('');
                            }} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                          >
                            🔄 Sync Amount
                          </Button>
                          <Button 
                            onClick={testContractConnection} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                          >
                            🧪 Test Contract
                          </Button>
                          <Button 
                            onClick={testExecuteIntent} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                          >
                            🎯 Test Execute
                          </Button>
                          <Button 
                            onClick={refreshIntentStatus} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                          >
                            🔄 Refresh Status
                          </Button>
                          <Button 
                            onClick={generateSecret} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                          >
                            🔐 Generate Secret
                          </Button>
                          <Button 
                            onClick={verifySecret} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                          >
                            🔍 Verify Secret
                          </Button>
                          <Button 
                            onClick={getStoredSecret} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                          >
                            📋 Get Stored Secret
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      Equivalent: {calculateEquivalent(ethAmount, 'eth')} EOS
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>EOS Amount</Label>
                    <Input
                      type="number"
                      value={eosAmount}
                      onChange={handleEosAmountChange}
                      placeholder="35.0"
                    />
                    {eosAmount && (
                      <div className="text-xs text-gray-500">
                        ≈ {calculateEquivalent(eosAmount, 'eos')} ETH
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallet Connections */}
                <div className="grid grid-cols-2 gap-6">
                  {/* ETH Wallet */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">🏭 Ethereum Wallet (Sepolia)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!isConnected ? (
                        <Button onClick={connectWallet} disabled={loading} className="w-full">
                          {loading ? 'Connecting...' : 'Connect MetaMask'}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Connected to Sepolia</p>
                          <p className="text-sm">Ready for testnet swaps</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* EOS Wallet */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">🌴 EOS Wallet (Jungle Testnet)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!isEosConnected ? (
                        <div className="space-y-2">
                          <Button 
                            onClick={() => setShowEosWalletForm(!showEosWalletForm)} 
                            variant="outline" 
                            className="w-full"
                          >
                            Connect EOS Wallet
                          </Button>
                          {showEosWalletForm && (
                            <div className="space-y-2 pt-2">
                              <Input
                                placeholder="EOS Account Name"
                                value={eosAccountName}
                                onChange={(e) => setEosAccountName(e.target.value)}
                              />
                              <Input
                                type="password"
                                placeholder="Private Key"
                                value={eosPrivateKey}
                                onChange={(e) => setEosPrivateKey(e.target.value)}
                              />
                              <Button onClick={connectEOSWallet} disabled={loading} className="w-full">
                                {loading ? 'Connecting...' : 'Connect to Jungle Testnet'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Connected to Jungle Testnet</p>
                          <p className="text-xs font-mono">{eosAccountName}</p>
                          <p className="text-sm">Balance: {eosBalance}</p>
                          <Button onClick={disconnectEOSWallet} variant="outline" size="sm">
                            Disconnect
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Swap Actions */}
                <div className="space-y-4">
                  <Button onClick={createIntent} disabled={!isConnected || loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Gasless Intent (0 Gas Cost)'}
                  </Button>
                  
                  {swapId && (
                    <Button onClick={executeRealIntent} disabled={loading} className="w-full">
                      {loading ? 'Executing...' : 'Execute Intent (Resolver Pays Gas)'}
                    </Button>
                  )}

                  {isEosConnected && (
                    <Button onClick={performEOSTransfer} disabled={loading} className="w-full">
                      {loading ? 'Transferring...' : 'Perform EOS Transfer'}
                    </Button>
                  )}

                  {/* Secret Reveal Section */}
                  {swapStatus === 'Executed' && !revealedSecret && (
                    <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="text-center mb-3">
                        <div className="text-orange-800 font-semibold mb-1">🔐 Ready to Reveal Secret</div>
                        <div className="text-orange-600 text-sm">Complete the swap by revealing your secret</div>
                      </div>
                      <Button 
                        onClick={() => setShowSecretForm(!showSecretForm)} 
                        variant="outline" 
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        {showSecretForm ? 'Hide Secret Form' : '🔓 Reveal Secret & Claim'}
                      </Button>
                    </div>
                  )}

                  {showSecretForm && (
                    <div className="space-y-3 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div className="text-center">
                        <div className="text-blue-800 font-semibold mb-1">🔐 Enter Your Secret</div>
                        <div className="text-blue-600 text-sm">This will generate the hashlock for claiming</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-blue-800">Secret:</Label>
                        <Input
                          type="password"
                          value={secret}
                          onChange={(e) => setSecret(e.target.value)}
                          placeholder="Enter secret to reveal hashlock"
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      <Button 
                        onClick={revealSecret} 
                        disabled={loading || !secret} 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? 'Revealing...' : '🔓 Reveal Secret'}
                      </Button>
                    </div>
                  )}

                  {/* Claim Section */}
                  {revealedSecret && (
                    <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="text-center mb-3">
                        <div className="text-green-800 font-semibold mb-1">🎯 Ready to Claim Tokens</div>
                        <div className="text-green-600 text-sm">Secret revealed - Claim your tokens gaslessly</div>
                      </div>
                      <Button 
                        onClick={claimTokens} 
                        disabled={loading} 
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {loading ? 'Claiming...' : '🎯 Claim Tokens (Gasless)'}
                      </Button>
                    </div>
                  )}

                  <Button onClick={checkStatus} disabled={!swapId || loading} variant="outline" className="w-full">
                    {loading ? 'Checking...' : 'Check Status'}
                  </Button>
                </div>

                {/* Status Display */}
                {swapStatus && (
                  <Alert>
                    <AlertDescription>{swapStatus}</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Swap Details */}
                {swapId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Swap Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Swap ID:</span>
                        <span className="font-mono">{swapId}</span>
                      </div>
                      {hashlock && (
                        <div className="flex justify-between">
                          <span>Hashlock:</span>
                          <span className="font-mono">{hashlock}</span>
                        </div>
                      )}
                      {deadline && (
                        <div className="flex justify-between">
                          <span>Deadline:</span>
                          <span>{new Date(parseInt(deadline) * 1000).toLocaleString()}</span>
                        </div>
                      )}
                      {txHash && (
                        <div className="flex justify-between">
                          <span>Transaction:</span>
                          <span className="font-mono">{txHash}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Transfer Blocks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">🔄 Transfer Blocks</CardTitle>
                    <CardDescription>
                      Real-time blockchain transaction details and transfer history
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* ETH Transfer Block */}
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-blue-900">🏭 Ethereum Transfer</h4>
                        <Badge variant="outline" className="text-blue-700">Sepolia Testnet</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">From:</span>
                          <span className="font-mono text-blue-800">
                            {isConnected ? '0xeb63...1f90' : 'Not Connected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">To:</span>
                          <span className="font-mono text-blue-800">0x9F5c...b20f</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-semibold text-blue-900">{ethAmount} ETH</span>
                        </div>
                        
                        {/* Gas Information */}
                        <div className="border-t pt-2 mt-2">
                          <div className="text-xs font-semibold text-blue-800 mb-2">⛽ Gas Details</div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gas Price:</span>
                              <span className="font-mono text-blue-800">~{gasPrice}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gas Limit:</span>
                              <span className="font-mono text-blue-800">~{gasLimit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Estimated Gas Cost:</span>
                              <span className="font-mono text-blue-800">~{estimatedGasCost}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gas Paid By:</span>
                              <span className="text-green-600 font-semibold">Resolver (Gasless)</span>
                            </div>
                          </div>
                        </div>
                        
                        {ethTxHash && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tx Hash:</span>
                            <span className="font-mono text-xs text-blue-800 break-all">
                              {ethTxHash}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={swapStatus === 'Executed' ? 'default' : 'secondary'}>
                            {swapStatus || 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* EOS Transfer Block */}
                    <div className="border rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-900">🌴 EOS Transfer</h4>
                        <Badge variant="outline" className="text-green-700">Jungle Testnet</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">From:</span>
                          <span className="font-mono text-green-800">
                            {isEosConnected ? eosAccountName : 'Not Connected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">To:</span>
                          <span className="font-mono text-green-800">silaslist123</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-semibold text-green-900">{eosAmount} EOS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Memo:</span>
                          <span className="font-mono text-green-800">
                            {swapId ? `Swap ${swapId.slice(0, 8)}` : 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={isEosConnected ? 'default' : 'secondary'}>
                            {isEosConnected ? 'Ready' : 'Not Connected'}
                          </Badge>
                        </div>
                        {eosTxHash && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tx Hash:</span>
                            <span className="font-mono text-xs text-green-800 break-all">
                              {eosTxHash}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cross-Chain Bridge Info */}
                    <div className="border rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-purple-900">🌉 Cross-Chain Bridge</h4>
                        <Badge variant="outline" className="text-purple-700">1inch Fusion+</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Direction:</span>
                          <span className="font-semibold text-purple-900">
                            {swapDirection === 'eth-to-eos' ? 'ETH → EOS' : 'EOS → ETH'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Exchange Rate:</span>
                          <span className="font-semibold text-purple-900">
                            1 ETH = {conversionRate.toLocaleString()} EOS
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gasless:</span>
                          <span className="text-green-600 font-semibold">✅ Yes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">HTLC:</span>
                          <span className="text-green-600 font-semibold">✅ Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Secret Management */}
                    {(swapId || revealedSecret) && (
                      <div className="border rounded-lg p-4 bg-orange-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-orange-900">🔐 Secret Management</h4>
                          <Badge variant="outline" className="text-orange-700">HTLC Security</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          {swapId && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Swap ID:</span>
                              <span className="font-mono text-orange-800 text-xs break-all">
                                {swapId}
                              </span>
                            </div>
                          )}
                          {hashlock && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hashlock:</span>
                              <span className="font-mono text-orange-800 text-xs break-all">
                                {hashlock}
                              </span>
                            </div>
                          )}
                          {revealedSecret && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Secret:</span>
                              <span className="font-mono text-orange-800 text-xs break-all">
                                {revealedSecret}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <Badge variant={revealedSecret ? 'default' : 'secondary'}>
                              {revealedSecret ? 'Secret Revealed' : 'Secret Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comprehensive HTLC Management */}
                    {htlcData && (
                      <div className="border rounded-lg p-4 bg-indigo-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-indigo-900">🔗 HTLC Contract Details</h4>
                          <Badge variant="outline" className="text-indigo-700">Real Contract Data</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {/* Left Column */}
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded border">
                              <div className="font-semibold text-indigo-800 mb-2">🔐 Hashlock</div>
                              <div className="text-gray-700 text-xs font-mono break-all">
                                {htlcData.hashlock}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                A bytes32 hash of a secret; ensures funds can only be claimed with a matching preimage
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded border">
                              <div className="font-semibold text-indigo-800 mb-2">⏰ Timelock</div>
                              <div className="text-gray-700">
                                {new Date(htlcData.timelock * 1000).toLocaleString()}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                A deadline after which the funds can be refunded to the original sender
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded border">
                              <div className="font-semibold text-indigo-800 mb-2">🧾 Order Hash</div>
                              <div className="text-gray-700 text-xs font-mono break-all">
                                {htlcData.orderHash}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                A unique identifier for each swap order (used to link swaps between chains)
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded border">
                              <div className="font-semibold text-indigo-800 mb-2">🏷️ Beneficiary</div>
                              <div className="text-gray-700 text-xs font-mono break-all">
                                {htlcData.beneficiary}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                The address who will receive the funds upon revealing the correct secret
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column */}
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded border">
                              <div className="font-semibold text-indigo-800 mb-2">💰 Amount</div>
                              <div className="text-gray-700 font-semibold">
                                {htlcData.amount} ETH
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                The token or native asset amount being locked in the escrow
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded border">
                              <div className="font-semibold text-indigo-800 mb-2">🗓️ Deadline</div>
                              <div className="text-gray-700">
                                {new Date(htlcData.deadline * 1000).toLocaleString()}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                Expiry time in Unix timestamp format for automatic refund logic
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded border">
                              <div className="font-semibold text-indigo-800 mb-2">🏦 Escrow Address</div>
                              <div className="text-gray-700 text-xs font-mono break-all">
                                {htlcData.escrowAddress || 'Not deployed yet'}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                The deployed escrow contract address holding the locked funds
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded border">
                              <div className="font-semibold text-indigo-800 mb-2">🧠 Escrow State</div>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Executed:</span>
                                  <Badge variant={htlcData.executed ? 'default' : 'secondary'}>
                                    {htlcData.executed ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Claimed:</span>
                                  <Badge variant={htlcData.claimed ? 'default' : 'secondary'}>
                                    {htlcData.claimed ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Expired:</span>
                                  <Badge variant={Date.now() > htlcData.deadline * 1000 ? 'destructive' : 'secondary'}>
                                    {Date.now() > htlcData.deadline * 1000 ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                Whether the escrow is resolved, claimed, or refunded to prevent double claims
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* HTLC Actions */}
                        <div className="mt-4 pt-4 border-t border-indigo-200">
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              onClick={() => fetchHTLCData(swapId)} 
                              variant="outline" 
                              size="sm"
                              className="text-indigo-700 border-indigo-300"
                            >
                              🔄 Refresh HTLC Data
                            </Button>
                            
                            <Button 
                              onClick={getIntentDetails} 
                              variant="outline" 
                              size="sm"
                              className="text-blue-700 border-blue-300"
                            >
                              📋 Get Intent Details
                            </Button>
                            
                            {htlcData.executed && !htlcData.claimed && Date.now() > htlcData.deadline * 1000 && (
                              <Button 
                                onClick={refundHTLC} 
                                variant="destructive" 
                                size="sm"
                              >
                                🔄 Refund Expired HTLC
                              </Button>
                            )}
                            
                            {htlcData.executed && !htlcData.claimed && Date.now() <= htlcData.deadline * 1000 && (
                              <Button 
                                onClick={() => setShowSecretForm(true)} 
                                variant="default" 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                🔓 Claim with Secret
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gasless Mechanism Explanation */}
                    <div className="border rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-yellow-900">💸 Gasless Mechanism</h4>
                        <Badge variant="outline" className="text-yellow-700">How It Works</Badge>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="bg-white p-3 rounded border">
                          <div className="font-semibold text-yellow-800 mb-2">🔐 Step 1: Intent Creation (0 Gas)</div>
                          <div className="text-gray-700 space-y-1">
                            <div>• User signs EIP-712 intent off-chain</div>
                            <div>• No blockchain transaction required</div>
                            <div>• Intent stored in resolver contract</div>
                            <div>• <span className="font-semibold text-green-600">User pays: 0 gas</span></div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded border">
                          <div className="font-semibold text-yellow-800 mb-2">⚡ Step 2: Intent Execution (Resolver Pays Gas)</div>
                          <div className="text-gray-700 space-y-1">
                            <div>• Resolver calls executeIntent() function</div>
                            <div>• Resolver pays {estimatedGasCost} in gas fees</div>
                            <div>• Creates escrow contract with user's ETH</div>
                            <div>• <span className="font-semibold text-green-600">User pays: 0 gas</span></div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded border">
                          <div className="font-semibold text-yellow-800 mb-2">🎯 Step 3: Token Claim (0 Gas)</div>
                          <div className="text-gray-700 space-y-1">
                            <div>• User reveals secret to claim tokens</div>
                            <div>• Resolver handles claim transaction</div>
                            <div>• Resolver pays gas for claim</div>
                            <div>• <span className="font-semibold text-green-600">User pays: 0 gas</span></div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-100 p-3 rounded border">
                          <div className="font-semibold text-blue-800 mb-1">💰 Total User Cost:</div>
                          <div className="text-blue-700">
                            <span className="font-bold text-lg">0 ETH gas fees</span> + <span className="font-bold">{ethAmount} ETH swap amount</span>
                          </div>
                        </div>
                        
                        <div className="bg-green-100 p-3 rounded border">
                          <div className="font-semibold text-green-800 mb-1">💚 Gas Savings:</div>
                          <div className="text-green-700">
                            <div>• User saves: <span className="font-bold">{estimatedGasCost}</span></div>
                            <div>• Resolver pays: <span className="font-bold">{estimatedGasCost}</span></div>
                            <div>• Gasless benefit: <span className="font-bold text-lg">100% gas savings</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Timeline */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-3">📅 Transaction Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">ETH Wallet Connected</div>
                            <div className="text-xs text-gray-500">Sepolia Testnet</div>
                          </div>
                          <Badge variant={isConnected ? 'default' : 'secondary'}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${isEosConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">EOS Wallet Connected</div>
                            <div className="text-xs text-gray-500">Jungle Testnet</div>
                          </div>
                          <Badge variant={isEosConnected ? 'default' : 'secondary'}>
                            {isEosConnected ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${swapId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Intent Created</div>
                            <div className="text-xs text-gray-500">Gasless signature</div>
                          </div>
                          <Badge variant={swapId ? 'default' : 'secondary'}>
                            {swapId ? 'Created' : 'Pending'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${swapStatus === 'Executed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Intent Executed</div>
                            <div className="text-xs text-gray-500">Resolver pays gas</div>
                          </div>
                          <Badge variant={swapStatus === 'Executed' ? 'default' : 'secondary'}>
                            {swapStatus === 'Executed' ? 'Executed' : 'Pending'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${swapStatus === 'Claimed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Tokens Claimed</div>
                            <div className="text-xs text-gray-500">Secret revealed</div>
                          </div>
                          <Badge variant={swapStatus === 'Claimed' ? 'default' : 'secondary'}>
                            {swapStatus === 'Claimed' ? 'Claimed' : 'Pending'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${revealedSecret ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Secret Revealed</div>
                            <div className="text-xs text-gray-500">Hashlock generated</div>
                          </div>
                          <Badge variant={revealedSecret ? 'default' : 'secondary'}>
                            {revealedSecret ? 'Revealed' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mainnet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🏭 Mainnet Bidirectional Swaps</CardTitle>
                <CardDescription>
                  Production-ready gasless mainnet swaps (ETH ↔ EOS)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">ETH → EOS Mainnet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Gasless ETH to EOS swap on mainnet
                      </p>
                      <Button 
                        onClick={() => window.open('https://github.com/your-repo#eth-to-eos-mainnet', '_blank')}
                        className="w-full"
                      >
                        Run ETH→EOS
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">EOS → ETH Mainnet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Gasless EOS to ETH swap on mainnet
                      </p>
                      <Button 
                        onClick={() => window.open('https://github.com/your-repo#eos-to-eth-mainnet', '_blank')}
                        className="w-full"
                      >
                        Run EOS→ETH
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Mainnet Configuration Required:</strong><br />
                    1. Copy <code>mainnet-config.example</code> to <code>.env</code><br />
                    2. Add your mainnet private keys and RPC URLs<br />
                    3. Run: <code>npm run eth-to-eos-mainnet</code> or <code>npm run eos-to-eth-mainnet</code>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contract Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">📋 Contract Information</CardTitle>
            <CardDescription>
              {renderContractInfo()}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Resolver Balance Check */}
                {/* Resolver Balance Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>💰 Resolver Funding Status</CardTitle>
                    <CardDescription>
                      The resolver needs ETH to pay for gas fees in gasless transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resolverBalance ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">Resolver Address:</span>
                          <span className="font-mono text-xs">{resolverBalance.address}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Balance:</span>
                          <span className="font-bold">{resolverBalance.balance} ETH</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Status:</span>
                          <Badge variant={resolverBalance.isFunded ? "default" : "destructive"}>
                            {resolverBalance.isFunded ? "✅ Funded" : "❌ Not Funded"}
                          </Badge>
                        </div>
                        
                        {!resolverBalance.isFunded && (
                          <Alert>
                            <AlertDescription>
                              <strong>To fund the resolver:</strong>
                              <br />
                              1. Send ETH to: <code className="text-xs">{resolverBalance.address}</code>
                              <br />
                              2. Network: Sepolia Testnet
                              <br />
                              3. Recommended: 0.1 ETH
                              <br />
                              <br />
                              <strong>Free Sepolia ETH:</strong>
                              <br />
                              • <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sepolia Faucet</a>
                              <br />
                              • <a href="https://www.infura.io/faucet/sepolia" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Infura Faucet</a>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        Connect wallet to check resolver balance
                      </div>
                    )}
                    
                    <Button 
                      onClick={checkResolverBalance} 
                      variant="outline" 
                      className="w-full"
                      disabled={!isConnected}
                    >
                      🔄 Check Resolver Balance
                    </Button>
                  </CardContent>
                </Card>
        {/* Secret Management Section */}
        {swapId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔐 Secret Management
            </h3>
            
            {/* Status Indicator */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                {revealedSecret 
                  ? '✅ Secret is available and ready for claiming!' 
                  : '⏳ No secret available. Click "Get Stored Secret" to retrieve your secret.'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Secret
                </label>
                <div className="bg-gray-50 p-3 rounded border font-mono text-sm break-all">
                  {revealedSecret || 'No secret revealed yet'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashlock
                </label>
                <div className="bg-gray-50 p-3 rounded border font-mono text-sm break-all">
                  {hashlock || 'No hashlock available'}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={getStoredSecret} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                📋 Get Stored Secret
              </Button>
              <Button 
                onClick={generateSecret} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                🔐 Generate New Secret
              </Button>
              <Button 
                onClick={verifySecret} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                🔍 Verify Secret
              </Button>
              {revealedSecret && (
                <Button 
                  onClick={claimTokens} 
                  variant="default" 
                  size="sm"
                  className="text-xs bg-green-600 hover:bg-green-700"
                >
                  💰 Claim Tokens
                </Button>
              )}
              {revealedSecret && (
                <Button 
                  onClick={copySecretToClipboard} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  📋 Copy Secret
                </Button>
              )}
            </div>
            
            {/* Manual Secret Input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manual Secret Input (if you have a secret)
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your secret (hex format)"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={verifySecret} 
                  variant="outline" 
                  size="sm"
                  disabled={!secret}
                >
                  Verify
                </Button>
              </div>
            </div>
            
            {revealedSecret && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  ✅ Secret is ready! You can now claim your tokens.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
