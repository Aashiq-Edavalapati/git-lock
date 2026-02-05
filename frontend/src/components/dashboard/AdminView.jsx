"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, DollarSign, ShieldAlert, Users, LayoutDashboard, FileText } from "lucide-react";
import PaymentHistoryTable from "./PaymentHistoryTable";

export default function AdminView() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("payments");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Payment Logs
                const res = await api.get('/payments/history');
                setPayments(res.data);
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-12 text-white"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-8 text-white">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-gray-400">Monitor system activity, payments, and audits.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="glass-card p-6 rounded-xl border border-white/10">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-gray-300">Total Payments</div>
                        <DollarSign className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{payments.filter(p => p.action === 'PAYMENT').length}</div>
                        <p className="text-xs text-gray-500">Successful transactions found</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-xl border border-white/10">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-gray-300">Failed Attempts</div>
                        <ShieldAlert className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{payments.filter(p => p.action === 'PAYMENT_FAILED').length}</div>
                        <p className="text-xs text-gray-500">Blocked or failed payments</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-xl border border-white/10">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium text-gray-300">System Status</div>
                        <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-500">Active</div>
                        <p className="text-xs text-gray-500">Access Control Enforced</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex space-x-1 rounded-xl bg-white/5 p-1 w-fit">
                    <button
                        onClick={() => setActiveTab("payments")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "payments" ? "bg-primary/20 text-primary shadow" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                    >
                        <LayoutDashboard size={16} /> Payment Logs
                    </button>
                    <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-gray-600 cursor-not-allowed"
                    >
                        <FileText size={16} /> Audit Trail (Coming Soon)
                    </button>
                </div>

                {activeTab === "payments" && (
                    <div className="glass-card p-6 rounded-xl border border-white/10">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium">Payment History</h3>
                            <p className="text-sm text-gray-400">All payment attempts (Success & Failed) recorded in the system.</p>
                        </div>
                        <PaymentHistoryTable payments={payments} role="ADMIN" />
                    </div>
                )}
            </div>
        </div>
    );
}
