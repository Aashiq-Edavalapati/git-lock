// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IGitLockEscrow.sol";

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
