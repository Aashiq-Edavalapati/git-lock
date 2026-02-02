"use client";

import { useState, useRef, useEffect } from "react";

export default function OTPInput({ length = 6, value, onChange, className = "" }) {
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const inputsRef = useRef([]);

    useEffect(() => {
        if (value) {
            const newVal = value.slice(0, length).split("");
            while (newVal.length < length) newVal.push("");
            setOtp(newVal);
        } else {
            setOtp(new Array(length).fill(""));
        }
    }, [value, length]);


    const handleChange = (index, e) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = [...otp];
        // Allow only last entered character or first if empty
        newOtp[index] = val.substring(val.length - 1);

        // Trigger generic change handler
        const combinedOtp = newOtp.join("");
        onChange(combinedOtp);
        setOtp(newOtp);

        // Focus next input
        if (val && index < length - 1 && inputsRef.current[index + 1]) {
            inputsRef.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0 && inputsRef.current[index - 1]) {
            // Move back if current is empty
            inputsRef.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text").slice(0, length).split("");
        if (data.some(char => isNaN(char))) return;

        const newOtp = [...otp];
        data.forEach((char, i) => {
            if (i < length) newOtp[i] = char;
        });

        // Trigger generic change handler
        const combinedOtp = newOtp.join("");
        onChange(combinedOtp);
        setOtp(newOtp);

        // Focus last filled or first empty
        const nextFocus = Math.min(data.length, length - 1);
        if (inputsRef.current[nextFocus]) {
            inputsRef.current[nextFocus].focus();
        }
    };


    return (
        <div className={`flex gap-2 justify-center ${className}`}>
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 bg-black/40 border border-white/10 rounded-lg text-center text-xl text-white focus:border-primary/50 outline-none transition-all focus:bg-white/5"
                />
            ))}
        </div>
    );
}
