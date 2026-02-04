"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

// Helper code duplicated for isolation (or could be moved to components)
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

import { Github, Mail } from "lucide-react";

function SocialLoginButton({ icon: Icon, text, onClick }) {
    return (
        <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 p-3 rounded-lg text-white hover:bg-white/10 transition-colors">
            <Icon size={18} />
            <span>{text}</span>
        </button>
    )
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", role: "CLIENT" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
        await api.post('/auth/register', formData);
        router.push('/login?registered=true');
    } catch (err) {
        setError(err.response?.data?.error || "Registration Failed");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSocialLogin = (provider) => {
      // Save role to localStorage so callback page can use it
      localStorage.setItem('oauth_role', formData.role);

      const callbackUrl = `${FRONTEND_URL}/auth/${provider}/callback`;
      
      if (provider === 'github') {
          window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${callbackUrl}&scope=user:email repo`;
      } else {
          window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${callbackUrl}&response_type=code&scope=email profile`;
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
           <h2 className="text-3xl font-bold text-white">Create Account</h2>
           <p className="text-gray-400 text-sm">Join the secure code economy.</p>
        </div>

        <div className="glass-card p-8 rounded-2xl border-white/5 bg-white/[0.02]">
           <form onSubmit={handleRegister} className="space-y-4">
               <div>
                  <input 
                     type="text" placeholder="Full Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
                  />
               </div>
               <div>
                  <input 
                     type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
                  />
               </div>
               <div>
                  <PasswordInput 
                     value={formData.password} 
                     onChange={e => setFormData({...formData, password: e.target.value})}
                  />
               </div>
               
               <div className="flex gap-4 pt-2">
                   <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center text-sm font-bold transition-all ${formData.role === 'CLIENT' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                       <input type="radio" name="role" value="CLIENT" className="hidden" checked={formData.role === 'CLIENT'} onChange={() => setFormData({...formData, role: 'CLIENT'})} />
                       Client
                   </label>
                   <label className={`flex-1 p-3 rounded-lg border cursor-pointer text-center text-sm font-bold transition-all ${formData.role === 'DEVELOPER' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                       <input type="radio" name="role" value="DEVELOPER" className="hidden" checked={formData.role === 'DEVELOPER'} onChange={() => setFormData({...formData, role: 'DEVELOPER'})} />
                       Developer
                   </label>
               </div>

               {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
               
               <Button className="w-full h-12 flex items-center justify-center gap-2" disabled={isLoading}>
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
           </form>

           <div className="mt-6 text-center text-sm text-gray-500">
               Already have an account? <Link href="/login" className="text-white hover:underline">Login here</Link>
           </div>
        </div>
      </div>
    </div>
  );
}
