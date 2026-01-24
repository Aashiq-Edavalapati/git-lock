"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Navbar() {
    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <nav className="w-full max-w-7xl px-6 py-8 flex justify-between items-center z-50">
            <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_var(--primary)]" />
                GitLock
            </div>
            <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-primary transition-colors">Features</a>
                <a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')} className="hover:text-primary transition-colors">Workflow</a>
                <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-primary transition-colors">Pricing</a>
            </div>
            <div className="flex gap-4 items-center">
                <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Log In
                </Link>
                <Link href="/dashboard/create">
                    <Button className="rounded-full px-6 py-2 text-sm bg-primary text-black font-bold hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all">
                        Launch App
                    </Button>
                </Link>
            </div>
        </nav>
    );
}
