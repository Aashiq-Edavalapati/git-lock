"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, UserPlus, FileCode, CheckCircle2, Loader2, ArrowRight, Lock, Unlock } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import Notifications from "./Notifications";

export default function ClientView() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", budget: "" });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    refreshProjects();
  }, []);

  const refreshProjects = () => {
    api.get('/projects').then(res => setProjects(res.data)).catch(console.error);
  };

  const handleCreate = async () => {
    if (!newProject.title || !newProject.budget) return;
    setIsCreating(true);
    try {
      await api.post('/projects/create', { title: newProject.title, description: "New Project", budget: newProject.budget });
      setShowModal(false);
      setNewProject({ title: "", budget: "" });
      refreshProjects();
    } catch (err) {
      alert("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async (projectId, email) => {
    try {
      await api.post('/projects/invite', { projectId, developerEmail: email });
      refreshProjects();
      alert("Invite Sent!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to invite");
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

      <div className="grid grid-cols-1 gap-4">
        {projects.length === 0 ? <div className="p-12 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">No projects found.</div> :
          projects.map(p => <ProjectCard key={p.id} project={p} onInvite={handleInvite} />)
        }
      </div>

      {
        showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#111] p-6 rounded-xl w-full max-w-md border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Create Project</h2>
              <input className="w-full bg-black border border-white/10 p-2 text-white mb-2 rounded" placeholder="Project Title" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} />
              <input className="w-full bg-black border border-white/10 p-2 text-white mb-4 rounded" placeholder="Budget (₹)" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1" disabled={isCreating}>
                  {isCreating ? <span className="flex items-center gap-2 justify-center"><Loader2 className="animate-spin" size={16} /> Creating...</span> : 'Create'}
                </Button>
                <button onClick={() => setShowModal(false)} className="text-gray-400" disabled={isCreating}>Cancel</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

function ProjectCard({ project, onInvite }) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><FileCode /></div>
        <div>
          <h3 className="font-bold text-white">{project.title}</h3>
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
            <input className="bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white w-48" placeholder="dev@demo.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Button onClick={async () => {
              setIsInviting(true);
              await onInvite(project.id, email);
              setIsInviting(false);
            }} className="h-8 text-xs min-w-[80px]" disabled={isInviting}>
              {isInviting ? <Loader2 className="animate-spin" size={14} /> : (project.status === 'INVITE_SENT' ? 'Re-Invite' : 'Invite')}
            </Button>
          </div>
        )}
      </div>

      <div>
        {/* If status is LOCKED_REVIEW or COMPLETED, show button */}
        {(project.status === 'LOCKED_REVIEW' || project.status === 'COMPLETED') ? (
          <Link href={`/dashboard/escrow/${project.id}`}>
            <Button variant={project.status === 'COMPLETED' ? 'default' : 'outline'} className="h-10 flex items-center gap-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
              {project.status === 'COMPLETED' ? <Unlock size={16} className="text-green-400" /> : <Lock size={16} />} View Vault
            </Button>
          </Link>
        ) : (
          <span className="text-xs text-gray-500">Waiting for Lock</span>
        )}
      </div>
    </div>
  );
}