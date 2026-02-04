"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, UserCircle2, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper for classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function DashboardPreview() {
  const [activeView, setActiveView] = useState("developer"); // 'developer' | 'client'

  return (
    <section className="w-full max-w-7xl px-6 pb-40 relative z-10">
      
      {/* Section Header */}
      <div className="text-center mb-10 space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold">
          One Platform. <span className="text-primary">Two Perspectives.</span>
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Whether you're shipping code or funding it, GitLock provides a purpose-built interface for your workflow.
        </p>
      </div>

      {/* --- FLOATING TOGGLE SWITCH --- */}
      <div className="flex justify-center mb-8">
        <div className="p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-1 relative z-20 shadow-2xl">
          {/* Developer Toggle */}
          <button
            onClick={() => setActiveView("developer")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 relative",
              activeView === "developer" ? "text-black" : "text-gray-400 hover:text-white"
            )}
          >
            {activeView === "developer" && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-primary rounded-full shadow-[0_0_20px_rgba(204,255,0,0.4)]"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Code2 size={16} /> Developer Console
            </span>
          </button>

          {/* Client Toggle */}
          <button
            onClick={() => setActiveView("client")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 relative",
              activeView === "client" ? "text-black" : "text-gray-400 hover:text-white"
            )}
          >
            {activeView === "client" && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-primary rounded-full shadow-[0_0_20px_rgba(204,255,0,0.4)]"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <UserCircle2 size={16} /> Client Dashboard
            </span>
          </button>
        </div>
      </div>

      {/* --- DASHBOARD PREVIEW CONTAINER --- */}
      <div className="relative rounded-2xl p-2 glass-card-strong overflow-hidden group min-h-[300px] md:min-h-[600px] lg:min-h-[800px]">
        
        {/* Dynamic Image Switcher */}
        <div className="relative w-full h-full aspect-[16/10]">
          <AnimatePresence mode="wait">
            
            {activeView === "developer" ? (
              <motion.div
                key="dev"
                initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src="/PagePreviewFullPage.png" // Ensure this file exists
                  alt="Developer Dashboard"
                  fill
                  className="rounded-xl object-cover object-top"
                  priority
                />
                
                {/* Floating Tooltip 1 (Dev) */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="absolute top-[20%] right-[5%] p-3 bg-black/80 backdrop-blur-md border border-primary/30 rounded-xl shadow-2xl flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Code2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Action</p>
                    <p className="text-sm font-bold text-white">Upload & Lock Code</p>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="client"
                initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {/* IMPORTANT: You need to add this image to your public folder! 
                   Take a screenshot of the Client View we built.
                */}
                <Image
                  src="/ClientPagePreview.png" 
                  alt="Client Dashboard"
                  fill
                  className="rounded-xl object-cover object-top"
                  priority
                />

                {/* Floating Tooltip 2 (Client) */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="absolute top-[20%] left-[5%] p-3 bg-black/80 backdrop-blur-md border border-blue-500/30 rounded-xl shadow-2xl flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Action</p>
                    <p className="text-sm font-bold text-white">Verify & Release Payment</p>
                  </div>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Ambient Gradient Overlay (Bottom) */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
}