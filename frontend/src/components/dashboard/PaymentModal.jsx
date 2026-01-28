"use client";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentModal({ amount, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        onSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white w-full max-w-[400px] rounded-lg overflow-hidden shadow-2xl relative">
            
            {/* Razorpay Header */}
            <div className="bg-[#2b83ea] p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/20 rounded-md"></div>
                   <div>
                      <h3 className="font-bold text-sm">GitLock Escrow</h3>
                      <p className="text-xs opacity-80">Order #lock_123</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xs opacity-80">Amount</p>
                   <p className="font-bold">{amount}</p>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Cards, UPI & More</p>
                
                <button onClick={handlePay} className="w-full flex items-center gap-4 p-4 border rounded hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full border flex items-center justify-center text-blue-600 font-bold text-xs">G</div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-gray-800">Google Pay</p>
                        <p className="text-xs text-gray-500">upi@okhdfcbank</p>
                    </div>
                </button>

                <button onClick={handlePay} className="w-full flex items-center gap-4 p-4 border rounded hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center text-white text-xs font-bold">C</div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-gray-800">Card</p>
                        <p className="text-xs text-gray-500">**** 4242</p>
                    </div>
                </button>

                {loading && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                        <p className="text-sm font-bold text-gray-700">Processing Secure Payment...</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-3 flex justify-between items-center border-t">
                <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-800">Cancel</button>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    SECURED BY RAZORPAY
                </div>
            </div>
        </motion.div>
    </div>
  )
}