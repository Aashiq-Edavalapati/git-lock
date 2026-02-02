"use client";

import { useState } from "react";
import { X, Upload, File, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CreateProjectModal({ isOpen, onClose, onCreate }) {
    const [formData, setFormData] = useState({
        title: "",
        budget: "",
        description: "",
        requirements: ""
    });
    const [attachments, setAttachments] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            name: file.name,
            size: (file.size / 1024).toFixed(2) + " KB",
            type: file.type
        }));
        setAttachments([...attachments, ...newAttachments]);
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.budget) return;

        setIsCreating(true);
        await onCreate({
            ...formData,
            attachments // Mock attachments
        });
        setIsCreating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#111] z-10">
                    <h2 className="text-xl font-bold text-white">Create New Project</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* content */}
                <div className="p-6 space-y-6 flex-1">

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Project Title</label>
                            <input
                                name="title"
                                className="w-full bg-black border border-white/10 p-3 text-white rounded-lg focus:border-blue-500 outline-none transition-colors"
                                placeholder="e.g. DeFi Staking Platform"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Budget (₹)</label>
                            <input
                                name="budget"
                                type="number"
                                className="w-full bg-black border border-white/10 p-3 text-white rounded-lg focus:border-green-500 outline-none transition-colors"
                                placeholder="e.g. 50000"
                                value={formData.budget}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Description</label>
                        <textarea
                            name="description"
                            className="w-full bg-black border border-white/10 p-3 text-white rounded-lg outline-none min-h-[100px] resize-y focus:border-blue-500 transition-colors"
                            placeholder="Describe your project goal, scope, and key deliverables..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Requirements */}
                    <div>
                        <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Technical Requirements</label>
                        <textarea
                            name="requirements"
                            className="w-full bg-black border border-white/10 p-3 text-white rounded-lg outline-none min-h-[100px] resize-y focus:border-blue-500 transition-colors"
                            placeholder="e.g. React, Node.js, PostgreSQL, specific security standards..."
                            value={formData.requirements}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Attachments (Mock) */}
                    <div>
                        <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Attachments (Mock)</label>

                        <div className="border border-dashed border-white/10 rounded-lg p-6 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                <Upload size={24} />
                                <span className="text-sm">Click to upload files (Requirements, Wireframes, Contracts)</span>
                            </div>
                        </div>

                        {/* List */}
                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <File size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-medium truncat max-w-[200px]">{file.name}</p>
                                                <p className="text-xs text-gray-500">{file.size}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeAttachment(i)} className="text-gray-500 hover:text-red-400">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#111] flex justify-end gap-3 sticky bottom-0 z-10">
                    <Button variant="outline" onClick={onClose} disabled={isCreating}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isCreating} className="min-w-[120px]">
                        {isCreating ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Creating...</span> : 'Create Project'}
                    </Button>
                </div>

            </div>
        </div>
    );
}
