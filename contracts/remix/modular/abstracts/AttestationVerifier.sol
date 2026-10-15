// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IGitLockEscrow.sol";

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
