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
  addItem: (item: CartItem) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  setIsOpen: (isOpen: boolean) => void; 
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false, 

      setIsOpen: (isOpen) => set({ isOpen }),

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
              isOpen: true, 
            };
          }
          return { 
            items: [...state.items, item],
            isOpen: true, // Automatycznie wysuń szufladę po dodaniu nowego produktu!
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'centrum-rolnictwa-cart', 
      partialize: (state) => ({ items: state.items }), 
    }
  )
);