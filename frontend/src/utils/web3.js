import { ethers } from "ethers";
import EscrowABI from "@/contracts/GitLockEscrowABI.json";

export const BSC_TESTNET_CONFIG = {
  chainId: "0x61", // 97 in decimal
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: {
    name: "Binance Chain Native Token",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: [
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://bsc-testnet.publicnode.com"
  ],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

export const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ||
  "0x1642fb0220915E10b9e21cC18EFE10297154C67A";

export const MINIMAL_TEST_AMOUNT =
  process.env.NEXT_PUBLIC_MINIMAL_TEST_AMOUNT || "0.0001";

/**
 * Check if window.ethereum (MetaMask) is available
 */
export const isMetaMaskAvailable = () => {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
};

/**
 * Switch or prompt MetaMask to add the BSC Testnet network
 */
export const switchToBscTestnet = async () => {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_TESTNET_CONFIG.chainId }],
    });
  } catch (switchError) {
    // 4902 means the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BSC_TESTNET_CONFIG],
      });
    } else {
      throw switchError;
    }
  }
};

/**
 * Connect user's wallet via MetaMask
 */
export const connectWallet = async () => {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not installed. Please install MetaMask to interact with the blockchain.");
  }

  // Ensure network is BSC Testnet
  await switchToBscTestnet();

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found in MetaMask.");
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balanceWei = await provider.getBalance(address);
  const balance = ethers.formatEther(balanceWei);
  const network = await provider.getNetwork();

  return {
    address,
    balance: parseFloat(balance).toFixed(4),
    balanceWei: balanceWei.toString(),
    provider,
    signer,
    chainId: Number(network.chainId),
  };
};

/**
 * Get an instance of the GitLockEscrow contract
 */
export const getEscrowContract = (signerOrProvider) => {
  if (!ESCROW_CONTRACT_ADDRESS) {
    throw new Error("Escrow contract address is not configured.");
  }
  return new ethers.Contract(ESCROW_CONTRACT_ADDRESS, EscrowABI, signerOrProvider);
};

/**
 * Step 4 in Workflow: Client funds escrow deal on-chain
 */
export const createAndFundEscrowDeal = async ({
  dealId,
  developerAddress,
  repoFullName,
  amountBnb,
  signer,
}) => {
  if (!signer) throw new Error("Signer is required to submit transaction");
  if (!developerAddress || !ethers.isAddress(developerAddress)) {
    throw new Error("Invalid developer wallet address");
  }

  const contract = getEscrowContract(signer);
  const valueWei = ethers.parseEther(amountBnb.toString());

  console.log(`🚀 Depositing ${amountBnb} tBNB to Escrow (${ESCROW_CONTRACT_ADDRESS})...`);
  const tx = await contract.createAndFundDeal(
    dealId,
    developerAddress,
    repoFullName,
    { value: valueWei }
  );

  console.log("⏳ Transaction submitted. Waiting for confirmation...", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Escrow funding confirmed on-chain!", receipt);

  return {
    txHash: tx.hash,
    receipt,
    dealId,
    amountBnb,
  };
};

/**
 * Step 3 in Workflow: Client approves live deployment on-chain
 */
export const approveDeploymentOnchain = async ({ dealId, signer }) => {
  if (!signer) throw new Error("Signer is required");
  const contract = getEscrowContract(signer);
  const tx = await contract.approveDeployment(dealId);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
};

/**
 * Step 7 in Workflow: Release payment with Oracle Attestation
 */
export const releasePaymentWithAttestationOnchain = async ({
  attestation,
  signature,
  signer,
}) => {
  if (!signer) throw new Error("Signer is required to release payment");
  const contract = getEscrowContract(signer);

  console.log("🚀 Submitting releasePaymentWithAttestation on-chain...", {
    attestation,
    signature,
  });

  const tx = await contract.releasePaymentWithAttestation(attestation, signature);
  console.log("⏳ Transaction submitted:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Payment released to developer on-chain!", receipt);

  return {
    txHash: tx.hash,
    receipt,
  };
};

/**
 * Query on-chain deal state
 */
export const fetchOnchainDeal = async (dealId, providerOrSigner) => {
  try {
    const contract = getEscrowContract(providerOrSigner);
    const deal = await contract.getDeal(dealId);
    return {
      dealId: deal.dealId,
      client: deal.client,
      developer: deal.developer,
      amount: ethers.formatEther(deal.amount),
      state: Number(deal.state), // 0: None, 1: Created, 2: Funded, 3: Approved, 4: Completed, 5: Refunded
      repoFullName: deal.repoFullName,
      createdAt: Number(deal.createdAt),
      fundedAt: Number(deal.fundedAt),
      completedAt: Number(deal.completedAt),
    };
  } catch (err) {
    console.warn("Could not query on-chain deal:", err.message);
    return null;
  }
};

/**
 * Convert project UUID to bytes32 dealId
 */
export const formatDealId = (projectId) => {
  return ethers.keccak256(ethers.toUtf8Bytes(projectId));
};

/**
 * Shorten wallet address for UI display
 */
export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Get BscScan Explorer URLs
 */
export const getBscScanTxUrl = (txHash) => {
  return `https://testnet.bscscan.com/tx/${txHash}`;
};

export const getBscScanAddressUrl = (address) => {
  return `https://testnet.bscscan.com/address/${address}`;
};
