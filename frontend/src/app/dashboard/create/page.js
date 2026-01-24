"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Upload, Github } from "lucide-react";

export default function CreateEscrow() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to Backend API (Phase 2 of project)
    console.log("Mock Uploading...");
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h2 className="text-3xl font-bold mb-8">Create New Lock</h2>

      <form onSubmit={handleCreate} className="glass-panel p-8 rounded-xl space-y-6">
        
        {/* 1. Project Details */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Project Name</label>
          <input 
            type="text" 
            placeholder="e.g. E-Commerce MVP" 
            className="w-full bg-black/40 border border-card-border rounded-lg p-3 focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* 2. GitHub Binding */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">GitHub Commit SHA</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Github className="absolute left-3 top-3.5 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Paste the full Commit SHA" 
                className="w-full bg-black/40 border border-card-border rounded-lg p-3 pl-10 focus:border-primary focus:outline-none"
              />
            </div>
            <Button type="button" variant="outline">Verify</Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            We will fetch the deployment URL associated with this commit automatically.
          </p>
        </div>

        {/* 3. File Upload */}
        <div className="border-2 border-dashed border-card-border rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer bg-black/20">
          <Upload className="mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-300">Drag & Drop source_code.zip here</p>
          <p className="text-xs text-gray-500 mt-1">AES-256 Encrypted immediately</p>
          <input 
            type="file" 
            className="hidden" 
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {/* 4. Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Escrow Amount (INR)</label>
          <input 
            type="number" 
            placeholder="5000" 
            className="w-full bg-black/40 border border-card-border rounded-lg p-3 focus:border-primary focus:outline-none"
          />
        </div>

        <Button className="w-full mt-4" disabled={loading}>
          {loading ? "Encrypting & Locking..." : "Generate Secure Link"}
        </Button>

      </form>
    </div>
  );
}