import { ShieldCheck, Lock, Zap, Globe } from "lucide-react";

export default function Features() {
    return (
        <section id="features" className="w-full max-w-7xl px-6 pb-40 relative z-10">
            <div className="mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Security by <span className="text-gradient-primary">Design</span>
                </h2>
                <p className="text-gray-400 max-w-2xl text-lg">
                    We don't just hold funds. We verify the product integrity using SHA-256 signatures.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[600px]">

                {/* Card 1: Core Verification (Large) */}
                <div className="glass-card md:col-span-2 row-span-2 rounded-3xl p-10 relative overflow-hidden group flex flex-col justify-between">
                    <div className="relative z-10">
                        <ShieldCheck className="w-14 h-14 text-primary mb-6 drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]" strokeWidth={1.5} />
                        <h3 className="text-2xl font-bold mb-3 text-white">Cryptographic Binding</h3>
                        <p className="text-gray-400 leading-relaxed text-base">
                            GitLock computes the hash of the uploaded zip and matches it against the live GitHub commit deployment.
                        </p>
                    </div>

                    <div className="mt-8 border border-white/5 rounded-lg p-4 bg-black/40 font-mono text-xs space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-between text-gray-500"><span>Status</span><span>Verified</span></div>
                        <div className="h-1 w-full bg-gray-800 rounded overflow-hidden"><div className="h-full w-full bg-primary animate-pulse"></div></div>
                        <div className="text-green-400">✓ SHA-256 Match confirmed</div>
                    </div>

                    <div className="absolute right-[-60px] top-[-60px] w-64 h-64 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-all duration-700" />
                </div>

                {/* Card 2: Vault (Medium) */}
                <div className="glass-card md:col-span-2 rounded-3xl p-8 flex items-center gap-6 group overflow-hidden relative">
                    <div className="min-w-[60px] h-[60px] rounded-full bg-white/5 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">AES-256 Vault</h3>
                        <p className="text-sm text-gray-400">Source code is encrypted at rest. Decryption keys are only generated upon payment success.</p>
                    </div>
                </div>

                {/* Card 3: Payments (Small) */}
                <div className="glass-card md:col-span-1 rounded-3xl p-6 flex flex-col justify-between group relative overflow-hidden">
                    <Zap className="w-8 h-8 text-white mb-2" />
                    <div>
                        <h3 className="text-lg font-bold">Instant</h3>
                        <p className="text-xs text-gray-400 mt-1">Webhook-driven release.</p>
                    </div>
                    <div className="absolute bottom-[-20px] right-[-20px] w-20 h-20 bg-purple-500/20 rounded-full blur-[30px]" />
                </div>

                {/* Card 4: Global (Small) - New Content */}
                <div className="glass-card md:col-span-1 rounded-3xl p-6 flex flex-col justify-between group relative overflow-hidden">
                    <Globe className="w-8 h-8 text-white mb-2" />
                    <div>
                        <h3 className="text-lg font-bold">Global</h3>
                        <p className="text-xs text-gray-400 mt-1">Accepts 100+ currencies.</p>
                    </div>
                    <div className="absolute bottom-[-20px] right-[-20px] w-20 h-20 bg-blue-500/20 rounded-full blur-[30px]" />
                </div>
            </div>
        </section>
    );
}
