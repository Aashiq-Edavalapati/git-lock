"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, PlusCircle, 
  Settings, LogOut, FileCode, Menu, Bell, Mail,
  ChevronLeft, ChevronRight, User 
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Mail, label: "Invitations", href: "/dashboard/invitations" },
  { icon: PlusCircle, label: "New Lock", href: "/dashboard/create" },
  { icon: FileCode, label: "My Contracts", href: "/dashboard/contracts" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Determine Role for sidebar filtering and User for profile
    const fetchUser = async () => {
        try {
            const { data } = await import("@/lib/api").then(m => m.default.get('/auth/me'));
            setUser(data);
        } catch(e) {}
    }
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* --- SIDEBAR (Desktop) --- */}
      <aside 
        className={`hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-white/5 bg-black/20 backdrop-blur-xl z-50 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} relative`}>
          <div className="w-8 h-8 flex-shrink-0 bg-primary rounded-full shadow-[0_0_15px_var(--primary)] flex items-center justify-center">
             <span className="font-bold text-black text-xs">G</span>
          </div>
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: "auto" }} 
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-xl tracking-tight overflow-hidden whitespace-nowrap"
              >
                GitLock
              </motion.span>
            )}
          </AnimatePresence>

            {/* Toggle Button */}
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute -right-3 top-8 bg-[#1a1a1a] border border-white/10 rounded-full p-1 text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle Sidebar"
            >
                {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          {sidebarItems.map((item) => {
            // "New Lock" (PlusCircle) is only for DEVELOPER
            if (item.label === "New Lock" && user?.role !== "DEVELOPER") return null;

            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
                    isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  } ${isSidebarCollapsed ? "justify-center" : ""}`}
                  title={isSidebarCollapsed ? item.label : ""}
                >
                  <item.icon size={20} className={`flex-shrink-0 ${isActive ? "text-primary drop-shadow-[0_0_5px_rgba(204,255,0,0.5)]" : "group-hover:text-white"}`} />
                  
                  {!isSidebarCollapsed && (
                     <motion.span 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="font-medium whitespace-nowrap overflow-hidden"
                     >
                        {item.label}
                     </motion.span>
                  )}
                  
                  {isActive && !isSidebarCollapsed && (
                    <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          
          {/* Profile Circle Link */}
          <Link href="/dashboard/settings">
            <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group hover:bg-white/5 ${isSidebarCollapsed ? "justify-center" : ""}`}>
               <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-black overflow-hidden relative">
                  {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                      user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />
                  )}
               </div>
               
               {!isSidebarCollapsed && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="flex flex-col overflow-hidden"
                 >
                    <span className="font-medium text-sm text-white truncate">{user?.name || "User"}</span>
                    <span className="text-xs text-gray-500 truncate">{user?.role || "Member"}</span>
                 </motion.div>
               )}
            </div>
          </Link>

          <button onClick={async () => {
              try {
                  await import("@/lib/api").then(m => m.default.post('/auth/logout'));
                  window.location.href = "/login";
              } catch(e) { console.error(e); }
          }} className={`flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-400 transition-colors w-full ${isSidebarCollapsed ? "justify-center" : ""}`}
             title={isSidebarCollapsed ? "Sign Out" : ""}
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAV TOGGLE --- */}
      <div className="md:hidden fixed top-0 left-0 w-full p-4 z-50 bg-black/50 backdrop-blur-md flex justify-between items-center border-b border-white/5">
         <span className="font-bold">GitLock</span>
         <button onClick={() => setIsMobileOpen(!isMobileOpen)}><Menu /></button>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main 
        className={`flex-1 p-6 md:p-12 relative z-10 pt-20 md:pt-12 transition-all duration-300 ease-in-out ${
           isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        {children}
      </main>

    </div>
  );
}