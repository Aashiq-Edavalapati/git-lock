"use client";

import { useState, useEffect } from "react";
import ClientView from "@/components/dashboard/ClientView";
import DeveloperView from "@/components/dashboard/DeveloperView";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check who is logged in
    api.get('/auth/me')
      .then(res => {
          setRole(res.data.role);
          setLoading(false);
      })
      .catch(async () => {
          try {
             await api.post('/auth/logout');
          } catch(e) { console.error("Logout failed during cleanup", e); }
          window.location.href = '/login';
      });
  }, []);

  if (loading) {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-500">
            <Loader2 size={32} className="animate-spin mb-4 text-primary" />
            <p>Loading Secure Workspace...</p>
        </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
       {role === "DEVELOPER" ? <DeveloperView /> : <ClientView />}
    </div>
  );
}