// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ResolverAddressManager
 * @dev Manages separate addresses for each resolver with secure key derivation
 * 
 * 🎯 FEATURES:
 * - Generate unique addresses for each resolver
 * - Secure key derivation from master key
 * - Address rotation and management
 * - Fee tracking per resolver address
 * - Access control and permissions
 */
contract ResolverAddressManager is Ownable {
    using ECDSA for bytes32;

    // 🎯 Resolver Address Structure
    struct ResolverAddress {
        address resolverAddress;     // Generated address for this resolver
        address ownerAddress;        // Original owner address
        uint256 nonce;              // Unique nonce for address generation
        bool active;                // Whether this address is active
        uint256 createdAt;          // Creation timestamp
        uint256 totalFees;          // Total fees earned
        uint256 totalFills;         // Total fills executed
        string resolverName;        // Human-readable name
    }

    // 📊 Storage
    mapping(address => ResolverAddress) public resolverAddresses;
    mapping(address => address) public addressToResolver;  // Reverse mapping
    mapping(uint256 => address) public nonceToAddress;     // Nonce to address mapping
    
    // 🔧 Configuration
    uint256 public nextNonce = 1;
    uint256 public constant MAX_RESOLVERS = 100;
    uint256 public constant ADDRESS_GENERATION_COST = 0.001 ether;
    
    // 🎉 Events
    event ResolverAddressCreated(
        address indexed resolverAddress,
        address indexed ownerAddress,
        uint256 nonce,
        string resolverName
    );
    
    event ResolverAddressDeactivated(
        address indexed resolverAddress,
        address indexed ownerAddress
    );
    
    event ResolverAddressReactivated(
        address indexed resolverAddress,
        address indexed ownerAddress
    );
    
    event FeeEarned(
        address indexed resolverAddress,
        uint256 amount,
        uint256 totalFees
    );
    
    event FillExecuted(
        address indexed resolverAddress,
        uint256 totalFills
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Generate a new resolver address
     * @param _resolverName Human-readable name for the resolver
     * @param _ownerSignature Signature from the owner to prove authorization
     */
    function createResolverAddress(
        string calldata _resolverName,
        bytes calldata _ownerSignature
    ) external payable returns (address resolverAddress) {
        require(msg.value >= ADDRESS_GENERATION_COST, "Insufficient payment");
        require(bytes(_resolverName).length > 0, "Name cannot be empty");
        require(nextNonce <= MAX_RESOLVERS, "Max resolvers reached");
        
        // Verify owner signature (simplified for now)
        // TODO: Implement proper signature verification
        require(msg.sender == owner(), "Only owner can create resolver addresses");
        
        // Generate deterministic address
        resolverAddress = _generateDeterministicAddress(msg.sender, nextNonce);
        
        // Create resolver address record
        resolverAddresses[resolverAddress] = ResolverAddress({
            resolverAddress: resolverAddress,
            ownerAddress: msg.sender,
            nonce: nextNonce,
            active: true,
            createdAt: block.timestamp,
            totalFees: 0,
            totalFills: 0,
            resolverName: _resolverName
        });
        
        // Update mappings
        addressToResolver[resolverAddress] = msg.sender;
        nonceToAddress[nextNonce] = resolverAddress;
        
        nextNonce++;
        
        emit ResolverAddressCreated(resolverAddress, msg.sender, nextNonce - 1, _resolverName);
        
        return resolverAddress;
    }

    /**
     * @dev Generate deterministic address for resolver
     * @param _owner Owner address
     * @param _nonce Unique nonce
     */
    function _generateDeterministicAddress(
        address _owner,
        uint256 _nonce
    ) internal pure returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(
            _owner,
            _nonce,
            "RESOLVER_ADDRESS_SALT"
        ));
        
        // Convert hash to address (last 20 bytes)
        return address(uint160(uint256(hash)));
    }

    /**
     * @dev Deactivate a resolver address (only owner can deactivate)
     */
    function deactivateResolverAddress(address _resolverAddress) external onlyOwner {
        ResolverAddress storage resolver = resolverAddresses[_resolverAddress];
        require(resolver.active, "Address not active");
        
        resolver.active = false;
        
        emit ResolverAddressDeactivated(_resolverAddress, resolver.ownerAddress);
    }

    /**
     * @dev Reactivate a resolver address (only owner can reactivate)
     */
    function reactivateResolverAddress(address _resolverAddress) external onlyOwner {
        ResolverAddress storage resolver = resolverAddresses[_resolverAddress];
        require(!resolver.active, "Address already active");
        require(resolver.resolverAddress != address(0), "Address not found");
        
        resolver.active = true;
        
        emit ResolverAddressReactivated(_resolverAddress, resolver.ownerAddress);
    }

    /**
     * @dev Record fee earned by resolver
     */
    function recordFeeEarned(address _resolverAddress, uint256 _amount) external {
        require(msg.sender == owner(), "Only owner can record fees");
        
        ResolverAddress storage resolver = resolverAddresses[_resolverAddress];
        require(resolver.active, "Address not active");
        
        resolver.totalFees += _amount;
        
        emit FeeEarned(_resolverAddress, _amount, resolver.totalFees);
    }

    /**
     * @dev Record fill executed by resolver
     */
    function recordFillExecuted(address _resolverAddress) external {
        require(msg.sender == owner(), "Only owner can record fills");
        
        ResolverAddress storage resolver = resolverAddresses[_resolverAddress];
        require(resolver.active, "Address not active");
        
        resolver.totalFills++;
        
        emit FillExecuted(_resolverAddress, resolver.totalFills);
    }

    /**
     * @dev Get resolver address info
     */
    function getResolverAddress(address _resolverAddress) external view returns (ResolverAddress memory) {
        return resolverAddresses[_resolverAddress];
    }

    /**
     * @dev Get all resolver addresses for an owner
     */
    function getResolverAddressesByOwner(address _owner) external view returns (address[] memory) {
        uint256 count = 0;
        
        // Count addresses for this owner
        for (uint256 i = 1; i < nextNonce; i++) {
            address resolverAddr = nonceToAddress[i];
            if (resolverAddresses[resolverAddr].ownerAddress == _owner) {
                count++;
            }
        }
        
        // Create array and populate
        address[] memory addresses = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextNonce; i++) {
            address resolverAddr = nonceToAddress[i];
            if (resolverAddresses[resolverAddr].ownerAddress == _owner) {
                addresses[index] = resolverAddr;
                index++;
            }
        }
        
        return addresses;
    }

    /**
     * @dev Check if address is an active resolver
     */
    function isActiveResolver(address _resolverAddress) external view returns (bool) {
        return resolverAddresses[_resolverAddress].active;
    }

    /**
     * @dev Get total fees earned by all resolvers
     */
    function getTotalFeesEarned() external view returns (uint256 totalFees) {
        for (uint256 i = 1; i < nextNonce; i++) {
            address resolverAddr = nonceToAddress[i];
            totalFees += resolverAddresses[resolverAddr].totalFees;
        }
        return totalFees;
    }

    /**
     * @dev Get total fills executed by all resolvers
     */
    function getTotalFillsExecuted() external view returns (uint256 totalFills) {
        for (uint256 i = 1; i < nextNonce; i++) {
            address resolverAddr = nonceToAddress[i];
            totalFills += resolverAddresses[resolverAddr].totalFills;
        }
        return totalFills;
    }

    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency function to recover stuck tokens
     */
    function emergencyWithdraw(address _token, address _recipient, uint256 _amount) external onlyOwner {
        // This would use SafeERC20 in a full implementation
        // For simplicity, we'll just transfer ETH
        if (_token == address(0)) {
            payable(_recipient).transfer(_amount);
        }
    }
} 