"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import api from "@/lib/api";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
    }
    
    setStatus("loading");
    setError("");

    try {
      await api.post('/auth/reset-password', { email, token, newPassword: password });
      setStatus("success");
      // Auto redirect after 3s
      setTimeout(() => router.push('/login?message=Password Reset Successful'), 2000);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.error || "Failed to reset password");
      setStatus("error");
    }
  };

  if (!token || !email) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="text-center text-white">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
                <p className="text-gray-400 mb-6">This password reset link is invalid or missing required parameters.</p>
                <Link href="/login"><Button>Back to Login</Button></Link>
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10 glass-card p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
        
        {status === "success" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
            <p className="text-gray-400 mb-6">
                Your password has been successfully updated. Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-8">
                <h1 className="text-2xl font-bold text-white">Set New Password</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
                <PasswordInput 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                />
              </div>

              {status === "error" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle size={16} />
                    {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12" disabled={status === "loading"}>
                {status === "loading" ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
