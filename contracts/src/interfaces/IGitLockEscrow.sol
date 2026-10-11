// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IGitLockEscrow
 * @author Aashiq Edavalapati
 * @notice Interface for the GitLock Trustless Escrow System.
 * @dev Defines structs, enums, custom errors, events, and functions for decentralized freelance code escrow.
 */
interface IGitLockEscrow {
    // ==========================================
    // ENUMS
    // ==========================================
    enum DealState {
        None,       // Deal has not been initialized
        Created,    // Deal registered on-chain
        Funded,     // Client deposited BNB into escrow
        Approved,   // Client verified & approved live deployment
        Completed,  // Repository ownership verified & BNB released to developer
        Refunded    // Escrow cancelled/refunded to client
    }

    // ==========================================
    // STRUCTS
    // ==========================================
    struct Deal {
        bytes32 dealId;
        address payable client;
        address payable developer;
        uint256 amount;
        DealState state;
        string repoFullName; // e.g. "octocat/hello-world"
        uint256 createdAt;
        uint256 fundedAt;
        uint256 completedAt;
    }

    struct OwnershipAttestation {
        bytes32 dealId;
        address developer;
        address client;
        string repoFullName;
        bytes32 nonce;
        uint256 deadline;
    }

    // ==========================================
    // CUSTOM ERRORS
    // ==========================================
    error DealNotFound(bytes32 dealId);
    error DealAlreadyExists(bytes32 dealId);
    error InvalidState(DealState current, DealState expected);
    error InvalidDepositAmount(uint256 sent, uint256 required);
    error Unauthorized(address caller);
    error InvalidZeroAddress();
    error InvalidEmptyString();
    error InvalidOracleSignature();
    error AttestationExpired(uint256 deadline, uint256 currentTimestamp);
    error NonceAlreadyUsed(bytes32 nonce);
    error TransferFailed();
    error ReentrancyGuardReentrantCall();

    // ==========================================
    // EVENTS
    // ==========================================
    event DealCreated(
        bytes32 indexed dealId,
        address indexed client,
        address indexed developer,
        uint256 amount,
        string repoFullName
    );

    event EscrowFunded(
        bytes32 indexed dealId,
        address indexed client,
        uint256 amount
    );

    event DeploymentApproved(
        bytes32 indexed dealId,
        address indexed client
    );

    event OwnershipAttested(
        bytes32 indexed dealId,
        bytes32 indexed nonce,
        address indexed oracle,
        address developer
    );

    event PaymentReleased(
        bytes32 indexed dealId,
        address indexed developer,
        uint256 amount
    );

    event EscrowRefunded(
        bytes32 indexed dealId,
        address indexed client,
        uint256 amount
    );

    event OracleUpdated(
        address indexed previousOracle,
        address indexed newOracle
    );

    // ==========================================
    // FUNCTIONS
    // ==========================================
    function createAndFundDeal(
        bytes32 dealId,
        address payable developer,
        string calldata repoFullName
    ) external payable;

    function fundEscrow(bytes32 dealId) external payable;

    function approveDeployment(bytes32 dealId) external;

    function releasePaymentWithAttestation(
        OwnershipAttestation calldata attestation,
        bytes calldata signature
    ) external;

    function refund(bytes32 dealId) external;

    function getDeal(bytes32 dealId) external view returns (Deal memory);

    function isNonceUsed(bytes32 nonce) external view returns (bool);

    function getOracle() external view returns (address);
}
