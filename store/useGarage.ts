import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GarageState {
  brand: string;
  model: string;
  isActive: boolean;
  setVehicle: (brand: string, model: string) => void;
  clearGarage: () => void;
}

export const useGarage = create<GarageState>()(
  persist(
    (set) => ({
      brand: '',
      model: '',
      isActive: false,
      setVehicle: (brand, model) => set({ brand, model, isActive: true }),
      clearGarage: () => set({ brand: '', model: '', isActive: false }),
    }),
    {
      name: 'farmer_garage', // Zustand sam zadba o zapis i odczyt z localStorage!
    }
  )
);