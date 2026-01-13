import { useEffect } from 'react';
import { initAuth } from '../lib/auth-service';

export default function AuthInitializer() {
    useEffect(() => {
        initAuth();
    }, []);

    return null;
}
