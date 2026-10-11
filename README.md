# GitLock: Trustless Code Escrow & Decentralized Delivery Platform

*Verifiable, Blockchain-Based Freelance Code Escrow & Deployment Binding Platform on BNB Smart Chain (BSC Testnet).*

---

### **1. Problem Statement**

Freelance software transactions involve risks for both clients and developers, including unverified source code, unreliable delivery, and payment disputes. **GitLock** addresses these risks by verifying source-code integrity and deployment consistency, then using a blockchain-based escrow smart contract to hold payment until the client approves the delivery and ownership of the verified GitHub repository is transferred to them.

---

### **2. The 7-Step Workflow**

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant GL as GitLock Backend
    actor Client as Client
    participant SC as GitLockEscrow Smart Contract (BSC)

    Dev->>GL: 1. Project Submission (ZIP, GitHub Repo, Commit Hash, Staging URL)
    GL->>GL: 2. Verification (Source Code Hash == GitHub Archive, Deployment Active)
    Client->>GL: 3. Client Approval (Tests Live Staging Demo & Approves)
    Client->>SC: 4. Escrow Funding (Deposits BNB into Smart Contract)
    Dev->>Client: 5. Repository Transfer (Transfers GitHub Repo Ownership to Client)
    GL->>GL: 6. Ownership Verification (GitHub API Verifies Transfer & Signs Oracle Attestation)
    Client->>SC: 7. Payment Release (Submits Attestation; Contract Releases BNB to Dev & Unlocks Code)
```

1. **Project Submission:** Developer submits the source ZIP, GitHub repository, commit hash, and deployment URL.
2. **Verification:** GitLock verifies source-code integrity (ZIP CRC/SHA-256 vs GitHub commit archive) and deployment consistency (GitHub Deployments API).
3. **Client Approval:** Client tests the live deployment URL and approves it.
4. **Escrow Funding:** Client deposits BNB into the `GitLockEscrow` smart contract on BNB Smart Chain Testnet.
5. **Repository Transfer:** Developer transfers GitHub repository ownership to the client.
6. **Ownership Verification:** GitLock backend verifies the transfer via the GitHub API and cryptographically signs an EIP-191 oracle attestation.
7. **Payment Release:** Smart contract verifies the oracle attestation signature and releases BNB to the developer, while the platform unlocks the decrypted source code for the client.

---

### **3. Blockchain & Smart Contract Architecture**

The smart contract is written in **Solidity 0.8.20** and utilizes all fundamental and advanced Solidity concepts:

- **Inheritance & Abstract Contracts:**
  - `IGitLockEscrow`: Core interface defining data structures, enums, errors, events, and functions.
  - `EscrowBase`: Abstract contract managing storage mappings, modifiers, and access control.
  - `AttestationVerifier`: Abstract contract implementing cryptographic hashing, EIP-191 message prefixing, and `ecrecover` signature verification.
  - `GitLockEscrow`: Main contract inheriting from `EscrowBase` and `AttestationVerifier`.
- **Structs:**
  - `Deal`: Stores deal ID, client, developer, amount, status, repository name, and timestamps.
  - `OwnershipAttestation`: Encapsulates oracle attestation data (dealId, developer, client, repoFullName, nonce, deadline).
- **Enums:**
  - `DealState { None, Created, Funded, Approved, Completed, Refunded }`
- **Custom Errors:**
  - `DealNotFound`, `DealAlreadyExists`, `InvalidState`, `InvalidDepositAmount`, `Unauthorized`, `InvalidZeroAddress`, `InvalidOracleSignature`, `AttestationExpired`, `NonceAlreadyUsed`, `TransferFailed`, `ReentrancyGuardReentrantCall`.
- **Modifiers:**
  - `onlyOwner`, `onlyClient`, `onlyDeveloper`, `inState`, `validDeal`, `nonReentrant`.
- **Events:**
  - `DealCreated`, `EscrowFunded`, `DeploymentApproved`, `OwnershipAttested`, `PaymentReleased`, `EscrowRefunded`, `OracleUpdated`.
- **Payable Functions:**
  - `createAndFundDeal(bytes32, address, string)` (payable)
  - `fundEscrow(bytes32)` (payable)
  - `releasePaymentWithAttestation(...)` (transfers BNB via secure `.call`)
  - `refund(bytes32)` (refunds BNB)
  - `receive()`, `fallback()` (payable)
- **View & Pure Functions:**
  - `getDeal(bytes32)` (view)
  - `isNonceUsed(bytes32)` (view)
  - `getOracle()` (view)
  - `hashAttestation(...)` (pure)
  - `getEthSignedMessageHash(...)` (pure)
  - `recoverSigner(...)` (pure)
  - `splitSignature(...)` (pure assembly)
  - `verifyAttestationSignature(...)` (pure)
  - `projectIdToDealId(...)` (pure)
- **Mappings:**
  - `mapping(bytes32 => Deal) internal deals;`
  - `mapping(bytes32 => bool) public usedNonces;` (replay attack protection)
  - `mapping(address => uint256) public totalFundedByClient;`
  - `mapping(address => uint256) public totalEarnedByDeveloper;`

---

### **4. Deployed Smart Contract Details (BSC Testnet)**

- **Network:** BNB Smart Chain Testnet (BSC Testnet)
- **Chain ID:** `97` (`0x61`)
- **Contract Address:** [`0x1642fb0220915E10b9e21cC18EFE10297154C67A`](https://testnet.bscscan.com/address/0x1642fb0220915E10b9e21cC18EFE10297154C67A)
- **Oracle Signer Address:** `0x392e227Bf9201A328f9ebD8DBee33f3cBDB15b37`
- **Minimal Test Amount:** `0.0001 tBNB` (designed to conserve testnet faucet funds)
- **BscScan Explorer:** [https://testnet.bscscan.com](https://testnet.bscscan.com)

---

### **5. Testing & Verification**

#### **Foundry Smart Contract Tests:**
```bash
cd contracts
forge test -vvv
```
All 11 unit & integration tests pass with 100% success rate:
- `test_InitialState`: Verifies oracle and owner initialization
- `test_CreateAndFundDeal`: Verifies deposit and deal creation
- `test_RevertWhen_ZeroDeposit`: Reverts on zero deposit
- `test_RevertWhen_SelfDealing`: Reverts if client == developer
- `test_ApproveDeployment`: Verifies client live deployment approval
- `test_ReleasePaymentWithValidAttestation`: Verifies cryptographic oracle attestation and BNB transfer
- `test_RevertWhen_InvalidOracleSignature`: Reverts on forged or unauthorized signature
- `test_RevertWhen_AttestationExpired`: Reverts on expired deadline
- `test_RevertWhen_NonceReused`: Reverts on replay attacks
- `test_Refund`: Verifies client refund
- `test_AdminUpdateOracle`: Verifies access control on oracle rotation

#### **Live On-Chain E2E Verification:**
```bash
cd backend
node scripts/verifyBlockchainEscrowE2E.js
```
Executes the full 7-step lifecycle live on BSC Testnet with minimal gas and verifies balance release.

---

### **6. Tech Stack**

- **Smart Contracts:** Solidity `^0.8.20`, Foundry (`forge`, `cast`), BNB Smart Chain Testnet
- **Backend:** Node.js, Express.js, Ethers.js v6, PostgreSQL, Octokit / GitHub REST API, AES-256 / RSA Hybrid Encryption
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide React, Ethers.js v6 Web3 integration with MetaMask
