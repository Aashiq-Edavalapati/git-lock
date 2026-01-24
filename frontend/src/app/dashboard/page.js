"use client";

import { useState } from "react";
import ClientView from "@/components/dashboard/ClientView";
import DeveloperView from "@/components/dashboard/DeveloperView";
import { UserCircle2, Code2 } from "lucide-react";

export default function DashboardPage() {
  // MOCK AUTH STATE: Change this to test different views
  // In real app: const { role } = useAuth();
  const [userRole, setUserRole] = useState("client"); // 'client' | 'developer'

  return (
    <div className="relative">
      
      {/* --- DEMO ONLY: Role Switcher (Top Right) --- */}
      <div className="absolute top-0 right-0 z-50 flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-full">
        <button 
          onClick={() => setUserRole("client")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${userRole === 'client' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <UserCircle2 size={14} /> Client
        </button>
        <button 
          onClick={() => setUserRole("developer")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${userRole === 'developer' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <Code2 size={14} /> Dev
        </button>
      </div>

      {/* Render the appropriate Dashboard */}
      <div key={userRole} className="animate-in fade-in duration-500">
        {userRole === "client" ? <ClientView /> : <DeveloperView />}
      </div>

    </div>
  );
}