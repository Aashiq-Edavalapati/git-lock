"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, PlusCircle, ShieldCheck, 
  Settings, LogOut, FileCode, Menu 
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: PlusCircle, label: "New Lock", href: "/dashboard/create" },
  { icon: FileCode, label: "My Contracts", href: "/dashboard/contracts" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-black/20 backdrop-blur-xl z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_var(--primary)]" />
          <span className="font-bold text-xl tracking-tight">GitLock</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <item.icon size={20} className={isActive ? "text-primary drop-shadow-[0_0_5px_rgba(204,255,0,0.5)]" : "group-hover:text-white"} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={async () => {
              try {
                  await import("@/lib/api").then(m => m.default.post('/auth/logout'));
                  window.location.href = "/login";
              } catch(e) { console.error(e); }
          }} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors w-full">
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAV TOGGLE --- */}
      <div className="md:hidden fixed top-0 left-0 w-full p-4 z-50 bg-black/50 backdrop-blur-md flex justify-between items-center border-b border-white/5">
         <span className="font-bold">GitLock</span>
         <button onClick={() => setIsMobileOpen(!isMobileOpen)}><Menu /></button>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 relative z-10 pt-20 md:pt-12">
        {children}
      </main>

    </div>
  );
}