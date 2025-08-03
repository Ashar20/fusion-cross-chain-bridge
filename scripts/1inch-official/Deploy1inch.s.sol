// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Script.sol";
import "contracts/EscrowFactory.sol";
import "contracts/EscrowSrc.sol";
import "contracts/EscrowDst.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Deploy1inchContracts is Script {
    function run() external {
        vm.startBroadcast();

        // Mock LimitOrderProtocol for testnet
        MockLimitOrderProtocol limitOrderProtocol = new MockLimitOrderProtocol();
        
        // Deploy EscrowFactory
        EscrowFactory escrowFactory = new EscrowFactory(
            address(limitOrderProtocol),  // limitOrderProtocol
            IERC20(address(0)),          // accessToken (none)
            msg.sender,                  // owner
            86400,                       // rescueDelaySrc (24 hours)
            86400                        // rescueDelayDst (24 hours)
        );

        vm.stopBroadcast();

        console.log("LimitOrderProtocol deployed at:", address(limitOrderProtocol));
        console.log("EscrowFactory deployed at:", address(escrowFactory));
        console.log("EscrowSrc Implementation:", escrowFactory.ESCROW_SRC_IMPLEMENTATION());
        console.log("EscrowDst Implementation:", escrowFactory.ESCROW_DST_IMPLEMENTATION());
    }
}

// Simple mock for LimitOrderProtocol
contract MockLimitOrderProtocol {
    mapping(bytes32 => bool) public filledOrders;
    
    function fillOrder(
        bytes memory order,
        bytes memory signature,
        bytes memory interaction,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 skipPermitAndThresholdAmount,
        address target
    ) external returns (uint256, uint256, bytes32) {
        bytes32 orderHash = keccak256(order);
        filledOrders[orderHash] = true;
        return (makingAmount, takingAmount, orderHash);
    }
    
    function hashOrder(bytes memory order) external pure returns (bytes32) {
        return keccak256(order);
    }
}