"use client";

import Button from "@/components/ui/Button";
import { AlertCircle, ArrowLeft, X } from "lucide-react";

export default function ErrorModal({ isOpen, onClose, title = "Error", message, actionLabel, onAction }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#111] p-6 rounded-xl w-full max-w-sm border border-white/10 text-center relative overflow-hidden animate-in fade-in zoom-in duration-200">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X size={20} />
                </button>

                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertCircle size={24} />
                </div>

                <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                <p className="text-gray-400 text-sm mb-6 whitespace-pre-wrap">{message}</p>

                <div className="flex gap-3">
                    {onAction && (
                        <Button
                            onClick={onAction}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} /> {actionLabel || "Go Back"}
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        className={`flex-1 ${onAction ? 'bg-red-600 hover:bg-red-700' : 'bg-white/10 hover:bg-white/20'} text-white`}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
