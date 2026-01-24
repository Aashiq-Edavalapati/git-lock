import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Cta() {
    return (
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
    );
}
