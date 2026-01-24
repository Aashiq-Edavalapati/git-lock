"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, Filter, Lock, Unlock, 
  MoreVertical, FileCode, Calendar 
} from "lucide-react";

export default function ContractsPage() {
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'completed'

  // Mock Data
  const contracts = [
    { id: "LOCK-8821", name: "E-Commerce Frontend", client: "Sarah Connor", amount: "₹50,000", status: "Active", date: "Oct 24, 2026" },
    { id: "LOCK-9921", name: "Python AI Bot", client: "John Wick", amount: "₹25,000", status: "Completed", date: "Sep 12, 2026" },
    { id: "LOCK-1120", name: "React Dashboard", client: "Tony Stark", amount: "₹1,20,000", status: "Active", date: "Oct 28, 2026" },
  ];

  const filteredContracts = filter === 'all' 
    ? contracts 
    : filter === 'active' 
      ? contracts.filter(c => c.status === 'Active') 
      : contracts.filter(c => c.status === 'Completed');

  return (
    <div className="space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Contracts</h1>
          <p className="text-gray-400 text-sm">Track your active escrows and history.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search contracts..." 
              className="bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-primary/50 outline-none w-64"
            />
          </div>
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredContracts.map((contract) => (
          <div 
            key={contract.id} 
            className="glass-card p-0 rounded-xl flex flex-col md:flex-row items-center overflow-hidden hover:border-primary/30 transition-all group"
          >
            {/* Status Strip */}
            <div className={`w-full md:w-2 h-2 md:h-full ${contract.status === 'Active' ? 'bg-yellow-500' : 'bg-green-500'}`} />
            
            <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
              
              {/* Info */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${contract.status === 'Active' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                  {contract.status === 'Active' ? <Lock size={20} /> : <Unlock size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-primary transition-colors">{contract.name}</h3>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <span className="font-mono text-xs opacity-50">{contract.id}</span> • {contract.client}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-8 text-sm">
                 <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={14} /> {contract.date}
                 </div>
                 <div className="font-bold text-white text-lg">
                    {contract.amount}
                 </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                 <Link href={`/dashboard/escrow/${contract.id}`}>
                    <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
                      View Vault
                    </button>
                 </Link>
                 <button className="p-2 text-gray-500 hover:text-white">
                    <MoreVertical size={18} />
                 </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}