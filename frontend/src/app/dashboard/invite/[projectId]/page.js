"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Mail, ArrowLeft, Send, Upload, X, FileText, Loader2, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import SuccessModal from "@/components/dashboard/SuccessModal";
import ErrorModal from "@/components/dashboard/ErrorModal";

export default function InvitePage({ params }) {
    const { projectId } = use(params);
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Form State
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [requirements, setRequirements] = useState("");
    const [attachments, setAttachments] = useState([]);

    // Modals
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    useEffect(() => {
        // Fetch Project Details
        api.get(`/projects/${projectId}`)
            .then(res => {
                setProject(res.data);
                setSubject(`Invitation to collaborate on "${res.data.title}"`);
                setBody(`Hi there,\n\nI'd like to invite you to collaborate on the project "${res.data.title}".\n\nPlease review the attached requirements and let me know if you are interested.\n\nRegards,`);
                setRequirements(res.data.requirements || ""); // Pre-fill if exists
                if(res.data.developer_email) setEmail(res.data.developer_email);
            })
            .catch(err => {
                console.error(err);
                setErrorModal({ isOpen: true, message: "Failed to load project details" });
                router.push('/dashboard');
            })
            .finally(() => setLoading(false));
    }, [projectId, router]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !subject || !body) {
            setErrorModal({ isOpen: true, message: "Please fill in required fields." });
            return;
        }

        setSending(true);
        try {
            const formData = new FormData();
            formData.append("projectId", projectId);
            formData.append("developerEmail", email);
            formData.append("subject", subject);
            formData.append("body", body);
            formData.append("requirements", requirements);
            
            attachments.forEach(file => {
                formData.append("attachments", file);
            });

            await api.post('/projects/invite', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccessModal({ isOpen: true, message: "Invitation sent successfully!" });
            // router.push('/dashboard'); // Moved to Modal action

        } catch (error) {
            console.error(error);
            setErrorModal({ isOpen: true, message: error.response?.data?.error || "Failed to send invitation" });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    if (!project) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                     <h1 className="text-3xl font-bold flex items-center gap-3">
                        Invite Developer <span className="text-gray-500 font-normal text-xl">/ {project.title}</span>
                     </h1>
                     <p className="text-gray-400">Send an invitation with detailed requirements and attachments.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Section 1: Recipient */}
                        <div className="bg-white/5 border border-white/5 p-6 rounded-xl space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
                                <Mail size={18} /> Recipient Details
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Developer Email *</label>
                                    <input 
                                        required
                                        type="email" 
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
                                        placeholder="developer@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Subject *</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
                                        placeholder="Invitation Subject"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Personal Message *</label>
                                    <textarea 
                                        required
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white h-32 resize-none focus:border-primary/50 outline-none"
                                        placeholder="Write a personal message..."
                                        value={body}
                                        onChange={e => setBody(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Project Details */}
                        <div className="bg-white/5 border border-white/5 p-6 rounded-xl space-y-4">
                             <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-400">
                                <FileText size={18} /> Project Requirements
                            </h2>
                            <p className="text-xs text-gray-500">Provide detailed technical requirements to help the developer understand the scope.</p>
                            
                            <textarea 
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white min-h-[200px] focus:border-blue-400/50 outline-none font-mono text-sm leading-relaxed"
                                placeholder="• Tech Stack: React, Node.js&#10;• Deliverables: Source code, Documentation&#10;• Timeline: 2 weeks..."
                                value={requirements}
                                onChange={e => setRequirements(e.target.value)}
                            />
                        </div>

                        {/* Section 3: Attachments */}
                        <div className="bg-white/5 border border-white/5 p-6 rounded-xl space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-400">
                                <Upload size={18} /> Attachments
                            </h2>
                            
                            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    multiple 
                                    onChange={handleFileChange} 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                />
                                <Upload className="mx-auto text-gray-500 mb-2" size={32} />
                                <p className="text-gray-400 text-sm">Drag & drop files or <span className="text-white underline">browse</span></p>
                                <p className="text-gray-600 text-xs mt-1">Supports PDF, DOCX, Images, ZIP (Max 10MB)</p>
                            </div>

                            {attachments.length > 0 && (
                                <div className="space-y-2">
                                    {attachments.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5">
                                            <span className="text-sm text-gray-300 truncate max-w-[200px]">{file.name}</span>
                                            <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                                            <button type="button" onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                {/* Right: Summary / Preview */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/5 p-6 rounded-xl space-y-4 sticky top-6">
                        <h3 className="text-lg font-bold text-white mb-4">Summary</h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Project</span>
                                <span className="text-white font-medium">{project.title}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Budget</span>
                                <span className="text-green-400 font-bold">₹{project.budget}</span>
                            </div>
                            <hr className="border-white/10" />
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Files Attached</span>
                                <span className="text-white">{attachments.length}</span>
                            </div>
                        </div>

                        <Button 
                            onClick={handleSubmit} 
                            disabled={sending} 
                            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_var(--primary-shadow)] mt-6"
                        >
                            {sending ? <><Loader2 className="animate-spin" /> Sending...</> : <><Send size={18} /> Send Invitation</>}
                        </Button>
                        
                        <p className="text-xs text-center text-gray-500 mt-4">
                            The developer will receive an email with a secure link to view the requirements and accept the invite.
                        </p>
                    </div>
                </div>

            </div>
            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => {
                    setSuccessModal({ ...successModal, isOpen: false });
                    router.push('/dashboard');
                }}
                message={successModal.message}
            />

            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                message={errorModal.message}
            />
        </div>
    );
}
