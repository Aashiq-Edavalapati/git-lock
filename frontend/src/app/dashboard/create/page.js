"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Github, Upload, Lock, ArrowRight, CheckCircle2, 
  FileArchive, Loader2, AlertCircle, UserPlus, Mail
} from "lucide-react";
import Button from "@/components/ui/Button";

// Wrapper for Suspense (Required for useSearchParams in Next.js App Router)
export default function CreateLockPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading Context...</div>}>
       <CreateLockForm />
    </Suspense>
  )
}

function CreateLockForm() {
  const searchParams = useSearchParams();
  
  // Context from URL (Simulating DB fetch based on Project ID)
  const contextProjectId = searchParams.get("projectId");
  const contextClientName = searchParams.get("client");

  // If context exists, start at Step 2 (Skip Client Connect)
  const [step, setStep] = useState(contextProjectId ? 2 : 1);
  const [file, setFile] = useState(null);
  
  // Client State
  const [clientEmail, setClientEmail] = useState("");
  const [isClientFound, setIsClientFound] = useState(!!contextProjectId); // Auto-found if context exists
  const [searchingClient, setSearchingClient] = useState(false);

  // GitHub Verification State
  const [repoStatus, setRepoStatus] = useState("idle");

  const handleVerifyClient = () => {
    if (!clientEmail) return;
    setSearchingClient(true);
    setTimeout(() => {
        setSearchingClient(false);
        setIsClientFound(true);
    }, 1500);
  };

  const handleVerifyGit = () => {
    setRepoStatus("loading");
    setTimeout(() => setRepoStatus("success"), 2000);
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Progress Bar */}
      <div className="mb-12 flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500" 
          style={{ width: `${((step - 1) / 3) * 100}%` }} 
        />
        
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className={`flex flex-col items-center gap-2 ${step >= num ? 'text-white' : 'text-gray-600'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-[#050505] ${step >= num ? 'border-primary text-primary shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'border-white/10 text-gray-600'}`}>
              {step > num ? <CheckCircle2 size={18} /> : num === 1 ? <UserPlus size={18} /> : num === 2 ? <Github size={18} /> : num === 3 ? <Upload size={18} /> : <Lock size={18} />}
            </div>
            <span className="text-[10px] font-medium tracking-wider uppercase hidden sm:block">
              {num === 1 ? "Client" : num === 2 ? "Binding" : num === 3 ? "Vault" : "Terms"}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: The Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CLIENT CONNECTION (Only shown if no context) */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card p-8 rounded-2xl"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <UserPlus className="text-primary" /> Connect Client
                </h2>
                <div className="space-y-6">
                  <p className="text-sm text-gray-400">Who is this code for?</p>
                  <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input 
                            type="email" 
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="client@company.com" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-10 focus:border-primary/50 outline-none text-white" 
                        />
                      </div>
                      <Button variant="outline" onClick={handleVerifyClient} disabled={searchingClient || isClientFound}>
                        {searchingClient ? <Loader2 className="animate-spin" /> : "Connect"}
                      </Button>
                  </div>
                  {isClientFound && (
                    <div className="p-4 bg-white/5 border border-primary/30 rounded-xl flex items-center gap-4 animate-in fade-in">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                        <div><h4 className="font-bold text-white">Ad-hoc Client</h4><p className="text-xs text-green-400">Verified</p></div>
                    </div>
                  )}
                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleNext} disabled={!isClientFound}>Next Step <ArrowRight size={16} /></Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: GITHUB */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card p-8 rounded-2xl"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Github className="text-primary" /> Repository Binding
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-gray-400">Commit SHA</label>
                    <div className="flex gap-3 mt-2">
                      <input type="text" placeholder="Full 40-char SHA" className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none" />
                      <Button variant="outline" onClick={handleVerifyGit} disabled={repoStatus !== 'idle'}>
                         {repoStatus === 'loading' ? <Loader2 className="animate-spin"/> : repoStatus === 'success' ? <CheckCircle2 className="text-primary"/> : "Verify"}
                      </Button>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-between">
                    <button onClick={() => !contextProjectId && setStep(1)} disabled={!!contextProjectId} className={`text-gray-400 ${!contextProjectId && 'hover:text-white'}`}>Back</button>
                    <Button onClick={handleNext} disabled={repoStatus !== 'success'}>Next Step <ArrowRight size={16} /></Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: FILE UPLOAD */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card p-8 rounded-2xl"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Upload className="text-primary" /> Secure Vault
                </h2>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center hover:bg-white/5 cursor-pointer relative">
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
                   {!file ? <p className="text-gray-400">Drop source_code.zip</p> : <p className="text-primary font-bold">{file.name}</p>}
                </div>
                <div className="pt-6 flex justify-between">
                    <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white">Back</button>
                    <Button onClick={handleNext} disabled={!file}>Next Step <ArrowRight size={16} /></Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CONFIRM */}
            {step === 4 && (
               <motion.div 
                 key="step4"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="glass-card p-8 rounded-2xl"
               >
                 <h2 className="text-2xl font-bold mb-6">Payment Terms</h2>
                 <p className="text-gray-400 mb-6">Linked to project budget. Terms are pre-agreed.</p>
                 <Button className="w-full bg-primary text-black font-bold h-12">Generate Final Lock</Button>
                 <div className="pt-4 text-center">
                    <button onClick={() => setStep(3)} className="text-gray-400 hover:text-white text-sm">Back</button>
                 </div>
               </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* RIGHT: Context Panel */}
        <div className="hidden lg:block space-y-6">
           <div className="glass-card p-6 rounded-xl border-t border-t-primary">
              <h3 className="font-bold mb-2 text-white">Context</h3>
              <p className="text-sm text-gray-400 mb-4">
                 {contextProjectId ? "Resumed from Active Workspace." : "Manual Setup Mode."}
              </p>
              {(isClientFound || contextClientName) && (
                <div className="flex items-center gap-2 text-xs bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {(contextClientName || "C").charAt(0)}
                    </div>
                    <div>
                        <p className="text-white font-bold">{contextClientName || "Connected Client"}</p>
                        <p className="text-green-400">Verified</p>
                    </div>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}