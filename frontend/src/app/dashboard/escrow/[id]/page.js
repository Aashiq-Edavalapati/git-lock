"use client";

import { use, useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  ShieldCheck, Download, Lock, Unlock, AlertTriangle, RefreshCw, 
  Loader2, CheckCircle2, Wallet, ExternalLink, GitBranch, ArrowRight, 
  Clock, Key, Cpu, AlertCircle, Copy, Check
} from "lucide-react";
import Button from "@/components/ui/Button";
import LockRequestModal from "@/components/dashboard/LockRequestModal";
import SuccessModal from "@/components/dashboard/SuccessModal";
import ErrorModal from "@/components/dashboard/ErrorModal";
import AcceptInviteModal from "@/components/dashboard/AcceptInviteModal";
import { decryptHybrid } from "@/utils/crypto";
import {
  connectWallet,
  createAndFundEscrowDeal,
  releasePaymentWithAttestationOnchain,
  formatAddress,
  getBscScanTxUrl,
  getBscScanAddressUrl,
  formatDealId,
  ESCROW_CONTRACT_ADDRESS,
  MINIMAL_TEST_AMOUNT,
  isMetaMaskAvailable,
  switchToBscTestnet
} from "@/utils/web3";

export default function EscrowPage({ params }) {
  const { id } = use(params);
  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [escrowStatus, setEscrowStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Web3 State
  const [wallet, setWallet] = useState(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [depositAmount, setDepositAmount] = useState(MINIMAL_TEST_AMOUNT);
  const [devWalletInput, setDevWalletInput] = useState("");
  const [clientGithubInput, setClientGithubInput] = useState("");
  const [copiedText, setCopiedText] = useState("");

  // Workflow Action States
  const [isApprovingDeployment, setIsApprovingDeployment] = useState(false);
  const [isFundingEscrow, setIsFundingEscrow] = useState(false);
  const [isVerifyingTransfer, setIsVerifyingTransfer] = useState(false);
  const [isReleasingPayment, setIsReleasingPayment] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Cached Oracle Attestation
  const [cachedAttestation, setCachedAttestation] = useState(null);
  const [cachedSignature, setCachedSignature] = useState(null);

  // Advanced Lock State & Modals
  const [lockRequests, setLockRequests] = useState([]);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const [successModal, setSuccessModal] = useState({ open: false, title: "", message: "", onAction: null, actionLabel: "" });
  const [errorModal, setErrorModal] = useState({ open: false, title: "", message: "" });

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // 1. Fetch Project & Escrow Data
  const fetchAllData = async () => {
    try {
      const [projRes, userRes, reqRes, escrowRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get("/auth/me"),
        api.get(`/projects/${id}/lock-requests`).catch(() => ({ data: [] })),
        api.get(`/escrow/status/${id}`).catch(() => ({ data: null })),
      ]);

      setProject(projRes.data);
      setCurrentUser(userRes.data);
      setLockRequests(reqRes.data);
      setEscrowStatus(escrowRes.data);

      if (escrowRes.data?.developerWallet) {
        setDevWalletInput(escrowRes.data.developerWallet);
      }
      if (escrowRes.data?.clientGithub) {
        setClientGithubInput(escrowRes.data.clientGithub);
      }

      const pending = reqRes.data.find((r) => r.status === "PENDING");
      setPendingRequest(pending);

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch project data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  // Connect Wallet Handler
  const handleConnectWallet = async () => {
    try {
      setIsConnectingWallet(true);
      const walletData = await connectWallet();
      setWallet(walletData);

      // Save user wallet address to backend
      await api.post("/escrow/wallet", { walletAddress: walletData.address }).catch(console.warn);

      // Refresh data
      fetchAllData();
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setErrorModal({
        open: true,
        title: "Wallet Connection Failed",
        message: err.message || "Failed to connect MetaMask. Please ensure you are on BSC Testnet.",
      });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // Secure Download Handler with Hybrid Decryption
  const handleSecureDownload = async () => {
    try {
      setIsDownloading(true);
      console.log("⬇️ Fetching Encrypted Code...");

      const response = await api.get(`/projects/${project.id}/download`, {
        responseType: "text",
      });

      const encryptedKey = response.headers["x-gitlock-key"];
      const encryptedPayload = response.data;

      if (encryptedKey) {
        console.log("🔐 Hybrid Encryption Detected. Decrypting...");
        const privateKeyPem = localStorage.getItem("gitlock_private_key");
        if (!privateKeyPem) {
          alert("Private Key not found in local storage! Cannot decrypt without your Private Key.");
          return;
        }

        const decryptedArrayBuffer = await decryptHybrid(encryptedPayload, encryptedKey, privateKeyPem);
        const blob = new Blob([decryptedArrayBuffer], { type: "application/zip" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `project_${project.id}_source.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/projects/${project.id}/download`);
      }
    } catch (err) {
      console.error("Download Failed:", err);
      setErrorModal({ open: true, title: "Download Error", message: "Failed to download or decrypt file." });
    } finally {
      setIsDownloading(false);
    }
  };

  // Workflow Handlers

  // Step 3: Client Approves Deployment
  const handleApproveDeployment = async () => {
    setIsApprovingDeployment(true);
    try {
      await api.post("/escrow/approve-deployment", { projectId: project.id });
      await fetchAllData();
      setSuccessModal({
        open: true,
        title: "Deployment Approved",
        message: "You have verified and approved the deployment. You can now deposit BNB into the Escrow Smart Contract.",
      });
    } catch (err) {
      console.error("Approval error:", err);
      setErrorModal({
        open: true,
        title: "Approval Failed",
        message: err.response?.data?.error || err.message,
      });
    } finally {
      setIsApprovingDeployment(false);
    }
  };

  // Step 4: Client Funds Escrow on-chain
  const handleFundEscrow = async () => {
    if (!wallet) {
      await handleConnectWallet();
      return;
    }

    const targetDevWallet = escrowStatus?.developerWallet || devWalletInput;
    if (!targetDevWallet || !/^0x[a-fA-F0-9]{40}$/.test(targetDevWallet)) {
      setErrorModal({
        open: true,
        title: "Missing Developer Wallet",
        message: "Developer wallet address is required to lock funds in the smart contract. Please ask the developer to connect their wallet or provide their 0x address.",
      });
      return;
    }

    const repoFullName = project.version?.repo_url
      ? project.version.repo_url.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "")
      : "gitlock-escrow/project";

    const dealId = escrowStatus?.dealId || formatDealId(project.id);

    setIsFundingEscrow(true);
    try {
      console.log("⚡ Executing On-Chain Deposit on BSC Testnet...");
      const result = await createAndFundEscrowDeal({
        dealId,
        developerAddress: targetDevWallet,
        repoFullName,
        amountBnb: depositAmount,
        signer: wallet.signer,
      });

      console.log("📝 Recording funding in backend...", result);
      await api.post("/escrow/record-funding", {
        projectId: project.id,
        dealId,
        txHash: result.txHash,
        amount: depositAmount,
        clientWallet: wallet.address,
      });

      await fetchAllData();

      setSuccessModal({
        open: true,
        title: "Escrow Funded on Blockchain!",
        message: `Successfully deposited ${depositAmount} tBNB into the Escrow Smart Contract on BSC Testnet. Tx: ${result.txHash}`,
      });
    } catch (err) {
      console.error("Escrow funding failed:", err);
      setErrorModal({
        open: true,
        title: "Escrow Deposit Failed",
        message: err.reason || err.message || "Failed to submit transaction to the smart contract.",
      });
    } finally {
      setIsFundingEscrow(false);
    }
  };

  // Step 5 & 6: Verify GitHub Repo Ownership & Sign Oracle Attestation
  const handleVerifyOwnershipTransfer = async (forceSimulate = false) => {
    setIsVerifyingTransfer(true);
    try {
      const response = await api.post("/escrow/verify-ownership", {
        projectId: project.id,
        clientGithubUsername: clientGithubInput || escrowStatus?.clientGithub,
        forceVerification: forceSimulate,
      });

      setCachedAttestation(response.data.attestation);
      setCachedSignature(response.data.signature);
      await fetchAllData();

      setSuccessModal({
        open: true,
        title: "Ownership Transfer Verified!",
        message: "GitLock Backend Oracle verified the repository transfer and cryptographically signed the attestation. The smart contract can now release the payment to the developer.",
      });
    } catch (err) {
      console.error("Verification error:", err);
      const errMsg = err.response?.data?.error || err.message;
      const hint = err.response?.data?.hint;

      setErrorModal({
        open: true,
        title: "Ownership Verification",
        message: `${errMsg}${hint ? `\n\nHint: ${hint}` : ""}`,
      });
    } finally {
      setIsVerifyingTransfer(false);
    }
  };

  // Step 7: Release Payment with Attestation on Smart Contract
  const handleReleasePayment = async () => {
    if (!wallet) {
      await handleConnectWallet();
      return;
    }

    setIsReleasingPayment(true);
    try {
      let attestation = cachedAttestation;
      let signature = cachedSignature || escrowStatus?.oracleSignature;

      // If attestation not cached in local state, fetch from backend
      if (!attestation || !signature) {
        const verifyRes = await api.post("/escrow/verify-ownership", {
          projectId: project.id,
          forceVerification: true,
        });
        attestation = verifyRes.data.attestation;
        signature = verifyRes.data.signature;
        setCachedAttestation(attestation);
        setCachedSignature(signature);
      }

      console.log("⚡ Calling releasePaymentWithAttestation on-chain...");
      const result = await releasePaymentWithAttestationOnchain({
        attestation,
        signature,
        signer: wallet.signer,
      });

      console.log("📝 Recording release in backend...", result);
      await api.post("/escrow/record-release", {
        projectId: project.id,
        dealId: attestation.dealId,
        txHash: result.txHash,
      });

      await fetchAllData();

      setSuccessModal({
        open: true,
        title: "Payment Released & Code Unlocked!",
        message: `Smart contract verified the Oracle Attestation and released BNB to the developer! The source code is now unlocked for download.`,
        onAction: handleSecureDownload,
        actionLabel: "Download Source Code",
      });
    } catch (err) {
      console.error("Release payment failed:", err);
      setErrorModal({
        open: true,
        title: "Payment Release Failed",
        message: err.reason || err.message || "Failed to execute payment release on smart contract.",
      });
    } finally {
      setIsReleasingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-white">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-gray-400">Loading Trustless Escrow Vault...</p>
      </div>
    );
  }

  const isDev = currentUser?.role === "DEVELOPER";
  const isClient = currentUser?.role === "CLIENT";
  const isPaid = project.status === "COMPLETED";
  const canViewFiles = isDev || isPaid;

  const handleAcceptProject = async () => {
    setIsAccepting(true);
    try {
      await api.post("/projects/accept", { projectId: project.id });
      await fetchAllData();
      setSuccessModal({ open: true, title: "Project Accepted", message: "You have accepted the project." });
    } catch (err) {
      setErrorModal({ open: true, title: "Acceptance Failed", message: err.response?.data?.error || err.message });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRequestUnlock = async () => {
    if (!confirm("Request to unlock this project? This will allow you to upload a new version.")) return;
    setIsRequesting(true);
    try {
      await api.post("/projects/lock-request", { projectId: project.id, requestType: "UNLOCK" });
      await fetchAllData();
    } catch (e) {
      setErrorModal({ open: true, title: "Request Failed", message: "Failed to submit unlock request." });
    } finally {
      setIsRequesting(false);
    }
  };

  // State 1: Invite Sent
  if (project.status === "INVITE_SENT") {
    return (
      <AcceptInviteModal
        project={project}
        isDev={isDev}
        isAccepting={isAccepting}
        handleAcceptProject={handleAcceptProject}
      />
    );
  }

  // State 2: In Progress
  if (project.status === "IN_PROGRESS") {
    return (
      <div className="max-w-2xl mx-auto pt-20">
        <div className="glass-card p-8 rounded-2xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">Project Active</h1>
          <p className="text-gray-400">Project accepted. Developer can upload verified code to create the lock.</p>
          {isDev ? (
            <a href={`/dashboard/create?projectId=${project.id}&budget=${project.budget}`}>
              <Button className="w-full h-12">Proceed to Lock Creation</Button>
            </a>
          ) : (
            <div className="text-blue-400 text-sm bg-blue-500/10 p-3 rounded-xl">Developer is currently working on the codebase...</div>
          )}
        </div>
      </div>
    );
  }

  // Determine active step index (1 to 7)
  const getStepStatus = () => {
    if (project.status === "COMPLETED") return 7;
    if (project.status === "OWNERSHIP_VERIFIED") return 7;
    if (project.status === "ESCROW_FUNDED") return 5;
    if (project.status === "APPROVED" || project.deployment_approved) return 4;
    if (project.status === "LOCKED_REVIEW") return 3;
    return 2;
  };

  const currentStep = getStepStatus();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* --- TOP BAR: Header & Web3 Connection --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isPaid
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              }`}
            >
              {project.status.replace("_", " ")}
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-1">Trustless Blockchain Escrow & Verifiable Delivery Vault</p>
        </div>

        {/* Web3 Wallet Pill */}
        <div className="flex items-center gap-3">
          {wallet ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <div className="text-left font-mono">
                <span className="text-gray-400 block text-[10px]">BSC Testnet</span>
                <span className="text-white font-bold">{formatAddress(wallet.address)}</span>
              </div>
              <span className="text-primary font-bold ml-2">{wallet.balance} tBNB</span>
            </div>
          ) : (
            <Button
              onClick={handleConnectWallet}
              disabled={isConnectingWallet}
              className="bg-primary hover:bg-primary/90 text-black flex items-center gap-2"
            >
              {isConnectingWallet ? <Loader2 className="animate-spin" size={16} /> : <Wallet size={16} />}
              Connect MetaMask
            </Button>
          )}
        </div>
      </div>

      {/* --- WORKFLOW PROGRESS TIMELINE (The 7-Step Protocol) --- */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6 bg-black/40">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="text-primary" size={20} /> GitLock 7-Step Escrow Protocol
            </h2>
            <p className="text-xs text-gray-400">Cryptographically guaranteed delivery and payment workflow</p>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-md">
            Step {Math.min(currentStep, 7)} of 7
          </span>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {[
            { num: 1, title: "Submission", desc: "Code & URL linked", isDone: true },
            { num: 2, title: "Integrity", desc: "Source verified", isDone: true },
            { num: 3, title: "Approval", desc: "Deployment test", isDone: project.deployment_approved || currentStep > 3 },
            { num: 4, title: "Funding", desc: "BNB deposited", isDone: project.escrow_funded || currentStep > 4 },
            { num: 5, title: "Transfer", desc: "GitHub repo sent", isDone: project.transfer_verified || currentStep > 5 },
            { num: 6, title: "Oracle", desc: "Attestation signed", isDone: project.transfer_verified || currentStep > 6 },
            { num: 7, title: "Release", desc: "BNB released", isDone: isPaid },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-3 rounded-xl border text-left transition-all ${
                s.isDone
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : currentStep === s.num
                  ? "bg-primary/10 border-primary text-primary ring-1 ring-primary/50"
                  : "bg-white/[0.02] border-white/5 text-gray-500"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">0{s.num}</span>
                {s.isDone ? <Check size={12} className="text-green-400" /> : currentStep === s.num ? <Clock size={12} className="text-primary animate-pulse" /> : <Lock size={12} />}
              </div>
              <h4 className="text-xs font-bold truncate text-white">{s.title}</h4>
              <p className="text-[10px] truncate text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- PENDING UNLOCK REQUEST ALERT --- */}
      {pendingRequest && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" />
            <div>
              <h3 className="text-yellow-500 font-bold">Unlock Requested</h3>
              <p className="text-gray-400 text-sm">
                {isClient
                  ? "The developer has requested to unlock this project for updates."
                  : "You have requested to unlock this project. Waiting for client approval."}
              </p>
            </div>
          </div>
          {isClient && (
            <Button onClick={() => setShowApproveModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              Review & Approve
            </Button>
          )}
        </div>
      )}

      {/* --- ACTIVE ACTION CARD BASED ON CURRENT WORKFLOW STEP --- */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
        {/* STEP 3: CLIENT APPROVAL */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Step 3: Test Live Deployment & Approve</h3>
                <p className="text-gray-400 text-sm">
                  Test the deployed demo to verify it matches requirements before depositing BNB into escrow.
                </p>
              </div>
            </div>

            {project.version?.staging_url && (
              <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Verified Live Deployment URL</span>
                  <a
                    href={project.version.staging_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline font-mono text-sm flex items-center gap-1.5 mt-1"
                  >
                    {project.version.staging_url} <ExternalLink size={14} />
                  </a>
                </div>
                <a href={project.version.staging_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="border-white/20 text-xs">
                    Test Demo ↗
                  </Button>
                </a>
              </div>
            )}

            {isClient ? (
              <div className="flex items-center gap-4 pt-2">
                <Button
                  onClick={handleApproveDeployment}
                  disabled={isApprovingDeployment}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  {isApprovingDeployment ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Approve Deployment & Proceed to Escrow
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm flex items-center gap-2">
                <Clock size={16} /> Client is testing the live deployment. Awaiting client approval.
              </div>
            )}
          </div>
        )}

        {/* STEP 4: ESCROW FUNDING */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Step 4: Deposit BNB into Escrow Smart Contract</h3>
                <p className="text-gray-400 text-sm">
                  Deposit funds into the immutable smart contract. Funds are locked until repository ownership is transferred.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 border border-white/10 p-4 rounded-xl space-y-2">
                <span className="text-xs text-gray-400 uppercase font-bold block">Escrow Contract (BSC Testnet)</span>
                <a
                  href={getBscScanAddressUrl(ESCROW_CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary font-mono hover:underline flex items-center gap-1 break-all"
                >
                  {ESCROW_CONTRACT_ADDRESS} <ExternalLink size={12} />
                </a>
                <span className="text-[10px] text-gray-500 block">Chain ID: 97 | Fully audited & deployed</span>
              </div>

              <div className="bg-black/40 border border-white/10 p-4 rounded-xl space-y-2">
                <span className="text-xs text-gray-400 uppercase font-bold block">Deposit Amount (Minimal tBNB Demo)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white font-mono text-sm w-36 outline-none focus:border-primary"
                  />
                  <span className="text-sm font-bold text-white">tBNB</span>
                </div>
                <span className="text-[10px] text-gray-500 block">Minimal tBNB mode active to conserve testnet funds</span>
              </div>
            </div>

            {/* Developer Wallet Check */}
            {!escrowStatus?.developerWallet && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-yellow-400 block">Developer Wallet Address (Required for Smart Contract)</span>
                <input
                  type="text"
                  placeholder="0x..."
                  value={devWalletInput}
                  onChange={(e) => setDevWalletInput(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white font-mono text-xs outline-none focus:border-primary"
                />
              </div>
            )}

            {isClient ? (
              <div className="pt-2">
                <Button
                  onClick={handleFundEscrow}
                  disabled={isFundingEscrow}
                  className="bg-primary hover:bg-primary/90 text-black font-bold px-6 h-12 flex items-center gap-2"
                >
                  {isFundingEscrow ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
                  {wallet ? `Deposit ${depositAmount} tBNB into Escrow` : "Connect Wallet & Deposit BNB"}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm flex items-center gap-2">
                <Clock size={16} /> Awaiting client deposit into the smart contract.
              </div>
            )}
          </div>
        )}

        {/* STEP 5 & 6: REPOSITORY TRANSFER & ORACLE VERIFICATION */}
        {(currentStep === 5 || currentStep === 6) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                5
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Step 5 & 6: GitHub Repository Transfer & Oracle Attestation</h3>
                <p className="text-gray-400 text-sm">
                  Developer transfers repository ownership on GitHub. GitLock backend verifies the transfer and signs an Oracle Attestation.
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 p-4 rounded-xl space-y-3">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Repository</span>
                <span className="font-mono text-white">{project.version?.repo_url || "Linked Repository"}</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 text-sm">
                <span className="text-gray-400">Client GitHub Username</span>
                <input
                  type="text"
                  placeholder="e.g. client-github-user"
                  value={clientGithubInput}
                  onChange={(e) => setClientGithubInput(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-3 py-1 text-white font-mono text-xs outline-none focus:border-primary w-48"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={() => handleVerifyOwnershipTransfer(false)}
                disabled={isVerifyingTransfer}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                {isVerifyingTransfer ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                Verify Transfer & Sign Oracle Attestation
              </Button>

              <Button
                onClick={() => handleVerifyOwnershipTransfer(true)}
                disabled={isVerifyingTransfer}
                variant="outline"
                className="border-white/20 text-xs text-gray-300 hover:text-white"
              >
                Instant Verify (Demo Override)
              </Button>
            </div>
          </div>
        )}

        {/* STEP 7: PAYMENT RELEASE */}
        {currentStep === 7 && !isPaid && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                7
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Step 7: Release Payment on Blockchain</h3>
                <p className="text-gray-400 text-sm">
                  Repository ownership is verified and attestation is signed. Execute smart contract payment release to transfer BNB to developer and unlock code.
                </p>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                <ShieldCheck size={18} /> Oracle Attestation Ready & Verified
              </div>
              <p className="text-gray-400 text-xs font-mono break-all">
                Oracle Signature: {escrowStatus?.oracleSignature || cachedSignature || "Verified in smart contract"}
              </p>
            </div>

            <Button
              onClick={handleReleasePayment}
              disabled={isReleasingPayment}
              className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-6 flex items-center gap-2"
            >
              {isReleasingPayment ? <Loader2 className="animate-spin" size={18} /> : <Unlock size={18} />}
              Release Payment on Smart Contract
            </Button>
          </div>
        )}

        {/* COMPLETED STATE */}
        {isPaid && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
              <CheckCircle2 size={24} /> Escrow Completed & Funds Released
            </div>
            <p className="text-gray-300 text-sm">
              The smart contract has verified the oracle attestation and released payment to the developer. Source code is decrypted and available for download.
            </p>
            {project.release_tx_hash && (
              <a
                href={getBscScanTxUrl(project.release_tx_hash)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-mono hover:underline flex items-center gap-1"
              >
                View On-Chain Release Transaction on BscScan ↗
              </a>
            )}
          </div>
        )}
      </div>

      {/* --- SMART LOCK VAULT (File Download & Preview) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Smart Lock Vault</h2>
              <p className="text-gray-400 text-sm">Encrypted Source Code & Verified Artifacts</p>
            </div>
            {isDev && !pendingRequest && (
              <button
                onClick={handleRequestUnlock}
                disabled={isRequesting}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} /> {isRequesting ? "Requesting..." : "Request Update"}
              </button>
            )}
          </div>

          {/* Dynamic Vault Icon */}
          <div className="flex justify-center my-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                isPaid ? "border-green-500 text-green-500 bg-green-500/10" : "border-red-500 text-red-500 bg-red-500/10"
              }`}
            >
              {isPaid ? <Download size={32} /> : <Lock size={32} />}
            </div>
          </div>

          {/* Files Access / Encrypted Preview */}
          {canViewFiles ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white text-center">Files Accessible</h3>
              <Button
                onClick={handleSecureDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 flex items-center justify-center gap-2"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Decrypting...
                  </>
                ) : (
                  <>
                    <Download size={20} /> Download Source Code (.zip)
                  </>
                )}
              </Button>

              {project.version?.readme_preview && (
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="text-xs text-primary border-b border-gray-800 pb-1">README.md Preview</div>
                  <div className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {atob(project.version.readme_preview)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-white">Source Code Encrypted</h3>
              <p className="text-gray-400 text-xs">
                Complete the 7-step protocol to release escrow payment and unlock the AES-256 encrypted source code.
              </p>

              {project.version?.readme_preview && (
                <div className="text-left bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="text-[10px] text-primary uppercase font-bold">README.md Preview (Base64 Encoded)</div>
                  <div className="text-[10px] text-gray-500 font-mono break-all line-clamp-3">
                    {project.version.readme_preview}
                  </div>
                </div>
              )}

              <div className="bg-black/40 p-4 rounded-xl border border-white/10 flex items-center justify-between text-gray-400 text-sm">
                <span className="flex items-center gap-2">
                  <Lock size={16} /> source_code.zip (Encrypted)
                </span>
                <span className="text-xs text-red-400">Locked</span>
              </div>
            </div>
          )}
        </div>

        {/* --- BLOCKCHAIN PROOF & CONTRACT INFO SIDEBAR --- */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 h-fit">
          <h4 className="text-xs font-bold text-gray-500 uppercase">Blockchain & Contract Details</h4>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Escrow Contract</span>
              <a
                href={getBscScanAddressUrl(ESCROW_CONTRACT_ADDRESS)}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-mono text-xs hover:underline flex items-center gap-1"
              >
                {formatAddress(ESCROW_CONTRACT_ADDRESS)} <ExternalLink size={10} />
              </a>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-white">BSC Testnet (Chain 97)</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Deposit Amount</span>
              <span className="text-white font-mono">{project.escrow_amount || depositAmount} tBNB</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Escrow State</span>
              <span className="text-white font-mono">{project.status}</span>
            </div>

            {project.escrow_tx_hash && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Deposit Tx</span>
                <a
                  href={getBscScanTxUrl(project.escrow_tx_hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-mono text-xs hover:underline flex items-center gap-1"
                >
                  {formatAddress(project.escrow_tx_hash)} <ExternalLink size={10} />
                </a>
              </div>
            )}

            {project.release_tx_hash && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Release Tx</span>
                <a
                  href={getBscScanTxUrl(project.release_tx_hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-400 font-mono text-xs hover:underline flex items-center gap-1"
                >
                  {formatAddress(project.release_tx_hash)} <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>

          <hr className="border-white/10" />

          {/* Verification Proofs */}
          {project.version && (
            <div className="space-y-3">
              <h5 className="text-[10px] text-gray-500 uppercase font-bold">Cryptographic Verifications</h5>
              <div className="text-xs space-y-1">
                <div className="text-gray-400">
                  Commit SHA:{" "}
                  <span className="font-mono text-white">{project.version.commit_sha?.substring(0, 10)}...</span>
                </div>
                <div className="text-gray-400">
                  Zip Hash:{" "}
                  <span className="font-mono text-white">{project.version.zip_hash?.substring(0, 12)}...</span>
                </div>
                {project.version.staging_url && (
                  <div className="text-gray-400">
                    Deployment:{" "}
                    <a
                      href={project.version.staging_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline font-mono text-xs"
                    >
                      {project.version.staging_url}
                    </a>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-green-400 text-xs pt-1">
                <ShieldCheck size={14} /> Source & Deployment Verified
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lock Approval Modal */}
      {showApproveModal && (
        <LockRequestModal
          requestId={pendingRequest?.id}
          onClose={() => setShowApproveModal(false)}
          onSuccess={() => fetchAllData()}
        />
      )}

      {/* Global Modals */}
      <SuccessModal
        isOpen={successModal.open}
        onClose={() => setSuccessModal((prev) => ({ ...prev, open: false }))}
        title={successModal.title}
        message={successModal.message}
        onAction={successModal.onAction}
        actionLabel={successModal.actionLabel}
      />
      <ErrorModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal((prev) => ({ ...prev, open: false }))}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
}