"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Unlock, Plus, Code2, LayoutDashboard, Coins, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import Notifications from "./Notifications";
import PaymentHistoryTable from "./PaymentHistoryTable";

export default function DeveloperView() {
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    if (activeTab === 'earnings' && payments.length === 0) {
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Developer Console</h1>
          <p className="text-gray-400 text-sm">Manage incoming jobs.</p>
        </div>

        <div className="flex items-center gap-4">
          <Notifications />
          <Link href="/dashboard/create">
            <Button className="rounded-full px-6 flex items-center gap-2">
              <Plus size={18} /> Create Lock
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-white/5 p-1 w-fit">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "projects" ? "bg-primary/20 text-primary shadow" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          <LayoutDashboard size={16} /> Active Projects
        </button>
        <button
          onClick={() => setActiveTab("earnings")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "earnings" ? "bg-primary/20 text-primary shadow" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          <Coins size={16} /> Earnings & History
        </button>
      </div>

      {activeTab === 'projects' ? (
        <div className="grid grid-cols-1 gap-4 text-white">
          {projects.length === 0 && <div className="p-12 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">No active projects. Wait for an invite from a client.</div>}

          {projects.map((project) => (
            <div key={project.id} className="glass-card p-6 rounded-xl flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500"><Code2 /></div>
                <div>
                  <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                    <h3 className="font-bold text-white hover:text-blue-400 transition-colors">{project.title}</h3>
                  </Link>
                  <p className="text-sm text-gray-400">Status: <span className="text-white">{project.status}</span></p>
                </div>
              </div>

              <div>
                {(['LOCKED_REVIEW', 'APPROVED', 'ESCROW_FUNDED', 'OWNERSHIP_VERIFIED', 'COMPLETED'].includes(project.status)) ? (
                  <Link href={`/dashboard/escrow/${project.id}`}>
                    <Button variant="outline" className="flex items-center gap-2 border-white/10 bg-white/5 hover:bg-white/10">
                      {project.status === 'COMPLETED' ? <Unlock size={16} className="text-green-400" /> : <Lock size={16} className="text-primary" />} View Vault
                    </Button>
                  </Link>
                ) : project.status === 'INVITE_SENT' ? (
                  <Link href={`/dashboard/accept-invite/${project.id}`}>
                    <Button variant="outline" className="flex items-center gap-2 text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10">
                      <ShieldCheck size={16} /> View Invite
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/dashboard/create?projectId=${project.id}&budget=${encodeURIComponent(project.budget)}`}>
                    <Button className="flex items-center gap-2">
                      <Lock size={16} /> Initialize Lock
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-6 rounded-xl border border-white/10">
          {loadingPayments ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-white" /></div> :
            <PaymentHistoryTable payments={payments} role="DEVELOPER" />
          }
        </div>
      )}
    </div>
  );
}