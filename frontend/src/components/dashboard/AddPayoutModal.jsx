"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Landmark } from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

export default function AddPayoutModal({ isOpen, onClose, onSuccess }) {
    const [type, setType] = useState('UPI'); // UPI, BANK_ACCOUNT
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        upiId: '',
        accountNumber: '',
        ifsc: '',
        holderName: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let details = {};

            if (type === 'UPI') {
                if (!formData.upiId.includes('@')) throw new Error("Invalid UPI ID");
                details = { upiId: formData.upiId };
            } else {
                if (!formData.accountNumber || !formData.ifsc || !formData.holderName)
                    throw new Error("All fields are required");
                details = {
                    accountNumber: formData.accountNumber,
                    ifsc: formData.ifsc,
                    holderName: formData.holderName
                };
            }

            await api.post('/payouts', { type, details });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Add Payout Method</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setType('UPI')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'UPI' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'}`}
                        >
                            <CreditCard size={24} />
                            <span className="text-xs font-bold">UPI ID</span>
                        </button>
                        <button
                            onClick={() => setType('BANK_ACCOUNT')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'BANK_ACCOUNT' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'}`}
                        >
                            <Landmark size={24} />
                            <span className="text-xs font-bold">Bank Account</span>
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {type === 'UPI' ? (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">UPI ID</label>
                                <input
                                    type="text"
                                    placeholder="username@bank"
                                    value={formData.upiId}
                                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none mt-1"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Account Holder Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={formData.holderName}
                                        onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none mt-1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Account Number</label>
                                        <input
                                            type="text"
                                            placeholder="1234567890"
                                            value={formData.accountNumber}
                                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">IFSC Code</label>
                                        <input
                                            type="text"
                                            placeholder="ABCD0123456"
                                            value={formData.ifsc}
                                            onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button className="w-full" disabled={loading}>
                            {loading ? 'Adding...' : 'Save Payout Method'}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
