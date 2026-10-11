// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GitLockEscrow.sol";
import "../src/interfaces/IGitLockEscrow.sol";

contract GitLockEscrowTest is Test {
    GitLockEscrow public escrow;

    uint256 internal oraclePrivateKey = 0xA11CE;
    address internal oracleAddress;

    address payable internal client = payable(address(0x1111));
    address payable internal developer = payable(address(0x2222));
    address internal unauthorizedUser = address(0x3333);

    bytes32 internal testDealId;
    string internal testRepo = "developer/secure-vault-service";
    uint256 internal depositAmount = 0.0001 ether; // minimal amount

    function setUp() public {
        oracleAddress = vm.addr(oraclePrivateKey);
        escrow = new GitLockEscrow(oracleAddress);

        testDealId = escrow.projectIdToDealId("proj-uuid-1234-abcd");

        // Fund client and developer with some native BNB
        vm.deal(client, 10 ether);
        vm.deal(developer, 1 ether);
    }

    function test_InitialState() public view {
        assertEq(escrow.oracle(), oracleAddress);
        assertEq(escrow.owner(), address(this));
    }

    function test_CreateAndFundDeal() public {
        vm.prank(client);
        escrow.createAndFundDeal{value: depositAmount}(testDealId, developer, testRepo);

        IGitLockEscrow.Deal memory deal = escrow.getDeal(testDealId);
        assertEq(deal.client, client);
        assertEq(deal.developer, developer);
        assertEq(deal.amount, depositAmount);
        assertEq(uint8(deal.state), uint8(IGitLockEscrow.DealState.Funded));
        assertEq(deal.repoFullName, testRepo);
        assertEq(escrow.totalFundedByClient(client), depositAmount);
    }

    function test_RevertWhen_ZeroDeposit() public {
        vm.prank(client);
        vm.expectRevert(abi.encodeWithSelector(IGitLockEscrow.InvalidDepositAmount.selector, 0, 1));
        escrow.createAndFundDeal{value: 0}(testDealId, developer, testRepo);
    }

    function test_RevertWhen_SelfDealing() public {
        vm.prank(client);
        vm.expectRevert(abi.encodeWithSelector(IGitLockEscrow.Unauthorized.selector, client));
        escrow.createAndFundDeal{value: depositAmount}(testDealId, client, testRepo);
    }

    function test_ApproveDeployment() public {
        vm.prank(client);
        escrow.createAndFundDeal{value: depositAmount}(testDealId, developer, testRepo);

        vm.prank(client);
        escrow.approveDeployment(testDealId);

        IGitLockEscrow.Deal memory deal = escrow.getDeal(testDealId);
        assertEq(uint8(deal.state), uint8(IGitLockEscrow.DealState.Approved));
    }

    function test_ReleasePaymentWithValidAttestation() public {
        // 1. Client creates and funds deal
        vm.prank(client);
        escrow.createAndFundDeal{value: depositAmount}(testDealId, developer, testRepo);

        // 2. Client approves deployment
        vm.prank(client);
        escrow.approveDeployment(testDealId);

        // 3. Oracle prepares attestation
        bytes32 nonce = keccak256("nonce-1");
        uint256 deadline = block.timestamp + 1 hours;

        IGitLockEscrow.OwnershipAttestation memory attestation = IGitLockEscrow.OwnershipAttestation({
            dealId: testDealId,
            developer: developer,
            client: client,
            repoFullName: testRepo,
            nonce: nonce,
            deadline: deadline
        });

        // 4. Oracle signs attestation
        bytes32 rawHash = escrow.hashAttestation(attestation);
        bytes32 ethSignedHash = escrow.getEthSignedMessageHash(rawHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 5. Release payment
        uint256 initialDevBalance = developer.balance;

        escrow.releasePaymentWithAttestation(attestation, signature);

        // 6. Assertions
        assertEq(developer.balance, initialDevBalance + depositAmount);
        assertEq(escrow.isNonceUsed(nonce), true);
        assertEq(escrow.totalEarnedByDeveloper(developer), depositAmount);

        IGitLockEscrow.Deal memory deal = escrow.getDeal(testDealId);
        assertEq(uint8(deal.state), uint8(IGitLockEscrow.DealState.Completed));
    }

    function test_RevertWhen_InvalidOracleSignature() public {
        vm.prank(client);
        escrow.createAndFundDeal{value: depositAmount}(testDealId, developer, testRepo);

        bytes32 nonce = keccak256("nonce-bad");
        IGitLockEscrow.OwnershipAttestation memory attestation = IGitLockEscrow.OwnershipAttestation({
            dealId: testDealId,
            developer: developer,
            client: client,
            repoFullName: testRepo,
            nonce: nonce,
            deadline: block.timestamp + 1 hours
        });

        // Sign with an unauthorized private key
        uint256 attackerKey = 0xBAD;
        bytes32 rawHash = escrow.hashAttestation(attestation);
        bytes32 ethSignedHash = escrow.getEthSignedMessageHash(rawHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(attackerKey, ethSignedHash);
        bytes memory badSignature = abi.encodePacked(r, s, v);

        vm.expectRevert(IGitLockEscrow.InvalidOracleSignature.selector);
        escrow.releasePaymentWithAttestation(attestation, badSignature);
    }

    function test_RevertWhen_AttestationExpired() public {
        vm.prank(client);
        escrow.createAndFundDeal{value: depositAmount}(testDealId, developer, testRepo);

        uint256 pastDeadline = block.timestamp - 1;
        IGitLockEscrow.OwnershipAttestation memory attestation = IGitLockEscrow.OwnershipAttestation({
            dealId: testDealId,
            developer: developer,
            client: client,
            repoFullName: testRepo,
            nonce: keccak256("nonce-expired"),
            deadline: pastDeadline
        });

        bytes32 rawHash = escrow.hashAttestation(attestation);
        bytes32 ethSignedHash = escrow.getEthSignedMessageHash(rawHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(abi.encodeWithSelector(IGitLockEscrow.AttestationExpired.selector, pastDeadline, block.timestamp));
        escrow.releasePaymentWithAttestation(attestation, signature);
    }

    function test_RevertWhen_NonceReused() public {
        vm.prank(client);
        escrow.createAndFundDeal{value: depositAmount}(testDealId, developer, testRepo);

        bytes32 nonce = keccak256("nonce-replay");
        IGitLockEscrow.OwnershipAttestation memory attestation = IGitLockEscrow.OwnershipAttestation({
            dealId: testDealId,
            developer: developer,
            client: client,
            repoFullName: testRepo,
            nonce: nonce,
            deadline: block.timestamp + 1 hours
        });

        bytes32 rawHash = escrow.hashAttestation(attestation);
        bytes32 ethSignedHash = escrow.getEthSignedMessageHash(rawHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        escrow.releasePaymentWithAttestation(attestation, signature);

        // Try replay
        vm.expectRevert(abi.encodeWithSelector(IGitLockEscrow.NonceAlreadyUsed.selector, nonce));
        escrow.releasePaymentWithAttestation(attestation, signature);
    }

    function test_Refund() public {
        vm.prank(client);
        escrow.createAndFundDeal{value: depositAmount}(testDealId, developer, testRepo);

        uint256 clientInitialBalance = client.balance;

        vm.prank(client);
        escrow.refund(testDealId);

        assertEq(client.balance, clientInitialBalance + depositAmount);
        IGitLockEscrow.Deal memory deal = escrow.getDeal(testDealId);
        assertEq(uint8(deal.state), uint8(IGitLockEscrow.DealState.Refunded));
    }

    function test_AdminUpdateOracle() public {
        address newOracle = address(0x9999);
        escrow.setOracle(newOracle);
        assertEq(escrow.getOracle(), newOracle);

        vm.prank(unauthorizedUser);
        vm.expectRevert(abi.encodeWithSelector(IGitLockEscrow.Unauthorized.selector, unauthorizedUser));
        escrow.setOracle(address(0x8888));
    }
}
