// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./Official1inchEscrowFactory.sol";

/**
 * 🚀 GASLESS 1INCH FUSION+ RESOLVER
 * 
 * Implements official 1inch Fusion+ gasless architecture:
 * 1. User creates intent (signs order) - NO GAS
 * 2. Resolver executes intent - RESOLVER PAYS GAS
 * 3. User claims tokens - NO GAS
 * 
 * Based on official 1inch Fusion+ patterns and EIP-712 signatures
 */
contract Gasless1inchResolver is EIP712 {
    using ECDSA for bytes32;
    
    Official1inchEscrowFactory public immutable escrowFactory;
    
    // EIP-712 domain separator for gasless transactions
    bytes32 public constant INTENT_TYPEHASH = keccak256(
        "Intent(bytes32 swapId,address user,address beneficiary,uint256 amount,bytes32 orderHash,bytes32 hashlock,uint256 deadline,uint256 nonce)"
    );
    
    // Intent tracking
    struct Intent {
        address user;
        address beneficiary;
        uint256 amount;
        bytes32 orderHash;
        bytes32 hashlock;
        uint256 deadline;
        uint256 nonce;
        bool executed;
        bool claimed;
        address escrowAddress;
    }
    
    mapping(bytes32 => Intent) public intents;
    mapping(address => uint256) public userNonces;
    
    // Events for gasless execution
    event IntentCreated(bytes32 indexed swapId, address indexed user, bytes32 orderHash);
    event IntentExecuted(bytes32 indexed swapId, address indexed resolver, address escrowAddress);
    event TokensClaimed(bytes32 indexed swapId, address indexed user, bytes32 secret);
    
    constructor(address _escrowFactory) EIP712("Gasless1inchResolver", "1.0.0") {
        escrowFactory = Official1inchEscrowFactory(_escrowFactory);
    }
    
    /**
     * 🚀 STEP 1: Create gasless intent (user signs, no gas)
     * User signs intent off-chain, resolver can execute later
     */
    function createIntent(
        bytes32 swapId,
        address beneficiary,
        uint256 amount,
        bytes32 orderHash,
        bytes32 hashlock,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(deadline > block.timestamp, "Intent expired");
        require(!intents[swapId].executed, "Intent already executed");
        
        // Get user address from signature
        address user = _verifyIntentSignature(
            swapId,
            beneficiary,
            amount,
            orderHash,
            hashlock,
            deadline,
            signature
        );
        
        // Store intent
        intents[swapId] = Intent({
            user: user,
            beneficiary: beneficiary,
            amount: amount,
            orderHash: orderHash,
            hashlock: hashlock,
            deadline: deadline,
            nonce: userNonces[user]++,
            executed: false,
            claimed: false,
            escrowAddress: address(0)
        });
        
        emit IntentCreated(swapId, user, orderHash);
    }
    
    /**
     * 🎯 STEP 2: Execute intent (resolver pays gas)
     * Resolver executes the intent and pays for gas
     */
    function executeIntent(bytes32 swapId) external payable {
        Intent storage intent = intents[swapId];
        require(!intent.executed, "Intent already executed");
        require(block.timestamp < intent.deadline, "Intent expired");
        require(msg.value == intent.amount, "Incorrect amount");
        
        // Deploy and fund escrow (resolver pays gas)
        address escrowAddress = escrowFactory.createEscrow{value: msg.value}(
            address(0), // ETH
            intent.amount,
            intent.orderHash,
            intent.deadline,
            "" // empty resolver data
        );
        
        intent.executed = true;
        intent.escrowAddress = escrowAddress;
        
        emit IntentExecuted(swapId, msg.sender, escrowAddress);
    }
    
    /**
     * 🎯 STEP 3: Claim tokens (user claims, no gas)
     * User claims tokens after secret is revealed
     */
    function claimTokens(
        bytes32 swapId,
        bytes32 secret,
        bytes calldata claimSignature
    ) external {
        Intent storage intent = intents[swapId];
        require(intent.executed, "Intent not executed");
        require(!intent.claimed, "Already claimed");
        require(block.timestamp < intent.deadline, "Intent expired");
        
        // Verify secret matches hashlock
        require(keccak256(abi.encodePacked(secret)) == intent.hashlock, "Invalid secret");
        
        // Verify claim signature
        address user = _verifyClaimSignature(swapId, secret, claimSignature);
        require(user == intent.user, "Invalid claimer");
        
        // Resolve escrow
        Official1inchEscrow escrow = Official1inchEscrow(payable(intent.escrowAddress));
        escrow.resolve(secret);
        
        intent.claimed = true;
        
        emit TokensClaimed(swapId, user, secret);
    }
    
    /**
     * 🔐 Verify intent signature (EIP-712)
     */
    function _verifyIntentSignature(
        bytes32 swapId,
        address beneficiary,
        uint256 amount,
        bytes32 orderHash,
        bytes32 hashlock,
        uint256 deadline,
        bytes calldata signature
    ) internal view returns (address) {
        // Assign to temporary variables to avoid stack too deep
        bytes32 _typeHash = INTENT_TYPEHASH;
        uint256 _nonce = userNonces[beneficiary];
        
        bytes32 structHash = keccak256(
            abi.encode(
                _typeHash,
                swapId,
                beneficiary, // user
                beneficiary, // beneficiary (same as user in our case)
                amount,
                orderHash,
                hashlock,
                deadline,
                _nonce
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        require(signer == beneficiary, "Invalid signature");
        return signer;
    }
    
    /**
     * 🔐 Verify claim signature
     */
    function _verifyClaimSignature(
        bytes32 swapId,
        bytes32 secret,
        bytes calldata signature
    ) internal view returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(swapId, secret));
        return hash.recover(signature);
    }
    
    /**
     * 📊 Get intent details
     */
    function getIntent(bytes32 swapId) external view returns (Intent memory) {
        return intents[swapId];
    }
    
    /**
     * 🔄 Refund expired intent (resolver can refund)
     */
    function refundExpiredIntent(bytes32 swapId) external {
        Intent storage intent = intents[swapId];
        require(intent.executed, "Intent not executed");
        require(block.timestamp >= intent.deadline, "Intent not expired");
        require(!intent.claimed, "Already claimed");
        
        // Refund from escrow
        Official1inchEscrow escrow = Official1inchEscrow(payable(intent.escrowAddress));
        escrow.refund();
    }
} 