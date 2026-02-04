"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      await api.post('/auth/forgot-password', { email });
      setStatus("success");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset link");
      setStatus("error");
    }
  };

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
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
                We have sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link href="/login">
                <Button variant="outline" className="w-full">Back to Login</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-8">
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            </div>

            <p className="text-gray-400 text-sm mb-6">
                Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                        type="email" 
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 p-3 text-white focus:border-primary/50 outline-none"
                    />
                </div>
              </div>

              {status === "error" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle size={16} />
                    {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12" disabled={status === "loading"}>
                {status === "loading" ? "Sending Link..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
