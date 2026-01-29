"use client";

import { useState } from "react";
import { Mail, X, Loader2, Send } from "lucide-react";
import Button from "@/components/ui/Button";

export default function InviteDevModal({ isOpen, onClose, onSend, defaultEmail = "" }) {
    const [email, setEmail] = useState(defaultEmail);
    const [subject, setSubject] = useState("Join my project on GitLock");
    const [body, setBody] = useState("Hi,\n\nI'd like to invite you to collaborate on this project. Please review the details and accept the invitation.\n\nRegards,");
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!email || !subject || !body) {
            alert("Please fill in all fields");
            return;
        }

        setIsSending(true);
        try {
            await onSend({ email, subject, body });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Mail className="text-primary" size={20} />
                        Invite Developer
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Developer Email</label>
                        <input
                            type="email"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="developer@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Subject</label>
                        <input
                            type="text"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="Invitation Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Message</label>
                        <textarea
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white h-32 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                            placeholder="Write a personal message..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSending} className="min-w-[120px]">
                        {isSending ? (
                            <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Sending...</span>
                        ) : (
                            <span className="flex items-center gap-2"><Send size={16} /> Send Invite</span>
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
}
