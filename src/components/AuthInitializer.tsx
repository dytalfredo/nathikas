import { useEffect } from 'react';
import { initAuth } from '../lib/auth-service';

export default function AuthInitializer() {
    useEffect(() => {
        // Defer auth init to allow UI to paint first
        const timer = setTimeout(() => {
            initAuth();
        }, 2000); // 2s delay

        return () => clearTimeout(timer);
    }, []);

    return null;
}
