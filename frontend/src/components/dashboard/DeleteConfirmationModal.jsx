"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import OTPInput from "@/components/ui/OTPInput";
import ResendOTP from "@/components/ui/ResendOTP";
import { AlertCircle } from "lucide-react";

export default function DeleteConfirmationModal({ onClose }) {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Type "Delete", 2: OTP
    const [confirmText, setConfirmText] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const continueBtnRef = useRef(null);


    const handleSendOtp = async () => {
        if (confirmText.toLowerCase() !== "delete") return;
        setLoading(true);
        setError("");
        try {
            await api.post('/auth/delete-account/initiate');
            setStep(2);
        } catch (err) {
            setError("Failed to send OTP. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleFinalDelete = async () => {
        setLoading(true);
        setError("");
        try {
            await api.delete('/auth/delete-account', { data: { otp } }); // Delete requests with body need 'data' key in axios
            router.push('/login');
        } catch (err) {
            setError(err.response?.data?.error || "Deletion Failed");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#111] p-6 rounded-xl w-full max-w-md border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Delete Account?</h2>
                    <p className="text-gray-400 text-sm mt-2">This action is irreversible.</p>
                </div>

                {step === 1 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Type "Delete" to confirm</label>
                            <input
                                className="w-full bg-black border border-white/10 p-3 rounded-lg text-white outline-none focus:border-red-500"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Tab") {
                                        e.preventDefault();
                                        continueBtnRef.current?.focus();
                                    }
                                }}
                                placeholder="Delete"
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        <div className="flex gap-2">
                            <Button
                                ref={continueBtnRef}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                disabled={confirmText.toLowerCase() !== "delete" || loading}
                                onClick={handleSendOtp}
                            >
                                {loading ? 'Sending OTP...' : 'Continue'}
                            </Button>
                            <button onClick={onClose} className="px-4 text-gray-400 hover:text-white" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-center">
                            <p className="text-yellow-500 text-sm">OTP Sent to your email</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold block mb-2 text-center">Enter 6-Digit OTP</label>
                            <OTPInput
                                length={6}
                                value={otp}
                                onChange={setOtp}
                                className="mb-4"
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                disabled={loading || otp.length < 6}
                                onClick={handleFinalDelete}
                            >
                                {loading ? 'Deleting...' : 'Confirm Deletion'}
                            </Button>
                            <button onClick={onClose} className="px-4 text-gray-400 hover:text-white" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}