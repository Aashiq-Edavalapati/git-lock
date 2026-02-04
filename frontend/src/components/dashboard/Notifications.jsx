"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ArrowUpRight, MessageSquare, Info, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    // Ref to handle clicking outside to close dropdown (optional but good UX)
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

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
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setHasUnread(notifications.some(n => !n.is_read && n.id !== id));
        
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (e) { 
            console.error(e); 
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        // If it's a link, we want to close the dropdown so the user sees the new page
        if (notification.link) {
            setShowDropdown(false);
        }
    };

    // Helper to get icon based on type (optional, based on your backend 'type' field)
    const getIcon = (type) => {
        switch (type) {
            case 'ALERT': return <AlertCircle size={16} className="text-red-400" />;
            case 'MESSAGE': return <MessageSquare size={16} className="text-blue-400" />;
            default: return <Info size={16} className="text-gray-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`relative p-3 rounded-full transition-all duration-200 ${
                    showDropdown ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
            >
                <Bell size={20} />
                {hasUnread && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111]" />
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 top-12 w-96 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
                    <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <h3 className="font-semibold text-white text-sm">Notifications</h3>
                        {hasUnread && (
                            <button
                                onClick={() => {
                                    notifications.forEach(n => !n.is_read && markAsRead(n.id));
                                }}
                                className="text-xs text-primary hover:text-primary-light transition-colors hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[24rem] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                <Bell size={32} className="text-gray-700" />
                                <span className="text-gray-500 text-sm">No new notifications</span>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const hasLink = !!n.link;
                                const Wrapper = hasLink ? Link : 'div';
                                const wrapperProps = hasLink ? { href: n.link } : {};

                                return (
                                    <Wrapper
                                        key={n.id}
                                        {...wrapperProps}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`
                                            block w-full text-left p-4 border-b border-white/5 transition-all duration-200 group
                                            ${n.is_read ? 'hover:bg-white/5 opacity-80' : 'bg-white/[0.02] hover:bg-white/[0.08]'}
                                            ${hasLink ? 'cursor-pointer' : 'cursor-default'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            {/* Icon Indicator */}
                                            <div className="mt-0.5 opacity-70">
                                                {getIcon(n.type)}
                                            </div>

                                            <div className="flex-1">
                                                <p className={`text-sm leading-snug ${!n.is_read ? 'text-white font-medium' : 'text-gray-400'}`}>
                                                    {n.message}
                                                </p>
                                                <p className="text-[11px] text-gray-600 mt-2 flex items-center gap-2">
                                                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                                                    {hasLink && (
                                                        <span className="flex items-center gap-1 text-primary/70">
                                                            Visit <ArrowUpRight size={10} />
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Status Indicators */}
                                            <div className="flex flex-col items-end gap-2 mt-1">
                                                {!n.is_read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                )}
                                                
                                                {/* Visual cue for link - becomes brighter on hover */}
                                                {hasLink && (
                                                    <ArrowUpRight 
                                                        size={16} 
                                                        className="text-gray-600 group-hover:text-primary transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </Wrapper>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}