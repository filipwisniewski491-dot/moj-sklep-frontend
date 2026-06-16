'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGarage } from '@/store/useGarage'; // Wpięcie stanu globalnego

const brands = ['Zetor', 'Ursus', 'John Deere', 'Massey Ferguson', 'Case IH', 'New Holland'];
const models: Record<string, string[]> = {
  'Zetor': ['7211', '5211', '7245', 'Proxima', 'Forterra'],
  'Ursus': ['C-330', 'C-360', 'C-385', '912', '1224'],
  'John Deere': ['6120M', '6155M', '5050E', '6920'],
};

export default function GaragePage() {
  const { brand: activeBrand, model: activeModel, setVehicle, clearGarage } = useGarage();
  
  const [savedVehicles, setSavedVehicles] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // W przyszłości pobierzesz to z API Medusy
    const saved = localStorage.getItem('farmer_garage_list');
    if (saved) {
      setSavedVehicles(JSON.parse(saved));
    }
  }, []);

  const handleAddVehicle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedBrand || !selectedModel) return;
    
    const newVehicle = { id: Date.now(), make: selectedBrand, model: selectedModel };
    const updatedList = [...savedVehicles, newVehicle];
    
    setSavedVehicles(updatedList);
    localStorage.setItem('farmer_garage_list', JSON.stringify(updatedList));
    
    // Globalna aktywacja Zustand
    setVehicle(selectedBrand, selectedModel);
    
    setSelectedBrand('');
    setSelectedModel('');
  };

  const handleActivateVehicle = (vehicle: any) => {
    setVehicle(vehicle.make, vehicle.model);
    alert(`Aktywowano filtry sklepu dla: ${vehicle.make} ${vehicle.model}`);
  };

  if (!mounted) return null;

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-4">Mój Garaż Maszyn</h1>
      
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm mb-8">
         <h2 className="text-xl font-black uppercase text-slate-900 mb-6">Twoje pojazdy</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {savedVehicles.map(vehicle => {
             const isCurrentActive = activeBrand === vehicle.make && activeModel === vehicle.model;
             return (
               <div key={vehicle.id} className={`border-2 rounded-2xl p-5 relative group transition-colors ${isCurrentActive ? 'border-red-600 bg-red-50/30' : 'border-slate-200 hover:border-slate-900'}`}>
                  {isCurrentActive && <span className="absolute top-4 right-4 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">Aktywny filtr</span>}
                  <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{vehicle.make} {vehicle.model}</h3>
                  <div className="mt-4 flex gap-2">
                     <button onClick={() => handleActivateVehicle(vehicle)} className="flex-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg hover:bg-red-600 transition-colors">
                       Użyj w sklepie
                     </button>
                     <button className="px-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors">
                       Usuń
                     </button>
                  </div>
               </div>
             )
           })}
         </div>
      </div>

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
    </>
  );
}