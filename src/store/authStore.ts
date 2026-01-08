import { create } from 'zustand';

export type UserRole = 'administrator' | 'asistente' | 'vendedor' | null;

interface UserProfile {
    uid: string;
    email: string | null;
    role: UserRole;
}

interface AuthState {
    user: UserProfile | null;
    loading: boolean;
    setUser: (user: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    setLoading: (loading) => set({ loading }),
}));
