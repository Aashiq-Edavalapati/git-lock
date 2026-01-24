"use client";

import Link from "next/link";
import { ArrowRight, Twitter, Github, Linkedin } from "lucide-react";

function SocialIcon({ icon }) {
    return (
        <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            {icon}
        </a>
    )
}

export default function Footer() {
    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <footer className="w-full border-t border-white/5 bg-black py-20 relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-8">

                <div className="md:col-span-1 space-y-6">
                    <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_var(--primary)]" />
                        GitLock
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        The first trustless payment protocol for software verification and delivery.
                    </p>
                    <div className="flex gap-4">
                        {/* Social Icons */}
                        <SocialIcon icon={<Twitter size={16} />} />
                        <SocialIcon icon={<Github size={16} />} />
                        <SocialIcon icon={<Linkedin size={16} />} />
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6">Product</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-primary transition-colors">Features</a></li>
                        <li><a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')} className="hover:text-primary transition-colors">Workflow</a></li>
                        <li><a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-primary transition-colors">Pricing</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6">Company</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                        <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                        <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6">Stay Updated</h4>
                    <p className="text-sm text-gray-500 mb-4">Subscribe for security alerts.</p>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 w-full transition-colors"
                        />
                        <button className="bg-primary text-black rounded-lg px-3 py-2 hover:bg-primary/90 transition-colors">
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-gray-600">© 2026 GitLock Inc. All rights reserved.</p>
                <div className="flex gap-6 text-xs text-gray-600">
                    <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
