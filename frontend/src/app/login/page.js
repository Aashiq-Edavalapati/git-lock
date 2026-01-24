"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Github, Mail, ArrowRight, Code2, UserCircle2, 
  ShieldCheck, Lock, CheckCircle2 
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [role, setRole] = useState("developer"); // 'developer' | 'client' (only for signup)
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate Auth
    setTimeout(() => {
        setIsLoading(false);
        window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* --- LEFT: BRANDING & VISUALS --- */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#050505] overflow-hidden border-r border-white/5">
         {/* Background FX */}
         <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
         </div>

         <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
                <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_var(--primary)]" />
                GitLock
            </Link>
         </div>

         <div className="relative z-10 space-y-8 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight">
               Trust is good. <br/>
               <span className="text-primary">Code is better.</span>
            </h1>
            <p className="text-gray-400 text-lg">
               Join 5,000+ developers and agencies using GitLock to secure payments and verify software delivery.
            </p>
            
            <div className="space-y-4 pt-4">
               <FeatureRow icon={ShieldCheck} text="Bank-grade AES-256 Encryption" />
               <FeatureRow icon={Github} text="Verified Commit History" />
               <FeatureRow icon={Lock} text="Smart Escrow Contracts" />
            </div>
         </div>

         <div className="relative z-10 text-xs text-gray-600">
            © 2026 GitLock Inc. Secure Protocol.
         </div>
      </div>

      {/* --- RIGHT: AUTH FORM --- */}
      <div className="flex items-center justify-center p-6 bg-black relative">
         <div className="w-full max-w-md space-y-8">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
               <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                  <div className="w-2 h-2 bg-primary rounded-full" /> GitLock
               </Link>
            </div>

            <div className="text-center">
               <h2 className="text-3xl font-bold text-white mb-2">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
               </h2>
               <p className="text-gray-400 text-sm">
                  {mode === 'signin' ? 'Enter your credentials to access your vault.' : 'Start securing your code transactions today.'}
               </p>
            </div>

            {/* Form Container */}
            <div className="glass-card p-8 rounded-2xl border-white/5 bg-white/[0.02]">
               
               {/* Role Selector (Signup Only) */}
               <AnimatePresence>
                  {mode === 'signup' && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 overflow-hidden"
                     >
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">I am a...</label>
                        <div className="grid grid-cols-2 gap-3">
                           <button 
                              type="button"
                              onClick={() => setRole('developer')}
                              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'developer' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}
                           >
                              <Code2 size={20} />
                              <span className="text-sm font-bold">Developer</span>
                           </button>
                           <button 
                              type="button"
                              onClick={() => setRole('client')}
                              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'client' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}
                           >
                              <UserCircle2 size={20} />
                              <span className="text-sm font-bold">Client</span>
                           </button>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>

               <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                     <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                        <input type="text" placeholder="John Doe" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none transition-colors" />
                     </div>
                  )}
                  
                  <div>
                     <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-500" size={16} />
                        <input type="email" placeholder="you@example.com" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-primary/50 outline-none transition-colors" />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                     <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
                        <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-primary/50 outline-none transition-colors" />
                     </div>
                  </div>

                  <Button className="w-full h-12 text-base" disabled={isLoading}>
                     {isLoading ? 'Authenticating...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                  </Button>
               </form>

               <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0b0b0b] px-2 text-gray-500">Or continue with</span></div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors">
                     <Github size={18} /> GitHub
                  </button>
                  <button className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors">
                     <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.98h5.36c-.23 1.25-.92 2.31-1.95 3.01v2.5h3.13c1.83-1.69 2.89-4.17 2.89-7.05c0-.68-.07-1.34-.19-1.97zM12.18 21c2.58 0 4.75-.85 6.34-2.31l-3.13-2.5c-.86.58-1.96.92-3.21.92c-2.48 0-4.57-1.67-5.32-3.92H3.71v2.46C5.35 18.91 8.52 21 12.18 21zM6.86 13.19c-.19-.58-.3-1.2-.3-1.84s.11-1.26.3-1.84V7.05H3.71C2.33 9.79 2.33 13.06 3.71 15.8l3.15-2.61zM12.18 5.25c1.4 0 2.66.49 3.65 1.43l2.73-2.73C16.93 2.39 14.71 1.45 12.18 1.45C8.52 1.45 5.35 3.54 3.71 6.3l3.15 2.61c.75-2.25 2.84-3.92 5.32-3.92z"/></svg>
                     Google
                  </button>
               </div>
            </div>

            <div className="text-center">
               <button 
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
               >
                  {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <span className="text-primary font-bold hover:underline">
                     {mode === 'signin' ? 'Sign Up' : 'Log In'}
                  </span>
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-gray-300">
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary">
         <Icon size={16} />
      </div>
      <span className="font-medium">{text}</span>
    </div>
  )
}