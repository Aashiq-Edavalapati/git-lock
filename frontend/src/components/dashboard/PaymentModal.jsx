"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Loader2, X, CreditCard } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function PaymentModal({ amount, onClose, onSuccess }) {
  const [status, setStatus] = useState("idle"); // idle, processing, success

  const handlePay = () => {
    setStatus("processing");
    // Simulate Razorpay/Bank delay
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="bg-[#111] p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#3399cc] rounded flex items-center justify-center text-white text-xs font-bold">R</div>
            <span className="font-bold text-gray-200">Razorpay Trusted</span>
          </div>
          {status !== 'processing' && <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>}
        </div>

        {/* Body */}
        <div className="p-8 text-center space-y-6">
          {status === 'idle' && (
            <>
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Payable Amount</p>
                <h2 className="text-4xl font-bold text-white">{amount}</h2>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-white/10 p-4 rounded-xl flex items-center gap-4 transition-all group">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300">
                        <CreditCard size={20} />
                    </div>
                    <div className="text-left flex-1">
                        <p className="font-bold text-sm text-gray-200">Card</p>
                        <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-gray-600 group-hover:border-primary" />
                </button>
                
                <button className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-white/10 p-4 rounded-xl flex items-center gap-4 transition-all group">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 group-hover:text-orange-300">
                        <ShieldCheck size={20} />
                    </div>
                    <div className="text-left flex-1">
                        <p className="font-bold text-sm text-gray-200">UPI / QR</p>
                        <p className="text-xs text-gray-500">GPay, PhonePe, Paytm</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-gray-600 group-hover:border-primary" />
                </button>
              </div>

              <Button onClick={handlePay} className="w-full py-4 text-lg">
                 Pay Now
              </Button>
            </>
          )}

          {status === 'processing' && (
            <div className="py-10">
                <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">Processing Payment...</h3>
                <p className="text-gray-500 text-sm mt-2">Please do not close this window.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-10">
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <CheckCircle2 size={32} className="text-black" />
                </motion.div>
                <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
                <p className="text-gray-500 text-sm mt-2">Unlocking Vault...</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#111] p-3 text-center border-t border-white/5">
            <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1">
                <ShieldCheck size={10} /> Secured by GitLock Escrow Protocol
            </p>
        </div>
      </motion.div>
    </div>
  );
}