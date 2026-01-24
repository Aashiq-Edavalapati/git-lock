"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Github, Mail, Lock, Code2, UserCircle2, 
  ShieldCheck, AlertCircle, CheckCircle2 
} from "lucide-react";
import Button from "@/components/ui/Button";
import { login } from "@/lib/auth"; // Import the helper

export default function LoginPage() {
  const [mode, setMode] = useState("signin");
  const [role, setRole] = useState("developer");
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let newErrors = {};
    // Email Regex
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    // Password Strength
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    // Name (Signup only)
    if (mode === 'signup' && formData.name.length < 2) {
      newErrors.name = "Please enter your full name.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    
    // Simulate Network Request
    setTimeout(() => {
        // Save session using our helper
        login(formData.email, role, formData.name || "User");
        setIsLoading(false);
        // Force redirect to dashboard
        window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* LEFT: Branding (Unchanged Visuals) */}
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

      {/* RIGHT: Auth Form */}
      <div className="flex items-center justify-center p-6 bg-black relative">
         <div className="w-full max-w-md space-y-8">
            <div className="text-center">
               <h2 className="text-3xl font-bold text-white mb-2">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
               </h2>
               <p className="text-gray-400 text-sm">
                  {mode === 'signin' ? 'Access your secure vault.' : 'Secure your code transactions.'}
               </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border-white/5 bg-white/[0.02]">
               
               {/* Role Toggle */}
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
                           <button type="button" onClick={() => setRole('developer')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'developer' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}>
                              <Code2 size={20} /><span className="text-sm font-bold">Developer</span>
                           </button>
                           <button type="button" onClick={() => setRole('client')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'client' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}>
                              <UserCircle2 size={20} /><span className="text-sm font-bold">Client</span>
                           </button>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>

               <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                     <div>
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            className={`w-full bg-black/40 border rounded-lg p-3 text-white outline-none transition-colors ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-primary/50'}`}
                            value={formData.name}
                            onChange={(e) => {setFormData({...formData, name: e.target.value}); setErrors({...errors, name: ''})}}
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.name}</p>}
                     </div>
                  )}
                  
                  <div>
                     <input 
                        type="email" 
                        placeholder="Email Address" 
                        className={`w-full bg-black/40 border rounded-lg p-3 text-white outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-primary/50'}`}
                        value={formData.email}
                        onChange={(e) => {setFormData({...formData, email: e.target.value}); setErrors({...errors, email: ''})}}
                     />
                     {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.email}</p>}
                  </div>

                  <div>
                     <input 
                        type="password" 
                        placeholder="Password" 
                        className={`w-full bg-black/40 border rounded-lg p-3 text-white outline-none transition-colors ${errors.password ? 'border-red-500' : 'border-white/10 focus:border-primary/50'}`}
                        value={formData.password}
                        onChange={(e) => {setFormData({...formData, password: e.target.value}); setErrors({...errors, password: ''})}}
                     />
                     {errors.password && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.password}</p>}
                  </div>

                  <Button className="w-full h-12 text-base" disabled={isLoading}>
                     {isLoading ? (
                        <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> Processing...</span>
                     ) : (
                        mode === 'signin' ? 'Sign In' : 'Create Account'
                     )}
                  </Button>
               </form>
               
               <div className="text-center mt-6">
                  <button onClick={() => {setMode(mode === 'signin' ? 'signup' : 'signin'); setErrors({})}} className="text-sm text-gray-400 hover:text-white transition-colors">
                     {mode === 'signin' ? "New to GitLock? " : "Already have an account? "}
                     <span className="text-primary font-bold hover:underline">{mode === 'signin' ? 'Sign Up' : 'Log In'}</span>
                  </button>
               </div>
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