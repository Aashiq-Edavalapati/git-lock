"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, Clock } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (e) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id, isRead) => {
        if (isRead) return;
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) { 
            console.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        const original = [...notifications];
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        
        try {
            // Ideally backend would support this, but for now we loop or just update UI
            // Assuming no bulk endpoint, we iterate (not efficient but checking requirements)
            // Or better, just update visually since user asked for "Notifications option" not specifically bulk read API
            // But let's verify if there is a bulk read. No.
            // Let's just update the ones that are unread
            const unread = original.filter(n => !n.is_read);
            await Promise.all(unread.map(n => api.put(`/notifications/${n.id}/read`)));
        } catch (e) {
            setNotifications(original); // Revert on fail
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Notifications</h1>
                    <p className="text-gray-400">Stay updated with your escrow activity</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button 
                        onClick={markAllAsRead}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        Mark all as read
                    </button>
                )}
            </header>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Bell size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">All caught up!</h3>
                    <p className="text-gray-400">You don't have any notifications right now.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((n, i) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => markAsRead(n.id, n.is_read)}
                            className={`
                                group p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden
                                ${!n.is_read 
                                    ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20 hover:border-primary/40' 
                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                }
                            `}
                        >
                            <div className="flex items-start gap-4 z-10 relative">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-primary shadow-[0_0_10px_var(--primary)]' : 'bg-transparent'}`} />
                                <div className="flex-1">
                                    <p className={`text-lg mb-1 ${!n.is_read ? 'text-white font-medium' : 'text-gray-400'}`}>
                                        {n.message}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock size={12} />
                                        <span>{new Date(n.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                {!n.is_read && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                                            <CheckCircle size={18} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
