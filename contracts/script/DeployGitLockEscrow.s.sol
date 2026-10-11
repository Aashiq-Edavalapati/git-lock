// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GitLockEscrow.sol";

/**
 * @title DeployGitLockEscrow
 * @author Aashiq Edavalapati
 * @notice Forge script to deploy GitLockEscrow contract to BSC Testnet.
 */
contract DeployGitLockEscrow is Script {
    function run() external returns (GitLockEscrow) {
        address oracle = vm.envOr("ORACLE_ADDRESS", address(0x392e227Bf9201A328f9ebD8DBee33f3cBDB15b37));

        vm.startBroadcast();
        GitLockEscrow escrow = new GitLockEscrow(oracle);
        vm.stopBroadcast();

        console.log("=========================================");
        console.log("GitLockEscrow Deployed At:", address(escrow));
        console.log("Oracle Address:", oracle);
        console.log("Deployer:", msg.sender);
        console.log("=========================================");

        return escrow;
    }
}
