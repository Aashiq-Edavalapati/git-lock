"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import {
    Loader2, DollarSign, ShieldAlert, Users, FileText,
    Activity, Wallet, MousePointerClick, AlertTriangle, CheckCircle
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import PaymentHistoryTable from "./PaymentHistoryTable";

export default function AdminView() {
    const activeTab = useSearchParams().get("tab") || "overview";
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Mocking data structure if API fails for UI dev purposes
                const [paymentRes, statsRes] = await Promise.all([
                    api.get('/payments/history').catch(() => ({ data: [] })),
                    api.get('/admin/stats').catch(() => ({ data: null }))
                ]);
                setPayments(paymentRes.data);
                setStats(statsRes.data || generateMockStats()); // Fallback to mock if API isn't ready
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm text-gray-500 animate-pulse">Establishing Secure Connection...</p>
                </div>
            </div>
        );
    }

    // --- Chart Configurations ---
    const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];
    const ESCROW_COLORS = ['#eab308', '#22c55e'];

    const intrusionData = stats?.intrusionGraph?.map(d => ({
        time: new Date(d.hour).getHours() + ":00",
        count: parseInt(d.count)
    })) || [];

    const escrowData = [
        { name: 'Locked Funds', value: parseFloat(stats?.escrowStats?.locked_funds || 0) },
        { name: 'Released Funds', value: parseFloat(stats?.escrowStats?.released_funds || 0) },
    ];

    const distributionData = stats?.activityDistribution?.map(d => ({
        name: d.action.replace('_', ' '),
        value: parseInt(d.count)
    })) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Mobile Header - Optional, can keep for context if layout header isn't enough, but plan said remove. Keeping simple title. */}
            <div className="md:hidden flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-white">Admin Center</h1>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    {/* Page Header */}
                    <div>
                        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
                        <p className="text-gray-500">Real-time metrics and system health indicators.</p>
                    </div>

                    {/* Top Row: Intrusion & Escrow */}
                    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">

                        {/* Intrusion Detection Chart */}
                        <div className="lg:col-span-2 relative group overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2 text-red-400">
                                        <div className="p-2 bg-red-500/10 rounded-lg"><Activity size={20} /></div>
                                        <div>
                                            <h3 className="font-bold text-white">Intrusion Pulse</h3>
                                            <p className="text-xs text-red-400/70">Failed Login Attempts (24h)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-500/20">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                                    </div>
                                </div>
                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={intrusionData}>
                                            <defs>
                                                <linearGradient id="colorIntrusion" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                            <XAxis dataKey="time" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#ef4444"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorIntrusion)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Escrow Vault */}
                        <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0a] flex flex-col">
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                                    <div className="p-2 bg-yellow-500/10 rounded-lg"><Wallet size={20} /></div>
                                    <h3 className="font-bold text-white">Escrow Vault</h3>
                                </div>
                                <div className="flex-1 min-h-[220px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={escrowData}
                                                innerRadius={65}
                                                outerRadius={85}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {escrowData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={ESCROW_COLORS[index]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                        <span className="text-3xl font-bold text-white">
                                            {(escrowData[0].value + escrowData[1].value).toLocaleString()} tBNB
                                        </span>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">Total Volume</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Activity & Risk */}
                    <div className="grid gap-6 md:grid-cols-2">

                        {/* System Activity */}
                        <div className="p-6 rounded-2xl border border-white/10 bg-[#0a0a0a]">
                            <div className="flex items-center gap-2 text-purple-400 mb-6">
                                <div className="p-2 bg-purple-500/10 rounded-lg"><MousePointerClick size={20} /></div>
                                <h3 className="font-bold text-white">Activity Distribution</h3>
                            </div>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={distributionData} layout="vertical" barSize={20}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#262626" />
                                        <XAxis type="number" stroke="#525252" fontSize={11} hide />
                                        <YAxis dataKey="name" type="category" width={100} stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* High Risk Accounts */}
                        <div className="p-6 rounded-2xl border border-white/10 bg-[#0a0a0a] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 text-orange-400">
                                    <div className="p-2 bg-orange-500/10 rounded-lg"><ShieldAlert size={20} /></div>
                                    <h3 className="font-bold text-white">Risk Radar</h3>
                                </div>
                                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded border border-orange-500/20">
                                    Needs Review
                                </span>
                            </div>

                            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-gray-500 uppercase border-b border-white/5 sticky top-0 bg-[#0a0a0a]">
                                        <tr>
                                            <th className="pb-3 pl-2">User Identity</th>
                                            <th className="pb-3">Threat Level</th>
                                            <th className="pb-3 text-right pr-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {stats?.riskTable?.length > 0 ? (
                                            stats.riskTable.map((user, i) => (
                                                <tr key={i} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-3 pl-2">
                                                        <div className="font-medium text-gray-200">{user.full_name}</div>
                                                        <div className="text-xs text-gray-600 font-mono">{user.email}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${user.risk_score > 50 ? 'bg-red-500' : 'bg-orange-500'}`}
                                                                    style={{ width: `${Math.min(user.risk_score, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-bold ${user.risk_score > 50 ? 'text-red-400' : 'text-orange-400'}`}>
                                                                {user.risk_score}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right pr-2">
                                                        <button className="text-xs bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 px-3 py-1.5 rounded transition-all border border-white/5 hover:border-red-500/30">
                                                            Restrict
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="py-8 text-center text-gray-600 text-sm">
                                                    <CheckCircle className="mx-auto mb-2 opacity-50" size={24} />
                                                    No high-risk users detected.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: ACTIVITY LOG */}
            {activeTab === "activity" && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">System Audit Log</h2>
                        <p className="text-gray-500">Comprehensive trace of all system actions.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={18} className="text-blue-400" /> Global Audit Trail
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Immutable record of all system events.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Actor</th>
                                        <th className="px-6 py-4">Event Type</th>
                                        <th className="px-6 py-4">Metadata</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats?.recentActivity?.map((log, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{log.full_name || 'System'}</div>
                                                <div className="text-xs text-gray-600">{log.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge action={log.action} />
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs font-mono max-w-xs truncate">
                                                {JSON.stringify(log.details)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PAYMENTS */}
            {activeTab === "payments" && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Financials</h2>
                        <p className="text-gray-500">Manage and track all payment flows.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Payment Ledger</h3>
                                <p className="text-sm text-gray-500">Verified blockchain-anchored transactions.</p>
                            </div>
                            <button className="text-sm bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors">
                                Export CSV
                            </button>
                        </div>
                        <PaymentHistoryTable payments={payments} role="ADMIN" />
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Subcomponents for Cleanliness ---

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#111] border border-white/10 p-3 rounded-lg shadow-xl text-xs">
                <p className="text-gray-400 mb-1">{label}</p>
                <p className="text-white font-bold text-sm">
                    {payload[0].name}: <span style={{ color: payload[0].color }}>{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

const Badge = ({ action }) => {
    let colorClass = "bg-gray-500/10 text-gray-400 border-gray-500/20";
    if (action.includes('FAILED') || action.includes('UNAUTHORIZED')) colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
    else if (action.includes('PAYMENT') || action.includes('COMPLETED')) colorClass = "bg-green-500/10 text-green-400 border-green-500/20";
    else if (action.includes('LOCKED') || action.includes('UPLOAD')) colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";

    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${colorClass}`}>
            {action.replace('_', ' ')}
        </span>
    );
};

// --- Mock Data Helper (Remove in Prod) ---
const generateMockStats = () => ({
    intrusionGraph: Array.from({ length: 24 }, (_, i) => ({ hour: new Date().setHours(i), count: Math.floor(Math.random() * 10) })),
    escrowStats: { locked_funds: 50000, released_funds: 35000 },
    activityDistribution: [
        { action: 'LOGIN_SUCCESS', count: 120 },
        { action: 'UPLOAD_CODE', count: 45 },
        { action: 'PAYMENT_VERIFIED', count: 30 },
        { action: 'LOGIN_FAILED', count: 12 },
    ],
    riskTable: [
        { full_name: 'John Doe', email: 'john@gmail.com', risk_score: 85 },
        { full_name: 'Jane Smith', email: 'jane@test.com', risk_score: 45 },
    ],
    recentActivity: [
        { timestamp: Date.now(), full_name: 'Admin User', email: 'admin@gitlock.io', action: 'SYSTEM_AUDIT', details: { status: 'OK' } }
    ]
});