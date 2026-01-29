"use client";

import { CheckCircle, X, ShieldCheck, User, FolderOpen, Banknote } from "lucide-react";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function AcceptInviteModal({ isOpen, onClose, project, onConfirm }) {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !project) return null;

    const handleConfirm = async () => {
        setIsProcessing(true);
        await onConfirm();
        setIsProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-blue-500/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-blue-400">
                            <ShieldCheck size={20} />
                            <span className="text-sm font-semibold tracking-wider uppercase">Project Invitation</span>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{project.title}</h2>
                </div>

                {/* content */}
                <div className="p-6 space-y-6">

                    {/* Description */}
                    <div>
                        <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 flex items-center gap-2">
                            <FolderOpen size={14} /> Description
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                            {project.description || "No description provided."}
                        </p>
                    </div>

                    {/* Client Info */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 flex items-center gap-2">
                                <User size={14} /> Client
                            </h3>
                            <div className="text-white text-sm">
                                <p className="font-medium">{project.client_name || "Unknown Client"}</p>
                                <p className="text-gray-400 text-xs">{project.client_email}</p>
                            </div>
                        </div>

                        {/* Budget */}
                        <div className="flex-1">
                            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 flex items-center gap-2">
                                <Banknote size={14} /> Budget
                            </h3>
                            <div className="text-green-400 font-bold text-xl">
                                ₹{project.budget}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                        {isProcessing ? "Joining..." : "Acccept & Join"}
                    </Button>
                </div>

            </div>
        </div>
    );
}
