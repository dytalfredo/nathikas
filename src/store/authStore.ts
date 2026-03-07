import { create } from 'zustand';

export type UserRole = 'administrator' | 'asistente' | 'vendedor' | 'customer' | 'puntoDeVenta' | null;

interface UserProfile {
    uid: string;
    email: string | null;
    role: UserRole;
    name?: string;
    phone?: string;
    cedula?: string;
    isAnonymous?: boolean;
    pickupId?: string; // ID of the assigned pickup point for 'puntoDeVenta' role
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
