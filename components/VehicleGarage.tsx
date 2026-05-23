'use client';
import { useState, useEffect } from 'react';

const brands = ['Zetor', 'Ursus', 'John Deere', 'Massey Ferguson', 'Case IH', 'New Holland'];
const models: Record<string, string[]> = {
  'Zetor': ['7211', '5211', 'Proxima', 'Forterra'],
  'Ursus': ['C-330', 'C-360', 'C-385', '912'],
  'John Deere': ['6120M', '6155M', '5050E'],
};

export default function VehicleGarage() {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Sprawdzanie garażu przy starcie
  useEffect(() => {
    const saved = localStorage.getItem('farmer_garage');
    if (saved) {
      const { brand, model } = JSON.parse(saved);
      setSelectedBrand(brand);
      setSelectedModel(model);
      setIsActive(true);
    }
  }, []);

  const handleSearch = () => {
    if (selectedBrand && selectedModel) {
      localStorage.setItem('farmer_garage', JSON.stringify({ brand: selectedBrand, model: selectedModel }));
      setIsActive(true);
      // Przekierowanie do dynamicznej kategorii
      window.location.href = `/kategoria/wszystkie?marka=${selectedBrand}&model=${selectedModel}`;
    }
  };

  const clearGarage = () => {
    localStorage.removeItem('farmer_garage');
    setSelectedBrand('');
    setSelectedModel('');
    setIsActive(false);
  };

  // Widok aktywnego garażu (kiedy rolnik ma już wybraną maszynę)
  if (isActive) {
    return (
      <div className="bg-slate-900 rounded-[40px] p-8 flex flex-col justify-between shadow-2xl shadow-red-900/20 h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 group-hover:opacity-40 transition-opacity"></div>
        
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl animate-bounce-slow">🚜</span>
            <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Twój Wybór</span>
          </div>
          
          <h3 className="text-white text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">
            {selectedBrand}
          </h3>
          <p className="text-red-500 text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">
            {selectedModel}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <span className="text-green-500">●</span> Filtr aktywny
            </div>
            <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
              Wszystkie wyniki wyszukiwania są teraz filtrowane pod Twoją maszynę.
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          <button 
            onClick={() => window.location.href = `/kategoria/wszystkie?marka=${selectedBrand}&model=${selectedModel}`}
            className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
          >
            Pokaż części
          </button>
          <button 
            onClick={clearGarage}
            className="p-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all"
            title="Zmień maszynę"
          >
            🔄
          </button>
        </div>
      </div>
    );
  }

  // Widok pustego garażu (standardowy wybór)
  return (
    <div className="bg-white rounded-[40px] border-2 border-slate-100 p-8 flex flex-col justify-between shadow-sm h-full group hover:border-red-100 transition-all">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-100 p-3 rounded-2xl text-2xl group-hover:bg-red-100 group-hover:scale-110 transition-all">🚜</div>
          <div>
            <h3 className="font-black text-slate-900 text-xl leading-none uppercase italic tracking-tighter">Wirtualny</h3>
            <p className="font-black text-red-600 text-xl leading-none uppercase italic tracking-tighter">Garaż</p>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-400 mb-8 font-black uppercase tracking-[0.2em] leading-relaxed">
          Oszczędź czas. Dobierz części pod model.
        </p>
        
        <div className="space-y-4">
          <div className="relative">
            <select 
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(''); }}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-red-600 py-4 px-6 rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="">Wybierz markę</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
          </div>

          <div className="relative">
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedBrand}
              className={`w-full bg-slate-50 border-2 border-transparent focus:border-red-600 py-4 px-6 rounded-2xl text-sm font-bold outline-none appearance-none transition-all ${!selectedBrand ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <option value="">Wybierz model</option>
              {selectedBrand && models[selectedBrand]?.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleSearch}
        disabled={!selectedModel}
        className="w-full bg-slate-900 text-white py-5 rounded-[20px] font-black text-sm uppercase tracking-widest mt-8 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-10 shadow-xl shadow-slate-900/10"
      >
        Zatwierdź maszynę
      </button>
    </div>
  );
}