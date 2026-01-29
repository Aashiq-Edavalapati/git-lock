"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Mail, CheckCircle, XCircle, ArrowRight, Loader2, User } from "lucide-react";
import Button from "@/components/ui/Button";
import AcceptInviteModal from "@/components/dashboard/AcceptInviteModal";

export default function InvitationsProxy() {
    // This is a client-side wrapper to avoid hydration issues if we need to check auth safely
    return <InvitationsPage />;
}

function InvitationsPage() {
    const [invites, setInvites] = useState({ sent: [], received: [], accepted: [] });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, project: null });
    const [acceptModal, setAcceptModal] = useState({ isOpen: false, project: null });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get Current User Role
                const uRes = await api.get('/auth/me');
                setUser(uRes.data);

                // Fetch All Projects (Our endpoint filters by user relevance anyway)
                const pRes = await api.get('/projects');
                const projects = pRes.data;

                // Process Projects into categories based on status and user role
                const sent = [];
                const received = [];
                const accepted = [];

                projects.forEach(p => {
                    if (uRes.data.role === 'CLIENT') {
                        if (p.status === 'INVITE_SENT') {
                            sent.push(p);
                        } else if (p.developer_id) {
                            // Accepted by dev
                            accepted.push(p);
                        }
                    } else if (uRes.data.role === 'DEVELOPER') {
                        // For Dev, "Sent" to them is "Received"
                        if (p.status === 'INVITE_SENT' && p.developer_email === uRes.data.email) {
                            received.push(p);
                        } else if (p.status !== 'INVITE_SENT' && p.status !== 'OPEN') {
                             // They are part of it
                             accepted.push(p);
                        }
                    }
                });

                setInvites({ sent, received, accepted });

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleRemoveClick = (project) => {
        setConfirmModal({ isOpen: true, project });
    };

    const handleAcceptClick = (project) => {
        setAcceptModal({ isOpen: true, project });
    };

    const confirmAccept = async () => {
         const { project } = acceptModal;
         if (!project) return;
         try {
            await api.post('/projects/accept', { projectId: project.id });
            window.location.reload(); 
         } catch (e) {
            alert(e.response?.data?.error || "Failed");
         } finally {
            setAcceptModal({ isOpen: false, project: null });
         }
    };

    const confirmRemove = async () => {
        const { project } = confirmModal;
        if (!project) return;
        
        try {
            await api.post('/projects/cancel-invite', { projectId: project.id });
            window.location.reload();
        } catch (e) {
            alert(e.response?.data?.error || "Failed");
        } finally {
            setConfirmModal({ isOpen: false, project: null });
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold mb-2">Invitations Center</h1>
                <p className="text-gray-400">Manage your project collaborations.</p>
            </div>

            {user?.role === 'CLIENT' && (
                <Section title="Sent Invitations" icon={Mail} count={invites.sent.length} color="text-yellow-400">
                    {invites.sent.length === 0 ? <EmptyState text="No pending invitations sent." /> : 
                        invites.sent.map(p => <InvitationCard key={p.id} project={p} type="SENT" onRemove={() => handleRemoveClick(p)} />)
                    }
                </Section>
            )}

            {user?.role === 'DEVELOPER' && (
                <Section title="Received Invitations" icon={Mail} count={invites.received.length} color="text-blue-400">
                    {invites.received.length === 0 ? <EmptyState text="No pending invitations received." /> : 
                        invites.received.map(p => <InvitationCard key={p.id} project={p} type="RECEIVED" onAccept={() => handleAcceptClick(p)} />)
                    }
                </Section>
            )}

            <Section title={user?.role === 'CLIENT' ? "Active Collaborations" : "Joined Projects"} icon={CheckCircle} count={invites.accepted.length} color="text-green-400">
                 {invites.accepted.length === 0 ? <EmptyState text="No active collaborations yet." /> : 
                    invites.accepted.map(p => <InvitationCard key={p.id} project={p} type="ACCEPTED" role={user?.role} onRemove={user?.role === 'CLIENT' ? () => handleRemoveClick(p) : undefined} />)
                }
            </Section>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-2">Remove Developer?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Are you sure you want to remove the developer from <strong>{confirmModal.project?.title}</strong>? 
                            <br/><br/>
                            This will:
                            <ul className="list-disc list-inside mt-2 text-white/80">
                                <li>Reset the project status to <strong>OPEN</strong>.</li>
                                <li>Notify the developer via email.</li>
                                <li>Revoke their access to this project.</li>
                            </ul>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setConfirmModal({ isOpen: false, project: null })}>Cancel</Button>
                            <Button onClick={confirmRemove} className="bg-red-500 hover:bg-red-600 text-white">Remove Developer</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Accept Invite Modal */}
            <AcceptInviteModal 
                isOpen={acceptModal.isOpen}
                onClose={() => setAcceptModal({ isOpen: false, project: null })}
                project={acceptModal.project}
                onConfirm={confirmAccept}
            />

        </div>
    );
}

function Section({ title, icon: Icon, children, count, color }) {
    return (
        <div className="space-y-4">
            <h2 className={`text-xl font-semibold flex items-center gap-2 text-white/90`}>
                <Icon size={20} className={color} /> {title} 
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">{count}</span>
            </h2>
            <div className="grid grid-cols-1 gap-3">
                {children}
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return <div className="p-8 border border-white/5 border-dashed rounded-xl text-center text-sm text-gray-500 bg-white/[0.02]">{text}</div>;
}

function InvitationCard({ project, type, role, onRemove, onAccept }) {
    const [actionLoading, setActionLoading] = useState(false);

    // handleAccept and handleCancel logic is now moved up to parent (onAccept, onRemove)
    // but we can keep local loading state visually if needed, though modal handles it better.

    return (
        <div className={`glass-card p-5 border rounded-xl flex items-center justify-between group transition-all ${type === 'RECEIVED' ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/10 hover:border-primary/20'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                    {type === 'ACCEPTED' ? <CheckCircle size={20} /> : <Mail size={20} />}
                </div>
                <div>
                    <h3 className="font-bold text-white group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-sm text-gray-400"> Budget: ₹{project.budget} • <span className={`text-xs uppercase tracking-wide font-medium ${type === 'RECEIVED' ? 'text-blue-400' : ''}`}>{project.status}</span></p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                
                {/* Context Info */}
                {type === 'SENT' && (
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">Sent to</p>
                        <p className="text-sm text-white font-mono">{project.developer_email}</p>
                    </div>
                )}
                
                {type === 'RECEIVED' && (
                    <div className="text-right hidden sm:block">
                         <p className="text-xs text-gray-500">From Client</p>
                         <p className="text-sm text-white font-mono">{project.client_name || "Unknown Client"}</p>
                    </div>
                )}

                 {type === 'ACCEPTED' && (
                    <div className="text-right hidden sm:block">
                         <p className="text-xs text-gray-500">{role === 'CLIENT' ? 'Developer' : 'Client'}</p>
                         <p className="text-sm text-white font-mono">{role === 'CLIENT' ? project.developer_name : project.client_name}</p>
                    </div>
                )}


                {/* Actions */}
                <div className="flex items-center gap-2">
                    {type === 'RECEIVED' && onAccept && (
                        <Button onClick={onAccept} className="h-9 px-4 text-sm font-medium bg-blue-600 hover:bg-blue-700">
                            Review & Accept
                        </Button>
                    )}

                    {(type === 'SENT' || (type === 'ACCEPTED' && role === 'CLIENT')) && onRemove && (
                         <Button variant="outline" onClick={onRemove} disabled={actionLoading} className="h-9 px-4 text-sm bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:text-red-300">
                             {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Remove'}
                         </Button>
                    )}

                    {type === 'ACCEPTED' && role === 'DEVELOPER' && (
                         <Button variant="ghost" className="h-8 w-8 rounded-full p-0 text-gray-500 cursor-default">
                             <CheckCircle size={16} />
                         </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
