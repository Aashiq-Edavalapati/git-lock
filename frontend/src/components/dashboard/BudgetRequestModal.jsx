"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Loader2, DollarSign, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import SuccessModal from "./SuccessModal";

export default function BudgetRequestModal({ isOpen, onClose, projectId, currentBudget, onSuccess, isDirectUpdate }) {
    if (!isOpen) return null;

    const [amount, setAmount] = useState(currentBudget);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.post(`/projects/${projectId}/budget-request`, { newBudget: amount });
            setSuccessModal({ isOpen: true, message: res.data.message });
        } catch (err) {
            setError(err.response?.data?.error || "Request failed");
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
                    <h2 className="text-xl font-bold text-white">Update Budget</h2>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                    {isDirectUpdate
                        ? "Since no developer is assigned, this update will apply immediately."
                        : "A developer is assigned, so they must approve this change via OTP."}
                </p>

                {error && <div className="bg-red-500/10 text-red-500 p-2 text-sm rounded mb-4">{error}</div>}

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">New Budget (₹)</label>
                        <input
                            type="number"
                            className="w-full bg-black border border-white/10 p-2 text-white rounded mt-1"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={16} /> : (isDirectUpdate ? "Update Budget" : "Send Request")}
                    </Button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" disabled={loading}>Cancel</button>
                </div>
            </div>

            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => {
                    setSuccessModal({ ...successModal, isOpen: false });
                    onSuccess(amount);
                    onClose();
                }}
                message={successModal.message}
            />
        </div>
    );
}
