"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, Filter, Lock, Unlock, 
  MoreVertical, FileCode, Calendar 
} from "lucide-react";
import api from "@/lib/api"; // Assuming a configured axios instance exists, or I will use fetch/axios directly if not

export default function ContractsPage() {
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'completed'
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      // Assuming existing auth token handling in axios interceptor or cookie
      const response = await api.get('/projects'); 
      setContracts(response.data);
    } catch (error) {
      console.error("Failed to fetch contracts", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'LOCKED_REVIEW': return 'bg-yellow-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'INVITE_SENT': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusTextColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-500';
      case 'LOCKED_REVIEW': return 'text-yellow-500';
      case 'IN_PROGRESS': return 'text-blue-500';
      case 'INVITE_SENT': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'active' 
        ? ['IN_PROGRESS', 'LOCKED_REVIEW', 'INVITE_SENT'].includes(c.status)
        : c.status === 'COMPLETED';
    
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
                          
    return matchesFilter && matchesSearch;
  });

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        {loading ? (
             <p className="text-gray-500">Loading contracts...</p>
        ) : filteredContracts.length === 0 ? (
             <p className="text-gray-500">No contracts found.</p>
        ) : (
             filteredContracts.map((contract) => (
          <div 
            key={contract.id} 
            className="glass-card p-0 rounded-xl flex flex-col md:flex-row items-center overflow-hidden hover:border-primary/30 transition-all group"
          >
            {/* Status Strip */}
            <div className={`w-full md:w-2 h-2 md:h-full ${getStatusColor(contract.status)}`} />
            
            <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
              
              {/* Info */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-white/5 ${getStatusTextColor(contract.status)}`}>
                  {contract.status === 'LOCKED_REVIEW' ? <Lock size={20} /> : <FileCode size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-primary transition-colors">{contract.title}</h3>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <span className="font-mono text-xs opacity-50">{contract.id.substring(0,8)}</span> • {contract.client_name || 'Unknown Client'}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-8 text-sm">
                 <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={14} /> {new Date(contract.created_at).toLocaleDateString()}
                 </div>
                 <div className="font-bold text-white text-lg">
                    ₹{contract.budget}
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
        ))
        )}
      </div>

    </div>
  );
}