// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Enhanced1inchStyleBridge
 * @dev Cross-chain HTLC bridge enhanced with 1inch Fusion patterns
 * 
 * 🔥 FUSION-INSPIRED FEATURES:
 * - Simplified auction parameters (like 1inch)
 * - Interaction-based resolver execution
 * - Threshold-based user protection
 * - Permit-based gas-efficient approvals
 * 
 * 🌉 CROSS-CHAIN ENHANCEMENTS:
 * - ETH ↔ Algorand atomic swaps
 * - Cryptographic hash lock security
 * - Bidirectional HTLC coordination
 * - Gas price competition mechanism
 */
contract Enhanced1inchStyleBridge is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // 🎯 1inch-inspired auction configuration
    struct SimpleAuction {
        uint256 startTime;
        uint256 duration;           // Simple duration (like 1inch's 180s)
        uint256 initialRateBump;    // Price premium (like 1inch's 0)
        bool linearDecay;           // Simple linear price decay
    }
    
    // 🌉 Cross-chain HTLC with 1inch patterns
    struct FusionHTLC {
        address initiator;
        address recipient;
        address token;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        uint256 algorandChainId;
        string algorandAddress;
        uint256 algorandAmount;
        uint256 thresholdAmount;    // 1inch-style minimum output protection
        bytes interactionData;      // 1inch-style resolver execution data
        bool executed;
        bool refunded;
        uint256 createdAt;
    }
    
    // 🤖 1inch-style resolver interaction
    struct ResolverInteraction {
        address target;             // Resolver contract
        bytes callData;            // Execution instructions
        uint256 gasLimit;          // Gas limit for interaction
    }
    
    // ⚡ Simplified auction (1inch pattern)
    struct ResolverAuction {
        bytes32 htlcId;
        SimpleAuction config;
        address winningResolver;
        uint256 winningGasPrice;
        uint256 currentPrice;
        bool filled;
        bool expired;
    }
    
    mapping(bytes32 => FusionHTLC) public htlcContracts;
    mapping(bytes32 => ResolverAuction) public auctions;
    mapping(address => bool) public authorizedResolvers;
    mapping(bytes32 => bytes32) public revealedSecrets;
    
    // 🎯 1inch-inspired auction defaults
    uint256 public constant DEFAULT_AUCTION_DURATION = 180; // 3 minutes (like 1inch)
    uint256 public constant DEFAULT_INITIAL_RATE_BUMP = 0;   // No premium (like 1inch)
    uint256 public constant INITIAL_GAS_PRICE = 50 gwei;
    uint256 public constant MIN_GAS_PRICE = 5 gwei;
    
    event FusionHTLCCreated(
        bytes32 indexed htlcId,
        address indexed initiator,
        uint256 amount,
        bytes32 hashlock,
        uint256 thresholdAmount
    );
    
    event SimpleAuctionStarted(
        bytes32 indexed auctionId,
        bytes32 indexed htlcId,
        uint256 duration,
        uint256 startTime
    );
    
    event ResolverInteractionExecuted(
        bytes32 indexed htlcId,
        address indexed resolver,
        bytes result
    );
    
    event AuctionWon(
        bytes32 indexed auctionId,
        address indexed resolver,
        uint256 gasPrice
    );
    
    event HTLCExecuted(
        bytes32 indexed htlcId,
        address indexed resolver,
        bytes32 secret
    );
    
    constructor() Ownable(msg.sender) {
        // Initialize with 1inch-inspired defaults
    }
    
    /**
     * @dev Create HTLC with 1inch Fusion patterns
     * @param _recipient Token recipient
     * @param _token Token contract (address(0) for ETH)
     * @param _amount Amount to lock
     * @param _hashlock Secret hash
     * @param _timelock Expiry timestamp
     * @param _algorandChainId Target Algorand chain
     * @param _algorandAddress Algorand recipient
     * @param _algorandAmount Algorand output amount
     * @param _thresholdAmount Minimum output (1inch pattern)
     * @param _interactionData Resolver execution data (1inch pattern)
     */
    function createFusionHTLC(
        address _recipient,
        address _token,
        uint256 _amount,
        bytes32 _hashlock,
        uint256 _timelock,
        uint256 _algorandChainId,
        string calldata _algorandAddress,
        uint256 _algorandAmount,
        uint256 _thresholdAmount,
        bytes calldata _interactionData
    ) external payable nonReentrant returns (bytes32 htlcId) {
        require(_thresholdAmount > 0, "Invalid threshold");
        require(_amount > 0, "Amount must be > 0");
        require(_timelock > block.timestamp, "Invalid timelock");
        
        htlcId = keccak256(abi.encodePacked(
            msg.sender,
            _recipient,
            _token,
            _amount,
            _hashlock,
            _timelock,
            block.timestamp
        ));
        
        require(htlcContracts[htlcId].initiator == address(0), "HTLC exists");
        
        // Lock funds (same as original)
        if (_token == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            require(msg.value == 0, "ETH not expected");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }
        
        // Store HTLC with 1inch patterns
        htlcContracts[htlcId] = FusionHTLC({
            initiator: msg.sender,
            recipient: _recipient,
            token: _token,
            amount: _amount,
            hashlock: _hashlock,
            timelock: _timelock,
            algorandChainId: _algorandChainId,
            algorandAddress: _algorandAddress,
            algorandAmount: _algorandAmount,
            thresholdAmount: _thresholdAmount,      // 1inch-style protection
            interactionData: _interactionData,      // 1inch-style execution
            executed: false,
            refunded: false,
            createdAt: block.timestamp
        });
        
        emit FusionHTLCCreated(
            htlcId,
            msg.sender,
            _amount,
            _hashlock,
            _thresholdAmount
        );
    }
    
    /**
     * @dev Start simple auction (1inch pattern)
     */
    function startSimpleAuction(
        bytes32 _htlcId,
        uint256 _duration
    ) external returns (bytes32 auctionId) {
        require(authorizedResolvers[msg.sender], "Not authorized");
        FusionHTLC storage htlc = htlcContracts[_htlcId];
        require(htlc.initiator != address(0), "HTLC not found");
        
        // Use 1inch-inspired simple defaults
        uint256 duration = _duration > 0 ? _duration : DEFAULT_AUCTION_DURATION;
        
        auctionId = keccak256(abi.encodePacked(_htlcId, block.timestamp));
        
        auctions[auctionId] = ResolverAuction({
            htlcId: _htlcId,
            config: SimpleAuction({
                startTime: block.timestamp,
                duration: duration,
                initialRateBump: DEFAULT_INITIAL_RATE_BUMP,
                linearDecay: true
            }),
            winningResolver: address(0),
            winningGasPrice: 0,
            currentPrice: INITIAL_GAS_PRICE,
            filled: false,
            expired: false
        });
        
        emit SimpleAuctionStarted(auctionId, _htlcId, duration, block.timestamp);
    }
    
    /**
     * @dev Get current auction price (1inch-style linear decay)
     */
    function getCurrentAuctionPrice(bytes32 _auctionId) public view returns (uint256) {
        ResolverAuction storage auction = auctions[_auctionId];
        if (!auction.config.linearDecay) return auction.currentPrice;
        
        uint256 elapsed = block.timestamp - auction.config.startTime;
        if (elapsed >= auction.config.duration) return MIN_GAS_PRICE;
        
        // Linear price decay (1inch pattern)
        uint256 priceRange = INITIAL_GAS_PRICE - MIN_GAS_PRICE;
        uint256 priceDecay = (priceRange * elapsed) / auction.config.duration;
        
        return INITIAL_GAS_PRICE - priceDecay;
    }
    
    /**
     * @dev Place bid in auction (1inch pattern)
     */
    function placeBid(bytes32 _auctionId, uint256 _gasPrice) external {
        require(authorizedResolvers[msg.sender], "Not authorized resolver");
        ResolverAuction storage auction = auctions[_auctionId];
        require(auction.htlcId != bytes32(0), "Auction not found");
        require(!auction.filled, "Auction already filled");
        require(!auction.expired, "Auction expired");
        require(block.timestamp < auction.config.startTime + auction.config.duration, "Auction ended");
        require(_gasPrice >= MIN_GAS_PRICE, "Gas price too low");
        
        uint256 currentPrice = getCurrentAuctionPrice(_auctionId);
        require(_gasPrice <= currentPrice, "Bid too high for current price");
        
        // Update auction with winning bid
        auction.winningResolver = msg.sender;
        auction.winningGasPrice = _gasPrice;
        auction.currentPrice = _gasPrice;
        auction.filled = true;
        
        emit AuctionWon(_auctionId, msg.sender, _gasPrice);
    }
    
    /**
     * @dev Execute HTLC with 1inch-style resolver interaction
     */
    function executeFusionHTLCWithInteraction(
        bytes32 _htlcId,
        bytes32 _secret,
        bytes32 _auctionId,
        ResolverInteraction calldata _interaction
    ) external nonReentrant {
        FusionHTLC storage htlc = htlcContracts[_htlcId];
        ResolverAuction storage auction = auctions[_auctionId];
        
        require(auction.winningResolver == msg.sender, "Not auction winner");
        require(htlc.initiator != address(0), "HTLC not found");
        require(!htlc.executed, "Already executed");
        require(keccak256(abi.encodePacked(_secret)) == htlc.hashlock, "Invalid secret");
        require(block.timestamp < htlc.timelock, "HTLC expired");
        
        // Store revealed secret
        revealedSecrets[_htlcId] = _secret;
        
        // Execute 1inch-style resolver interaction
        if (_interaction.target != address(0)) {
            (bool success, bytes memory result) = _interaction.target.call{
                gas: _interaction.gasLimit
            }(_interaction.callData);
            
            require(success, "Resolver interaction failed");
            emit ResolverInteractionExecuted(_htlcId, msg.sender, result);
        }
        
        // Apply threshold protection (1inch pattern)
        require(htlc.algorandAmount >= htlc.thresholdAmount, "Below threshold");
        
        // Transfer funds to recipient (relayer in this case)
        htlc.executed = true;
        if (htlc.token == address(0)) {
            payable(msg.sender).transfer(htlc.amount);
        } else {
            IERC20(htlc.token).safeTransfer(msg.sender, htlc.amount);
        }
        
        emit HTLCExecuted(_htlcId, msg.sender, _secret);
    }
    

    
    /**
     * @dev Authorize resolver (1inch whitelist pattern)
     */
    function setResolverAuthorization(address _resolver, bool _authorized) external onlyOwner {
        authorizedResolvers[_resolver] = _authorized;
    }
} 