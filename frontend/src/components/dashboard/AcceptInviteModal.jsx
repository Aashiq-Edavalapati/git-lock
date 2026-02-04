"use client";

import { ShieldCheck, Download, X, Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function AcceptInviteModal({ isOpen, onClose, project, isDev = true, isAccepting, onConfirm }) {
    const [previewFile, setPreviewFile] = useState(null);

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8 space-y-8">

                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Project Invitation</h1>
                        <p className="text-gray-400">You have been invited to work on <span className="text-white font-bold">{project.title}</span>.</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                            <h3 className="text-xs uppercase text-gray-500 font-bold tracking-wider">Client Details</h3>
                            <div>
                                <p className="text-white font-medium text-lg">{project.client_name || "Unknown Client"}</p>
                                <p className="text-gray-400 text-sm font-mono">{project.client_email}</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                            <h3 className="text-xs uppercase text-gray-500 font-bold tracking-wider">Budget</h3>
                            <p className="text-green-400 font-bold text-3xl tracking-tight">₹{project.budget}</p>
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Description */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Project Description</h3>
                        <div className="bg-black/40 p-5 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed">
                            {project.description || "No description provided."}
                        </div>
                    </div>

                    {/* Requirements */}
                    {project.requirements && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Technical Requirements</h3>
                            <div className="bg-black/40 p-5 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {project.requirements}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {project.attachments && project.attachments.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Attachments</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {project.attachments.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                                                <Download size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-medium truncate max-w-[200px]">{file.name}</p>
                                                <p className="text-xs text-gray-500">{file.size}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setPreviewFile(file)}
                                                className="text-gray-500 hover:text-white p-1"
                                                title="Preview"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <a
                                                href={file.url}
                                                download={file.name}
                                                className="text-gray-500 hover:text-white p-1"
                                                title="Download"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4">
                        {isDev ? (
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Button
                                    onClick={onConfirm}
                                    disabled={isAccepting}
                                    className="w-full h-12 text-base font-semibold bg-green-500 hover:bg-green-600 text-black transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98]"
                                >
                                    {isAccepting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full" />
                                            Joining...
                                        </span>
                                    ) : 'Accept & Join Project'}
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-6 h-12 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    Review Later
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

            {/* Preview Modal Overlay */}
            {previewFile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                        {/* Preview Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                            <h3 className="text-white font-medium truncate max-w-md flex items-center gap-2">
                                <Eye size={18} className="text-primary" />
                                {previewFile.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewFile.url}
                                    download={previewFile.name}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <Download size={20} />
                                </a>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 bg-black/50 flex items-center justify-center overflow-hidden p-4 relative">
                            {previewFile.type === 'application/pdf' ? (
                                <iframe
                                    src={previewFile.url}
                                    className="w-full h-full rounded-lg border border-white/10"
                                    title="PDF Preview"
                                />
                            ) : previewFile.type.startsWith('image/') ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={previewFile.url}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            ) : (
                                <div className="text-center text-gray-400 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <Download size={32} />
                                    </div>
                                    <p className="text-lg">Preview not available for this file type.</p>
                                    <a
                                        href={previewFile.url}
                                        download={previewFile.name}
                                        className="text-primary hover:underline"
                                    >
                                        Download to view
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
