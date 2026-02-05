"use client";

import { useEffect, useState, Suspense, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage({ params }) {
    // Correctly unwrap params using React.use
    const { provider } = use(params);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackHandler provider={provider} />
        </Suspense>
    )
}

function CallbackHandler({ provider }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Processing Login...");

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state"); 
        
        const handleAuth = async () => {
             if (!code) return setStatus("No code received.");
             
             try {
                // If state is 'connect', we are LINKING an account, not logging in
                if (state === 'connect') {
                    setStatus(`Linking ${provider} Account...`);
                    await api.post(`/auth/${provider}/connect`, { code });
                    // Return to where they likely came from (Create Lock)
                    window.location.href = "/dashboard/create";
                    return;
                }

                setStatus(`Authenticating with ${provider}...`);
                
                // Get role from localStorage (set by Login/Register pages)
                const storedRole = localStorage.getItem('oauth_role');
                // Clean up immediately
                localStorage.removeItem('oauth_role');

                // Call the appropriate endpoint based on the dynamic route param
                // /auth/github or /auth/google
                const res = await api.post(`/auth/${provider}`, { 
                    code, 
                    role: storedRole // Pass the role to backend
                });
                
                const user = res.data.user;

                // --- KEY GENERATION FIX FOR SOCIAL LOGIN ---
                if (!user.public_key) {
                    setStatus("Generating Encryption Keys...");
                    const { generateKeyPair } = await import('@/utils/crypto');
                    const keys = await generateKeyPair();
                    
                    // 1. Download Private Key
                    const blob = new Blob([keys.privateKeyPem], { type: "application/x-pem-file" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `gitlock_private_key_${Date.now()}.pem`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // 2. Save Private Key to LocalStorage
                    localStorage.setItem("gitlock_private_key", keys.privateKeyPem);

                    // 3. Upload Public Key
                    setStatus("Uploading Public Key...");
                    await api.post('/auth/public-key', { publicKey: keys.publicKeyPem });
                }
                // -------------------------------------------
                
                console.log("Login Success", res.data);
                // Redirect to dashboard
                window.location.href = "/dashboard";

             } catch (err) {
                 console.error(err);
                 setStatus(`Login Failed: ${err.response?.data?.error || err.message}`);
                 setTimeout(() => router.push('/login'), 3000);
             }
        };

        handleAuth();
    }, [searchParams, router, provider]);

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-black text-white space-y-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-xl font-mono uppercase text-gray-400">{provider} LOGIN</p>
            <p className="text-lg">{status}</p>
        </div>
    )
}