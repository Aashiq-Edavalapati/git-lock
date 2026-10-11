"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, UserPlus, FileCode, CheckCircle2, Loader2, ArrowRight, Lock, Unlock, Edit, Trash2, LayoutDashboard, History } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import Notifications from "./Notifications";
import PaymentHistoryTable from "./PaymentHistoryTable";

import ConfirmationModal from "./ConfirmationModal";
import CreateProjectModal from "./CreateProjectModal";
import ErrorModal from "./ErrorModal";

export default function ClientView() {
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", budget: "" });



  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    if (activeTab === 'payments' && payments.length === 0) {
      setLoadingPayments(true);
      api.get('/payments/history')
        .then(res => setPayments(res.data))
        .catch(console.error)
        .finally(() => setLoadingPayments(false));
    }
  }, [activeTab]);

  const refreshProjects = () => {
    api.get('/projects').then(res => setProjects(res.data)).catch(console.error);
  };

  const handleCreate = async (projectData) => {
    try {
      await api.post('/projects/create', projectData);
      setShowModal(false);
      refreshProjects();
    } catch (err) {
      setErrorModal({ isOpen: true, message: "Failed to create project" });
    }
  };

  // Invite Logic moved to page /dashboard/invite/[id]

  const confirmDelete = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);

    try {
      await api.delete(`/projects/${projectToDelete.id}`);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (err) {
      setErrorModal({ isOpen: true, message: err.response?.data?.error || "Failed to delete project" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Client Dashboard</h1>
          <p className="text-gray-400 text-sm">Manage projects and payments.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Notifications />
          <Button onClick={() => setShowModal(true)} className="rounded-full px-6 flex items-center gap-2"><Plus size={18} /> New Project</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-white/5 p-1 w-fit">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "projects" ? "bg-primary/20 text-primary shadow" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          <LayoutDashboard size={16} /> Projects
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "payments" ? "bg-primary/20 text-primary shadow" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          <History size={16} /> Payment History
        </button>
      </div>

      {activeTab === 'projects' ? (
        <div className="grid grid-cols-1 gap-4 text-white">
          {projects.length === 0 ? <div className="p-12 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">No projects found.</div> :
            projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onDelete={() => confirmDelete(p)}
              />
            ))
          }
        </div>
      ) : (
        <div className="glass-card p-6 rounded-xl border border-white/10">
          {loadingPayments ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-white" /></div> :
            <PaymentHistoryTable payments={payments} role="CLIENT" />
          }
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />


      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Project?"
        message={`Are you sure you want to delete "${projectToDelete?.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
        loadingText="Deleting Project..."
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        message={errorModal.message}
      />

    </div>
  );
}

function ProjectCard({ project, onDelete }) {
  return (
    <div className="glass-card p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5 relative group">

      {/* Actions: Absolute positioned or just flex at end? Let's assume standard layout */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/dashboard/projects/${project.id}`} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white" title="Edit Project">
          <Edit size={14} />
        </Link>
        <button onClick={onDelete} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-full text-red-500 hover:text-red-400" title="Delete Project">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><FileCode /></div>
        <div>
          <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
            <h3 className="font-bold text-white hover:text-primary transition-colors">{project.title}</h3>
          </Link>
          <p className="text-sm text-gray-400">₹{project.budget} • {project.status}</p>
        </div>
      </div>

      <div className="flex-1 md:text-right">
        {/* If developer_id is present or status is beyond INVITE_SENT */}
        {project.developer_id ? (
          <div className="flex items-center justify-end gap-2 text-green-400 text-sm">
            <CheckCircle2 size={16} /> Dev Connected ({project.developer_email})
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">

            {/* If Invite Sent, display status but allow re-sending via the page */}
            {project.status === 'INVITE_SENT' ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-yellow-500">Invite Sent ({project.developer_email})</span>
                <Link href={`/dashboard/invite/${project.id}`}>
                  <Button className="h-8 text-white text-xs bg-white/5 hover:bg-white/10 border border-white/10">
                    Resend
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href={`/dashboard/invite/${project.id}`}>
                  <Button className="h-8 text-xs min-w-[80px]">
                    Invite Developer
                  </Button>
                </Link>
              </>
            )}

          </div>
        )}
      </div>

      <div className="mr-8">
        {/* If status is in escrow lifecycle, show View Vault button */}
        {(['LOCKED_REVIEW', 'APPROVED', 'ESCROW_FUNDED', 'OWNERSHIP_VERIFIED', 'COMPLETED'].includes(project.status)) ? (
          <Link href={`/dashboard/escrow/${project.id}`}>
            <Button variant={project.status === 'COMPLETED' ? 'default' : 'outline'} className="h-10 flex items-center gap-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
              {project.status === 'COMPLETED' ? <Unlock size={16} className="text-green-400" /> : <Lock size={16} className="text-primary" />} View Vault
            </Button>
          </Link>
        ) : (
          <span className="text-xs text-gray-500">Waiting for Lock</span>
        )}
      </div>
    </div>
  );
}
