"use client";

import { ShieldCheck, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function AcceptInviteModal({ project, isDev, isAccepting, handleAcceptProject }) {
    const router = useRouter();
    const handleCloseModal = () => {
        router.push('/dashboard');
    }

    return (
        <div className="max-w-2xl mx-auto pt-10 pb-20">
            <div className="glass-card p-8 rounded-2xl space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Project Invitation</h1>
                    <p className="text-gray-400">You have been invited to work on <span className="text-white font-bold">{project.title}</span>.</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                        <h3 className="text-xs uppercase text-gray-500 font-bold">Client Details</h3>
                        <div>
                            <p className="text-white font-medium">{project.client_name || "Unknown Client"}</p>
                            <p className="text-gray-400 text-sm">{project.client_email}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                         <h3 className="text-xs uppercase text-gray-500 font-bold">Budget</h3>
                         <p className="text-green-400 font-bold text-2xl">₹{project.budget}</p>
                    </div>
                </div>

                <hr className="border-white/5" />

                {/* Description */}
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white">Project Description</h3>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed">
                        {project.description || "No description provided."}
                    </div>
                </div>

                {/* Requirements */}
                {project.requirements && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Technical Requirements</h3>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {project.requirements}
                        </div>
                    </div>
                )}

                {/* Attachments */}
                 {project.attachments && project.attachments.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Attachments</h3>
                         <div className="grid grid-cols-1 gap-2">
                            {project.attachments.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Download size={16} />{/* Using Download as generic file icon */}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium truncat max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-gray-500">{file.size}</p>
                                        </div>
                                    </div>
                                    {/* Mock Download */}
                                    <button className="text-gray-500 hover:text-white" title="Download">
                                        <Download size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-6">
                    {isDev ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Button 
                                onClick={handleAcceptProject} 
                                disabled={isAccepting}
                                className="w-full h-14 text-lg font-semibold bg-green-400 hover:bg-green-500 text-black transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98]"
                            >
                                {isAccepting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full" />
                                        Joining...
                                    </span>
                                ) : 'Accept & Join Project'}
                            </Button>
                            
                            <button 
                                onClick={handleCloseModal}
                                className="w-full sm:w-1/3 h-14 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                            >
                                Decline Invitation
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-yellow-500/90 text-sm bg-yellow-500/5 py-4 px-6 rounded-xl border border-yellow-500/10 backdrop-blur-sm">
                            Waiting for developer response...
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
