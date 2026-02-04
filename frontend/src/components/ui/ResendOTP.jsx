"use client";

import { useState, useEffect } from "react";

export default function ResendOTP({ onResend, interval = 60, className = "" }) {
    const [timer, setTimer] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let intervalId;
        if (timer > 0) {
            intervalId = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [timer]);

    const handleResend = async (e) => {
        e.preventDefault();
        if (timer > 0 || loading) return;

        setLoading(true);
        try {
            await onResend();
            setTimer(interval); // Reset timer on success
        } catch (error) {
            console.error("Resend failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`text-center ${className}`}>
            {timer > 0 ? (
                <p className="text-xs text-gray-500">
                    Resend code in <span className="text-white font-mono">{timer}s</span>
                </p>
            ) : (
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Sending..." : "Resend Verification Code"}
                </button>
            )}
        </div>
    );
}
