"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  UserPlus, AlertCircle, Loader2, Github, Mail, 
  Globe, Zap, Scale 
} from "lucide-react";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import OTPInput from "@/components/ui/OTPInput";
import ResendOTP from "@/components/ui/ResendOTP";
import api from "@/lib/api";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import { generateKeyPair } from "@/utils/crypto";

// Environment Helpers
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

export default function RegisterPage() {
  const { isLoading: authLoading } = useAuthRedirect(true);
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "", role: "CLIENT", otp: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Register Form, 2: MFA Verification
  const [userId, setUserId] = useState(null);

  if (authLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  // Import Crypto Utility

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
    }

    setIsLoading(true);

    try {
        // 1. Generate RSA Key Pair (Client-Side)
        const { publicKeyPem, privateKeyPem } = await generateKeyPair();

        // 2. Save Private Key to LocalStorage (For ease of use in this prototype)
        localStorage.setItem("gitlock_private_key", privateKeyPem);

        // 3. Trigger Download of Private Key (User ownership)
        const blob = new Blob([privateKeyPem], { type: 'application/x-pem-file' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gitlock_private_key_${Date.now()}.pem`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 4. Send Public Key to Backend
        const res = await api.post('/auth/register', {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            publicKey: publicKeyPem 
        });

        if (res.data.mfaRequired) {
             setUserId(res.data.userId);
             setStep(2);
        } else {
             router.push('/login?message=Account created successfully. Please login.');
        }
    } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || "Registration Failed");
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
        // After verification, we can redirect to dashboard directly as verify-mfa usually sets the token cookie
        // Or redirect to login if we want them to login explicitly. 
        // Based on Login Page flow, verify-mfa sets cookie. So we go to dashboard.
        window.location.href = "/dashboard";
    } catch (err) {
         setError(err.response?.data?.error || "Invalid OTP");
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleSocialLogin = (provider) => {
      // Save role to localStorage so the callback page knows what role to assign
      localStorage.setItem('oauth_role', formData.role);

      const callbackUrl = `${FRONTEND_URL}/auth/${provider}/callback`;
      const encodedRedirectUri = encodeURIComponent(callbackUrl);
      
      if (provider === 'github') {
          window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&scope=user:email repo`;
      } else {
          window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=email profile`;
      }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* --- LEFT PANEL (Distinct Content) --- */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#050505] overflow-hidden border-r border-white/5">
         
         {/* Background Effects (Slightly different gradient positions than login) */}
         <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
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
               Build without borders. <br/>
               <span className="text-primary">Pay without risk.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
               Join the new standard for trustless software delivery. Whether you are shipping code or funding it, we guarantee the exchange.
            </p>
            
            <div className="space-y-5 pt-4">
               <FeatureRow icon={Globe} title="Global Talent Pool" desc="Connect with verified devs worldwide." />
               <FeatureRow icon={Zap} title="Instant Settlement" desc="Funds release immediately upon code verification." />
               <FeatureRow icon={Scale} title="Zero-Trust Architecture" desc="Code only unlocks when payment is confirmed." />
            </div>
         </div>

         <div className="relative z-10 text-xs text-gray-600">© 2026 GitLock Inc.</div>
      </div>


      {/* --- RIGHT PANEL (Form) --- */}
      <div className="flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
               <h2 className="text-3xl font-bold text-white">Create Account</h2>
               <p className="text-gray-400 text-sm">Start your secure code journey.</p>
            </div>

            <div className="glass-card p-8 rounded-2xl border-white/5 bg-white/[0.02]">
               {step === 1 ? (
                   <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                         <input 
                            type="text" placeholder="Full Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none transition-colors"
                         />
                      </div>
                      <div>
                         <input 
                            type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none transition-colors"
                         />
                      </div>
                      <div>
                         <PasswordInput 
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})}
                         />
                      </div>
                      <div>
                          <PasswordInput
                              value={formData.confirmPassword}
                              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                              placeholder="Confirm Password"
                          />
                      </div>
                      
                      {/* Role Selector */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${formData.role === 'CLIENT' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                            <input type="radio" name="role" value="CLIENT" className="hidden" checked={formData.role === 'CLIENT'} onChange={() => setFormData({...formData, role: 'CLIENT'})} />
                            <span className="font-bold text-sm">Client</span>
                            <span className="text-[10px] opacity-70 font-normal">I want to hire</span>
                         </label>
                         <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${formData.role === 'DEVELOPER' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                            <input type="radio" name="role" value="DEVELOPER" className="hidden" checked={formData.role === 'DEVELOPER'} onChange={() => setFormData({...formData, role: 'DEVELOPER'})} />
                            <span className="font-bold text-sm">Developer</span>
                            <span className="text-[10px] opacity-70 font-normal">I want to work</span>
                         </label>
                      </div>

                      {error && <p className="text-xs text-red-500 flex items-center gap-1 mt-2"><AlertCircle size={10}/> {error}</p>}
                      
                      <Button className="w-full h-12 flex items-center justify-center gap-2 mt-4" disabled={isLoading}>
                         {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={18} /> Register</>}
                      </Button>
                      
                      <div className="relative my-6">
                         <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                         <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-gray-500">Or continue with</span></div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <SocialLoginButton icon={Github} text="Github" onClick={() => handleSocialLogin('github')} />
                         <SocialLoginButton icon={Mail} text="Google" onClick={() => handleSocialLogin('google')} /> 
                      </div>

                      <div className="mt-6 text-center text-sm text-gray-500">
                         Already have an account? <Link href="/login" className="text-white hover:underline font-medium">Login here</Link>
                      </div>
                   </form>
               ) : (
                   <form onSubmit={handleVerifyMfa} className="space-y-4">
                      
                      <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-center">
                          <p className="text-sm text-primary mb-2">Verification Code Sent!</p>
                          <p className="text-xs text-gray-400">Please check your email for the 6-digit OTP.</p>
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
                      
                      <Button onClick={handleVerifyMfa} className="w-full h-12 border-primary/50 text-black hover:bg-primary hover:text-black/80 transition-all" disabled={isLoading}>
                          {isLoading ? 'Verifying...' : 'Verify Email & Login'}
                      </Button>
                      
                      <ResendOTP onResend={async () => await api.post('/auth/login', { email: formData.email, password: formData.password })} />
                   </form>
               )}
            </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function FeatureRow({ icon: Icon, title, desc }) {
    return (
      <div className="flex items-start gap-4 text-gray-300">
        <div className="min-w-[32px] h-8 rounded-full bg-white/5 flex items-center justify-center text-primary mt-1">
            <Icon size={16} />
        </div>
        <div>
            <h4 className="font-bold text-white text-sm mb-0.5">{title}</h4>
            <p className="text-sm text-gray-400">{desc}</p>
        </div>
      </div>
    )
}

function SocialLoginButton({ icon: Icon, text, onClick }) {
    return (
        <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 p-3 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-medium">
            <Icon size={18} />
            <span>{text}</span>
        </button>
    )
}