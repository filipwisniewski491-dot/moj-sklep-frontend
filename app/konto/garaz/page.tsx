'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useCart } from '@/store/useCart';

const brands = ['Zetor', 'Ursus', 'John Deere', 'Massey Ferguson', 'Case IH', 'New Holland', 'Deutz-Fahr', 'Fendt', 'Class'];
const models: Record<string, string[]> = {
  'Zetor': ['7211', '5211', '7245', 'Proxima', 'Forterra'],
  'Ursus': ['C-330', 'C-360', 'C-385', '912', '1224'],
  'John Deere': ['6120M', '6155M', '5050E', '6920'],
};

export default function GaragePage() {
  const { items } = useCart();
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  
  // REALNE DANE: Zarządzanie wirtualnym garażem
  const [savedVehicles, setSavedVehicles] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Pobieranie pojazdów przy starcie
  useEffect(() => {
    const fetchGarage = () => {
      const saved = localStorage.getItem('farmer_garage_list');
      if (saved) {
        setSavedVehicles(JSON.parse(saved));
      } else {
        // Jeśli nie ma listy, sprawdzamy czy nie ma pojedynczego (ze starego systemu)
        const single = localStorage.getItem('farmer_garage');
        if (single) {
          const parsed = JSON.parse(single);
          const initialList = [{ id: Date.now(), make: parsed.brand, model: parsed.model }];
          setSavedVehicles(initialList);
          localStorage.setItem('farmer_garage_list', JSON.stringify(initialList));
        }
      }
    };
    fetchGarage();
  }, []);

  const handleAddVehicle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedBrand || !selectedModel) return;

    const newVehicle = { id: Date.now(), make: selectedBrand, model: selectedModel };
    const updatedList = [...savedVehicles, newVehicle];
    
    setSavedVehicles(updatedList);
    localStorage.setItem('farmer_garage_list', JSON.stringify(updatedList));
    
    // Ustawiamy od razu ten nowy pojazd jako aktywny filtr na głównym sklepie
    localStorage.setItem('farmer_garage', JSON.stringify({ brand: selectedBrand, model: selectedModel }));
    
    setSelectedBrand('');
    setSelectedModel('');
  };

  const handleRemoveVehicle = (idToRemove: number) => {
    const updatedList = savedVehicles.filter(v => v.id !== idToRemove);
    setSavedVehicles(updatedList);
    localStorage.setItem('farmer_garage_list', JSON.stringify(updatedList));
    
    // Jeśli usuwamy, czyścimy też główny filtr, by zapobiec błędom
    localStorage.removeItem('farmer_garage');
  };

  const handleActivateVehicle = (vehicle: any) => {
    localStorage.setItem('farmer_garage', JSON.stringify({ brand: vehicle.make, model: vehicle.model }));
    alert(`Aktywowano filtry sklepu dla: ${vehicle.make} ${vehicle.model}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      <header className="bg-white relative z-50 shadow-sm border-b border-slate-100 py-3 md:py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-row items-center justify-between gap-3 md:gap-8">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" aria-label="CentrumRolnictwa.pl - Strona Główna">
              <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa.pl" className="h-10 sm:h-14 md:h-20 w-auto transition-transform hover:scale-105 duration-300" fetchPriority="high" />
            </Link>
          </div>
          <div className="flex-1 w-full relative z-50">
             <SearchBar />
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-slate-800">
            <Link href="/konto" className="flex flex-col items-center cursor-pointer text-red-600 transition-all group">
              <div className="p-3 bg-red-50 border-red-200 rounded-full transition-colors border shadow-inner">
                 <svg className="w-5 h-5 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest">Moje Konto</span>
            </Link>
          </nav>
        </div>
      </header>

      <MegaMenu />

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12 relative z-10">
        <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-8">
          Mój Garaż Maszyn
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/4 shrink-0">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <nav className="space-y-2">
                   <Link href="/konto" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">📊</span> Pulpit i Skarbonka
                   </Link>
                   <Link href="/konto/zamowienia" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">📦</span> Moje zamówienia
                   </Link>
                   <Link href="/konto/garaz" className="flex items-center gap-3 bg-red-50 text-red-700 font-black text-[11px] uppercase tracking-widest p-4 rounded-xl border border-red-100">
                     <span className="text-lg">🚜</span> Mój Garaż Maszyn
                   </Link>
                   <Link href="/konto/zwroty" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">🔄</span> Zwroty i Reklamacje
                   </Link>
                   <Link href="/konto/ustawienia" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">⚙️</span> Ustawienia Konta
                   </Link>
                </nav>
             </div>
          </aside>

          <div className="w-full lg:w-3/4 flex flex-col gap-8">
            
            {/* LISTA ZAPISANYCH MASZYN */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
               <h2 className="text-xl font-black uppercase text-slate-900 mb-6">Twoje pojazdy</h2>
               
               {savedVehicles.length === 0 ? (
                 <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-4xl grayscale opacity-40 block mb-2">🚜</span>
                    <p className="text-sm font-bold text-slate-500">Twój garaż jest pusty.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {savedVehicles.map(vehicle => (
                     <div key={vehicle.id} className="border border-slate-200 rounded-2xl p-5 relative group hover:border-slate-900 transition-colors">
                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{vehicle.make} {vehicle.model}</h3>
                        <div className="mt-4 flex gap-2">
                           <button onClick={() => handleActivateVehicle(vehicle)} className="flex-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg hover:bg-red-600 transition-colors">
                             Szukaj części
                           </button>
                           <button onClick={() => handleRemoveVehicle(vehicle.id)} className="px-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors">
                             Usuń
                           </button>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* DODAWANIE NOWEJ MASZYNY */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
               <h2 className="text-xl font-black uppercase text-slate-900 mb-2">Dodaj nową maszynę</h2>
               <p className="text-xs text-slate-500 font-medium mb-6">Dodaj pojazd do wirtualnego garażu, aby sklep automatycznie ukrywał niepasujące do niego części.</p>
               
               <form className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1">
                   <select 
                     value={selectedBrand} 
                     onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(''); }}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 cursor-pointer"
                   >
                     <option value="">Wybierz markę</option>
                     {brands.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                 </div>
                 <div className="flex-1">
                   <select 
                     value={selectedModel} 
                     onChange={(e) => setSelectedModel(e.target.value)}
                     disabled={!selectedBrand}
                     className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 ${!selectedBrand ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                   >
                     <option value="">Wybierz model</option>
                     {selectedBrand && models[selectedBrand]?.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                 </div>
                 <button 
                   onClick={handleAddVehicle}
                   disabled={!selectedModel}
                   className="bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                   Zapisz
                 </button>
               </form>
            </div>

          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}