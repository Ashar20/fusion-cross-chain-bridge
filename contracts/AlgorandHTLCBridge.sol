// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title AlgorandHTLCBridge
 * @dev Bidirectional HTLC bridge for Ethereum ↔ Algorand cross-chain atomic swaps
 * 
 * 🌉 CROSS-CHAIN FEATURES:
 * - ETH ↔ Algorand atomic swaps
 * - Gasless execution via relayers
 * - Dutch auction order matching
 * - Bidirectional HTLC setup
 * - Secret hash coordination
 * 
 * 🔗 ALGORAND INTEGRATION:
 * - Chain ID: 416001 (Mainnet) / 416002 (Testnet)
 * - Native Token: ALGO
 * - Bridge: Algorand Bridge
 * - RPC: https://mainnet-api.algonode.cloud
 */
contract AlgorandHTLCBridge is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // Algorand chain configuration
    uint256 public constant ALGORAND_MAINNET_CHAIN_ID = 416001;
    uint256 public constant ALGORAND_TESTNET_CHAIN_ID = 416002;
    
    // HTLC configuration
    uint256 public constant MIN_TIMELOCK = 3600; // 1 hour
    uint256 public constant MAX_TIMELOCK = 86400; // 24 hours
    uint256 public constant DUTCH_AUCTION_DURATION = 3600; // 1 hour auction
    
    // Dutch auction configuration
    uint256 public constant INITIAL_GAS_PRICE = 50 gwei;
    uint256 public constant MIN_GAS_PRICE = 5 gwei;
    uint256 public constant GAS_PRICE_DECAY_RATE = 45; // 45 gwei per hour
    
    struct HTLCContract {
        address initiator;
        address recipient;
        address token;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        uint256 algorandChainId;
        string algorandAddress;
        string algorandToken;
        uint256 algorandAmount;
        bool withdrawn;
        bool refunded;
        bool executed;
        uint256 createdAt;
    }
    
    struct DutchAuction {
        bytes32 auctionId;
        bytes32 htlcId;
        uint256 startPrice;
        uint256 currentPrice;
        uint256 startTime;
        uint256 endTime;
        address winningRelayer;
        uint256 winningGasPrice;
        bool filled;
        bool expired;
    }
    
    struct RelayerBid {
        address relayer;
        uint256 gasPrice;
        uint256 timestamp;
        bool accepted;
    }
    
    mapping(bytes32 => HTLCContract) public htlcContracts;
    mapping(bytes32 => DutchAuction) public dutchAuctions;
    mapping(bytes32 => RelayerBid[]) public relayerBids;
    mapping(address => bool) public authorizedRelayers;
    mapping(bytes32 => bytes32) public revealedSecrets; // htlcId => secret
    mapping(address => uint256) public relayerBalances;
    
    event HTLCCreated(
        bytes32 indexed htlcId,
        address indexed initiator,
        uint256 ethChainId,
        uint256 algorandChainId,
        bytes32 hashlock,
        uint256 amount
    );
    
    event DutchAuctionStarted(
        bytes32 indexed auctionId,
        bytes32 indexed htlcId,
        uint256 startPrice,
        uint256 startTime,
        uint256 endTime
    );
    
    event RelayerBidPlaced(
        bytes32 indexed auctionId,
        address indexed relayer,
        uint256 gasPrice,
        uint256 timestamp
    );
    
    event AuctionWon(
        bytes32 indexed auctionId,
        address indexed relayer,
        uint256 gasPrice
    );
    
    event SecretRevealed(bytes32 indexed htlcId, bytes32 secret);
    event HTLCWithdrawn(bytes32 indexed htlcId, address recipient);
    event HTLCRefunded(bytes32 indexed htlcId, address initiator);
    event RelayerAuthorized(address indexed relayer, bool authorized);
    event RelayerBalanceWithdrawn(address indexed relayer, uint256 amount);
    
    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender] || msg.sender == owner(), "Not authorized relayer");
        _;
    }
    
    modifier onlyAuctionWinner(bytes32 _auctionId) {
        require(dutchAuctions[_auctionId].winningRelayer == msg.sender, "Not auction winner");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Initialize with default settings - deployer becomes owner
    }
    
    /**
     * @dev Create bidirectional HTLC for ETH → Algorand swap
     */
    function createETHtoAlgorandHTLC(
        address _recipient,
        address _token,
        uint256 _amount,
        bytes32 _hashlock,
        uint256 _timelock,
        uint256 _algorandChainId,
        string calldata _algorandAddress,
        string calldata _algorandToken,
        uint256 _algorandAmount
    ) external payable nonReentrant returns (bytes32 htlcId) {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");
        require(_timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        require(_timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        require(_algorandChainId == ALGORAND_MAINNET_CHAIN_ID || _algorandChainId == ALGORAND_TESTNET_CHAIN_ID, "Invalid Algorand chain");
        require(bytes(_algorandAddress).length > 0, "Algorand address required");
        
        htlcId = keccak256(abi.encodePacked(
            msg.sender,
            _recipient,
            _token,
            _amount,
            _hashlock,
            _timelock,
            _algorandChainId,
            _algorandAddress,
            block.timestamp
        ));
        
        require(htlcContracts[htlcId].initiator == address(0), "HTLC exists");
        
        if (_token == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            require(msg.value == 0, "ETH not expected");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }
        
        htlcContracts[htlcId] = HTLCContract({
            initiator: msg.sender,
            recipient: _recipient,
            token: _token,
            amount: _amount,
            hashlock: _hashlock,
            timelock: _timelock,
            algorandChainId: _algorandChainId,
            algorandAddress: _algorandAddress,
            algorandToken: _algorandToken,
            algorandAmount: _algorandAmount,
            withdrawn: false,
            refunded: false,
            executed: false,
            createdAt: block.timestamp
        });
        
        emit HTLCCreated(
            htlcId,
            msg.sender,
            block.chainid,
            _algorandChainId,
            _hashlock,
            _amount
        );
    }
    
    /**
     * @dev Start Dutch auction for HTLC execution
     */
    function startDutchAuction(bytes32 _htlcId) external onlyAuthorizedRelayer returns (bytes32 auctionId) {
        HTLCContract storage htlc = htlcContracts[_htlcId];
        require(htlc.initiator != address(0), "HTLC not found");
        require(!htlc.executed, "HTLC already executed");
        require(!htlc.refunded, "HTLC refunded");
        require(block.timestamp < htlc.timelock, "HTLC expired");
        
        auctionId = keccak256(abi.encodePacked(
            _htlcId,
            block.timestamp,
            msg.sender
        ));
        
        require(dutchAuctions[auctionId].auctionId == bytes32(0), "Auction exists");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + DUTCH_AUCTION_DURATION;
        
        dutchAuctions[auctionId] = DutchAuction({
            auctionId: auctionId,
            htlcId: _htlcId,
            startPrice: INITIAL_GAS_PRICE,
            currentPrice: INITIAL_GAS_PRICE,
            startTime: startTime,
            endTime: endTime,
            winningRelayer: address(0),
            winningGasPrice: 0,
            filled: false,
            expired: false
        });
        
        emit DutchAuctionStarted(
            auctionId,
            _htlcId,
            INITIAL_GAS_PRICE,
            startTime,
            endTime
        );
    }
    
    /**
     * @dev Place bid in Dutch auction
     */
    function placeBid(bytes32 _auctionId, uint256 _gasPrice) external onlyAuthorizedRelayer {
        DutchAuction storage auction = dutchAuctions[_auctionId];
        require(auction.auctionId != bytes32(0), "Auction not found");
        require(!auction.filled, "Auction already filled");
        require(!auction.expired, "Auction expired");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(_gasPrice >= MIN_GAS_PRICE, "Gas price too low");
        require(_gasPrice <= auction.currentPrice, "Gas price too high");
        
        // Update current price based on time decay
        uint256 timeElapsed = block.timestamp - auction.startTime;
        uint256 priceDecay = (timeElapsed * GAS_PRICE_DECAY_RATE) / 3600; // Decay per hour
        uint256 newPrice = auction.startPrice > priceDecay ? auction.startPrice - priceDecay : MIN_GAS_PRICE;
        auction.currentPrice = newPrice;
        
        // Accept bid if it's at or below current price
        if (_gasPrice <= newPrice) {
            auction.winningRelayer = msg.sender;
            auction.winningGasPrice = _gasPrice;
            auction.filled = true;
            
            relayerBids[_auctionId].push(RelayerBid({
                relayer: msg.sender,
                gasPrice: _gasPrice,
                timestamp: block.timestamp,
                accepted: true
            }));
            
            emit RelayerBidPlaced(_auctionId, msg.sender, _gasPrice, block.timestamp);
            emit AuctionWon(_auctionId, msg.sender, _gasPrice);
        } else {
            relayerBids[_auctionId].push(RelayerBid({
                relayer: msg.sender,
                gasPrice: _gasPrice,
                timestamp: block.timestamp,
                accepted: false
            }));
            
            emit RelayerBidPlaced(_auctionId, msg.sender, _gasPrice, block.timestamp);
        }
    }
    
    /**
     * @dev Execute HTLC with secret reveal (gasless execution)
     */
    function executeHTLCWithSecret(
        bytes32 _htlcId,
        bytes32 _secret,
        bytes32 _auctionId
    ) external onlyAuctionWinner(_auctionId) nonReentrant {
        HTLCContract storage htlc = htlcContracts[_htlcId];
        require(htlc.initiator != address(0), "HTLC not found");
        require(!htlc.executed, "HTLC already executed");
        require(!htlc.refunded, "HTLC refunded");
        require(keccak256(abi.encodePacked(_secret)) == htlc.hashlock, "Invalid secret");
        require(block.timestamp < htlc.timelock, "HTLC expired");
        
        // Store revealed secret
        revealedSecrets[_htlcId] = _secret;
        
        // Execute the HTLC
        htlc.executed = true;
        htlc.withdrawn = true;
        
        // Transfer funds to recipient (gasless - relayer pays gas)
        if (htlc.token == address(0)) {
            payable(htlc.recipient).transfer(htlc.amount);
        } else {
            IERC20(htlc.token).safeTransfer(htlc.recipient, htlc.amount);
        }
        
        // Pay relayer fee
        uint256 relayerFee = calculateRelayerFee(_auctionId);
        if (relayerFee > 0) {
            relayerBalances[msg.sender] += relayerFee;
        }
        
        emit SecretRevealed(_htlcId, _secret);
        emit HTLCWithdrawn(_htlcId, htlc.recipient);
    }
    
    /**
     * @dev Refund expired HTLC
     */
    function refundHTLC(bytes32 _htlcId) external nonReentrant {
        HTLCContract storage htlc = htlcContracts[_htlcId];
        require(htlc.initiator != address(0), "HTLC not found");
        require(!htlc.executed, "HTLC already executed");
        require(!htlc.refunded, "HTLC already refunded");
        require(block.timestamp >= htlc.timelock, "HTLC not expired");
        
        htlc.refunded = true;
        
        // Return funds to initiator
        if (htlc.token == address(0)) {
            payable(htlc.initiator).transfer(htlc.amount);
        } else {
            IERC20(htlc.token).safeTransfer(htlc.initiator, htlc.amount);
        }
        
        emit HTLCRefunded(_htlcId, htlc.initiator);
    }
    
    /**
     * @dev Calculate relayer fee based on auction
     */
    function calculateRelayerFee(bytes32 _auctionId) internal view returns (uint256) {
        DutchAuction storage auction = dutchAuctions[_auctionId];
        if (auction.winningGasPrice == 0) return 0;
        
        // Fee calculation: base fee + gas price bonus
        uint256 baseFee = 0.001 ether; // 0.001 ETH base fee
        uint256 gasBonus = (auction.startPrice - auction.winningGasPrice) * 1000; // Bonus for lower gas price
        
        return baseFee + gasBonus;
    }
    
    /**
     * @dev Get current Dutch auction price
     */
    function getCurrentAuctionPrice(bytes32 _auctionId) external view returns (uint256) {
        DutchAuction storage auction = dutchAuctions[_auctionId];
        if (auction.auctionId == bytes32(0)) return 0;
        
        uint256 timeElapsed = block.timestamp - auction.startTime;
        uint256 priceDecay = (timeElapsed * GAS_PRICE_DECAY_RATE) / 3600;
        uint256 currentPrice = auction.startPrice > priceDecay ? auction.startPrice - priceDecay : MIN_GAS_PRICE;
        
        return currentPrice;
    }
    
    /**
     * @dev Get HTLC details
     */
    function getHTLC(bytes32 _htlcId) external view returns (HTLCContract memory) {
        return htlcContracts[_htlcId];
    }
    
    /**
     * @dev Get Dutch auction details
     */
    function getDutchAuction(bytes32 _auctionId) external view returns (DutchAuction memory) {
        return dutchAuctions[_auctionId];
    }
    
    /**
     * @dev Get relayer bids for an auction
     */
    function getRelayerBids(bytes32 _auctionId) external view returns (RelayerBid[] memory) {
        return relayerBids[_auctionId];
    }
    
    /**
     * @dev Get revealed secret
     */
    function getRevealedSecret(bytes32 _htlcId) external view returns (bytes32) {
        return revealedSecrets[_htlcId];
    }
    
    /**
     * @dev Authorize/deauthorize relayers
     */
    function setRelayerAuthorization(address _relayer, bool _authorized) external onlyOwner {
        authorizedRelayers[_relayer] = _authorized;
        emit RelayerAuthorized(_relayer, _authorized);
    }
    
    /**
     * @dev Withdraw relayer fees
     */
    function withdrawRelayerFees() external {
        uint256 balance = relayerBalances[msg.sender];
        require(balance > 0, "No fees to withdraw");
        
        relayerBalances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
        
        emit RelayerBalanceWithdrawn(msg.sender, balance);
    }
    
    /**
     * @dev Get relayer balance
     */
    function getRelayerBalance(address _relayer) external view returns (uint256) {
        return relayerBalances[_relayer];
    }
    
    /**
     * @dev Check if relayer is authorized
     */
    function isRelayerAuthorized(address _relayer) external view returns (bool) {
        return authorizedRelayers[_relayer] || _relayer == owner();
    }
    
    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
    
    receive() external payable {
        // Accept ETH payments
    }
} 