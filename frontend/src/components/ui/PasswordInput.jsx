"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ value, onChange, placeholder = "Password", className = "", required = true }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full bg-black/40 border border-white/10 rounded-lg p-3 pr-10 text-white focus:border-primary/50 outline-none ${className}`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}
