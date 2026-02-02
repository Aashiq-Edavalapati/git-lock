"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import OTPInput from "@/components/ui/OTPInput";
import { Loader2, DollarSign, Lock, Mail } from "lucide-react";
import api from "@/lib/api";

export default function BudgetApprovalModal({ isOpen, onClose, projectId, currentBudget, pendingBudget, onSuccess }) {
    if (!isOpen) return null;

    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1: Confirm, 2: OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendOTP = async () => {
        setLoading(true);
        setError("");
        try {
            await api.post(`/projects/${projectId}/budget-approve-otp`);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        setError("");
        try {
            await api.post(`/projects/${projectId}/budget-approve`, { otp });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to approve budget");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#111] p-6 rounded-xl w-full max-w-sm border border-white/10">
                <div className="flex items-center gap-3 mb-4 text-green-400">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                        <DollarSign size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Approve Change</h2>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                    Please confirm the budget change. This action requires OTP verification sent to your email.
                </p>

                {error && <div className="bg-red-500/10 text-red-500 p-2 text-sm rounded mb-4">{error}</div>}

                <div className="bg-white/5 p-4 rounded-lg mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Current Budget</span>
                        <span className="text-gray-300">₹{currentBudget}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">New Budget</span>
                        <span className="text-green-400">₹{pendingBudget}</span>
                    </div>
                </div>

                {step === 2 && (
                    <div className="mb-4">
                        <label className="text-xs text-gray-500 uppercase font-bold text-center block mb-2">Email OTP</label>
                        <OTPInput
                            length={6}
                            value={otp}
                            onChange={setOtp}
                        />
                        <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><Mail size={12} /> OTP Sent to your email</p>
                    </div>
                )}

                <div className="flex gap-2">
                    {step === 1 ? (
                        <Button onClick={handleSendOTP} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={16} /> : "Continue to Verify"}
                        </Button>
                    ) : (
                        <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={16} /> : "Verify & Approve"}
                        </Button>
                    )}
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" disabled={loading}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
