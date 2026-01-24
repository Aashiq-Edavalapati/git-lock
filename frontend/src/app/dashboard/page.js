"use client";

import { useState, useEffect } from "react";
import ClientView from "@/components/dashboard/ClientView";
import DeveloperView from "@/components/dashboard/DeveloperView";
import { getSession } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check who is logged in
    const user = getSession();
    if (user) {
        setRole(user.role);
    } else {
        // Fallback for demo if user goes directly to /dashboard without login
        // In real app: window.location.href = '/login';
        setRole("client"); // Default fallback
    }
    setLoading(false);
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
       {role === "developer" ? <DeveloperView /> : <ClientView />}
    </div>
  );
}