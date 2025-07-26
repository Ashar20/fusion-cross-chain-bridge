// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FusionEOSBridge is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct HTLCContract {
        address sender;
        address receiver;
        address token;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        string eosAccount;
        string eosToken;
        uint256 eosAmount;
    }

    mapping(bytes32 => HTLCContract) public contracts;
    mapping(bytes32 => bool) public usedPreimages;
    
    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 48 hours;
    
    event HTLCNew(
        bytes32 indexed contractId,
        address indexed sender,
        address indexed receiver,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        string eosAccount,
        string eosToken,
        uint256 eosAmount
    );
    
    event HTLCWithdraw(bytes32 indexed contractId, bytes32 preimage);
    event HTLCRefund(bytes32 indexed contractId);

    constructor() Ownable(msg.sender) {}

    function newContract(
        address _receiver,
        bytes32 _hashlock,
        uint256 _timelock,
        address _token,
        uint256 _amount,
        string calldata _eosAccount,
        string calldata _eosToken,
        uint256 _eosAmount
    ) external payable nonReentrant returns (bytes32 contractId) {
        require(_receiver != address(0), "Invalid receiver");
        require(_amount > 0, "Amount must be > 0");
        require(_timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        require(_timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        require(bytes(_eosAccount).length > 0, "EOS account required");

        contractId = keccak256(abi.encodePacked(
            msg.sender,
            _receiver,
            _token,
            _amount,
            _hashlock,
            _timelock,
            block.timestamp
        ));

        require(contracts[contractId].sender == address(0), "Contract exists");

        if (_token == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            require(msg.value == 0, "ETH not expected");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        contracts[contractId] = HTLCContract({
            sender: msg.sender,
            receiver: _receiver,
            token: _token,
            amount: _amount,
            hashlock: _hashlock,
            timelock: _timelock,
            withdrawn: false,
            refunded: false,
            eosAccount: _eosAccount,
            eosToken: _eosToken,
            eosAmount: _eosAmount
        });

        emit HTLCNew(
            contractId,
            msg.sender,
            _receiver,
            _token,
            _amount,
            _hashlock,
            _timelock,
            _eosAccount,
            _eosToken,
            _eosAmount
        );
    }

    function withdraw(bytes32 _contractId, bytes32 _preimage) 
        external 
        nonReentrant 
        returns (bool) 
    {
        HTLCContract storage c = contracts[_contractId];
        
        require(c.sender != address(0), "Contract not found");
        require(c.hashlock == keccak256(abi.encodePacked(_preimage)), "Invalid preimage");
        require(c.timelock > block.timestamp, "Timelock expired");
        require(!c.withdrawn, "Already withdrawn");
        require(!c.refunded, "Already refunded");
        require(!usedPreimages[keccak256(abi.encodePacked(_preimage))], "Preimage already used");

        c.withdrawn = true;
        usedPreimages[keccak256(abi.encodePacked(_preimage))] = true;

        if (c.token == address(0)) {
            payable(c.receiver).transfer(c.amount);
        } else {
            IERC20(c.token).safeTransfer(c.receiver, c.amount);
        }

        emit HTLCWithdraw(_contractId, _preimage);
        return true;
    }

    function refund(bytes32 _contractId) external nonReentrant returns (bool) {
        HTLCContract storage c = contracts[_contractId];
        
        require(c.sender != address(0), "Contract not found");
        require(c.timelock <= block.timestamp, "Timelock not expired");
        require(!c.withdrawn, "Already withdrawn");
        require(!c.refunded, "Already refunded");

        c.refunded = true;

        if (c.token == address(0)) {
            payable(c.sender).transfer(c.amount);
        } else {
            IERC20(c.token).safeTransfer(c.sender, c.amount);
        }

        emit HTLCRefund(_contractId);
        return true;
    }

    function getContract(bytes32 _contractId) 
        external 
        view 
        returns (HTLCContract memory) 
    {
        return contracts[_contractId];
    }

    function hasPreimageBeenUsed(bytes32 _preimage) external view returns (bool) {
        return usedPreimages[keccak256(abi.encodePacked(_preimage))];
    }
}