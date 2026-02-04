"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ShieldCheck, Download, X, Eye, ArrowLeft, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useSidebar } from "@/context/SidebarContext";
import ErrorModal from "@/components/dashboard/ErrorModal";

export default function AcceptInvitePage({ params }) {
    const { projectId } = use(params);
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const { setIsSidebarCollapsed } = useSidebar();
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    useEffect(() => {
        // Fetch Project Details
        api.get(`/projects/${projectId}`)
            .then(res => {
                setProject(res.data);
            })
            .catch(err => {
                console.error(err);
                setErrorModal({ isOpen: true, message: "Failed to load project details" });
                router.push('/dashboard');
            })
            .finally(() => setLoading(false));
    }, [projectId, router]);

    // Auto-collapse sidebar when preview is open
    useEffect(() => {
        if (previewFile) {
            setIsSidebarCollapsed(true);
        }
    }, [previewFile, setIsSidebarCollapsed]);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            await api.post('/projects/accept', { projectId });

            router.push(`/dashboard/projects/${projectId}`); 
        } catch (error) {
            console.error(error);
            setErrorModal({ isOpen: true, message: "Failed to accept invitation" });
            setIsAccepting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    if (!project) return null;

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-300 space-y-8">
            
            {/* Back Button */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            <div className="relative w-full glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
                    <div className="w-24 h-24 bg-[#050505] rounded-full border-4 border-[#050505] flex items-center justify-center text-primary shadow-[0_0_30px_rgba(204,255,0,0.3)] absolute -bottom-12 z-10">
                         <ShieldCheck size={48} />
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8 md:px-12 space-y-8">

                    {/* Header Info */}
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold text-white">Project Invitation</h1>
                        <p className="text-gray-400 text-lg">You have been invited to work on <span className="text-white font-bold">{project.title}</span>.</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3 hover:bg-white/[0.07] transition-colors">
                            <h3 className="text-xs uppercase text-gray-500 font-bold tracking-wider">Client Details</h3>
                            <div>
                                <p className="text-white font-medium text-xl">{project.client_name || "Unknown Client"}</p>
                                <p className="text-gray-400 font-mono">{project.client_email}</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3 hover:bg-white/[0.07] transition-colors">
                            <h3 className="text-xs uppercase text-gray-500 font-bold tracking-wider">Budget Offer</h3>
                            <p className="text-green-400 font-bold text-4xl tracking-tight">₹{project.budget}</p>
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Description */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                             Project Description
                        </h3>
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-gray-300 leading-relaxed text-base">
                            {project.description || "No description provided."}
                        </div>
                    </div>

                    {/* Requirements */}
                    {project.requirements && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Technical Requirements</h3>
                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
                                {project.requirements}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {project.attachments && project.attachments.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Attachments</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {project.attachments.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                                <Download size={20} />
                                            </div>
                                            <div>
                                                <p className="text-base text-white font-medium truncate max-w-[300px]">{file.name}</p>
                                                <p className="text-xs text-gray-500">{file.size}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setPreviewFile(file)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" 
                                                title="Preview"
                                            >
                                                <Eye size={18} />
                                                <span className="text-sm font-medium hidden sm:inline">Preview</span>
                                            </button>
                                            <a 
                                                href={file.url} 
                                                download={file.name}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" 
                                                title="Download"
                                            >
                                                <Download size={18} />
                                                <span className="text-sm font-medium hidden sm:inline">Download</span>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center gap-6">
                         <div className="flex-1 text-sm text-gray-500 text-center md:text-left">
                            By accepting this project, you agree to the <span className="text-white hover:underline cursor-pointer">Terms of Service</span>.
                         </div>
                         <div className="flex items-center gap-4 w-full md:w-auto">
                            <Button
                                onClick={() => router.push('/dashboard')}
                                variant="outline"
                                className="h-14 px-8 w-full md:w-auto text-base"
                            >
                                Decline
                            </Button>
                            <Button
                                onClick={handleAccept}
                                disabled={isAccepting}
                                className="h-14 px-10 w-full md:w-auto text-base font-bold bg-primary hover:bg-primary/90 text-black shadow-[0_0_25px_rgba(204,255,0,0.3)] hover:shadow-[0_0_40px_rgba(204,255,0,0.5)] transition-all duration-300"
                            >
                                {isAccepting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin h-5 w-5 border-2 border-black/30 border-t-black rounded-full" />
                                        Joining...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle size={20} /> Accept & Start
                                    </span>
                                )}
                            </Button>
                         </div>
                    </div>

                </div>
            </div>

            {/* Preview Modal Overlay (Re-used Logic) */}
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
            
            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                message={errorModal.message}
            />
        </div>
    );
}
