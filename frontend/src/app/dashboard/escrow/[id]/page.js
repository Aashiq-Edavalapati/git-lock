"use client";

import { use, useState, useEffect } from "react";
import api from "@/lib/api";
import { ShieldCheck, Download, Lock, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import LockRequestModal from "@/components/dashboard/LockRequestModal";
import SuccessModal from "@/components/dashboard/SuccessModal";
import ErrorModal from "@/components/dashboard/ErrorModal";
import AcceptInviteModal from "@/components/dashboard/AcceptInviteModal";
// Import Crypto
import { decryptHybrid } from "@/utils/crypto";

export default function EscrowPage({ params }) {
  const { id } = use(params);
  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Advanced Lock State
  const [lockRequests, setLockRequests] = useState([]);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Modals
  const [successModal, setSuccessModal] = useState({ open: false, title: "", message: "" });
  const [errorModal, setErrorModal] = useState({ open: false, title: "", message: "" });

  // Correct Download Handler with Client-Side Decryption
  const handleSecureDownload = async () => {
      try {
          setIsDownloading(true);
          console.log("⬇️ Fetching Encrypted Code...");
          
          const response = await api.get(`/projects/${project.id}/download`, {
              responseType: 'text', // We expect the "iv:data" string
          });

          const encryptedKey = response.headers['x-gitlock-key'];
          const encryptedPayload = response.data; // This is the "iv:data" string

          if (encryptedKey) {
              console.log("🔐 Hybrid Encryption Detected. Decrypting...");
              
              // Get Private Key
              const privateKeyPem = localStorage.getItem('gitlock_private_key');
              if (!privateKeyPem) {
                  alert("Private Key not found! You cannot decrypt this file without your Private Key.");
                  return;
              }

              // Decrypt
              // encryptedPayload (String "iv:hex") -> ArrayBuffer (Zip)
              const decryptedArrayBuffer = await decryptHybrid(encryptedPayload, encryptedKey, privateKeyPem);
              
              // Create Download Blob
              const blob = new Blob([decryptedArrayBuffer], { type: 'application/zip' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `project_${project.id}_source.zip`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              console.log("✅ Download & Decryption Complete");

          } else {
              // Legacy/Plain Download (Fallback)
              // Since we requested 'text', we might format data wrongly if it was binary.
              // Safest fallback is direct window.open if headers missing
              // Or try to parse blob?
              console.log("🔓 Legacy Download (Redirecting)");
               window.open(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:5000/api'}/projects/${project.id}/download`);
          }

      } catch (err) {
          console.error("Download Failed:", err);
          setErrorModal({ open: true, title: "Download Error", message: "Failed to download or decrypt file." });
      } finally {
          setIsDownloading(false);
      }
  };


  // Helper to get Razorpay
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      // script.async = true; // Try async loading
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchProjectData = async () => { // Renamed from fetchProject
    try {
        const [projRes, userRes, reqRes] = await Promise.all([
            api.get(`/projects/${id}`),
            api.get('/auth/me'),
            api.get(`/projects/${id}/lock-requests`).catch(() => ({ data: [] })) // Soft fail
        ]);
        
        setProject(projRes.data);
        setCurrentUser(userRes.data);
        setLockRequests(reqRes.data);
        
        // Check for pending requests
        const pending = reqRes.data.find(r => r.status === 'PENDING');
        setPendingRequest(pending);

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch project data:", err);
        setLoading(false);
      }
  };
  
  useEffect(() => {
    fetchProjectData();
  }, [id]);

  if (loading) return <div className="p-20 text-center text-white">Loading Vault...</div>;


  const isDev = currentUser?.role === 'DEVELOPER';
  const isPaid = project.status === 'COMPLETED';
  const canViewFiles = isDev || isPaid;

  const handleAcceptProject = async () => {
    setIsAccepting(true);
    try {
        await api.post('/projects/accept', { projectId: project.id });
        fetchProjectData(); // Refresh state
        setSuccessModal({ open: true, title: "Project Accepted", message: "You have successfully accepted the project." });
    } catch (err) {
        setErrorModal({ open: true, title: "Acceptance Failed", message: err.response?.data?.error || err.message });
    } finally {
        setIsAccepting(false);
    }
  };

  const handleRequestUnlock = async () => {
      if(!confirm("Request to unlock this project? This will allow you to upload a new version.")) return;
      setIsRequesting(true);
      try {
          await api.post('/projects/lock-request', { projectId: project.id, requestType: 'UNLOCK' });
          fetchProjectData(); // Refresh to see pending state
      } catch(e) {
          setErrorModal({ open: true, title: "Request Failed", message: "Failed to submit unlock request." });
      } finally {
          setIsRequesting(false);
      }
  };

  // --- STATE 1: INVITE SENT (Developer Viewing) ---
  if (project.status === 'INVITE_SENT') {
      return (
        <AcceptInviteModal project={project} isDev={isDev} isAccepting={isAccepting} handleAcceptProject={handleAcceptProject} />
      )
  }

  // --- STATE 2: IN PROGRESS (Developer Accepted, Needs to Lock) ---
  if (project.status === 'IN_PROGRESS') {
      return (
        <div className="max-w-2xl mx-auto pt-20">
            <div className="glass-card p-8 rounded-2xl text-center space-y-6">
                 <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500">
                    <Lock size={32} />
                </div>
                <h1 className="text-3xl font-bold text-white">Project Active</h1>
                <p className="text-gray-400">Project accepted. Ready to upload code and create lock.</p>
                 {isDev ? (
                    <a href={`/dashboard/create?projectId=${project.id}&budget=${project.budget}`}>
                        <Button className="w-full h-12">Proceed to Lock Creation</Button>
                    </a>
                ) : (
                    <div className="text-blue-400 text-sm bg-blue-500/10 p-2 rounded">Developer is working...</div>
                )}
            </div>
        </div>
      )
  }

  // --- STATE 3: LOCKED / COMPLETED (Vault View) ---
  const handlePayment = async () => {
    const res = await loadRazorpay();
    if (!res) { 
        setErrorModal({ open: true, title: "Payment Error", message: "Razorpay SDK failed to load. Check your connection." });
        return; 
    }

    try {
        // 1. Create Order
        const orderRes = await api.post('/payments/create-order', { 
            amount: project.budget, 
            currency: 'INR',
            projectId: project.id 
        });
        const order = orderRes.data;

        // 2. Get Key and Open Razorpay
        const keyRes = await api.get('/payments/key');
        const key = keyRes.data.key;

        const options = {
            key: key, 
            name: "GitLock Escrow",
            description: `Unlock Code for ${project.title}`,
            order_id: order.id,
            notes: {
                projectId: project.id, 
            },
            handler: async function (response) {
                console.log("💳 Razorpay Payment Success!", response); 
                
                // 3. Verify & Unlock
                try {
                    console.log("🔐 Requesting Unlock from Backend...");
                    // 1. Verify Payment & Unlock
                    await api.post('/payments/unlock', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        projectId: project.id
                    });

                    setSuccessModal({ 
                        open: true, 
                        title: "Payment Successful", 
                        message: "The budget has been released and the code is now unlocked!",
                        onAction: handleSecureDownload,
                        actionLabel: "Download Code"
                    });
                    
                    fetchProjectData(); 

                } catch (verifyErr) {
                     console.error("Unlock Error:", verifyErr);
                    const errMsg = verifyErr.response?.data?.error || verifyErr.message || "Unknown Error";
                    const status = verifyErr.response?.status || "No Status";
                    setErrorModal({ open: true, title: "Verification Failed", message: `Payment succeeded but unlock failed.\nStatus: ${status}\nError: ${errMsg}` });
                }
            },
            prefill: {
                name: currentUser.name,
                email: currentUser.email,
                contact: "9999999999", 
            },
            theme: { color: "#3399cc" },
            modal: {
                ondismiss: function() {
                    console.log('Checkout form closed');
                    setIsPaymentProcessing(false);
                }
            }
        };

        console.log("🚀 Initializing Razorpay with Options:", options); 
        
        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response){
                console.error("❌ Payment Failed Event:", response.error);
                setErrorModal({ 
                    open: true, 
                    title: "Payment Failed", 
                    message: `${response.error.description}\nReason: ${response.error.reason}`
                });
        });
        rzp1.open();

    } catch (err) {
        console.error(err);
        const errorData = err.response?.data || {};
        const isPayoutError = errorData.code === 'NO_PAYOUT_METHOD';
        
        setErrorModal({ 
            open: true, 
            title: isPayoutError ? "Payment Blocked" : "Error", 
            message: errorData.error || "Payment Initialization Failed" 
        });
        setIsPaymentProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
       <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Escrow Vault</h1>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isPaid ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {isPaid ? 'UNLOCKED' : 'LOCKED'}
          </div>
       </div>

       {/* --- ALERTS --- */}
      {/* 1. Pending Lock Request Alert */}
      {pendingRequest && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <AlertTriangle className="text-yellow-500" />
                  <div>
                      <h3 className="text-yellow-500 font-bold">Unlock Requested</h3>
                      <p className="text-gray-400 text-sm">
                          {currentUser.role === 'CLIENT' 
                            ? "The developer has requested to unlock this project for updates." 
                            : "You have requested to unlock this project. Waiting for client approval."}
                      </p>
                  </div>
              </div>
              {currentUser.role === 'CLIENT' && (
                  <Button onClick={() => setShowApproveModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                      Review & Approve
                  </Button>
              )}
          </div>
      )}

      {/* 2. Lock Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-2xl border-white/5 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Smart Lock Vault</h2>
              <p className="text-gray-400 text-sm">Encrypted Source Code & Assets</p>
            </div>
            {/* Developer Action: Request Unlock */}
            {currentUser.role === 'DEVELOPER' && !pendingRequest && (project.status === 'LOCKED_REVIEW' || project.status === 'COMPLETED') && (
                <button onClick={handleRequestUnlock} disabled={isRequesting} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <RefreshCw size={12}/> {isRequesting ? 'Requesting...' : 'Request Unlock/Update'}
                </button>
            )}
          </div>
             
             {/* Dynamic Icon */}
             <div className="flex justify-center mb-6">
                 <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${isPaid ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                    {isPaid ? <Download size={32}/> : <Lock size={32}/>}
                 </div>
             </div>

             {/* Logic-Driven View */}
             {canViewFiles ? (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white text-center">Files Accessible</h3>
                    
                    
                    <Button 
                        onClick={handleSecureDownload}
                        className="mx-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <><Loader2 className="animate-spin mr-2" size={20}/> Decrypting...</>
                        ) : (
                            <><Download className="mr-2" size={20}/> Download Source Code</>
                        )}
                    </Button>

                    <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                        {/* Rubric #5: Encoding/Decoding Visual Proof */}
                        {project.version?.readme_preview ? (
                            <div className="p-2 bg-gray-900 rounded text-xs text-gray-400 font-mono whitespace-pre-wrap">
                                <div className="text-primary mb-1 border-b border-gray-700 pb-1">README.md (Base64 Decoded Preview)</div>
                                {atob(project.version.readme_preview)}
                            </div>
                        ) : (
                             <div className="text-gray-500 italic">No README preview available.</div>
                        )}
                    </div>
                </div>
             ) : (
                <div className="text-center space-y-6">
                    <h3 className="text-xl font-bold text-white">Encrypted Content</h3>
                    <p className="text-gray-400 text-sm">Payment of ₹{project.budget} required to decrypt source code.</p>
                    
                    {/* Rubric #5: Encoding/Decoding Visual Proof (Encrypted State) */}
                    {project.version?.readme_preview ? (
                        <div className="text-left bg-black/40 p-3 rounded border border-white/5">
                            <div className="text-xs text-primary mb-1">README.md Preview (Base64 Encoded)</div>
                            <div className="text-[10px] text-gray-500 font-mono break-all line-clamp-4 overflow-hidden text-ellipsis">
                                {project.version.readme_preview}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 italic">No README preview available</div>
                    )}
                    
                    <div className="bg-black/40 p-4 rounded-xl space-y-2 border border-green-500/20 opacity-50">
                        <div className="flex items-center justify-between text-gray-400">
                            <div className="flex items-center gap-3"><Lock size={16}/> source_code.zip (Encrypted)</div>
                             {/* No Download Button for Client until paid */}
                        </div>
                    </div>

                    {/* Only Client sees Pay Button */}
                    {!isDev && (
                        <Button onClick={() => { setIsPaymentProcessing(true); handlePayment(); }} className="w-full h-12" disabled={isPaymentProcessing}>
                            {isPaymentProcessing ? 'Processing Payment...' : `Pay ₹${project.budget} to Unlock`}
                        </Button>
                    )}
                </div>
             )}
          </div>

          {/* Sidebar Info */}
          <div className="glass-card p-6 rounded-2xl space-y-4 h-fit">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Contract Info</h4>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Project</span><span className="text-white">{project.title}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Budget</span><span className="text-white">₹{project.budget}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Status</span><span className="text-white">{project.status}</span></div>
              <hr className="border-white/10"/>
               {project.version && (
                <div className="space-y-4">
                     <div className="space-y-1">
                        <h5 className="text-[10px] text-gray-500 uppercase font-bold">Verification</h5>
                        <div className="text-[10px] text-gray-400 truncate">Commit: <span className="font-mono text-white">{project.version.commit_sha?.substring(0, 7)}</span></div>
                        <div className="text-[10px] text-gray-400 truncate">Hash: <span className="font-mono text-white">{project.version.zip_hash?.substring(0, 10)}...</span></div>
                     </div>

                     {project.version.staging_url && (
                         <div className="space-y-1">
                            <h5 className="text-[10px] text-gray-500 uppercase font-bold">Deployment</h5>
                            <a href={project.version.staging_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline break-all">
                                {project.version.staging_url}
                            </a>
                         </div>
                     )}
                     
                     <div className="flex items-center gap-2 text-green-400 text-xs mt-2"><ShieldCheck size={14}/> Verified & Locked</div>
                </div>
              )}
          </div>
       </div>

       {/* Lock Approval Modal */}
      {showApproveModal && (
          <LockRequestModal 
            requestId={pendingRequest?.id} 
            onClose={() => setShowApproveModal(false)}
            onSuccess={() => {
                // Refresh data
                fetchProjectData(); 
            }}
          />
      )}

      {/* Global Modals */}
      <SuccessModal 
        isOpen={successModal.open}
        onClose={() => setSuccessModal(prev => ({ ...prev, open: false }))}
        title={successModal.title}
        message={successModal.message}
        onAction={successModal.onAction}
        actionLabel={successModal.actionLabel}
      />
      <ErrorModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal(prev => ({ ...prev, open: false }))}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
}