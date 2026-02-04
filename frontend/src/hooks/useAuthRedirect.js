"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function useAuthRedirect(redirectIfFound = false) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/auth/me');
        // If we get here, user is logged in
        if (redirectIfFound) {
            // On guest page (login/register), but logged in -> Go to Dashboard
            router.push('/dashboard'); 
        } else {
            // On protected page, and logged in -> Allow access
            setIsLoading(false);
        }
      } catch (error) {
        // If we get here, user is NOT logged in (or error)
        if (!redirectIfFound) {
            // On protected page, but not logged in -> Go to Login
             router.push('/login?message=Please log in to access the dashboard');
        } else {
            // On guest page, and not logged in -> Allow access
            setIsLoading(false);
        }
      }
    };

    checkAuth();
  }, [redirectIfFound, router]);

  return { isLoading };
}
