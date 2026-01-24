"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Github, Upload, Lock, ArrowRight, CheckCircle2, 
  FileArchive, Loader2, AlertCircle, AlertTriangle 
} from "lucide-react";
import Button from "@/components/ui/Button";

// Suspense Wrapper required for searchParams
export default function CreateLockPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading Context...</div>}>
       <CreateLockForm />
    </Suspense>
  )
}

function CreateLockForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Context from URL
  const contextProjectId = searchParams.get("projectId");
  const contextClientName = searchParams.get("client");
  const contextBudget = searchParams.get("budget");

  // Step State (Starts at 1 = GitHub Binding)
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  
  // Validation States
  const [repoStatus, setRepoStatus] = useState("idle");
  const [shaInput, setShaInput] = useState("");
  const [shaError, setShaError] = useState("");
  const [fileError, setFileError] = useState("");

  // --- ACCESS CONTROL CHECK ---
  if (!contextProjectId) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
                <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400 mb-8">
                You cannot create a lock without an active Client Project. Please go back to your dashboard and accept an invite first.
            </p>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
    );
  }

  // --- HANDLERS ---
  const handleVerifyGit = () => {
    // Validate SHA (40 hex chars)
    const shaRegex = /^[0-9a-f]{40}$/i;
    if (!shaRegex.test(shaInput)) {
        setShaError("Invalid Commit SHA format (must be 40 hex characters)");
        setRepoStatus("error");
        return;
    }
    setShaError("");
    setRepoStatus("loading");
    // Simulate API Check
    setTimeout(() => setRepoStatus("success"), 2000);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    // Validate File Type (must be zip)
    if (!uploadedFile.name.endsWith('.zip') && !uploadedFile.name.endsWith('.tar.gz')) {
        setFileError("Only .zip or .tar.gz archives are accepted.");
        setFile(null);
        return;
    }
    // Validate Size (e.g. max 50MB)
    if (uploadedFile.size > 50 * 1024 * 1024) {
        setFileError("File exceeds 50MB limit.");
        setFile(null);
        return;
    }

    setFileError("");
    setFile(uploadedFile);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Progress Bar (Reduced to 3 Technical Steps) */}
      <div className="mb-12 flex justify-between items-center relative max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10 rounded-full" />
        <div className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        
        {[1, 2, 3].map((num) => (
          <div key={num} className={`flex flex-col items-center gap-2 ${step >= num ? 'text-white' : 'text-gray-600'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-[#050505] ${step >= num ? 'border-primary text-primary shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'border-white/10 text-gray-600'}`}>
              {step > num ? <CheckCircle2 size={18} /> : num === 1 ? <Github size={18} /> : num === 2 ? <Upload size={18} /> : <Lock size={18} />}
            </div>
            <span className="text-[10px] font-medium tracking-wider uppercase">{num === 1 ? "Binding" : num === 2 ? "Vault" : "Confirm"}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Form */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: GITHUB */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-card p-8 rounded-2xl bg-[#0a0a0a]">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Github className="text-primary" /> Repository Binding</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-gray-400">Commit SHA</label>
                    <div className="flex gap-3 mt-2">
                      <input 
                        type="text" 
                        placeholder="e.g. 7b3f1k2..." 
                        className={`flex-1 bg-black/40 border rounded-lg p-3 text-white outline-none font-mono ${shaError ? 'border-red-500' : 'border-white/10'}`} 
                        value={shaInput}
                        onChange={(e) => setShaInput(e.target.value)}
                      />
                      <Button variant="outline" onClick={handleVerifyGit} disabled={repoStatus === 'loading' || repoStatus === 'success'}>
                         {repoStatus === 'loading' ? <Loader2 className="animate-spin"/> : repoStatus === 'success' ? <CheckCircle2 className="text-primary"/> : "Verify"}
                      </Button>
                    </div>
                    {shaError && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle size={10}/> {shaError}</p>}
                    {repoStatus === 'success' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-sm text-green-400">
                           <CheckCircle2 size={16} /> Verified: Linked to live deployment.
                        </motion.div>
                    )}
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleNext} disabled={repoStatus !== 'success'}>Next Step <ArrowRight size={16} /></Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: FILE UPLOAD */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-card p-8 rounded-2xl bg-[#0a0a0a]">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Upload className="text-primary" /> Secure Vault</h2>
                <div className="space-y-4">
                    <div className={`border-2 border-dashed rounded-xl p-12 text-center hover:bg-white/5 cursor-pointer relative transition-all ${fileError ? 'border-red-500' : 'border-white/10 hover:border-primary/50'}`}>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} accept=".zip,.tar.gz" />
                        {!file ? (
                            <>
                                <Upload className="mx-auto text-gray-500 mb-4" />
                                <p className="text-gray-400">Drop source_code.zip</p>
                                <p className="text-xs text-gray-600 mt-2">Max 50MB. Encrypted locally.</p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FileArchive className="text-primary w-12 h-12 mb-2" />
                                <p className="text-white font-bold">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        )}
                    </div>
                    {fileError && <p className="text-xs text-red-500 flex items-center gap-1 justify-center"><AlertCircle size={10}/> {fileError}</p>}
                </div>
                <div className="pt-6 flex justify-between">
                    <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white">Back</button>
                    <Button onClick={handleNext} disabled={!file}>Next Step <ArrowRight size={16} /></Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONFIRM */}
            {step === 3 && (
               <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-card p-8 rounded-2xl bg-[#0a0a0a]">
                 <h2 className="text-2xl font-bold mb-6">Confirm Lock</h2>
                 <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Client</span>
                        <span className="text-white font-bold">{contextClientName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Escrow Value</span>
                        <span className="text-primary font-bold">{contextBudget}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">File</span>
                        <span className="text-gray-300 font-mono">{file?.name}</span>
                    </div>
                 </div>
                 <div className="pt-6 space-y-4">
                     <Button className="w-full bg-primary text-black font-bold h-12 hover:scale-[1.02]">Generate Final Lock</Button>
                     <button onClick={() => setStep(2)} className="w-full text-gray-500 hover:text-white text-sm">Back</button>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Fixed Context Panel */}
        <div className="hidden lg:block space-y-6">
           <div className="glass-card p-6 rounded-xl border-t-2 border-t-primary bg-[#0a0a0a]">
              <h3 className="font-bold mb-2 text-white">Project Context</h3>
              <p className="text-sm text-gray-400 mb-4">You are creating a lock for an active agreement.</p>
              
              <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{contextClientName?.charAt(0)}</div>
                        <div>
                            <p className="text-white font-bold">{contextClientName}</p>
                            <p className="text-green-400">Verified Client</p>
                        </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">₹</div>
                        <div>
                            <p className="text-white font-bold">{contextBudget}</p>
                            <p className="text-gray-400">Agreed Budget</p>
                        </div>
                  </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}