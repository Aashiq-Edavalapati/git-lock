"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

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
                  <input 
                     type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
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
           </form>

           <div className="mt-6 text-center text-sm text-gray-500">
               Already have an account? <Link href="/login" className="text-white hover:underline">Login here</Link>
           </div>
        </div>
      </div>
    </div>
  );
}
