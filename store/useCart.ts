import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  crossSell?: string[];
  category?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalPrice: number; // Dodane: teraz TypeScript już nie będzie krzyczał
  addItem: (item: CartItem) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  setIsOpen: (isOpen: boolean) => void;
  clearCart: () => void;
}

// Funkcja pomocnicza do obliczania sumy
const calculateTotal = (items: CartItem[]) => {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      totalPrice: 0, // Inicjalizacja

      setIsOpen: (isOpen) => set({ isOpen }),

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          let newItems;
          
          if (existingItem) {
            newItems = state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            );
          } else {
            newItems = [...state.items, item];
          }
          
          return {
            items: newItems,
            totalPrice: calculateTotal(newItems),
            isOpen: true,
          };
        }),

      removeItem: (id) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== id);
          return {
            items: newItems,
            totalPrice: calculateTotal(newItems),
          };
        }),

      updateQuantity: (id, quantity) =>
        set((state) => {
          const newItems = state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
          );
          return {
            items: newItems,
            totalPrice: calculateTotal(newItems),
          };
        }),

      clearCart: () => set({ items: [], totalPrice: 0 }),
    }),
    {
      name: 'centrum-rolnictwa-cart',
      partialize: (state) => ({ items: state.items, totalPrice: state.totalPrice }),
    }
  )
);