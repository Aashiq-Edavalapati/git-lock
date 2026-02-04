"use client";

import { useState, Suspense } from "react";
import { Github, Mail, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import OTPInput from "@/components/ui/OTPInput";
import ResendOTP from "@/components/ui/ResendOTP";
import PasswordInput from "@/components/ui/PasswordInput";
import api from "@/lib/api"; 
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useAuthRedirect from "@/hooks/useAuthRedirect";

// 1. Get these from Environment Variables (Instructions below)
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}

function LoginForm() {
  const { isLoading: authLoading } = useAuthRedirect(true);
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: "", password: "", otp: "" });
  const [role, setRole] = useState("CLIENT"); // Default role
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Login, 2: MFA
  const [userId, setUserId] = useState(null);

  if (authLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        if (res.data.mfaRequired) {
            setUserId(res.data.userId);
            setStep(2); 
        } else {
            // Direct login (if MFA disabled)
            window.location.href = "/dashboard";
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
        await api.post('/auth/verify-mfa', { userId, otp: formData.otp });
        window.location.href = "/dashboard";
    } catch (err) {
         setError(err.response?.data?.error || "Invalid OTP");
    } finally {
        setIsLoading(false);
    }
  }

  // 2. Exact Redirect Logic
  const handleSocialLogin = (provider) => {
      // Save role to localStorage so callback page can use it
      localStorage.setItem('oauth_role', role);

      const callbackUrl = `${FRONTEND_URL}/auth/${provider}/callback`;
        const encodedRedirectUri = encodeURIComponent(callbackUrl);

        if (provider === 'github') {
            window.location.href =
                `https://github.com/login/oauth/authorize` +
                `?client_id=${GITHUB_CLIENT_ID}` +
                `&redirect_uri=${encodedRedirectUri}` +
                `&scope=user:email repo`;
        } else {
            window.location.href =
                `https://accounts.google.com/o/oauth2/v2/auth` +
                `?client_id=${GOOGLE_CLIENT_ID}` +
                `&redirect_uri=${encodedRedirectUri}` +
                `&response_type=code` +
                `&scope=email profile`;
        }

  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel (Kept your existing beautiful styling) */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#050505] overflow-hidden border-r border-white/5">
         <div className="absolute inset-0">
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
         </div>
         <div className="relative z-10">
            <Link href="/" className="inline-block">
                <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-white cursor-pointer hover:opacity-90 transition">
                <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_var(--primary)]" />
                GitLock
                </div>
            </Link>
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

      {/* Right Panel */}
      <div className="flex items-center justify-center p-6 bg-black">
         <div className="w-full max-w-md space-y-8">
            <div className="text-center">
               <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
               <p className="text-gray-400 text-sm">Sign in to your vault.</p>
            </div>

            <div className="glass-card p-8 rounded-2xl border-white/5 bg-white/[0.02]">
               {step === 1 ? (
                   <form onSubmit={handleLogin} className="space-y-4">
                      {/* Inputs kept same as your code... */}
                      <div>
                         <input 
                            type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
                         />
                      </div>
                      
                       <div>
                          <PasswordInput 
                             value={formData.password} 
                             onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                          <div className="flex justify-end mt-2">
                             <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                         </div>
                      </div>
                      
                      <RoleSelector role={role} setRole={setRole} />

                       {/* Message from Middleware */}
                       {searchParams.get("message") && (
                           <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-2 text-sm text-blue-400 mb-4">
                               <AlertCircle size={16} />
                               {searchParams.get("message")}
                           </div>
                       )}

                      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
                      <Button className="w-full h-12" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Secure Login'}</Button>
                      
                      <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-gray-500">Or continue with</span></div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <SocialLoginButton icon={Github} text="Github" onClick={() => handleSocialLogin('github')} />
                          <SocialLoginButton icon={Mail} text="Google" onClick={() => handleSocialLogin('google')} /> 
                      </div>

                       <p className="text-center text-gray-400 text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-primary hover:underline font-medium">
                                Register now
                            </Link>
                        </p>
                   </form>
               ) : (
                   <form onSubmit={handleVerifyMfa} className="space-y-4">
                        {/* MFA Form kept same... */}
                         <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-center">
                             <p className="text-sm text-primary mb-2">Check your mail for OTP</p>
                         </div>
                         <div>
                          <label className="text-gray-400 text-sm mb-1 block text-center">Enter 6-Digit OTP</label>
                          <OTPInput 
                             length={6}
                             value={formData.otp}
                             onChange={(otp) => setFormData({...formData, otp})}
                             className="mb-2"
                          />
                       </div>
                      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
                      <Button onClick={handleVerifyMfa} className="w-full h-12" disabled={isLoading}>{isLoading ? 'Verifying OTP...' : 'Verify Identity'}</Button>
                      
                      <ResendOTP onResend={async () => await api.post('/auth/resend-login-otp', { userId })} />
                   </form>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

// Helper components
function FeatureRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-gray-300">
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary"><Icon size={16} /></div>
      <span className="font-medium">{text}</span>
    </div>
  )
}

function SocialLoginButton({ icon: Icon, text, onClick }) {
    return (
        <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 p-3 rounded-lg text-white hover:bg-white/10 transition-colors">
            <Icon size={18} />
            <span>{text}</span>
        </button>
    )
}

function RoleSelector({ role, setRole }) {
    return (
        <div className="flex gap-4 pt-2 pb-4">
           <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center text-sm font-bold transition-all ${role === 'CLIENT' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}>
               <input type="radio" name="role" value="CLIENT" className="hidden" checked={role === 'CLIENT'} onChange={() => setRole('CLIENT')} />
               Client
           </label>
           <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center text-sm font-bold transition-all ${role === 'DEVELOPER' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-gray-400'}`}>
               <input type="radio" name="role" value="DEVELOPER" className="hidden" checked={role === 'DEVELOPER'} onChange={() => setRole('DEVELOPER')} />
               Developer
           </label>
       </div>
    )
}