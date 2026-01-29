import Button from "@/components/ui/Button";
import { Loader2, AlertTriangle } from "lucide-react";

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, isLoading, loadingText = "Processing..." }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#111] p-6 rounded-xl w-full max-w-sm border border-white/10 text-center relative overflow-hidden">

                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertTriangle size={24} />
                </div>

                <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                <p className="text-gray-400 text-sm mb-6">{message}</p>

                <div className="flex gap-3">
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2 justify-center">
                                <Loader2 className="animate-spin" size={16} />
                                {loadingText}
                            </span>
                        ) : "Delete"}
                    </Button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
