import { ethers } from 'ethers';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const abiPath = path.resolve(__dirname, '../config/GitLockEscrowABI.json');
const escrowAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const rpcUrl = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const chainId = parseInt(process.env.BSC_CHAIN_ID || '97', 10);
const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;

// Provider and Wallet
const provider = new ethers.JsonRpcProvider(rpcUrl);
let oracleWallet = null;
if (oraclePrivateKey) {
  try {
    oracleWallet = new ethers.Wallet(oraclePrivateKey, provider);
    console.log(`📡 Oracle Wallet Initialized: ${oracleWallet.address}`);
  } catch (err) {
    console.error('Failed to init oracle wallet:', err.message);
  }
}

export const getEscrowContract = () => {
  const currentAddress = process.env.ESCROW_CONTRACT_ADDRESS || contractAddress;
  if (!currentAddress) return null;
  return new ethers.Contract(currentAddress, escrowAbi, provider);
};

/**
 * Get public blockchain configuration
 */
export const getBlockchainConfig = () => {
  const activeAddress = process.env.ESCROW_CONTRACT_ADDRESS || contractAddress;
  return {
    contractAddress: activeAddress,
    chainId,
    rpcUrl,
    oracleAddress: oracleWallet ? oracleWallet.address : process.env.ORACLE_ADDRESS,
    minimalTestAmount: process.env.MINIMAL_TEST_AMOUNT || '0.0001'
  };
};

/**
 * Generate standard 32-byte dealId from project UUID
 */
export const generateDealId = (projectId) => {
  return ethers.keccak256(ethers.toUtf8Bytes(projectId));
};

/**
 * Read deal data from the smart contract on BSC Testnet
 */
export const getOnchainDeal = async (dealId) => {
  const contract = getEscrowContract();
  if (!contract) throw new Error('Escrow contract not configured');
  try {
    const deal = await contract.getDeal(dealId);
    return {
      dealId: deal.dealId,
      client: deal.client,
      developer: deal.developer,
      amount: ethers.formatEther(deal.amount),
      amountWei: deal.amount.toString(),
      state: Number(deal.state), // 0: None, 1: Created, 2: Funded, 3: Approved, 4: Completed, 5: Refunded
      repoFullName: deal.repoFullName,
      createdAt: Number(deal.createdAt),
      fundedAt: Number(deal.fundedAt),
      completedAt: Number(deal.completedAt)
    };
  } catch (err) {
    console.warn(`Deal ${dealId} query notice:`, err.message);
    return null;
  }
};

/**
 * Verify on-chain funding transaction or deal state
 */
export const verifyOnchainFunding = async (dealId, txHash = null) => {
  const contract = getEscrowContract();
  if (!contract) throw new Error('Escrow contract not configured');

  if (txHash) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return { success: false, error: 'Transaction failed or pending' };
      }
    } catch (e) {
      console.warn('Receipt lookup note:', e.message);
    }
  }

  const deal = await getOnchainDeal(dealId);
  if (!deal) {
    return { success: false, error: 'Deal not found on-chain' };
  }

  // State must be Funded (2) or Approved (3) or Completed (4)
  if (deal.state >= 2) {
    return { success: true, deal };
  }

  return { success: false, error: `Invalid on-chain state: ${deal.state}` };
};

/**
 * Verify repository ownership transfer using GitHub API
 */
export const verifyGithubRepoOwnership = async (repoOwner, repoName, expectedClientGithubLogin, token = null) => {
  try {
    const headers = {
      Accept: 'application/vnd.github+json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let targetLogin = expectedClientGithubLogin;
    // If a numeric GitHub ID was passed, resolve it to the username login
    if (targetLogin && /^\d+$/.test(targetLogin.toString().trim())) {
      try {
        const uRes = await axios.get(`https://api.github.com/user/${targetLogin.toString().trim()}`, {
          headers: { 'User-Agent': 'GitLock', Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (uRes.data?.login) {
          targetLogin = uRes.data.login;
        }
      } catch (err) {
        console.warn('Could not resolve numeric github ID to username:', err.message);
      }
    }

    // First try querying repo directly under expected client login
    let currentOwner = null;
    try {
      const res = await axios.get(`https://api.github.com/repos/${targetLogin}/${repoName}`, { headers });
      currentOwner = res.data?.owner?.login;
    } catch (err) {
      // If not under new owner yet, check current owner
      try {
        const resOld = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}`, { headers });
        currentOwner = resOld.data?.owner?.login;
      } catch (errOld) {
        console.warn('GitHub API lookup fallback:', errOld.message);
      }
    }

    console.log(`GitHub Ownership Check: Repo: ${repoName} | Current Owner: ${currentOwner} | Expected: ${targetLogin}`);

    if (currentOwner && currentOwner.toLowerCase() === targetLogin.toLowerCase()) {
      return { verified: true, currentOwner };
    }

    return {
      verified: false,
      currentOwner,
      message: `Repo owner is currently "${currentOwner || 'unknown'}", expected "${targetLogin}".`
    };
  } catch (error) {
    console.error('GitHub transfer verification error:', error.message);
    return { verified: false, error: error.message };
  }
};

/**
 * Generate and sign an Oracle Attestation for GitHub repository ownership transfer
 */
export const createOracleAttestation = async ({
  dealId,
  developerAddress,
  clientAddress,
  repoFullName
}) => {
  if (!oracleWallet) throw new Error('Oracle wallet not configured');

  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const deadline = Math.floor(Date.now() / 1000) + 7200; // 2 hour validity

  const repoHash = ethers.keccak256(ethers.toUtf8Bytes(repoFullName));
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const encoded = coder.encode(
    ['bytes32', 'address', 'address', 'bytes32', 'bytes32', 'uint256'],
    [dealId, developerAddress, clientAddress, repoHash, nonce, deadline]
  );
  const rawHash = ethers.keccak256(encoded);

  // EIP-191 sign message
  const signature = await oracleWallet.signMessage(ethers.getBytes(rawHash));

  return {
    attestation: {
      dealId,
      developer: developerAddress,
      client: clientAddress,
      repoFullName,
      nonce,
      deadline
    },
    signature,
    oracleAddress: oracleWallet.address
  };
};
