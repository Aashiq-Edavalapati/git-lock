"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Github, Upload, Lock, ArrowRight, CheckCircle2, FileArchive, Loader2, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";


export default function CreateLockPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
       <CreateLockForm />
    </Suspense>
  )
}

import api from "@/lib/api";

function CreateLockForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const projectId = searchParams.get("projectId");
  const budget = searchParams.get("budget");

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  // Github Details
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [commitHash, setCommitHash] = useState("");
  
  const [repoStatus, setRepoStatus] = useState("idle");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!projectId) return <div className="text-white text-center p-20">Access Denied</div>;

  const handleVerifyGit = () => {
    // In real app, we might ping an endpoint to check if commit exists, 
    // but for now we trust the dev to input correctly or rely on backend to reject.
    if(repoOwner && repoName && commitHash) {
        setRepoStatus("loading");
        setTimeout(() => setRepoStatus("success"), 1000);
    } else {
        alert("Please fill all fields");
    }
  };

  const handleCreateLock = async () => {
    setIsProcessing(true);
    
    try {
        const formData = new FormData();
        formData.append("projectId", projectId);
        formData.append("stagingUrl", "https://demo-deploy.com"); // MOCK URL for now
        formData.append("repoOwner", repoOwner);
        formData.append("repoName", repoName);
        formData.append("commitHash", commitHash);
        formData.append("sourceCode", file);

        await api.post('/projects/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Redirect to the vault view
        router.push(`/dashboard/escrow/${projectId}`);
    } catch (err) {
        console.error(err);
        alert("Upload Failed: " + (err.response?.data?.error || err.message));
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar (Visual only for brevity) */}
      <div className="flex justify-between items-center mb-12 px-20">
         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step>=1 ? 'bg-primary text-black' : 'bg-white/10'}`}>1</div>
         <div className="h-1 flex-1 bg-white/10 mx-4" />
         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step>=2 ? 'bg-primary text-black' : 'bg-white/10'}`}>2</div>
         <div className="h-1 flex-1 bg-white/10 mx-4" />
         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step>=3 ? 'bg-primary text-black' : 'bg-white/10'}`}>3</div>
      </div>

      <div className="glass-card p-8 rounded-2xl max-w-2xl mx-auto">
         {step === 1 && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">1. Link Commit</h2>
                <div className="grid grid-cols-2 gap-4">
                    <input className="bg-black/50 border border-white/10 p-3 rounded text-white" placeholder="Repo Owner (e.g. facebook)" value={repoOwner} onChange={e => setRepoOwner(e.target.value)} />
                    <input className="bg-black/50 border border-white/10 p-3 rounded text-white" placeholder="Repo Name (e.g. react)" value={repoName} onChange={e => setRepoName(e.target.value)} />
                </div>
                <input className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" placeholder="Commit SHA" value={commitHash} onChange={e => setCommitHash(e.target.value)} />
                <Button onClick={handleVerifyGit} disabled={repoStatus==='loading'} variant="outline">Verify</Button>
                {repoStatus === 'success' && <div className="text-green-400 text-sm">Git Details Verified (Simulated).</div>}
                <div className="flex justify-end"><Button onClick={() => setStep(2)} disabled={repoStatus!=='success'}>Next</Button></div>
            </div>
         )}

         {step === 2 && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">2. Upload Source Zip</h2>
                <div className="border-2 border-dashed border-white/20 p-10 rounded-xl text-center">
                    <input type="file" className="text-white" accept=".zip" onChange={e => setFile(e.target.files[0])} />
                </div>
                <div className="flex justify-between"><button className="text-gray-400" onClick={() => setStep(1)}>Back</button><Button onClick={() => setStep(3)} disabled={!file}>Next</Button></div>
            </div>
         )}

         {step === 3 && (
            <div className="space-y-6 text-center">
                <h2 className="text-2xl font-bold text-white">3. Confirm Lock</h2>
                <div className="bg-white/5 p-4 rounded text-left space-y-2">
                    <p className="text-gray-400 text-sm">Value: <span className="text-white">{budget}</span></p>
                    <p className="text-gray-400 text-sm">File: <span className="text-white">{file?.name}</span></p>
                    <p className="text-gray-400 text-sm">SHA: <span className="text-primary font-mono">{commitHash.substring(0,8)}...</span></p>
                </div>
                <Button className="w-full" onClick={handleCreateLock} disabled={isProcessing}>{isProcessing ? "Encrypting..." : "Generate Lock"}</Button>
            </div>
         )}
      </div>
    </div>
  );
}