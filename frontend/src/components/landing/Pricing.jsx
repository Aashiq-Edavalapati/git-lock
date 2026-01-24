import Button from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export default function Pricing() {
    return (
        <section id="pricing" className="w-full max-w-7xl px-6 pb-40 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
                <p className="text-gray-400">We only make money when you do.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Tier */}
                <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-opacity">
                    <h3 className="text-xl font-bold mb-2">The Freelancer</h3>
                    <div className="text-4xl font-bold mb-6 text-white">Free</div>
                    <ul className="space-y-3 text-sm text-gray-400 mb-8">
                        <li className="flex items-center gap-2 justify-center"><CheckCircle2 size={16} /> Create up to 3 Locks/month</li>
                        <li className="flex items-center gap-2 justify-center"><CheckCircle2 size={16} /> Basic GitHub Verification</li>
                        <li className="flex items-center gap-2 justify-center"><CheckCircle2 size={16} /> 24-hour Escrow hold</li>
                    </ul>
                    <Button variant="outline" className="w-full">Get Started</Button>
                </div>

                {/* Pro Tier */}
                <div className="glass-card-strong p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden border-primary/30">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                    <h3 className="text-xl font-bold mb-2 text-primary">The Agency</h3>
                    <div className="text-4xl font-bold mb-2 text-white">1% <span className="text-lg font-normal text-gray-500">/ txn</span></div>
                    <p className="text-xs text-gray-500 mb-6">Capped at $50 per lock</p>
                    <ul className="space-y-3 text-sm text-gray-300 mb-8">
                        <li className="flex items-center gap-2 justify-center"><CheckCircle2 size={16} className="text-primary" /> Unlimited Locks</li>
                        <li className="flex items-center gap-2 justify-center"><CheckCircle2 size={16} className="text-primary" /> Priority Dispute Resolution</li>
                        <li className="flex items-center gap-2 justify-center"><CheckCircle2 size={16} className="text-primary" /> Instant Withdrawals</li>
                    </ul>
                    <Button className="w-full">Go Pro</Button>
                </div>
            </div>
        </section>
    );
}
