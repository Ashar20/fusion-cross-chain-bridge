import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import io from 'socket.io-client';

interface PartialFill {
  orderId: string;
  resolver: string;
  fillAmount: string;
  remainingAmount: string;
  algorandAmount: string;
  resolverFee: string;
  fillIndex: string;
  isFullyFilled: boolean;
  timestamp: string;
  transactionHash: string;
  isMyFill: boolean;
}

interface PartialFillOrder {
  orderId: string;
  maker: string;
  makerToken: string;
  takerToken: string;
  makerAmount: string;
  takerAmount: string;
  deadline: string;
  algorandAddress: string;
  partialFillsEnabled: boolean;
  minFillAmount: string;
  filledAmount: string;
  remainingAmount: string;
  fillCount: number;
  status: 'pending' | 'partial' | 'completed' | 'error' | 'cancelled';
  createdAt: string;
  transactionHash?: string;
  fills: PartialFill[];
}

const PartialFillInterface: React.FC = () => {
  // Connection states
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string>('');
  const [connected, setConnected] = useState(false);
  
  // Form state with partial fill options
  const [ethAmount, setEthAmount] = useState('');
  const [algoAmount, setAlgoAmount] = useState('');
  const [algoAddress, setAlgoAddress] = useState('');
  const [partialFillsEnabled, setPartialFillsEnabled] = useState(true);
  const [minFillAmount, setMinFillAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Order tracking
  const [activeOrders, setActiveOrders] = useState<PartialFillOrder[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  
  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);
  
  const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:8080';

  useEffect(() => {
    // Initialize WebSocket connection
    const socketConnection = io(RELAYER_URL);
    setSocket(socketConnection);

    socketConnection.on('connect', () => {
      console.log('🔌 Connected to partial fill relayer');
    });

    socketConnection.on('newPartialFillOrder', (order: PartialFillOrder) => {
      setActiveOrders(prev => [...prev, { ...order, fills: [] }]);
    });

    socketConnection.on('partialFillExecuted', (fillData: PartialFill) => {
      setActiveOrders(prev => prev.map(order => {
        if (order.orderId === fillData.orderId) {
          return {
            ...order,
            remainingAmount: fillData.remainingAmount,
            filledAmount: (BigInt(order.makerAmount) - BigInt(fillData.remainingAmount)).toString(),
            fillCount: order.fillCount + 1,
            status: fillData.isFullyFilled ? 'completed' : 'partial',
            fills: [...order.fills, fillData]
          };
        }
        return order;
      }));
    });

    socketConnection.on('orderFullyCompleted', (completionData: any) => {
      setActiveOrders(prev => prev.map(order => {
        if (order.orderId === completionData.orderId) {
          return {
            ...order,
            status: 'completed',
            filledAmount: completionData.totalFilled,
            remainingAmount: '0'
          };
        }
        return order;
      }));
    });

    // Fetch analytics periodically
    const analyticsInterval = setInterval(async () => {
      try {
        const response = await fetch(`${RELAYER_URL}/api/analytics`);
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    }, 10000);

    return () => {
      socketConnection.disconnect();
      clearInterval(analyticsInterval);
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

  const createPartialFillOrder = async () => {
    if (!signer || !ethAmount || !algoAmount || !algoAddress) {
      alert('Please fill all fields and connect your wallet');
      return;
    }

    if (partialFillsEnabled && !minFillAmount) {
      alert('Please specify minimum fill amount for partial fills');
      return;
    }

    setLoading(true);
    try {
      const contractABI = [
        "function submitLimitOrder((address,address,address,uint256,uint256,uint256,uint256,string,bytes32,bool,uint256), bytes, bytes32, uint256) external payable returns (bytes32)"
      ];
      
      const contractAddress = process.env.NEXT_PUBLIC_PARTIAL_FILL_CONTRACT || process.env.NEXT_PUBLIC_LIMIT_ORDER_CONTRACT;
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // Enhanced intent with partial fill options
      const intent = {
        maker: account,
        makerToken: "0x0000000000000000000000000000000000000000",
        takerToken: "0x0000000000000000000000000000000000000000",
        makerAmount: ethers.parseEther(ethAmount),
        takerAmount: ethers.parseUnits(algoAmount, 6),
        deadline: Math.floor(Date.now() / 1000) + 86400,
        algorandChainId: 416002,
        algorandAddress: algoAddress,
        salt: ethers.randomBytes(32),
        partialFillsEnabled: partialFillsEnabled,
        minFillAmount: partialFillsEnabled ? ethers.parseEther(minFillAmount) : 0n
      };
      
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      const timelock = 0;
      const signature = "0x";
      
      console.log('🧩 Creating partial fill order...');
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
      
      // Subscribe to partial fill updates
      if (socket) {
        const orderId = receipt.logs[0]?.topics[1];
        socket.emit('subscribeToPartialFills', orderId);
      }
      
      // Reset form
      setEthAmount('');
      setAlgoAmount('');
      setAlgoAddress('');
      setMinFillAmount('');
      
      alert(partialFillsEnabled ? 
        '🧩 Partial fill order created! Watch it get filled incrementally.' : 
        '🎉 Full fill order created! The relayer will execute it when profitable.'
      );
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      alert('Error creating order. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (order: PartialFillOrder) => {
    const total = parseFloat(ethers.formatEther(order.makerAmount));
    const filled = parseFloat(ethers.formatEther(order.filledAmount || '0'));
    return (filled / total) * 100;
  };

  const formatStatus = (status: string, fillCount: number) => {
    const statusMap = {
      pending: { text: '⏳ Pending', color: 'text-yellow-600' },
      partial: { text: `🧩 Partial (${fillCount} fills)`, color: 'text-blue-600' },
      completed: { text: '✅ Completed', color: 'text-green-600' },
      error: { text: '❌ Error', color: 'text-red-600' },
      cancelled: { text: '🚫 Cancelled', color: 'text-gray-600' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, color: 'text-gray-600' };
    return <span className={statusInfo.color}>{statusInfo.text}</span>;
  };

  const OrderDetails: React.FC<{ order: PartialFillOrder }> = ({ order }) => {
    const progress = calculateProgress(order);
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {ethers.formatEther(order.makerAmount)} ETH → {ethers.formatUnits(order.takerAmount, 6)} ALGO
            </h3>
            <p className="text-sm text-gray-600">
              To: {order.algorandAddress.slice(0, 10)}...{order.algorandAddress.slice(-10)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Order ID: {order.orderId.slice(0, 10)}...
            </p>
          </div>
          <div className="text-right">
            {formatStatus(order.status, order.fillCount)}
            <p className="text-xs text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                progress === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Filled: {ethers.formatEther(order.filledAmount || '0')} ETH</span>
            <span>Remaining: {ethers.formatEther(order.remainingAmount || order.makerAmount)} ETH</span>
          </div>
        </div>
        
        {/* Partial Fill Settings */}
        {order.partialFillsEnabled && (
          <div className="bg-blue-50 rounded p-3 mb-4">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 font-medium">🧩 Partial Fills Enabled</span>
            </div>
            <div className="text-sm text-blue-700">
              <p>Min Fill: {ethers.formatEther(order.minFillAmount)} ETH</p>
              <p>Fill Count: {order.fillCount} fills</p>
            </div>
          </div>
        )}
        
        {/* Fill History */}
        {order.fills.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Fill History ({order.fills.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {order.fills.map((fill, index) => (
                <div key={index} className="flex justify-between items-center text-sm bg-gray-50 rounded p-2">
                  <div>
                    <span className="font-medium">{ethers.formatEther(fill.fillAmount)} ETH</span>
                    <span className="text-gray-600 ml-2">
                      by {fill.resolver.slice(0, 6)}...{fill.resolver.slice(-4)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600">+{ethers.formatEther(fill.resolverFee)} ETH fee</p>
                    <p className="text-xs text-gray-500">
                      {new Date(fill.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {order.transactionHash && (
          <div className="mt-4 text-xs">
            <a 
              href={`https://sepolia.etherscan.io/tx/${order.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Initial Transaction ↗
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧩 Partial Fill Bridge
          </h1>
          <p className="text-gray-600">
            Advanced gasless cross-chain swaps with intelligent partial fills
          </p>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Capital Utilization</div>
              <div className="text-2xl font-bold text-blue-600">{analytics.capitalUtilization.utilizationRate}</div>
              <div className="text-xs text-gray-500">{analytics.capitalUtilization.totalDeployed}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Competitive Edge</div>
              <div className="text-2xl font-bold text-green-600">{analytics.competitiveAdvantage}</div>
              <div className="text-xs text-gray-500">Market share</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Profit</div>
              <div className="text-2xl font-bold text-purple-600">{analytics.profitabilityMetrics.totalProfit}</div>
              <div className="text-xs text-gray-500">{analytics.profitabilityMetrics.averageMargin} avg margin</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Execution Time</div>
              <div className="text-2xl font-bold text-orange-600">{analytics.averageExecutionTime}</div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Order Creation */}
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
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

            {/* Enhanced Swap Interface */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Create Advanced Order</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ETH Amount</label>
                  <input
                    type="number"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    placeholder="0.01"
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
                    placeholder="150"
                    step="0.1"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Algorand Address</label>
                <input
                  type="text"
                  value={algoAddress}
                  onChange={(e) => setAlgoAddress(e.target.value)}
                  placeholder="V2HHWIMPZMH4VMMB2KHNKKPJAI35Z3NUMVWFRE22DKQS7K4SBMYHHP6P7M"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Partial Fill Options */}
              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="partialFills"
                    checked={partialFillsEnabled}
                    onChange={(e) => setPartialFillsEnabled(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="partialFills" className="font-medium text-purple-800">
                    🧩 Enable Partial Fills
                  </label>
                </div>
                
                {partialFillsEnabled && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-purple-700">
                      Minimum Fill Amount (ETH)
                    </label>
                    <input
                      type="number"
                      value={minFillAmount}
                      onChange={(e) => setMinFillAmount(e.target.value)}
                      placeholder="0.002"
                      step="0.001"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-purple-600 mt-1">
                      💡 Smaller fills = more opportunities, but more gas overhead
                    </p>
                  </div>
                )}
              </div>
              
              <button
                onClick={createPartialFillOrder}
                disabled={!connected || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Creating Order...' : 
                 partialFillsEnabled ? '🧩 Create Partial Fill Order' : '🚀 Create Full Fill Order'}
              </button>
              
              <div className="mt-4 text-sm text-gray-600">
                {partialFillsEnabled ? (
                  <>
                    🧩 <strong>Partial Fill Benefits:</strong> Your order can be filled incrementally by multiple resolvers, 
                    providing better price discovery and faster execution for large orders.
                  </>
                ) : (
                  <>
                    💡 <strong>Full Fill:</strong> Your entire order will be executed in one transaction when conditions are met.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active Orders */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Active Orders ({activeOrders.length})
              </h2>
              
              {activeOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🧩</div>
                  <p className="text-lg">No active orders</p>
                  <p className="text-sm mt-2">Create a partial fill order to see intelligent execution</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {activeOrders.map((order) => (
                    <OrderDetails key={order.orderId} order={order} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartialFillInterface; 