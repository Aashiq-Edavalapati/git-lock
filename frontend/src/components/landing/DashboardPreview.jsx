import Image from "next/image";

export default function DashboardPreview() {
    return (
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
    );
}
