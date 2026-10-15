// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../remix/GitLockEscrow_Remix.sol";

contract GitLockEscrowRemixTest is Test {
    GitLockEscrow public escrow;
    uint256 internal oraclePrivateKey = 0xA11CE;
    address internal oracleAddress;
    address payable internal client = payable(address(0x1111));
    address payable internal developer = payable(address(0x2222));

    function setUp() public {
        oracleAddress = vm.addr(oraclePrivateKey);
        escrow = new GitLockEscrow(oracleAddress);
        vm.deal(client, 1 ether);
    }

    function test_RemixContract_EndToEnd() public {
        bytes32 dealId = escrow.projectIdToDealId("test-remix-project");
        string memory repo = "student/blockchain-project";
        uint256 amount = 0.0001 ether;

        // 1. Create and fund
        vm.prank(client);
        escrow.createAndFundDeal{value: amount}(dealId, developer, repo);

        // 2. Approve
        vm.prank(client);
        escrow.approveDeployment(dealId);

        // 3. Attest
        bytes32 nonce = keccak256("remix-nonce");
        uint256 deadline = block.timestamp + 1 hours;
        IGitLockEscrow.OwnershipAttestation memory att = IGitLockEscrow.OwnershipAttestation({
            dealId: dealId,
            developer: developer,
            client: client,
            repoFullName: repo,
            nonce: nonce,
            deadline: deadline
        });

        bytes32 rawHash = escrow.hashAttestation(att);
        bytes32 ethSignedHash = escrow.getEthSignedMessageHash(rawHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePrivateKey, ethSignedHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        // 4. Release
        uint256 devBefore = developer.balance;
        escrow.releasePaymentWithAttestation(att, sig);

        assertEq(developer.balance, devBefore + amount);
        IGitLockEscrow.Deal memory deal = escrow.getDeal(dealId);
        assertEq(uint8(deal.state), uint8(IGitLockEscrow.DealState.Completed));
    }
}
