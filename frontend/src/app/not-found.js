import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-center p-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle size={32} className="text-red-500" />
        </div>
        
        <h1 className="text-7xl font-bold text-white tracking-tighter">404</h1>
        <h2 className="text-2xl font-medium text-gray-300">Protocol Mismatch</h2>
        
        <p className="text-gray-500 max-w-md mx-auto">
          The requested resource could not be found in the secure vault. It may have been deleted or never existed.
        </p>

        <div className="pt-4 flex justify-center">
            <Link href="/">
                <Button className="rounded-full px-8">
                    <Home size={16} className="mr-2" /> Return to Base
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}