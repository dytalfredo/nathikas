import { useEffect } from 'react';

export default function AuthInitializer() {
    useEffect(() => {
        // Defer auth init and code loading to allow UI to paint first
        const timer = setTimeout(async () => {
            const { initAuth } = await import('../lib/auth-service');
            initAuth();
        }, 2000); // 2s delay

        return () => clearTimeout(timer);
    }, []);

    return null;
}
