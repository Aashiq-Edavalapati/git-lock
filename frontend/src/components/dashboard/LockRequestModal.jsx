"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import OTPInput from "@/components/ui/OTPInput";
import ResendOTP from "@/components/ui/ResendOTP";
import api from "@/lib/api";

export default function LockRequestModal({ requestId, onClose, onSuccess }) {
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1: Send OTP, 2: Enter OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const sendOtp = async () => {
        setLoading(true);
        setError("");
        try {
            await api.post('/auth/request-otp');
            setStep(2);
        } catch (err) {
            setError("Failed to send OTP. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        setLoading(true);
        setError("");
        try {
            await api.post('/projects/lock-approve', { requestId, otp });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-sm p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Approve Unlock</h3>
                <p className="text-gray-400 text-sm">
                    {step === 1
                        ? "This action requires Multi-Factor Authentication. We will send an OTP to your email."
                        : "Enter the code sent to your email to confirm approval."}
                </p>

                {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded">{error}</div>}

                {step === 1 ? (
                    <Button onClick={sendOtp} className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : "Send OTP Verification"}
                    </Button>
                ) : (
                    <div className="space-y-4">
                        <OTPInput
                            length={6}
                            value={otp}
                            onChange={setOtp}
                        />
                        <Button onClick={verifyOtp} className="w-full" disabled={loading || otp.length !== 6}>
                            {loading ? <Loader2 className="animate-spin" /> : "Verify & Approve"}
                        </Button>
                        <ResendOTP onResend={sendOtp} />
                    </div>
                )}

                <button onClick={onClose} className="w-full text-gray-500 text-xs hover:text-white transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    );
}
