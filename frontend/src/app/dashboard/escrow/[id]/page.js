"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Unlock, Github, ExternalLink, Download, 
  CheckCircle2, Clock, FileCode, ShieldCheck, Copy
} from "lucide-react";
import Button from "@/components/ui/Button";
import PaymentModal from "@/components/dashboard/PaymentModal";

export default function EscrowContractPage({ params }) {
  // --- MOCK STATE ---
  const [role, setRole] = useState("client"); // 'client' | 'developer'
  const [contractStatus, setContractStatus] = useState("LOCKED"); // 'LOCKED' | 'PAID'
  const [showPayment, setShowPayment] = useState(false);

  // Contract Details (Mock)
  const contract = {
    id: params.id || "GIT-8X29-2026",
    title: "E-Commerce MVP Frontend",
    amount: "₹50,000",
    dev: "Aashiq Edavalapati",
    commitHash: "a4f8...9x2",
    commitMsg: "feat: implemented razorpay integration and final cart logic",
    deployUrl: "https://gitlock-demo.vercel.app",
    uploadTime: "2 hours ago"
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setContractStatus("PAID");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* --- DEV TOGGLE (FOR DEMO) --- */}
      <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
         <div className="text-xs text-gray-500 font-mono px-2">CONTRACT ID: {contract.id}</div>
         <div className="flex gap-2">
            <button onClick={() => setRole("client")} className={`text-xs px-3 py-1 rounded-full ${role === 'client' ? 'bg-primary text-black font-bold' : 'text-gray-400'}`}>View as Client</button>
            <button onClick={() => setRole("developer")} className={`text-xs px-3 py-1 rounded-full ${role === 'developer' ? 'bg-primary text-black font-bold' : 'text-gray-400'}`}>View as Dev</button>
         </div>
      </div>

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <h1 className="text-3xl font-bold text-white">{contract.title}</h1>
             <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${contractStatus === 'LOCKED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                {contractStatus === 'LOCKED' ? <Lock size={12}/> : <Unlock size={12}/>}
                {contractStatus === 'LOCKED' ? 'ESCROW LOCKED' : 'PAYMENT RELEASED'}
             </span>
          </div>
          <p className="text-gray-400 text-sm">
            Developed by <span className="text-white font-medium">{contract.dev}</span> • Uploaded {contract.uploadTime}
          </p>
        </div>
        
        {/* Main Action Button */}
        <div>
          {contractStatus === 'LOCKED' ? (
             role === 'client' ? (
                <Button onClick={() => setShowPayment(true)} className="h-12 px-8 text-lg shadow-[0_0_20px_var(--primary-glow)] animate-pulse">
                   Unlock & Pay {contract.amount}
                </Button>
             ) : (
                <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/20">
                   <Clock size={18} />
                   <span className="font-bold">Waiting for Payment</span>
                </div>
             )
          ) : (
             <Button variant="success" className="h-12 px-8 text-lg bg-green-500 hover:bg-green-400 text-black">
                <Download size={20} className="mr-2"/> Download Source
             </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* --- LEFT: DEPLOYMENT PROOF --- */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* The Deployment Card */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
               <div className="bg-[#111] p-4 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     Live Deployment Verified
                  </div>
                  <a href={contract.deployUrl} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                     Open in new tab <ExternalLink size={12} />
                  </a>
               </div>
               
               {/* Mock Browser Window */}
               <div className="relative bg-[#050505] aspect-video flex flex-col items-center justify-center group">
                  {/* Iframe Placeholder */}
                  <div className="text-center space-y-4">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
                        <ShieldCheck size={32} className="text-green-500" />
                     </div>
                     <h3 className="text-xl font-bold text-white">Verification Successful</h3>
                     <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        We have verified that the code in the vault generates the exact deployment at <span className="text-gray-300">{contract.deployUrl}</span>.
                     </p>
                     <Button variant="outline" className="mt-4">
                        View Deployment Preview
                     </Button>
                  </div>
               </div>
            </div>

            {/* Commit Details */}
            <div className="glass-card p-6 rounded-2xl">
               <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Github size={18} /> Source Integrity
               </h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                     <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Commit Hash</p>
                        <p className="font-mono text-primary">{contract.commitHash}</p>
                     </div>
                     <CheckCircle2 className="text-green-500" size={20} />
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                     <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Commit Message</p>
                     <p className="text-gray-300 italic">"{contract.commitMsg}"</p>
                  </div>
               </div>
            </div>
         </div>

         {/* --- RIGHT: THE VAULT --- */}
         <div className="space-y-6">
            <div className={`glass-card p-8 rounded-3xl relative overflow-hidden transition-all duration-500 ${contractStatus === 'LOCKED' ? 'border-red-500/20' : 'border-green-500/30'}`}>
               
               {/* Vault Status Icon */}
               <div className="flex justify-center mb-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${contractStatus === 'LOCKED' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
                     {contractStatus === 'LOCKED' ? <Lock size={40} /> : <Unlock size={40} />}
                  </div>
               </div>

               <h3 className="text-2xl font-bold text-center mb-2">
                  {contractStatus === 'LOCKED' ? 'Files Encrypted' : 'Files Unlocked'}
               </h3>
               <p className="text-center text-sm text-gray-500 mb-8">
                  {contractStatus === 'LOCKED' 
                     ? "Source code is secured with AES-256. Payment is required to generate the decryption key."
                     : "Decryption successful. You now have full access to the source code repository."
                  }
               </p>

               {/* File Preview List */}
               <div className="space-y-2 mb-8">
                  {['src/app/page.js', 'src/components/Navbar.jsx', 'package.json'].map((file, i) => (
                     <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5">
                        <FileCode size={16} className="text-gray-500" />
                        <span className={`text-sm font-mono ${contractStatus === 'LOCKED' ? 'blur-[3px] select-none text-gray-600' : 'text-gray-300'}`}>
                           {file}
                        </span>
                        {contractStatus === 'LOCKED' && <Lock size={12} className="ml-auto text-gray-700" />}
                     </div>
                  ))}
                  <div className="text-center text-xs text-gray-600 mt-2">+ 24 other files hidden</div>
               </div>

               {/* Action (Redundant but good for UX) */}
               {contractStatus === 'PAID' && (
                  <div className="space-y-3">
                     <Button className="w-full bg-green-500 text-black hover:bg-green-400">Download .ZIP</Button>
                     <button className="w-full py-2 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2">
                        <Copy size={14} /> Copy Repository URL
                     </button>
                  </div>
               )}

               {/* Background Glow */}
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] -z-10 ${contractStatus === 'LOCKED' ? 'bg-red-500/10' : 'bg-green-500/20'}`} />
            </div>

            {/* Escrow Details */}
            <div className="glass-card p-6 rounded-2xl">
               <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4">Escrow Summary</h4>
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                     <span className="text-gray-500">Agreed Amount</span>
                     <span className="text-white">{contract.amount}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-500">Platform Fee</span>
                     <span className="text-white">1%</span>
                  </div>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between font-bold text-lg">
                     <span className="text-white">Total</span>
                     <span className="text-primary">{contract.amount}</span>
                  </div>
               </div>
            </div>
         </div>

      </div>

      {/* --- PAYMENT MODAL --- */}
      <AnimatePresence>
        {showPayment && (
          <PaymentModal 
             amount={contract.amount} 
             onClose={() => setShowPayment(false)} 
             onSuccess={handlePaymentSuccess} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}