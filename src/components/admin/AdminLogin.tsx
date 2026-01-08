import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error(err);
            setError('Credenciales inválidas o error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF6E3] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border-4 border-[#F2A900]"
            >
                <div className="text-center mb-8">
                    <img src="/images/logo.png" alt="Nathikas Logo" className="w-24 h-24 mx-auto mb-4" />
                    <h1 className="text-4xl font-heading text-[#D91A2A]">Panel Admin</h1>
                    <p className="text-gray-600 font-bold">Ingresa tus credenciales</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#F2A900] transition-colors"
                                placeholder="admin@nathikas.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#FDF6E3] border-2 border-[#E0E0E0] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#F2A900] transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-bold border border-red-200"
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-[#D91A2A] text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#b9151e] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
