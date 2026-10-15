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

/**
 * @title EscrowBase
 * @author Aashiq Edavalapati
 * @notice Abstract base contract managing core escrow state, mappings, modifiers, and access control.
 * @dev Demonstrates Solidity concepts: Abstract Contract, Modifiers, Enums, Structs, Custom Errors, Mappings.
 */
abstract contract EscrowBase is IGitLockEscrow {
    // ==========================================
    // STATE VARIABLES
    // ==========================================
    address public owner;
    address public oracle;

    // Reentrancy guard slot
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    // Core mappings
    mapping(bytes32 => Deal) internal deals;
    mapping(bytes32 => bool) public usedNonces;
    mapping(address => uint256) public totalFundedByClient;
    mapping(address => uint256) public totalEarnedByDeveloper;

    // ==========================================
    // MODIFIERS
    // ==========================================
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized(msg.sender);
        _;
    }

    modifier onlyClient(bytes32 dealId) {
        Deal storage deal = deals[dealId];
        if (deal.client == address(0)) revert DealNotFound(dealId);
        if (msg.sender != deal.client) revert Unauthorized(msg.sender);
        _;
    }

    modifier onlyDeveloper(bytes32 dealId) {
        Deal storage deal = deals[dealId];
        if (deal.developer == address(0)) revert DealNotFound(dealId);
        if (msg.sender != deal.developer) revert Unauthorized(msg.sender);
        _;
    }

    modifier inState(bytes32 dealId, DealState expectedState) {
        Deal storage deal = deals[dealId];
        if (deal.state != expectedState) revert InvalidState(deal.state, expectedState);
        _;
    }

    modifier validDeal(bytes32 dealId) {
        if (deals[dealId].state == DealState.None) revert DealNotFound(dealId);
        _;
    }

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuardReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    constructor(address initialOracle) {
        if (initialOracle == address(0)) revert InvalidZeroAddress();
        owner = msg.sender;
        oracle = initialOracle;
        _status = _NOT_ENTERED;
    }

    // ==========================================
    // ADMIN FUNCTIONS
    // ==========================================
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidZeroAddress();
        owner = newOwner;
    }

    function setOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert InvalidZeroAddress();
        address oldOracle = oracle;
        oracle = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }

    // ==========================================
    // VIEW FUNCTIONS
    // ==========================================
    function getDeal(bytes32 dealId) external view override returns (Deal memory) {
        Deal memory deal = deals[dealId];
        if (deal.state == DealState.None) revert DealNotFound(dealId);
        return deal;
    }

    function isNonceUsed(bytes32 nonce) external view override returns (bool) {
        return usedNonces[nonce];
    }

    function getOracle() external view override returns (address) {
        return oracle;
    }
}

/**
 * @title AttestationVerifier
 * @author Aashiq Edavalapati
 * @notice Abstract contract providing cryptographic attestation hashing, signature recovery, and verification.
 * @dev Demonstrates Solidity concepts: Abstract Contract, Pure Functions, View Functions, Inline Assembly, ecrecover.
 */
abstract contract AttestationVerifier {
    // ==========================================
    // PURE / VIEW CRYPTOGRAPHIC FUNCTIONS
    // ==========================================

    /**
     * @notice Computes standard hash of the oracle ownership attestation.
     * @param attestation The attestation struct signed by the GitLock backend oracle.
     * @return The 32-byte Keccak-256 hash.
     */
    function hashAttestation(
        IGitLockEscrow.OwnershipAttestation memory attestation
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                attestation.dealId,
                attestation.developer,
                attestation.client,
                keccak256(bytes(attestation.repoFullName)),
                attestation.nonce,
                attestation.deadline
            )
        );
    }

    /**
     * @notice Formats a hash with the Ethereum Signed Message prefix according to EIP-191.
     * @param messageHash Raw hash of the message.
     * @return The EIP-191 prefixed hash.
     */
    function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
    }

    /**
     * @notice Recovers the signer address from an EIP-191 signed message hash and signature.
     * @param ethSignedMessageHash The message hash with prefix.
     * @param sig The 65-byte ECDSA signature (r, s, v).
     * @return The recovered address.
     */
    function recoverSigner(
        bytes32 ethSignedMessageHash,
        bytes memory sig
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(sig);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    /**
     * @notice Splits a 65-byte signature into r, s, and v components.
     * @param sig Signature bytes.
     * @return r First 32 bytes.
     * @return s Second 32 bytes.
     * @return v Final byte recovery identifier.
     */
    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        if (sig.length != 65) revert IGitLockEscrow.InvalidOracleSignature();

        assembly {
            // First 32 bytes after length prefix
            r := mload(add(sig, 32))
            // Next 32 bytes
            s := mload(add(sig, 64))
            // Final byte
            v := byte(0, mload(add(sig, 96)))
        }

        // Support standard v values (27 or 28)
        if (v < 27) {
            v += 27;
        }
    }

    /**
     * @notice Verifies that an attestation was signed by the expected oracle address.
     * @param attestation The attestation struct.
     * @param sig The signature.
     * @param expectedSigner The authorized oracle address.
     * @return isValid True if signer matches expectedSigner.
     */
    function verifyAttestationSignature(
        IGitLockEscrow.OwnershipAttestation memory attestation,
        bytes memory sig,
        address expectedSigner
    ) public pure returns (bool isValid) {
        bytes32 rawHash = hashAttestation(attestation);
        bytes32 ethSignedHash = getEthSignedMessageHash(rawHash);
        address recovered = recoverSigner(ethSignedHash, sig);
        return (recovered != address(0) && recovered == expectedSigner);
    }

    /**
     * @notice Helper pure function to convert string project ID to bytes32 dealId.
     * @param projectId UUID or string identifier.
     * @return The bytes32 hash representation.
     */
    function projectIdToDealId(string memory projectId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(projectId));
    }
}

/**
 * @title GitLockEscrow
 * @author Aashiq Edavalapati
 * @notice Trustless blockchain escrow for freelance software transactions.
 * @dev Fully utilizes Solidity concepts:
 *      - Inheritance: Inherits from EscrowBase and AttestationVerifier
 *      - Abstract contracts: EscrowBase and AttestationVerifier
 *      - Structs: Deal, OwnershipAttestation
 *      - Enums: DealState
 *      - Custom errors: Revert with parameterized custom errors
 *      - Modifiers: onlyOwner, onlyClient, onlyDeveloper, inState, validDeal, nonReentrant
 *      - Events: DealCreated, EscrowFunded, DeploymentApproved, OwnershipAttested, PaymentReleased, EscrowRefunded, OracleUpdated
 *      - Payable functions: createAndFundDeal, fundEscrow, releasePaymentWithAttestation, refund, receive, fallback
 *      - View and Pure functions: getDeal, isNonceUsed, getOracle, hashAttestation, getEthSignedMessageHash, recoverSigner, verifyAttestationSignature, projectIdToDealId
 *      - Mappings: deals, usedNonces, totalFundedByClient, totalEarnedByDeveloper
 */
contract GitLockEscrow is EscrowBase, AttestationVerifier {
    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    /**
     * @notice Initializes the GitLock Escrow contract with an initial oracle address.
     * @param initialOracle Address of the GitLock backend oracle responsible for verifying GitHub repo transfers.
     */
    constructor(address initialOracle) EscrowBase(initialOracle) {}

    // ==========================================
    // PAYABLE & STATE-CHANGING FUNCTIONS
    // ==========================================

    /**
     * @notice Creates a new deal and funds the escrow in a single atomic transaction.
     * @param dealId Unique 32-byte identifier for the deal (e.g. hash of GitLock project UUID).
     * @param developer Address of the developer who will receive payment upon verified transfer.
     * @param repoFullName Full GitHub repository name (e.g. "developer/awesome-app").
     */
    function createAndFundDeal(
        bytes32 dealId,
        address payable developer,
        string calldata repoFullName
    ) external payable override nonReentrant {
        if (dealId == bytes32(0)) revert InvalidZeroAddress();
        if (developer == address(0)) revert InvalidZeroAddress();
        if (developer == msg.sender) revert Unauthorized(msg.sender);
        if (bytes(repoFullName).length == 0) revert InvalidEmptyString();
        if (msg.value == 0) revert InvalidDepositAmount(0, 1);
        if (deals[dealId].state != DealState.None) revert DealAlreadyExists(dealId);

        deals[dealId] = Deal({
            dealId: dealId,
            client: payable(msg.sender),
            developer: developer,
            amount: msg.value,
            state: DealState.Funded,
            repoFullName: repoFullName,
            createdAt: block.timestamp,
            fundedAt: block.timestamp,
            completedAt: 0
        });

        totalFundedByClient[msg.sender] += msg.value;

        emit DealCreated(dealId, msg.sender, developer, msg.value, repoFullName);
        emit EscrowFunded(dealId, msg.sender, msg.value);
    }

    /**
     * @notice Funds an already registered deal that is in Created state.
     * @param dealId Deal identifier to fund.
     */
    function fundEscrow(
        bytes32 dealId
    ) external payable override nonReentrant validDeal(dealId) inState(dealId, DealState.Created) {
        Deal storage deal = deals[dealId];
        if (msg.sender != deal.client) revert Unauthorized(msg.sender);
        if (msg.value == 0 || msg.value != deal.amount) revert InvalidDepositAmount(msg.value, deal.amount);

        deal.state = DealState.Funded;
        deal.fundedAt = block.timestamp;
        totalFundedByClient[msg.sender] += msg.value;

        emit EscrowFunded(dealId, msg.sender, msg.value);
    }

    /**
     * @notice Step 3 in GitLock Workflow: Client tests live deployment and approves it.
     * @param dealId Deal identifier.
     */
    function approveDeployment(
        bytes32 dealId
    ) external override onlyClient(dealId) {
        Deal storage deal = deals[dealId];
        if (deal.state != DealState.Funded) {
            revert InvalidState(deal.state, DealState.Funded);
        }

        deal.state = DealState.Approved;
        emit DeploymentApproved(dealId, msg.sender);
    }

    /**
     * @notice Step 7 in GitLock Workflow: Releases BNB to developer upon valid Oracle Attestation of GitHub transfer.
     * @param attestation Oracle attestation containing deal ID, developer, client, repo, nonce, and deadline.
     * @param signature Cryptographic ECDSA signature generated by the GitLock backend oracle.
     */
    function releasePaymentWithAttestation(
        OwnershipAttestation calldata attestation,
        bytes calldata signature
    ) external override nonReentrant {
        // 1. Expiration check
        if (block.timestamp > attestation.deadline) {
            revert AttestationExpired(attestation.deadline, block.timestamp);
        }

        // 2. Replay protection check
        if (usedNonces[attestation.nonce]) {
            revert NonceAlreadyUsed(attestation.nonce);
        }

        // 3. Cryptographic signature verification
        if (!verifyAttestationSignature(attestation, signature, oracle)) {
            revert InvalidOracleSignature();
        }

        // 4. Validate deal state
        Deal storage deal = deals[attestation.dealId];
        if (deal.state != DealState.Funded && deal.state != DealState.Approved) {
            revert InvalidState(deal.state, DealState.Approved);
        }

        // 5. Cross-check attestation parameters with on-chain deal record
        if (deal.developer != attestation.developer) revert Unauthorized(attestation.developer);
        if (deal.client != attestation.client) revert Unauthorized(attestation.client);

        // 6. State updates before external transfer (Checks-Effects-Interactions pattern)
        usedNonces[attestation.nonce] = true;
        deal.state = DealState.Completed;
        deal.completedAt = block.timestamp;
        uint256 payoutAmount = deal.amount;
        totalEarnedByDeveloper[deal.developer] += payoutAmount;

        emit OwnershipAttested(attestation.dealId, attestation.nonce, oracle, deal.developer);
        emit PaymentReleased(attestation.dealId, deal.developer, payoutAmount);

        // 7. Secure external BNB transfer to developer
        (bool success, ) = deal.developer.call{value: payoutAmount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Refunds the escrowed funds back to the client in case of cancellation or mutual refund.
     * @param dealId Deal identifier.
     */
    function refund(
        bytes32 dealId
    ) external override nonReentrant validDeal(dealId) {
        Deal storage deal = deals[dealId];
        
        // Allowed by owner/admin or client before completion
        if (msg.sender != owner && msg.sender != deal.client) {
            revert Unauthorized(msg.sender);
        }

        if (deal.state != DealState.Funded && deal.state != DealState.Approved) {
            revert InvalidState(deal.state, DealState.Funded);
        }

        deal.state = DealState.Refunded;
        uint256 refundAmount = deal.amount;

        emit EscrowRefunded(dealId, deal.client, refundAmount);

        (bool success, ) = deal.client.call{value: refundAmount}("");
        if (!success) revert TransferFailed();
    }

    // ==========================================
    // RECEIVE & FALLBACK PAYABLE FUNCTIONS
    // ==========================================
    receive() external payable {}

    fallback() external payable {}
}
