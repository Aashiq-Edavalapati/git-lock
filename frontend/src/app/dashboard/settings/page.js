"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, Github, CreditCard, Shield, 
  LogOut, Save, CheckCircle2, AlertCircle 
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile"); // profile, billing, security
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your identity and payout preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/10">
        {['profile', 'billing', 'security'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium capitalize transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="glass-card p-8 rounded-2xl min-h-[400px]">
        
        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border-2 border-white/10 flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
               </div>
               <div>
                  <Button variant="outline" className="text-xs h-8">Change Avatar</Button>
                  <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max 1MB.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
                  <input type="text" defaultValue="Aashiq Edavalapati" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" defaultValue="aashiq@example.com" disabled className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-gray-400 cursor-not-allowed" />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bio / Headline</label>
                  <textarea rows="3" defaultValue="Full Stack Developer specialized in React & Node." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none resize-none" />
               </div>
            </div>
          </motion.div>
        )}

        {/* --- BILLING / PAYOUTS TAB --- */}
        {activeTab === 'billing' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              
              {/* Connected Accounts */}
              <section className="space-y-4">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Github size={20} /> Repository Access
                 </h3>
                 <div className="p-4 rounded-xl border border-white/10 bg-black/20 flex justify-between items-center">
                    <div>
                       <p className="font-bold text-white">GitHub Account</p>
                       <p className="text-xs text-gray-400">Required to verify commit hashes.</p>
                    </div>
                    {isGithubConnected ? (
                       <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-full">
                          <CheckCircle2 size={16} /> Connected
                       </div>
                    ) : (
                       <Button onClick={() => setIsGithubConnected(true)} variant="outline" className="h-9">Connect GitHub</Button>
                    )}
                 </div>
              </section>

              <hr className="border-white/5" />

              {/* Payout Method */}
              <section className="space-y-4">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard size={20} /> Payout Method
                 </h3>
                 <p className="text-sm text-gray-400">Where should we send your escrowed funds?</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-primary/50 bg-primary/5 relative cursor-pointer">
                       <div className="absolute top-3 right-3 text-primary"><CheckCircle2 size={18} /></div>
                       <p className="font-bold text-white">UPI ID</p>
                       <p className="text-sm text-gray-300 mt-1">aashiq@okhdfcbank</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/10 bg-black/20 hover:border-white/30 cursor-pointer transition-colors flex flex-col justify-center items-center text-gray-400 hover:text-white">
                       <span className="text-2xl mb-1">+</span>
                       <span className="text-xs font-bold uppercase">Add Bank Account</span>
                    </div>
                 </div>
              </section>
           </motion.div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                 <h4 className="font-bold text-red-400 flex items-center gap-2 mb-2">
                    <AlertCircle size={18} /> Danger Zone
                 </h4>
                 <p className="text-xs text-gray-400 mb-4">
                    Deleting your account will permanently remove all locked contracts and encryption keys. This action cannot be undone.
                 </p>
                 <Button variant="danger" className="bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white">
                    Delete Account
                 </Button>
              </div>
           </motion.div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="flex justify-end pt-4">
         <Button onClick={handleSave} className="w-32" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
         </Button>
      </div>

    </div>
  );
}