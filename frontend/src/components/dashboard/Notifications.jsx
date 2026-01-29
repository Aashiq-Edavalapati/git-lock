import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import api from "@/lib/api";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
            setHasUnread(data.some(n => !n.is_read));
        } catch (e) {
            console.error("Failed to fetch notifications");
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setHasUnread(notifications.some(n => !n.is_read && n.id !== id));
        } catch (e) { }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-3 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
                <Bell size={20} />
                {hasUnread && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111]" />
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 top-12 w-80 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-white/5 bg-black/20">
                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-xs">No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                    className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-500/5' : ''}`}
                                >
                                    <p className={`text-sm ${!n.is_read ? 'text-white font-medium' : 'text-gray-400'}`}>
                                        {n.message}
                                    </p>
                                    <p className="text-[10px] text-gray-600 mt-1">
                                        {new Date(n.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
