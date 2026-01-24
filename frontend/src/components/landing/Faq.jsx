"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function FaqItem({ q, a }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div
            className={`glass-card p-6 rounded-xl transition-all duration-300 cursor-pointer group ${isOpen ? 'bg-white/5 border-primary/30' : 'hover:bg-white/5'}`}
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="flex justify-between items-center">
                <h4 className={`font-semibold transition-colors ${isOpen ? 'text-primary' : 'text-white group-hover:text-primary'}`}>{q}</h4>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-primary' : 'text-gray-500'}`} />
                </motion.div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="text-sm text-gray-400 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Faq() {
    return (
        <section id="faq" className="w-full max-w-3xl px-6 pb-40 relative z-10 mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked</h2>
            <div className="space-y-4">
                <FaqItem q="What if the code is broken?" a="The client verifies the functionality via the Live Deployment link BEFORE paying. The binding ensures the code they download is exactly what they saw running. If it crashes locally, standard dispute resolution applies." />
                <FaqItem q="Can the developer cheat?" a="No. If the developer uploads a fake zip, the SHA-256 hash won't match the GitHub commit, and GitLock will reject the upload immediately." />
                <FaqItem q="Is the payment refundable?" a="Once the file is unlocked, the transaction is final to prevent 'chargeback fraud'. However, funds are held safely until the 'Unlock' button is clicked." />
                <FaqItem q="Which platforms are supported?" a="Currently we support GitHub for repositories. For deployment verification, we automatically detect Vercel, Netlify, and AWS Amplify links." />
            </div>
        </section>
    );
}
