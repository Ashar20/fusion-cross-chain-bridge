import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import io from 'socket.io-client';

interface LimitOrder {
  orderId: string;
  maker: string;
  makerToken: string;
  takerToken: string;
  makerAmount: string;
  takerAmount: string;
  deadline: string;
  algorandAddress: string;
  status: 'pending' | 'executing' | 'completed' | 'error' | 'unprofitable';
  createdAt: string;
  transactionHash?: string;
}

const SwapInterface: React.FC = () => {
  // Connection states
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string>('');
  const [connected, setConnected] = useState(false);
  
  // Swap form state
  const [ethAmount, setEthAmount] = useState('');
  const [algoAmount, setAlgoAmount] = useState('');
  const [algoAddress, setAlgoAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Order tracking
  const [activeOrders, setActiveOrders] = useState<LimitOrder[]>([]);
  const [socket, setSocket] = useState<any>(null);
  
  // Relayer service connection
  const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:8080';

  useEffect(() => {
    // Initialize WebSocket connection to relayer
    const socketConnection = io(RELAYER_URL);
    setSocket(socketConnection);

    socketConnection.on('connect', () => {
      console.log('🔌 Connected to relayer service');
    });

    socketConnection.on('activeOrders', (orders: LimitOrder[]) => {
      setActiveOrders(orders);
    });

    socketConnection.on('newOrder', (order: LimitOrder) => {
      setActiveOrders(prev => [...prev, order]);
    });

    socketConnection.on('orderUpdate', (updatedOrder: LimitOrder) => {
      setActiveOrders(prev => prev.map(order => 
        order.orderId === updatedOrder.orderId ? updatedOrder : order
      ));
    });

    socketConnection.on('orderCompleted', (completedOrder: LimitOrder) => {
      setActiveOrders(prev => prev.filter(order => order.orderId !== completedOrder.orderId));
    });

    return () => {
      socketConnection.disconnect();
    };
  }, [RELAYER_URL]);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        setConnected(true);
        
        console.log('💰 Wallet connected:', accounts[0]);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
    }
  };

  const createLimitOrder = async () => {
    if (!signer || !ethAmount || !algoAmount || !algoAddress) {
      alert('Please fill all fields and connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Contract ABI and address
      const limitOrderABI = [
        "function submitLimitOrder((address,address,address,uint256,uint256,uint256,uint256,string,bytes32), bytes, bytes32, uint256) external payable returns (bytes32)",
        "event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock)"
      ];
      
      const contractAddress = process.env.NEXT_PUBLIC_LIMIT_ORDER_CONTRACT || "0xYourContractAddress";
      const contract = new ethers.Contract(contractAddress, limitOrderABI, signer);
      
      // Create intent
      const intent = {
        maker: account,
        makerToken: "0x0000000000000000000000000000000000000000", // ETH
        takerToken: "0x0000000000000000000000000000000000000000", // ALGO (cross-chain)
        makerAmount: ethers.parseEther(ethAmount),
        takerAmount: ethers.parseUnits(algoAmount, 6), // ALGO has 6 decimals
        deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        algorandChainId: 416002, // Algorand testnet
        algorandAddress: algoAddress,
        salt: ethers.randomBytes(32)
      };
      
      // Generate hashlock
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      const timelock = 0; // Use default timelock
      
      // Create signature (simplified - in production use EIP-712)
      const signature = "0x"; // Placeholder
      
      console.log('🎯 Creating limit order...');
      const tx = await contract.submitLimitOrder(
        intent,
        signature,
        hashlock,
        timelock,
        { value: ethers.parseEther(ethAmount) }
      );
      
      console.log('📜 Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      
      // Subscribe to order updates
      if (socket) {
        const orderId = receipt.logs[0]?.topics[1]; // Get order ID from event
        socket.emit('subscribeToOrder', orderId);
      }
      
      // Reset form
      setEthAmount('');
      setAlgoAmount('');
      setAlgoAddress('');
      
      alert('🎉 Limit order created! The relayer will execute it automatically when profitable.');
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      alert('Error creating order. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    const statusMap = {
      pending: { text: '⏳ Pending', color: 'text-yellow-600' },
      executing: { text: '🚀 Executing', color: 'text-blue-600' },
      completed: { text: '✅ Completed', color: 'text-green-600' },
      error: { text: '❌ Error', color: 'text-red-600' },
      unprofitable: { text: '📉 Unprofitable', color: 'text-gray-600' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, color: 'text-gray-600' };
    return <span className={statusInfo.color}>{statusInfo.text}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌉 Gasless Cross-Chain Bridge
          </h1>
          <p className="text-gray-600">
            Swap ETH → ALGO with zero gas fees • Powered by automated relayers
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Wallet Connection</h2>
              {connected ? (
                <p className="text-green-600">
                  ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              ) : (
                <p className="text-gray-600">❌ Not connected</p>
              )}
            </div>
            {!connected && (
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Swap Interface */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Gasless Swap</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">ETH Amount</label>
              <input
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="0.001"
                step="0.001"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">ALGO Amount (minimum)</label>
              <input
                type="number"
                value={algoAmount}
                onChange={(e) => setAlgoAmount(e.target.value)}
                placeholder="15"
                step="0.1"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Algorand Address</label>
            <input
              type="text"
              value={algoAddress}
              onChange={(e) => setAlgoAddress(e.target.value)}
              placeholder="V2HHWIMPZMH4VMMB2KHNKKPJAI35Z3NUMVWFRE22DKQS7K4SBMYHHP6P7M"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={createLimitOrder}
            disabled={!connected || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Creating Order...' : '🚀 Create Gasless Swap'}
          </button>
          
          <div className="mt-4 text-sm text-gray-600">
            💡 <strong>How it works:</strong> You pay only for this transaction. The relayer will automatically execute your swap when profitable and cover all cross-chain gas fees!
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Active Orders ({activeOrders.length})
          </h2>
          
          {activeOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>🔍 No active orders</p>
              <p className="text-sm mt-2">Create a swap to see real-time updates here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.orderId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">
                        {ethers.formatEther(order.makerAmount)} ETH → {ethers.formatUnits(order.takerAmount, 6)} ALGO
                      </p>
                      <p className="text-sm text-gray-600">
                        To: {order.algorandAddress.slice(0, 10)}...{order.algorandAddress.slice(-10)}
                      </p>
                    </div>
                    <div className="text-right">
                      {formatStatus(order.status)}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {order.transactionHash && (
                    <p className="text-xs text-blue-600">
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${order.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        View on Etherscan ↗
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapInterface; 