"use client";

import { use, useState, useEffect } from "react";
import api from "@/lib/api";
import { ArrowLeft, Edit, Trash2, ShieldCheck, User, Calendar, DollarSign, Lock, Unlock, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BudgetRequestModal from "@/components/dashboard/BudgetRequestModal";
import BudgetApprovalModal from "@/components/dashboard/BudgetApprovalModal";
import ConfirmationModal from "@/components/dashboard/ConfirmationModal";
import InviteDevModal from "@/components/dashboard/InviteDevModal";

export default function ProjectDetailsPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", description: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Budget State
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false); // New Modal state
    const [isApprovingBudget, setIsApprovingBudget] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    
    // Revoke State
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    const handleDelete = async () => {
        // Confirmation is handled by the Modal, so we proceed directly
        setIsDeleting(true);
        try {
            await api.delete(`/projects/${id}`);
            router.push('/dashboard');
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete project");
            setIsDeleting(false); // Only reset if failed. If success, we redirect.
            setShowDeleteModal(false);
        }
    };

    const handleRevoke = async () => {
        setIsRevoking(true);
        try {
            await api.post(`/projects/${id}/revoke`);
            router.push('/dashboard');
        } catch (err) {
            alert(err.response?.data?.error || "Failed to revoke acceptance");
            setIsRevoking(false);
            setShowRevokeModal(false);
        }
    };

    const fetchData = async () => {
        try {
            const [projRes, userRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get('/auth/me')
            ]);
            setProject(projRes.data);
            setCurrentUser(userRes.data);
            
            // Init Edit Form
            setEditForm({ 
                title: projRes.data.title, 
                description: projRes.data.description 
            });

            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            await api.put(`/projects/${id}/safe`, editForm);
            setProject(prev => ({ ...prev, ...editForm }));
            setIsEditing(false);
            alert("Details updated successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update details");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBudgetAction = async (action) => {
        if (action === 'approve') {
            setShowApprovalModal(true);
            return;
        }

        // Reject Action (No OTP needed for rejection)
        if(!confirm(`Are you sure you want to REJECT the budget change?`)) return;
        setIsApprovingBudget(true);
        try {
            await api.post(`/projects/${id}/budget-reject`);
            fetchData();
            alert(`Budget request rejected!`);
        } catch (err) {
            alert(err.response?.data?.error || "Action failed");
        } finally {
            setIsApprovingBudget(false);
        }
    };
    

    const handleInvite = async ({ email, subject, body }) => {
        try {
          await api.post('/projects/invite', { projectId: id, developerEmail: email, subject, body });
          fetchData();
          alert("Invite Sent!");
        } catch (err) {
          alert(err.response?.data?.error || "Failed to invite");
        }
    };

    if (loading) return <div className="p-20 text-center text-white">Loading Details...</div>;
    if (!project) return <div className="p-20 text-center text-white">Project Not Found</div>;

    const isClient = currentUser.role === 'CLIENT';
    // Use loose equality for ID comparison (string vs number safe)
    const isOwner = isClient && project.client_id == currentUser.id;
    const isDev = currentUser.role === 'DEVELOPER';
    const isAssignedDev = isDev && project.developer_id == currentUser.id;
    const isLocked = project.status === 'LOCKED_REVIEW' || project.status === 'COMPLETED';

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 flex-1">
                    <Link href="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm mb-2">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    
                    {isEditing ? (
                        <div className="flex gap-2 items-center">
                            <input 
                                className="bg-white/10 border border-white/20 p-2 rounded text-3xl font-bold text-white w-full"
                                value={editForm.title}
                                onChange={e => setEditForm({...editForm, title: e.target.value})}
                            />
                        </div>
                    ) : (
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            {project.title}
                            <span className="text-sm px-3 py-1 bg-white/10 rounded-full border border-white/10 font-normal">
                                {project.status}
                            </span>
                        </h1>
                    )}
                </div>

                <div className="flex gap-3">
                     {isOwner && !isEditing && (
                         <>
                            <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                                <Edit size={16} /> Edit Details
                            </Button>
                            <Button onClick={() => setShowDeleteModal(true)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 flex items-center gap-2">
                                <Trash2 size={16} /> Delete
                            </Button>
                         </>
                     )}

                     {isAssignedDev && !isLocked && (
                        <Button 
                            onClick={() => setShowRevokeModal(true)} 
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Revoke Acceptance
                        </Button>
                     )}

                     {isOwner && isEditing && (
                         <div className="flex gap-2">
                             <Button onClick={handleSaveDetails} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
                                 {isSaving ? "Saving..." : "Save Changes"}
                             </Button>
                             <Button onClick={() => { setIsEditing(false); setEditForm({title: project.title, description: project.description}) }} variant="outline">
                                 Cancel
                             </Button>
                         </div>
                     )}
                     
                     {isLocked && (
                         <Link href={`/dashboard/escrow/${id}`}>
                             <Button className="bg-primary hover:bg-primary/80 text-black font-bold flex items-center gap-2">
                                 {project.status === 'COMPLETED' ? <Unlock size={16}/> : <Lock size={16}/>} 
                                 Open Vault
                             </Button>
                         </Link>
                     )}
                </div>
            </div>
            
            {/* PENDING BUDGET ALERT (For Developer) */}
            {isAssignedDev && project.pending_budget && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-full text-yellow-500"><DollarSign size={20}/></div>
                        <div>
                            <h3 className="text-yellow-500 font-bold">Budget Change Requested</h3>
                            <p className="text-gray-400 text-sm">Client wants to change budget from <span className="text-white">₹{project.budget}</span> to <span className="text-green-400 font-bold">₹{project.pending_budget}</span>.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => handleBudgetAction('approve')} className="bg-green-500 hover:bg-green-600 text-black" disabled={isApprovingBudget}>Approve</Button>
                        <Button onClick={() => handleBudgetAction('reject')} className="bg-red-500/20 hover:bg-red-500/30 text-red-400" disabled={isApprovingBudget}>Reject</Button>
                    </div>
                </div>
            )}

            {/* PENDING BUDGET ALERT (For Client) */}
            {isOwner && project.pending_budget && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-full text-blue-500"><Loader2 className="animate-spin" size={20}/></div>
                        <div>
                            <h3 className="text-blue-500 font-bold">Budget Update Pending</h3>
                            <p className="text-gray-400 text-sm">Waiting for developer approval to change budget to <span className="text-white font-bold">₹{project.pending_budget}</span>.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Details */}
            <div className="glass-card p-8 rounded-2xl border-white/5 space-y-8">
                 <div className="space-y-2">
                     <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <h3 className="text-lg font-bold text-white">Description</h3>
                     </div>
                     {isEditing ? (
                         <textarea 
                             className="w-full h-32 bg-white/5 border border-white/10 rounded p-4 text-white resize-none"
                             value={editForm.description}
                             onChange={e => setEditForm({...editForm, description: e.target.value})}
                         />
                     ) : (
                         <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{project.description || "No description provided."}</p>
                     )}
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-1">
                            <div className="text-xs text-gray-500 uppercase font-bold">Budget</div>
                            {isOwner && (
                                <button onClick={() => setShowBudgetModal(true)} className="text-xs text-primary hover:underline ml-2">
                                    {project.pending_budget ? "(Update Request)" : "Change"}
                                </button>
                            )}
                        </div>
                        <div className="text-white font-medium truncate flex items-center gap-2">
                            ₹{project.budget}
                            {/* Visual lock if status is locked */}
                            {isLocked && <Lock size={12} className="text-gray-500"/>}
                        </div>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Created At</div>
                        <div className="text-white font-medium truncate">{new Date(project.created_at).toLocaleDateString()}</div>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Project ID</div>
                        <div className="text-white font-medium truncate">{project.id}</div>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Status</div>
                        <div className="text-white font-medium truncate">{project.status}</div>
                     </div>
                 </div>

                 {/* Team Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                     {/* Client Info */}
                     <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                         <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                                 <User size={20} />
                             </div>
                             <div>
                                 <h4 className="text-white font-bold">Client</h4>
                                 <p className="text-xs text-gray-500">Project Owner</p>
                             </div>
                         </div>
                         <div className="space-y-2 text-sm">
                             <div className="flex justify-between"><span className="text-gray-500">Name</span> <span className="text-gray-300">{project.client_name || 'Hidden'}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500">Email</span> <span className="text-gray-300">{project.client_email || 'Hidden'}</span></div>
                         </div>
                     </div>

                     {/* Developer Info */}
                     <div className="bg-black/20 p-6 rounded-xl border border-white/5 relative">
                         <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                 <ShieldCheck size={20} />
                             </div>
                             <div>
                                 <h4 className="text-white font-bold">Developer</h4>
                                 <p className="text-xs text-gray-500">Assigned Expert</p>
                             </div>
                         </div>
                         
                         {project.developer_id ? (
                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Name</span> <span className="text-gray-300">{project.developer_name || 'Connected'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Email</span> <span className="text-gray-300">{project.developer_email}</span></div>
                                <div className="mt-4 pt-2 border-t border-white/10 text-center text-green-400 text-xs flex items-center justify-center gap-2">
                                    <ShieldCheck size={12}/> Verified Connection
                                </div>
                             </div>
                         ) : (
                             <div className="text-center py-4 space-y-3">
                                 <p className="text-gray-500 text-sm">{project.developer_email ? `Invite pending for ${project.developer_email}` : "No developer assigned"}</p>
                                 {isOwner && (
                                     <Button onClick={() => setShowInviteModal(true)} className="h-8 text-xs">
                                         {project.developer_email ? 'Resend Invite' : 'Invite Developer'}
                                     </Button>
                                 )}
                             </div>
                         )}
                     </div>
                 </div>
            </div>

            {/* Modals */}
            <BudgetRequestModal 
                isOpen={showBudgetModal} 
                onClose={() => setShowBudgetModal(false)}
                projectId={project.id}
                currentBudget={project.pending_budget ? parseFloat(project.pending_budget) : parseFloat(project.budget)}
                onSuccess={() => fetchData()} 
            />

            <BudgetApprovalModal
                isOpen={showApprovalModal}
                onClose={() => setShowApprovalModal(false)}
                projectId={project.id}
                currentBudget={project.budget}
                pendingBudget={project.pending_budget}
                onSuccess={() => fetchData()}
            />
            
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Project?"
                message="Are you sure? This cannot be undone."
                isLoading={isDeleting}
            />

            <ConfirmationModal
                isOpen={showRevokeModal}
                onClose={() => !isRevoking && setShowRevokeModal(false)}
                onConfirm={handleRevoke}
                title="Revoke Acceptance?"
                message="Are you sure you want to leave this project? The client will be notified."
                isLoading={isRevoking}
            />

            <InviteDevModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSend={handleInvite}
                defaultEmail={project.developer_email || ""}
            />
        </div>
    );
}
