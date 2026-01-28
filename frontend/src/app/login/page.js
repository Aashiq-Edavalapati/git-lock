"use client";

import { useState } from "react";
import { Github, Mail, Lock, Code2, UserCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/lib/api"; // Real API

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "", otp: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Login, 2: MFA
  const [userId, setUserId] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        if (res.data.mfaRequired) {
            setUserId(res.data.userId);
            setStep(2); // Move to MFA
        }
    } catch (err) {
        setError(err.response?.data?.error || "Login Failed");
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
        const res = await api.post('/auth/verify-mfa', { userId, otp: formData.otp });
        console.log("Logged in:", res.data);
        window.location.href = "/dashboard";
    } catch (err) {
         setError(err.response?.data?.error || "Invalid OTP");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel (Visuals) */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#050505] overflow-hidden border-r border-white/5">
         <div className="absolute inset-0">
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-white">
                <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_var(--primary)]" />
                GitLock
            </div>
         </div>
         <div className="relative z-10 space-y-8 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight text-white">
               Trust is good. <br/>
               <span className="text-primary">Code is better.</span>
            </h1>
            <div className="space-y-4 pt-4">
               <FeatureRow icon={ShieldCheck} text="Bank-grade AES-256 Encryption" />
               <FeatureRow icon={Github} text="Verified Commit History" />
               <FeatureRow icon={Lock} text="Smart Escrow Contracts" />
            </div>
         </div>
         <div className="relative z-10 text-xs text-gray-600">© 2026 GitLock Inc.</div>
      </div>

      {/* Right Panel (Login) */}
      <div className="flex items-center justify-center p-6 bg-black">
         <div className="w-full max-w-md space-y-8">
            <div className="text-center">
               <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
               <p className="text-gray-400 text-sm">Sign in to your vault.</p>
            </div>

            <div className="glass-card p-8 rounded-2xl border-white/5 bg-white/[0.02]">
               
               {step === 1 ? (
                   <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                         <input 
                            type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
                         />
                      </div>
                      <div>
                         <input 
                            type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
                         />
                      </div>
                      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
                      <Button className="w-full h-12" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Secure Login'}</Button>
                   </form>
               ) : (
                   <form onSubmit={handleVerifyMfa} className="space-y-4">
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-center">
                            <p className="text-sm text-primary mb-2">Check the Backend Console for OTP</p>
                            <div className="text-xs text-gray-500">(Real email sending is simulated in this lab)</div>
                        </div>
                        <div>
                         <label className="text-gray-400 text-sm mb-1 block">Enter 6-Digit OTP</label>
                         <input 
                            type="text" placeholder="000000" value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-center text-2xl tracking-[0.5em] text-white focus:border-primary/50 outline-none font-mono"
                            maxLength={6}
                         />
                      </div>
                      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
                      <Button className="w-full h-12" disabled={isLoading}>{isLoading ? 'Verifying OTP...' : 'Verify Identity'}</Button>
                   </form>
               )}
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
               Don't have an account? <a href="/register" className="text-white hover:underline font-medium">Create one</a>
            </div>
         </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-gray-300">
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary"><Icon size={16} /></div>
      <span className="font-medium">{text}</span>
    </div>
  )
}