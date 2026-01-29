import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { Loader2, X } from "lucide-react";

export default function EditProjectModal({ isOpen, onClose, project, onSuccess }) {
    const [formData, setFormData] = useState({ title: "", budget: "", description: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title || "",
                budget: project.budget || "",
                description: project.description || "New Project"
            });
        }
    }, [project]);

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.put(`/projects/${project.id}`, formData);
            onSuccess(res.data.project);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update project");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#111] p-6 rounded-xl w-full max-w-md border border-white/10 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white mb-4">Edit Project</h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Title</label>
                        <input
                            className="w-full bg-black border border-white/10 p-2 text-white rounded focus:border-white/30 outline-none"
                            placeholder="Project Title"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Budget (₹)</label>
                        <input
                            className="w-full bg-black border border-white/10 p-2 text-white rounded focus:border-white/30 outline-none"
                            placeholder="Budget"
                            value={formData.budget}
                            onChange={e => setFormData({ ...formData, budget: e.target.value })}
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <div className="flex gap-2 pt-2">
                        <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                            {loading ? <span className="flex items-center gap-2 justify-center"><Loader2 className="animate-spin" size={16} /> Saving...</span> : 'Save Changes'}
                        </Button>
                        <button onClick={onClose} className="text-gray-400 px-4" disabled={loading}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
