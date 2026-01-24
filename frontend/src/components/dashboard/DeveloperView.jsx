"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Check, X, ShieldCheck, Lock, 
  ArrowRight, Briefcase 
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function DeveloperView() {
  
  // Mock Invites (This would come from DB where client invited this email)
  const [invites, setInvites] = useState([
    { id: 101, client: "Sarah Connor", project: "Skynet Security Patch", budget: "₹1,20,000" }
  ]);

  // Mock Active Projects (Accepted invites)
  const [activeProjects, setActiveProjects] = useState([
    { id: 201, client: "John Wick", project: "Continental Database", budget: "₹45,000", lockStatus: "Pending" }
  ]);

  const handleAccept = (invite) => {
    // Move from invites to active
    setInvites(invites.filter(i => i.id !== invite.id));
    setActiveProjects([...activeProjects, { ...invite, id: Date.now(), lockStatus: "Pending" }]);
  };

  const handleDecline = (id) => {
    setInvites(invites.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Developer Console</h1>
        <p className="text-gray-400 text-sm">Manage incoming jobs and secure your code.</p>
      </div>

      {/* --- INVITATIONS SECTION --- */}
      {invites.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Bell size={14} className="text-primary" /> Pending Invites
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {invites.map((invite) => (
                <motion.div 
                  key={invite.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-5 rounded-xl border-l-4 border-l-primary flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-white">{invite.project}</h3>
                    <p className="text-sm text-gray-400">Client: {invite.client}</p>
                    <p className="text-xs text-primary mt-1 font-mono">{invite.budget}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDecline(invite.id)}
                      className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                      title="Decline"
                    >
                      <X size={20} />
                    </button>
                    <button 
                      onClick={() => handleAccept(invite)}
                      className="p-2 bg-primary text-black rounded-lg hover:bg-white transition-colors"
                      title="Accept & Start"
                    >
                      <Check size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* --- ACTIVE WORKSPACE --- */}
      <section className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Briefcase size={14} /> Active Workspaces
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {activeProjects.map((project) => (
            <div key={project.id} className="glass-card p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6 group">
              
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    <ShieldCheck size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg text-white">{project.project}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                       <span>{project.client}</span>
                       <span>•</span>
                       <span>{project.budget}</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 {/* Status Indicator */}
                 <div className={`px-3 py-1 rounded-full text-xs font-medium border ${project.lockStatus === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-500'}`}>
                    {project.lockStatus === 'Pending' ? 'Not Locked' : 'Secure'}
                 </div>

                 {/* Action Button: Moves to /create with context */}
                 {project.lockStatus === 'Pending' ? (
                   <Link href={`/dashboard/create?projectId=${project.id}&client=${encodeURIComponent(project.client)}`}>
                     <Button className="flex items-center gap-2">
                        <Lock size={16} /> Initialize Lock
                     </Button>
                   </Link>
                 ) : (
                   <Button variant="outline">View Contract</Button>
                 )}
              </div>

            </div>
          ))}

          {activeProjects.length === 0 && (
             <div className="p-12 text-center border border-dashed border-white/10 rounded-xl text-gray-500">
                No active projects. Accept an invite to get started.
             </div>
          )}
        </div>
      </section>

    </div>
  );
}