"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Landmark, Wallet } from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { connectWallet } from '@/utils/web3';

export default function AddPayoutModal({ isOpen, onClose, onSuccess }) {
    const [type, setType] = useState('CRYPTO_WALLET'); // CRYPTO_WALLET, UPI, BANK_ACCOUNT
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        walletAddress: '',
        upiId: '',
        accountNumber: '',
        ifsc: '',
        holderName: ''
    });
    const [error, setError] = useState('');

    const handleAutoFillWallet = async () => {
        try {
            const walletData = await connectWallet();
            setFormData(prev => ({ ...prev, walletAddress: walletData.address }));
        } catch (err) {
            setError(err.message || "Failed to connect MetaMask");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let details = {};

            if (type === 'CRYPTO_WALLET') {
                if (!formData.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)) {
                    throw new Error("Invalid BNB / Ethereum wallet address (0x...)");
                }
                details = { walletAddress: formData.walletAddress, network: 'BSC Testnet (Chain ID 97)' };
                // Also update user's primary wallet in backend
                await api.post('/escrow/wallet', { walletAddress: formData.walletAddress });
            } else if (type === 'UPI') {
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
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setType('CRYPTO_WALLET')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${type === 'CRYPTO_WALLET' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'}`}
                        >
                            <Wallet size={20} />
                            <span className="text-[11px] font-bold">tBNB Wallet</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('UPI')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${type === 'UPI' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'}`}
                        >
                            <CreditCard size={20} />
                            <span className="text-[11px] font-bold">UPI ID</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('BANK_ACCOUNT')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${type === 'BANK_ACCOUNT' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'}`}
                        >
                            <Landmark size={20} />
                            <span className="text-[11px] font-bold">Bank Acc</span>
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {type === 'CRYPTO_WALLET' ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-400 uppercase">BSC Testnet Address (0x...)</label>
                                    <button
                                        type="button"
                                        onClick={handleAutoFillWallet}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        Auto-fill MetaMask
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="0x392e227Bf9201A328f9ebD8DBee33f3cBDB15b37"
                                    value={formData.walletAddress}
                                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono text-xs focus:border-primary/50 outline-none"
                                />
                                <p className="text-[11px] text-gray-500">
                                    Funds from the smart contract will be transferred directly to this wallet address on payment release.
                                </p>
                            </div>
                        ) : type === 'UPI' ? (
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
                                            placeholder="HDFC0001234"
                                            value={formData.ifsc}
                                            onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <Button type="submit" disabled={loading} className="w-full h-11">
                                {loading ? 'Saving...' : 'Save Payout Method'}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
