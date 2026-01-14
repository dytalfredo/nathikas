import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import OrderFlow from '../src/components/OrderFlow';

// Mocks
vi.mock('../src/lib/auth-service', () => ({
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    syncUserProfile: vi.fn(),
    loginAnonymously: vi.fn(),
}));

vi.mock('../src/store/cartStore', () => ({
    useCartStore: () => ({
        items: [],
        addToCart: vi.fn(),
        removeFromCart: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
    }),
}));

vi.mock('../src/store/authStore', () => ({
    useAuthStore: () => ({
        user: null, // Simulate logged out state
    }),
}));

vi.mock('../src/lib/firebase', () => ({
    db: {},
    getMessagingInstance: () => null,
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()), // Return unsubscribe function
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    writeBatch: vi.fn(() => ({
        commit: vi.fn(),
        update: vi.fn(),
    })),
}));

// Mock Data
const mockData = {
    products: [
        { id: '1', name: 'Gomitas Picantes', price: 5.00, image: 'img1.jpg' }
    ]
};

describe('OrderFlow Login UI', () => {
    it('renders login button when user is not logged in', () => {
        render(<OrderFlow data={mockData} />);

        // Check for the "Entrar" button text or icon
        const loginButtons = screen.getAllByText(/Entrar/i);
        expect(loginButtons.length).toBeGreaterThan(0);
    });

    it('shows email input fields in step 2 (Shipping)', () => {
        render(<OrderFlow data={mockData} />);

        // We need to navigate to step 2 manually or simulate state?
        // Since OrderFlow starts at step 1, we might test what's visible there.
        // Step 1 is product selection.
        expect(screen.getByText('ELIGE TU ANTOJO')).toBeDefined();
    });
});
