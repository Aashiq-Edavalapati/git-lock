"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { 
  ShieldCheck, ArrowRight, PlayCircle, Lock, 
  GitCommit, RefreshCcw, CreditCard, Github, 
  CheckCircle2, AlertCircle, ChevronDown, Twitter, 
  Linkedin, Mail, ArrowUp, Code2, Server, Globe, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeStep, setActiveStep] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  return (
    <main className="min-h-screen relative flex flex-col items-center">
      
      {/* --- Navbar --- */}
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

      {/* --- HERO SECTION --- */}
      <section className="w-full max-w-7xl px-6 pt-10 md:pt-6 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 min-h-[85vh] max-h-[85vh]">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-primary uppercase tracking-widest backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            V2.0 Protocol Live
          </div> */}
          
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
                {[1,2,3,4].map(i => (
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

      {/* --- DASHBOARD PREVIEW --- */}
      <section className="w-full max-w-7xl px-6 pb-40 relative z-10">
        <div className="relative rounded-2xl p-2 glass-card-strong overflow-hidden group">
           <Image 
            src="/PagePreviewFullPage.webp" 
            alt="Dashboard"
            width={1400} height={900}
            className="rounded-xl w-full h-auto opacity-90 transition-opacity group-hover:opacity-100"
          />
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* --- INTEGRATIONS MARQUEE (New Content) --- */}
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

      {/* --- BENTO GRID (The Tech) --- */}
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

      {/* --- INNOVATIVE WORKFLOW --- */}
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

      {/* --- PRICING SECTION (New Content) --- */}
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

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="w-full max-w-3xl px-6 pb-40 relative z-10 mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked</h2>
        <div className="space-y-4">
          <FaqItem q="What if the code is broken?" a="The client verifies the functionality via the Live Deployment link BEFORE paying. The binding ensures the code they download is exactly what they saw running. If it crashes locally, standard dispute resolution applies." />
          <FaqItem q="Can the developer cheat?" a="No. If the developer uploads a fake zip, the SHA-256 hash won't match the GitHub commit, and GitLock will reject the upload immediately." />
          <FaqItem q="Is the payment refundable?" a="Once the file is unlocked, the transaction is final to prevent 'chargeback fraud'. However, funds are held safely until the 'Unlock' button is clicked." />
          <FaqItem q="Which platforms are supported?" a="Currently we support GitHub for repositories. For deployment verification, we automatically detect Vercel, Netlify, and AWS Amplify links." />
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="w-full max-w-5xl px-6 pb-20 mx-auto text-center">
        <div className="glass-card-strong rounded-3xl p-16 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6">Ready to ship securely?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">Stop worrying about payment. Start coding. Let GitLock handle the trust.</p>
            <Link href="/login" className="flex justify-center">
              <Button className="h-14 px-10 text-lg rounded-full">Get Started Now</Button>
            </Link>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        </div>
      </section>

      {/* --- FOOTER --- */}
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

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-black shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:bg-white transition-colors"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}

// Helper Components
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

function SocialIcon({ icon }) {
    return (
        <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            {icon}
        </a>
    )
}