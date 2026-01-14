import { describe, it, expect, vi } from 'vitest';
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

// Mock Store with a spy to check calls
const addToCartSpy = vi.fn();
vi.mock('../src/store/cartStore', () => ({
    useCartStore: () => ({
        items: [],
        addToCart: addToCartSpy,
        removeFromCart: vi.fn(),
        updateQuantity: vi.fn(),
    }),
}));

vi.mock('../src/store/authStore', () => ({
    useAuthStore: () => ({
        user: { isAnonymous: true, name: 'Guest' },
    }),
}));

vi.mock('../src/lib/firebase', () => ({
    db: {},
    getMessagingInstance: () => null,
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()),
    doc: vi.fn(),
}));

const mockData = {
    products: [
        { id: '1', name: 'Gomitas Mango', price: 6.00, image: 'mango.jpg', description: 'Deliciosas' }
    ]
};

describe('Purchase Flow', () => {
    it('displays products', () => {
        render(<OrderFlow data={mockData} />);
        expect(screen.getByText('Gomitas Mango')).toBeDefined();
        expect(screen.getByText('$6.00')).toBeDefined();
    });

    it('can add product to cart', () => {
        render(<OrderFlow data={mockData} />);

        const addButton = screen.getByText(/AGREGAR/i);
        fireEvent.click(addButton);

        expect(addToCartSpy).toHaveBeenCalled();
        expect(addToCartSpy).toHaveBeenCalledWith(
            expect.objectContaining({ id: '1', name: 'Gomitas Mango' }),
            1
        );
    });
});
