import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { initAuth } from '../../lib/auth-service';
import AdminLogin from './AdminLogin';
import Dashboard from './Dashboard';

export default function AdminManager() {
    const { user, loading } = useAuthStore();

    useEffect(() => {
        initAuth();
    }, []);

    useEffect(() => {
        if (!loading) {
            console.log("--- Diagnóstico de Admin ---");
            console.log("UID:", user?.uid);
            console.log("Rol Detectado:", user?.role);
            console.log("Sesión activa:", !!user);
            console.log("---------------------------");
        }
    }, [user, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDF6E3] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#D91A2A] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            {user ? <Dashboard /> : <AdminLogin />}
        </>
    );
}
