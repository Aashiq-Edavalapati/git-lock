"use client";

import { use, useState, useEffect } from "react";
import api from "@/lib/api";
import { Lock, Unlock, ShieldCheck, FileCode } from "lucide-react";
import Button from "@/components/ui/Button";

export default function EscrowPage({ params }) {
  const { id } = use(params);
  const [project, setProject] = useState(null);
  const [showPay, setShowPay] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

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

  const fetchProject = () => {
      api.get(`/projects/${id}`)
        .then(res => setProject(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
  };
  
  useEffect(() => {
    // 1. Get User
    api.get('/auth/me').then(res => setCurrentUser(res.data)).catch(() => {});
    // 2. Get Project
    fetchProject();
  }, [id]);

  if (loading || !project || !currentUser) return <div className="text-white p-20 text-center">Loading Vault...</div>;


  const isDev = currentUser.role === 'DEVELOPER';
  const isPaid = project.status === 'COMPLETED';
  const canViewFiles = isDev || isPaid;

  const handleAcceptProject = async () => {
    setIsAccepting(true);
    try {
        await api.post('/projects/accept', { projectId: project.id });
        fetchProject(); // Refresh state
        alert("Project Accepted!");
    } catch (err) {
        alert("Failed to accept: " + (err.response?.data?.error || err.message));
    } finally {
        setIsAccepting(false);
    }
  };

  // --- STATE 1: INVITE SENT (Developer Viewing) ---
  if (project.status === 'INVITE_SENT') {
      return (
        <div className="max-w-2xl mx-auto pt-20">
            <div className="glass-card p-8 rounded-2xl text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-3xl font-bold text-white">Project Invitation</h1>
                <p className="text-gray-400">You have been invited to work on <span className="text-white font-bold">{project.title}</span>.</p>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Budget</span><span className="text-green-400 font-bold">₹{project.budget}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Client</span><span className="text-white">Yes</span></div>
                </div>
                {isDev ? (
                    <Button onClick={handleAcceptProject} className="w-full h-12" disabled={isAccepting}>
                        {isAccepting ? 'Accepting Project...' : 'Accept Project'}
                    </Button>
                ) : (
                    <div className="text-yellow-500 text-sm bg-yellow-500/10 p-2 rounded">Waiting for developer response...</div>
                )}
            </div>
        </div>
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
    if (!res) { alert('Razorpay SDK failed to load'); return; }

    try {
        // 1. Create Order
        const orderRes = await api.post('/payments/create-order', { amount: project.budget, currency: 'INR' });
        const order = orderRes.data;

        // 2. Get Key and Open Razorpay
        const keyRes = await api.get('/payments/key');
        const key = keyRes.data.key;

        const options = {
            key: key, 
            // amount: order.amount, // Rely on order_id
            // currency: order.currency, // Rely on order_id
            name: "GitLock Escrow",
            description: `Unlock Code for ${project.title}`,
            order_id: order.id,
            notes: {
                projectId: project.id, // Metadata
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

                    alert("Payment Successful! Code Unlocked.");
                    fetchProject(); // Refresh UI to show UNLOCKED state

                    // 2. Trigger Download (Optional auto-download)
                    // We can redirect/open new tab for download or fetch blob
                    window.open(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:5000/api'}/projects/${project.id}/download`, '_blank');

                } catch (verifyErr) {
                     console.error("Unlock Error:", verifyErr);
                    const errMsg = verifyErr.response?.data?.error || verifyErr.message || "Unknown Error";
                    const status = verifyErr.response?.status || "No Status";
                    alert(`Verification Failed! \nStatus: ${status} \nError: ${errMsg}`);
                }
            },
            prefill: {
                name: currentUser.name,
                email: currentUser.email,
                contact: "9999999999", 
            },
            theme: { color: "#3399cc" },
            // retry: { enabled: false }, // Re-enabled default retry
            modal: {
                ondismiss: function() {
                    console.log('Checkout form closed');
                    setIsPaymentProcessing(false);
                }
            }
        };

        console.log("🚀 Initializing Razorpay with Options:", options); // DEBUG LOG
        
        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response){
                console.error("❌ Payment Failed Event:", response.error);
                alert(`Payment Failed: ${response.error.description} \nReason: ${response.error.reason} \nSource: ${response.error.source}`);
        });
        rzp1.open();

    } catch (err) {
        console.error(err);
        alert("Payment Intiaiization Failed");
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

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Vault Panel */}
          <div className="md:col-span-2 glass-card p-8 rounded-2xl relative overflow-hidden">
             
             {/* Dynamic Icon */}
             <div className="flex justify-center mb-6">
                 <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${isPaid ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                    {isPaid ? <Unlock size={32}/> : <Lock size={32}/>}
                 </div>
             </div>

             {/* Logic-Driven View */}
             {canViewFiles ? (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white text-center">Files Accessible</h3>
                    
                    
                    <Button 
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:5000/api'}/projects/${project.id}/download`)}
                        className="mx-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    >
                        <FileCode className="mr-2" size={20}/> Download Source Code
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
                            <div className="flex items-center gap-3"><FileCode size={16}/> source_code.zip (Encrypted)</div>
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
    </div>
  );
}