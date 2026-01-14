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
            {user ? (
                user.role === 'administrator' ? (
                    <Dashboard />
                ) : (
                    <div className="min-h-screen bg-[#FDF6E3] flex flex-col items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-3xl shadow-xl text-center border-4 border-[#D91A2A] max-w-md w-full">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#D91A2A]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                            </div>
                            <h1 className="text-2xl font-bold text-[#D91A2A] mb-2">Acceso Restringido</h1>
                            <p className="mb-6 text-gray-600 font-medium">Esta área es exclusiva para administradores. Si eres parte del equipo, por favor inicia sesión con una cuenta autorizada.</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full bg-[#3E2723] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2D1C1A] transition-colors"
                                >
                                    Volver a la Tienda
                                </button>
                                <button
                                    onClick={() => import('../../lib/auth-service').then(m => m.logout().then(() => window.location.reload()))}
                                    className="w-full bg-white text-gray-500 border-2 border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cerrar Sesión Actual
                                </button>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                <AdminLogin />
            )}
        </>
    );
}
