// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleHTLC
 * @dev Simple HTLC contract for cross-chain atomic swaps
 */
contract SimpleHTLC {
    
    struct Escrow {
        address initiator;
        address recipient;
        address resolver;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
    }
    
    mapping(bytes32 => Escrow) public escrows;
    mapping(address => bool) public authorizedResolvers;
    address public owner;
    
    // Official 1inch addresses
    address public constant ONEINCH_SETTLEMENT = 0xA88800CD213dA5Ae406ce248380802BD53b47647;
    address public constant ONEINCH_ROUTER_V5 = 0x111111125434b319222CdBf8C261674aDB56F3ae;
    
    event HTLCEscrowCreated(
        bytes32 indexed escrowId,
        address indexed initiator,
        address indexed recipient,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    );
    
    event HTLCWithdrawn(
        bytes32 indexed escrowId,
        address indexed recipient,
        uint256 amount
    );
    
    event HTLCSecretRevealed(
        bytes32 indexed escrowId,
        bytes32 indexed secret
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedResolvers[msg.sender] = true;
    }
    
    function setResolverAuthorization(address _resolver, bool _authorized) external onlyOwner {
        authorizedResolvers[_resolver] = _authorized;
    }
    
    function isResolverAuthorized(address _resolver) external view returns (bool) {
        return authorizedResolvers[_resolver];
    }
    
    function createHTLCEscrow(
        address _recipient,
        address _resolver,
        bytes32 _hashlock,
        uint256 _timelock,
        uint256 _resolverFeeRate
    ) external payable returns (bytes32 escrowId) {
        
        require(_recipient != address(0), "Invalid recipient");
        require(_resolver != address(0), "Invalid resolver");
        require(authorizedResolvers[_resolver], "Resolver not authorized");
        require(msg.value > 0, "Amount must be > 0");
        require(_timelock > block.timestamp + 30 minutes, "Timelock too short");
        require(_hashlock != bytes32(0), "Invalid hashlock");
        require(_resolverFeeRate <= 500, "Resolver fee too high");
        
        escrowId = keccak256(abi.encodePacked(
            msg.sender,
            _recipient,
            _hashlock,
            _timelock,
            block.timestamp
        ));
        
        require(escrows[escrowId].initiator == address(0), "Escrow already exists");
        
        uint256 resolverFee = (msg.value * _resolverFeeRate) / 10000;
        uint256 netAmount = msg.value - resolverFee;
        
        escrows[escrowId] = Escrow({
            initiator: msg.sender,
            recipient: _recipient,
            resolver: _resolver,
            amount: netAmount,
            hashlock: _hashlock,
            timelock: _timelock,
            withdrawn: false,
            refunded: false
        });
        
        // Pay resolver fee immediately
        if (resolverFee > 0) {
            payable(_resolver).transfer(resolverFee);
        }
        
        emit HTLCEscrowCreated(
            escrowId,
            msg.sender,
            _recipient,
            netAmount,
            _hashlock,
            _timelock
        );
        
        return escrowId;
    }
    
    function withdrawWithSecret(bytes32 _escrowId, bytes32 _secret) external returns (bool) {
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.initiator != address(0), "Escrow not found");
        require(!escrow.withdrawn, "Already withdrawn");
        require(!escrow.refunded, "Already refunded");
        require(block.timestamp < escrow.timelock, "Escrow expired");
        
        bytes32 computedHash = keccak256(abi.encodePacked(_secret));
        require(computedHash == escrow.hashlock, "Invalid secret");
        
        require(
            msg.sender == escrow.recipient || msg.sender == escrow.resolver,
            "Unauthorized withdrawal"
        );
        
        escrow.withdrawn = true;
        
        payable(escrow.recipient).transfer(escrow.amount);
        
        emit HTLCSecretRevealed(_escrowId, _secret);
        emit HTLCWithdrawn(_escrowId, escrow.recipient, escrow.amount);
        
        return true;
    }
    
    function refundAfterTimeout(bytes32 _escrowId) external returns (bool) {
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.initiator != address(0), "Escrow not found");
        require(!escrow.withdrawn, "Already withdrawn");
        require(!escrow.refunded, "Already refunded");
        require(block.timestamp >= escrow.timelock, "Timelock not expired");
        require(msg.sender == escrow.initiator, "Only initiator can refund");
        
        escrow.refunded = true;
        
        payable(escrow.initiator).transfer(escrow.amount);
        
        return true;
    }
    
    function getEscrow(bytes32 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }
    
    function getOfficial1inchContracts() external pure returns (address settlement, address routerV5) {
        return (ONEINCH_SETTLEMENT, ONEINCH_ROUTER_V5);
    }
}