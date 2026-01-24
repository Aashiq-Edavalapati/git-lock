"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserPlus, FileCode, Search, Mail, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ClientView() {
  const [showModal, setShowModal] = useState(false);
  
  // Mock Projects: "Invite Sent" simulates a pending Dev connection
  const [projects, setProjects] = useState([
    { id: 1, name: "E-Commerce MVP", budget: "₹50,000", status: "Active", dev: "aashiq.dev" },
    { id: 2, name: "Portfolio Site", budget: "₹15,000", status: "Draft", dev: null },
  ]);

  const [newProject, setNewProject] = useState({ name: "", budget: "" });

  const handleCreate = () => {
    const project = {
      id: projects.length + 1,
      name: newProject.name,
      budget: `₹${newProject.budget}`,
      status: "Draft",
      dev: null
    };
    setProjects([...projects, project]);
    setShowModal(false);
    setNewProject({ name: "", budget: "" });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Client Dashboard</h1>
          <p className="text-gray-400 text-sm">Create projects and hire developers securely.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="rounded-full px-6 flex items-center gap-2">
          <Plus size={18} /> Create Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-8 rounded-2xl w-full max-w-md border-primary/20"
            >
              <h2 className="text-2xl font-bold mb-6">New Project Brief</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Project Name</label>
                  <input 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none" 
                    placeholder="e.g. AI SaaS Platform"
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Budget (INR)</label>
                  <input 
                    type="number" 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none" 
                    placeholder="50000"
                    value={newProject.budget}
                    onChange={e => setNewProject({...newProject, budget: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1" onClick={handleCreate}>Create</Button>
                  <button onClick={() => setShowModal(false)} className="px-4 text-gray-400 hover:text-white">Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for individual project card
function ProjectCard({ project }) {
  const [inviteMode, setInviteMode] = useState(false);
  const [inviteStatus, setInviteStatus] = useState("idle"); // idle, loading, sent

  const handleInvite = () => {
    setInviteStatus("loading");
    setTimeout(() => setInviteStatus("sent"), 1500); // Simulate API
  };

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/30 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${project.status === 'Draft' ? 'bg-white/5 text-gray-500' : 'bg-primary/10 text-primary'}`}>
          <FileCode size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">{project.name}</h3>
          <p className="text-sm text-gray-400">{project.budget} • <span className={project.status === 'Active' ? 'text-green-400' : 'text-gray-400'}>{project.status}</span></p>
        </div>
      </div>

      <div className="flex-1 md:border-l md:border-white/10 md:pl-8">
        {project.dev ? (
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
              <div>
                  <p className="text-sm font-medium text-white">Dev: {project.dev}</p>
                  <p className="text-xs text-green-400">Connected</p>
              </div>
           </div>
        ) : (
           !inviteMode ? (
             <button 
               onClick={() => setInviteMode(true)}
               className="text-sm text-primary hover:underline flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20 transition-all"
             >
                <UserPlus size={14} /> Invite Developer
             </button>
           ) : (
             <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                {inviteStatus === "sent" ? (
                   <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 size={16}/> Invite Sent</span>
                ) : (
                   <>
                     <input placeholder="dev@email.com" className="bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none w-48" />
                     <button onClick={handleInvite} className="p-1.5 bg-primary rounded text-black hover:scale-105 transition-transform">
                        {inviteStatus === "loading" ? <Loader2 size={14} className="animate-spin"/> : <ArrowRight size={14}/>}
                     </button>
                   </>
                )}
             </div>
           )
        )}
      </div>
    </div>
  );
}