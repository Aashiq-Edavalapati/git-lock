"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { GitCommit, ShieldCheck, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Workflow() {
    const [activeStep, setActiveStep] = useState(1);

    return (
        <section id="workflow" className="w-full max-w-7xl px-6 pb-40 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

                <div className="sticky top-32 h-fit">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        The <span className="text-primary">Happy Path</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-12">
                        A simplified workflow designed to eliminate trust friction.
                    </p>

                    <div className="min-h-[200px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                                    {activeStep === 1 && <GitCommit size={24} />}
                                    {activeStep === 2 && <ShieldCheck size={24} />}
                                    {activeStep === 3 && <CreditCard size={24} />}
                                </div>
                                <h3 className="text-2xl font-bold text-white">
                                    {activeStep === 1 && "1. The Binding"}
                                    {activeStep === 2 && "2. The Proof"}
                                    {activeStep === 3 && "3. The Exchange"}
                                </h3>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    {activeStep === 1 && "Developer uploads source.zip and links it to a specific GitHub commit. We lock the file and verify the hash matches the repo."}
                                    {activeStep === 2 && "Client receives a secure link. They view the live deployment (Vercel/Netlify) knowing for a fact that it matches the code in the vault."}
                                    {activeStep === 3 && "Client pays. The Vault instantly decrypts the zip file. The developer gets the funds, the client gets the code."}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="mt-12">
                        <Link href="/dashboard/create">
                            <Button>Start Your First Lock</Button>
                        </Link>
                    </div>
                </div>

                {/* The "Git Graph" Timeline */}
                <div className="relative border-l border-white/10 ml-6 lg:ml-0 pl-12 space-y-16 py-4">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className="relative group cursor-pointer"
                            onMouseEnter={() => setActiveStep(step)}
                        >
                            <div className={`absolute -left-[55px] top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${activeStep === step ? 'bg-[#0a0a0a] border border-primary shadow-[0_0_15px_var(--primary)]' : 'bg-[#0a0a0a] border border-gray-700'}`}>
                                <div className={`w-2 h-2 rounded-full transition-colors ${activeStep === step ? 'bg-primary' : 'bg-gray-500'}`} />
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${activeStep === step ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                {step === 1 ? "Upload & Lock" : step === 2 ? "Verify Deploy" : "Pay & Unlock"}
                            </h3>
                            <p className={`text-gray-400 leading-relaxed transition-opacity duration-300 ${activeStep === step ? 'opacity-100' : 'opacity-40'}`}>
                                {step === 1 ? "Link source code to deployment." : step === 2 ? "Verify functionality before paying." : "Instant, trustless delivery."}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
