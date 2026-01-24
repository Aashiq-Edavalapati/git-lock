"use client";
import { cn } from "@/lib/utils";

export default function Button({ children, variant = "primary", className, ...props }) {
  const variants = {
    primary: "bg-primary text-black hover:shadow-[0_0_15px_var(--primary-glow)]",
    outline: "border border-card-border text-gray-300 hover:border-primary hover:text-primary",
    danger: "bg-danger text-white hover:shadow-[0_0_15px_rgba(255,42,109,0.4)]",
    success: "bg-success text-black hover:shadow-[0_0_15px_rgba(0,255,148,0.4)]",
  };

  return (
    <button 
      className={cn(
        "px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}