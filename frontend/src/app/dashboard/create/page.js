"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Github, Upload, Lock, ArrowRight, CheckCircle2, FileArchive, Loader2, AlertTriangle, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import ErrorModal from "@/components/dashboard/ErrorModal";
import api from "@/lib/api";

// Helper constants
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

// Main Page Component with Suspense
export default function CreateLockPage() {
  return (
    <Suspense fallback={<div className="text-white p-10 text-center">Loading Lock Creator...</div>}>
       <CreateLockForm />
    </Suspense>
  )
}

function CreateLockForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projectId, setProjectId] = useState(searchParams.get("projectId") || null);
  const [budget, setBudget] = useState(searchParams.get("budget") || "0"); // Default 0 if selecting later

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  
  // Github Details
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [commitSha, setcommitSha] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [repoStatus, setRepoStatus] = useState("idle"); // idle, loading, success, error
  const [verificationError, setVerificationError] = useState(""); // Store specific error message
  
  // Repo Selection State
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [needsGithubConnection, setNeedsGithubConnection] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Error Modal State
  const [errorModal, setErrorModal] = useState({ open: false, title: "", message: "", action: null, actionLabel: "" });

  // Project Selection State (if no projectId)
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!projectId) {
        setLoadingProjects(true);
        api.get('/projects').then(res => {
            // Filter: Only projects that Developer is part of AND DO NOT HAVE A LOCK (status === 'IN_PROGRESS' or 'INVITE_SENT' but likely IN_PROGRESS if they are creating lock)
            // Actually, we usually only allow creating lock if status is IN_PROGRESS.
            const validProjects = res.data.filter(p => p.status === 'IN_PROGRESS' || p.status === 'INVITE_SENT'); // INVITE_SENT technically shouldn't be here if dev is logged in as dev but safe to filter.
            // Explicitly exclude LOCKED_REVIEW and COMPLETED
            const unlockedProjects = validProjects.filter(p => p.status !== 'LOCKED_REVIEW' && p.status !== 'COMPLETED');
            
            setAvailableProjects(unlockedProjects);
            setLoadingProjects(false);
        }).catch(() => setLoadingProjects(false));
    }
  }, [projectId]);

  const filteredProjects = availableProjects.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- ACTIONS ---

  const connectGithub = () => {
      const callbackUrl = `${FRONTEND_URL}/auth/github/callback`;
      // state=connect signals that we want to LINK the account, not log in a new user
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${callbackUrl}&scope=user:email repo&state=connect`;
  };

  const fetchRepos = async () => {
      setLoadingRepos(true);
      setShowRepoModal(true);
      setNeedsGithubConnection(false);
      try {
          const res = await api.get('/github/repos');
          setRepos(res.data);
      } catch (err) {
          console.error(err);
          setNeedsGithubConnection(true);
      } finally {
          setLoadingRepos(false);
      }
  };

  const selectRepo = (full_name) => {
      const [owner, name] = full_name.split('/');
      setRepoOwner(owner);
      setRepoName(name);
      setShowRepoModal(false);
      // Reset status on new repo selection
      setRepoStatus("idle");
  };

  const handleInputEdit = (setter) => (e) => {
      setter(e.target.value);
      if (repoStatus === 'success' || repoStatus === 'error') {
          setRepoStatus('idle');
          setVerificationError("");
      }
  };

  const handleVerifyGit = async () => {
    if(repoOwner && repoName && commitSha && stagingUrl) {
         // Frontend Validation
         if (!/^[0-9a-f]{40}$/.test(commitSha)) {
            setVerificationError("Commit SHA must be exactly 40 hexadecimal characters.");
            setRepoStatus("error");
            return;
         }

        setRepoStatus("loading");
        try {
            setRepoStatus("loading");
            setVerificationError(""); // Clear previous errors
            await api.post('/projects/verify-details', {
                projectId, repoOwner, repoName, commitSha: commitSha, stagingUrl
            });
            setRepoStatus("success");
            // alert("Verification Successful!");
        } catch (err) {
            setRepoStatus("error");
            console.error(err);
            const errMsg = err.response?.data?.error || "Unknown Error";
            setVerificationError(errMsg);
            // alert(`Verification Failed: ${errMsg}`); // Removed alert in favor of UI message
        }
    } else {
        setVerificationError("Please fill all fields");
        setRepoStatus("error");
    }
  };

  const handleCreateLock = async () => {
    setIsProcessing(true);
    try {
        const formData = new FormData();
        formData.append("projectId", projectId);
        formData.append("stagingUrl", stagingUrl); 
        formData.append("repoOwner", repoOwner);
        formData.append("repoName", repoName);
        formData.append("commitSha", commitSha);
        formData.append("sourceCode", file);

        await api.post('/projects/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        router.push(`/dashboard/escrow/${projectId}`);
    } catch (err) {
        console.error(err);
        setIsProcessing(false);
        const errorMsg = err.response?.data?.error || err.message;
        
        // Check for specific mismatch errors to offer "Go Back" action
        const isMismatch = errorMsg.includes("Mismatch") || errorMsg.includes("Hash");
        
        setErrorModal({
            open: true,
            title: "Lock Creation Failed",
            message: errorMsg,
            actionLabel: isMismatch ? "Back to Upload" : null,
            action: isMismatch ? () => { setErrorModal(prev => ({...prev, open: false})); setStep(2); } : null
        });
    }
  };

  // if (!projectId) return <div className="text-white text-center p-20">Access Denied</div>; -> Removed this blocking check
  
  if (!projectId) {
      return (
          <div className="max-w-4xl mx-auto space-y-8 p-8">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Select Project</h1>
                    <p className="text-gray-400">Choose a project to create a lock for.</p>
                 </div>
                 <input 
                    type="text" 
                    placeholder="Search projects..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white w-64 focus:border-primary/50 outline-none"
                 />
              </div>
              
              {loadingProjects ? <div className="text-gray-400">Loading projects...</div> : 
               filteredProjects.length === 0 ? <div className="text-gray-500 py-10 text-center border border-dashed border-white/10 rounded-xl">No eligible projects found.</div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredProjects.map(p => (
                          <button key={p.id} onClick={() => {
                              setProjectId(p.id);
                              setBudget(p.budget);
                          }} className="glass-card p-6 rounded-xl border border-white/5 hover:border-primary/50 transition-all text-left group">
                              <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">{p.title}</h3>
                              <p className="text-gray-400 text-sm">₹{p.budget} • {p.status}</p>
                          </button>
                      ))}
                  </div>
               )
              }
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* --- MODAL --- */}
      {showRepoModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
              <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-white">Select Repository</h3>
                      <button onClick={() => setShowRepoModal(false)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {loadingRepos ? <div className="p-4 text-center text-gray-400">Loading...</div> : 
                       needsGithubConnection ? (
                           <div className="p-8 text-center space-y-4">
                               <p className="text-gray-400">Please connect your GitHub account to access your repositories.</p>
                               <Button onClick={connectGithub} className="bg-[#24292F] hover:bg-[#24292F]/90 text-white flex items-center gap-2 mx-auto">
                                   <Github size={18} />
                                   Connect GitHub
                               </Button>
                           </div>
                       ) :
                       repos.length === 0 ? <div className="p-4 text-center text-gray-400">No repositories found.</div> :
                       repos.map(repo => (
                           <button key={repo.id} onClick={() => selectRepo(repo.full_name)} className="w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10">
                               <div className="font-semibold text-primary">{repo.name}</div>
                               <div className="text-xs text-gray-400">{repo.full_name}</div>
                           </button>
                       ))
                      }
                  </div>
              </div>
          </div>
      )}

      {/* --- STEPS HEADER --- */}
      <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -z-10" />
          <div className="flex justify-between px-20">
              {[1, 2, 3].map(s => (
                  <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all font-bold ${step >= s ? 'bg-primary border-primary text-black' : 'bg-black border-white/10 text-gray-500'}`}>
                      {step > s ? <Check size={16} /> : s}
                  </div>
              ))}
          </div>
      </div>

      <div className="glass-card p-8 rounded-2xl border-white/5 bg-white/[0.02]">
         
         {/* STEP 1: GIT DETAILS */}
         {step === 1 && (
             <div className="space-y-6">
                 <div>
                     <h3 className="text-xl font-bold mb-4 text-white">1. Link Repository</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-sm text-gray-400">Repository Owner</label>
                                <button type="button" onClick={fetchRepos} className="text-xs text-primary hover:underline flex items-center gap-1">
                                    <Github size={10} /> Select from Github
                                </button>
                             </div>
                             <input type="text" placeholder="e.g. facebook" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-primary/50" 
                                value={repoOwner} onChange={handleInputEdit(setRepoOwner)} />
                        </div>
                        <div>
                             <label className="text-sm text-gray-400 block mb-2">Repository Name</label>
                             <input type="text" placeholder="e.g. react" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-primary/50" 
                                value={repoName} onChange={handleInputEdit(setRepoName)} />
                        </div>
                        <div className="col-span-2">
                             <label className="text-sm text-gray-400 block mb-2">Commit SHA (Full Hash)</label>
                             <input type="text" placeholder="e.g. 5237b7..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-primary/50" 
                                value={commitSha} onChange={handleInputEdit(setcommitSha)} />
                        </div>
                        <div className="col-span-2">
                             <label className="text-sm text-gray-400 block mb-2">Staging URL</label>
                             <input type="text" placeholder="https://..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-primary/50" 
                                value={stagingUrl} onChange={handleInputEdit(setStagingUrl)} />
                        </div>
                     </div>
                 </div>

                 <div className="flex items-center justify-between pt-4">
                     <Button onClick={handleVerifyGit} disabled={repoStatus==='loading'} variant="outline" className="border-white/20 hover:bg-white/5">
                        {repoStatus === 'loading' ? <Loader2 className="animate-spin" size={18} /> : 'Verify Deployment'}
                     </Button>
                     
                     {repoStatus === 'success' && <div className="text-green-400 text-sm font-medium flex items-center gap-2"><CheckCircle2 size={16}/> Verification Successful</div>}
                     {repoStatus === 'error' && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-3 max-w-sm">
                            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-300">
                                <span className="font-bold block mb-1">Verification Failed</span>
                                {verificationError}
                            </div>
                        </div>
                     )}
                     
                     <Button onClick={() => setStep(2)} disabled={repoStatus!=='success'}>
                         Next Step <ArrowRight size={16} className="ml-2"/>
                     </Button>
                 </div>
             </div>
         )}

         {/* STEP 2: SOURCE CODE */}
         {step === 2 && (
             <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-white">2. Upload Source Zip</h2>
                 <p className="text-gray-400 text-sm">Upload the source code corresponding to the verified commit. This will be encrypted and stored.</p>
                 
                 <div 
                    className="border-2 border-dashed border-white/20 p-12 rounded-xl text-center hover:border-primary/50 transition-colors bg-white/[0.02]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile.name.endsWith('.zip')) {
                                setFile(droppedFile);
                            } else {
                                alert("Please upload a .zip file");
                            }
                        }
                    }}
                 >
                     <input type="file" id="file-upload" className="hidden" accept=".zip" onChange={e => setFile(e.target.files[0])} />
                     <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                         <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-primary">
                             <Upload size={32} />
                         </div>
                         <div className="space-y-1">
                             <p className="font-medium text-white text-lg">{file ? file.name : "Click to upload or Drag & Drop .zip"}</p>
                             {!file && <p className="text-sm text-gray-500">Maximum size: 50MB</p>}
                         </div>
                     </label>
                 </div>

                 <div className="flex justify-between pt-4">
                     <button className="text-gray-400 hover:text-white" onClick={() => setStep(1)}>Back</button>
                     <Button onClick={() => setStep(3)} disabled={!file}>Review & Lock</Button>
                 </div>
             </div>
         )}

         {/* STEP 3: CONFIRM */}
         {step === 3 && (
             <div className="space-y-8 text-center">
                 <div className="w-20 h-20 bg-primary/20 text-primary rounded-full mx-auto flex items-center justify-center">
                     <Lock size={40} />
                 </div>
                 
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Ready to Lock?</h2>
                    <p className="text-gray-400">The payout of <span className="text-white font-bold">{budget}</span> will be released when you deliver the key.</p>
                 </div>

                 <div className="bg-white/5 p-6 rounded-xl text-left space-y-3 border border-white/10">
                     <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-gray-400">Repository</span>
                         <span className="text-white font-mono">{repoOwner}/{repoName}</span>
                     </div>
                     <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-gray-400">Commit</span>
                         <span className="text-primary font-mono">{commitSha.substring(0,8)}...</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-gray-400">Source File</span>
                         <span className="text-white">{file?.name}</span>
                     </div>
                 </div>

                 <Button className="w-full h-12 text-lg" onClick={handleCreateLock} disabled={isProcessing}>
                     {isProcessing ? (
                         <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin"/> Encrypting & Locking...</span>
                     ) : (
                         "Generate Smart Lock"
                     )}
                 </Button>
                 
                 <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white text-sm" disabled={isProcessing}>
                     Go Back
                 </button>
             </div>
         )}
      </div>
      
      <ErrorModal 
         isOpen={errorModal.open} 
         onClose={() => setErrorModal(prev => ({ ...prev, open: false }))}
         title={errorModal.title}
         message={errorModal.message}
         actionLabel={errorModal.actionLabel}
         onAction={errorModal.action}
      />
    </div>
  );
}