// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SIPSettlement} from "../src/SIPSettlement.sol";
import {SIPVault} from "../src/SIPVault.sol";

/**
 * @title Deploy
 * @notice Deployment script for SIP contracts
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying from:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy settlement contract
        SIPSettlement settlement = new SIPSettlement();
        console.log("SIPSettlement deployed at:", address(settlement));

        // Deploy vault contract
        SIPVault vault = new SIPVault(address(settlement));
        console.log("SIPVault deployed at:", address(vault));

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("Settlement:", address(settlement));
        console.log("Vault:", address(vault));
    }
}
