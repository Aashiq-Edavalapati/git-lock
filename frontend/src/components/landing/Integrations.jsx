"use client";

export default function Integrations() {
    return (
        <section className="w-full border-y border-white/5 bg-white/[0.01] py-12 mb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Compatible with your stack</p>
            </div>
            <div className="flex gap-16 animate-marquee whitespace-nowrap opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {["Next.js", "React", "Node.js", "Python", "Vercel", "Netlify", "AWS", "GitHub", "GitLab", "Stripe", "Razorpay"].map((tech) => (
                    <span key={tech} className="text-2xl font-bold text-white/40 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" /> {tech}
                    </span>
                ))}
                {/* Duplicate for seamless loop */}
                {["Next.js", "React", "Node.js", "Python", "Vercel", "Netlify", "AWS", "GitHub", "GitLab", "Stripe", "Razorpay"].map((tech) => (
                    <span key={tech + "dup"} className="text-2xl font-bold text-white/40 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" /> {tech}
                    </span>
                ))}
            </div>
        </section>
    );
}
