"use client";

import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { ArrowRight, PlayCircle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section className="w-full max-w-7xl px-6 pt-10 md:pt-6 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 min-h-[85vh] max-h-[85vh]">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
                    <span className="text-white">Trustless</span> <br />
                    <span className="text-gray-500">Delivery.</span>
                </h1>

                <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                    The mathematical middleman. We cryptographically bind
                    <span className="text-white font-medium"> Source Code</span> to
                    <span className="text-white font-medium"> Live Deployments</span>.
                    Developers get paid, Clients get the code. Zero trust required.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link href="/dashboard/create">
                        <Button className="h-12 px-8 rounded-full text-base font-bold bg-white text-black hover:bg-gray-200 hover:scale-105 transition-transform">
                            Start Escrow <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                    <Button variant="outline" className="h-12 px-8 rounded-full border-white/10 hover:bg-white/5 text-base text-gray-300">
                        <PlayCircle className="mr-2 w-4 h-4 text-primary" /> View Demo
                    </Button>
                </div>

                {/* Social Proof Mini */}
                <div className="pt-4 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border border-black bg-zinc-800 flex items-center justify-center text-[10px] text-white">U{i}</div>
                        ))}
                    </div>
                    <p>Trusted by 2,000+ Freelancers</p>
                </div>
            </div>

            {/* 3D Illustration */}
            <div className="relative w-full h-[500px] flex items-center justify-center animate-float">
                <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full" />
                <Image
                    src="/Hero-3D-illustration.png"
                    alt="GitLock Vault"
                    width={600} height={600}
                    className="object-contain drop-shadow-2xl relative z-10"
                    priority
                />
            </div>

            {/* Scroll Nudge */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600"
            >
                <span className="text-[10px] uppercase tracking-widest">Scroll to Explore</span>
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <ChevronDown size={16} />
                </motion.div>
            </motion.div>
        </section>
    );
}
