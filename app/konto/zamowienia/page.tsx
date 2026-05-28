'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';

// Inteligentny loader dla zdjęć
const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart() as any;
  
  // Stany formularza
  const [orderType, setOrderType] = useState<'company' | 'person'>('company');
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'paczkomat'>('courier');
  const [paymentMethod, setPaymentMethod] = useState<'blik' | 'card' | 'pobranie'>('blik');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // REALNE DANE: Stany dla Skarbonki i zapamiętanych danych
  const [availableCashback, setAvailableCashback] = useState(0);
  const [useCashback, setUseCashback] = useState(false);
  const [formData, setFormData] = useState({
    email: '', phone: '', nip: '', companyName: '', street: '', zip: '', city: '', notes: ''
  });

  // Automatyczne przekierowanie, jeśli koszyk jest pusty
  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      router.push('/');
    }
  }, [items, router, isProcessing]);

  // Pobieranie prawdziwych danych użytkownika (Zastępuje Demówki)
  useEffect(() => {
    // 1. Sprawdzamy czy użytkownik ma środki w Skarbonce
    const savedCashback = localStorage.getItem('user_cashback_balance');
    if (savedCashback) {
      setAvailableCashback(parseFloat(savedCashback));
    }

    // 2. Wczytujemy zapamiętane dane firmowe z profilu
    const savedProfile = localStorage.getItem('user_profile_data');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setFormData(prev => ({
          ...prev,
          email: parsed.email || '',
          phone: parsed.phone || '',
          nip: parsed.nip || '',
          companyName: parsed.company || '',
          street: parsed.address || '',
          zip: parsed.zip || '',
          city: parsed.city || ''
        }));
      } catch (e) {
        console.error("Błąd parsowania danych profilu", e);
      }
    }
  }, []);

  const totalBrutto = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const totalNetto = totalBrutto / 1.23;
  const deliveryCost = totalBrutto > 500 ? 0 : (deliveryMethod === 'courier' ? 25 : 15);
  
  // Obliczanie zniżki ze skarbonki (Cashback nie może przekroczyć wartości koszyka)
  const appliedDiscount = useCashback ? Math.min(availableCashback, totalBrutto) : 0;
  const finalAmount = totalBrutto + deliveryCost - appliedDiscount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinishOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Zmniejszamy saldo skarbonki po zakupie
    if (useCashback && availableCashback > 0) {
      const newBalance = availableCashback - appliedDiscount;
      localStorage.setItem('user_cashback_balance', newBalance.toString());
    }

    // Symulacja bramki płatniczej
    setTimeout(() => {
      clearCart();
      router.push('/podziekowanie-za-zakup');
    }, 2500);
  };

  if (items.length === 0 && !isProcessing) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* NAGŁÓWEK BEZPIECZEŃSTWA (TUNELOWANIE) */}
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
          <Link href="/" className="font-black text-xl tracking-tighter text-slate-900">
            CentrumRolnictwa<span className="text-slate-400">.pl</span>
          </Link>
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <span className="text-emerald-500 text-lg">🔒</span> Bezpieczne zakupy SSL
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <form onSubmit={handleFinishOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEWA KOLUMNA: DANE I DOSTAWA */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. DANE KONTAKTOWE */}
            <section className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <span className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm shadow-md">1</span>
                <h2 className="text-lg font-black uppercase tracking-widest">Twoje dane</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="E-mail (do wysłania faktury)" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Numer telefonu (dla kuriera)" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
              </div>

              <div className="mt-6 flex gap-4 border-b border-slate-100 pb-6">
                 <button type="button" onClick={() => setOrderType('company')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${orderType === 'company' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400'}`}>Firma / Rolnik (NIP)</button>
                 <button type="button" onClick={() => setOrderType('person')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${orderType === 'person' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400'}`}>Osoba prywatna</button>
              </div>

              <div className="mt-6 space-y-4">
                {orderType === 'company' && (
                  <div className="relative flex items-center">
                    <input required type="text" name="nip" value={formData.nip} onChange={handleInputChange} placeholder="NIP (Pobierzemy dane z bazy GUS)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 outline-none focus:border-red-600 transition-colors text-sm font-black tracking-widest pr-36" />
                    <button type="button" className="absolute right-2 bg-slate-900 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-md active:scale-95">
                      Pobierz dane
                    </button>
                  </div>
                )}
                
                <input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder={orderType === 'company' ? "Pełna nazwa firmy / gospodarstwa" : "Imię i nazwisko"} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input required type="text" name="street" value={formData.street} onChange={handleInputChange} placeholder="Ulica i numer" className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                  <input required type="text" name="zip" value={formData.zip} onChange={handleInputChange} placeholder="Kod pocztowy" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                </div>
                
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Miejscowość" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                
                <textarea 
                   name="notes"
                   value={formData.notes}
                   onChange={handleInputChange}
                   placeholder="Uwagi do zamówienia / dla kuriera (np. zostawić za stodołą, zadzwonić przed dostawą)..."
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium min-h-[100px] resize-y mt-2"
                ></textarea>
              </div>
            </section>

            {/* 2. DOSTAWA */}
            <section className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <span className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm shadow-md">2</span>
                <h2 className="text-lg font-black uppercase tracking-widest">Sposób dostawy</h2>
              </div>

              <div className="space-y-3">
                <button type="button" onClick={() => setDeliveryMethod('courier')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${deliveryMethod === 'courier' ? 'border-red-600 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">📦</div>
                    <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-tight">Kurier pod drzwi (DPD / DHL)</p>
                      <p className="text-xs text-slate-500 font-medium">Dostawa jutro rano bezpośrednio do gospodarstwa</p>
                    </div>
                  </div>
                  <span className="font-black text-sm">{totalBrutto > 500 ? 'GRATIS' : '25.00 zł'}</span>
                </button>
                <button type="button" onClick={() => setDeliveryMethod('paczkomat')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${deliveryMethod === 'paczkomat' ? 'border-red-600 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">📱</div>
                    <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-tight">InPost Paczkomat 24/7</p>
                      <p className="text-xs text-slate-500 font-medium">Odbierz o dowolnej porze</p>
                    </div>
                  </div>
                  <span className="font-black text-sm">{totalBrutto > 500 ? 'GRATIS' : '15.00 zł'}</span>
                </button>
              </div>
            </section>

            {/* 3. PŁATNOŚĆ */}
            <section className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <span className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm shadow-md">3</span>
                <h2 className="text-lg font-black uppercase tracking-widest">Metoda płatności</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button type="button" onClick={() => setPaymentMethod('blik')} className={`p-4 rounded-2xl border-2 text-center transition-all ${paymentMethod === 'blik' ? 'border-red-600 bg-red-50/30 ring-2 ring-red-100' : 'border-slate-100 hover:border-slate-200'}`}>
                   <div className="bg-slate-900 text-white px-2 py-0.5 rounded-md inline-block text-[10px] font-black mb-2">BLIK</div>
                   <p className="text-xs font-black uppercase">Szybki przelew</p>
                </button>
                <button type="button" onClick={() => setPaymentMethod('card')} className={`p-4 rounded-2xl border-2 text-center transition-all ${paymentMethod === 'card' ? 'border-red-600 bg-red-50/30 ring-2 ring-red-100' : 'border-slate-100 hover:border-slate-200'}`}>
                   <div className="text-xl mb-1">💳</div>
                   <p className="text-xs font-black uppercase">Karta / PayU</p>
                </button>
                <button type="button" onClick={() => setPaymentMethod('pobranie')} className={`p-4 rounded-2xl border-2 text-center transition-all ${paymentMethod === 'pobranie' ? 'border-red-600 bg-red-50/30 ring-2 ring-red-100' : 'border-slate-100 hover:border-slate-200'}`}>
                   <div className="text-xl mb-1">🚚</div>
                   <p className="text-xs font-black uppercase">Przy odbiorze</p>
                </button>
              </div>
            </section>
          </div>

          {/* PRAWA KOLUMNA: PODSUMOWANIE (STICKY) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b pb-4">Twoje zamówienie</h3>
              
              <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-4 custom-scrollbar">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-lg border p-1 shrink-0 relative flex items-center justify-center overflow-hidden">
                      {item.image && item.image.trim() !== '' ? (
                        <Image loader={bunnyLoader} src={item.image} alt={item.name} fill className="object-contain mix-blend-multiply p-0.5" />
                      ) : (
                        <span className="text-[8px] font-black text-slate-300 uppercase">BRAK</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 truncate uppercase leading-tight">{item.name}</p>
                      <p className="text-[10px] font-black text-slate-400 mt-0.5">{item.quantity} szt. x {item.price.toFixed(2)} zł</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* INTEGRACJA ZE SKARBONKĄ */}
              {availableCashback > 0 && (
                <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useCashback} 
                      onChange={(e) => setUseCashback(e.target.checked)} 
                      className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase text-emerald-800 tracking-widest leading-none mb-1">Użyj Skarbonki</p>
                      <p className="text-[10px] font-bold text-emerald-600">Dostępne: {availableCashback.toFixed(2)} zł</p>
                    </div>
                  </label>
                </div>
              )}

              <div className="space-y-2.5 text-xs font-bold text-slate-500 border-t border-slate-100 pt-4">
                <div className="flex justify-between"><span>Produkty (netto):</span><span className="text-slate-800">{totalNetto.toFixed(2)} zł</span></div>
                <div className="flex justify-between"><span>Podatek VAT (23%):</span><span className="text-slate-800">{(totalBrutto - totalNetto).toFixed(2)} zł</span></div>
                
                {useCashback && appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-black">
                    <span>Zniżka (Skarbonka):</span>
                    <span>-{appliedDiscount.toFixed(2)} zł</span>
                  </div>
                )}
                
                <div className="flex justify-between"><span>Dostawa:</span><span className="text-slate-800">{deliveryCost === 0 ? 'GRATIS' : `${deliveryCost.toFixed(2)} zł`}</span></div>
                
                <div className="flex justify-between items-baseline pt-4 border-t border-dashed border-slate-200">
                  <span className="text-slate-900 font-black uppercase text-xs tracking-wider">Do zapłaty:</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">{finalAmount.toFixed(2)} <span className="text-xs font-bold text-slate-400">zł</span></span>
                </div>
              </div>

              <button 
                 type="submit" 
                 disabled={isProcessing}
                className={`w-full mt-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 ${isProcessing ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 hover:scale-[1.02] active:scale-95'}`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Przetwarzanie...</span>
                ) : (
                  <><span>POTWIERDZAM I PŁACĘ</span><span className="text-xl">➔</span></>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500 font-bold uppercase mt-6 leading-relaxed">
                Klikając powyższy przycisk akceptujesz <br className="md:hidden"/>
                <Link href="/regulamin" target="_blank" className="text-slate-900 hover:text-red-600 underline underline-offset-2 transition-colors">regulamin sklepu</Link> oraz <Link href="/polityka-prywatnosci" target="_blank" className="text-slate-900 hover:text-red-600 underline underline-offset-2 transition-colors">politykę prywatności</Link>.
              </p>
            </div>

            {/* ZAUFANIE B2B */}
            <div className="bg-slate-100/50 rounded-2xl p-4 flex flex-col gap-3">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">🛡️</div>
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-tight">Gwarancja dopasowania lub zwrot środków</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">📞</div>
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-tight">Wsparcie pozakupowe: +48 500 600 700</p>
               </div>
            </div>
          </aside>
          
        </form>
      </main>
    </div>
  );
}