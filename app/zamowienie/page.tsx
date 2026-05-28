'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
// 👇 Importujemy nasz nowy, potężny silnik matematyczny
import { calculateCartMath } from '@/lib/cashbackEngine';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart() as any;
  
  const [orderType, setOrderType] = useState<'company' | 'person'>('company');
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'paczkomat'>('courier');
  const [paymentMethod, setPaymentMethod] = useState<'blik' | 'card' | 'pobranie'>('blik');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // DANE Z BAZY (Symulacja historii klienta)
  // Załóżmy, że klient wydał u nas już 105 000 zł, co wrzuca go na próg "Partner Strategiczny (VIP)" -15%
  const [userTotalSpent, setUserTotalSpent] = useState(105000); 
  const [availableCashback, setAvailableCashback] = useState(250.50);
  const [useCashback, setUseCashback] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '', phone: '', nip: '', companyName: '', street: '', zip: '', city: '', notes: ''
  });

  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      router.push('/');
    }
  }, [items, router, isProcessing]);

  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile_data');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setFormData(prev => ({
          ...prev, email: parsed.email || '', phone: parsed.phone || '', nip: parsed.nip || '',
          companyName: parsed.company || '', street: parsed.address || '', zip: parsed.zip || '', city: parsed.city || ''
        }));
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinishOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      clearCart();
      router.push('/podziekowanie-za-zakup');
    }, 2500);
  };

  // ====================================================================
  // MAGIA MATEMATYKI B2B (W locie przeliczamy koszyk przez nasz silnik)
  // ====================================================================
  const totalBrutto = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  
  const cartMath = calculateCartMath(totalBrutto, userTotalSpent, availableCashback, useCashback);
  
  const deliveryCost = cartMath.finalAmountToPay > 500 ? 0 : (deliveryMethod === 'courier' ? 25 : 15);
  const totalToPayWithDelivery = cartMath.finalAmountToPay + deliveryCost;

  if (items.length === 0 && !isProcessing) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* NAGŁÓWEK BEZPIECZEŃSTWA */}
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
                    <button type="button" className="absolute right-2 bg-slate-900 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-md active:scale-95">Pobierz dane</button>
                  </div>
                )}
                <input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder={orderType === 'company' ? "Pełna nazwa firmy / gospodarstwa" : "Imię i nazwisko"} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input required type="text" name="street" value={formData.street} onChange={handleInputChange} placeholder="Ulica i numer" className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                  <input required type="text" name="zip" value={formData.zip} onChange={handleInputChange} placeholder="Kod pocztowy" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                </div>
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Miejscowość" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium" />
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Uwagi do zamówienia / dla kuriera..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-red-600 transition-colors text-sm font-medium min-h-[100px] resize-y mt-2"></textarea>
              </div>
            </section>

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
                  <span className="font-black text-sm">{cartMath.finalAmountToPay > 500 ? 'GRATIS' : '25.00 zł'}</span>
                </button>
                <button type="button" onClick={() => setDeliveryMethod('paczkomat')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${deliveryMethod === 'paczkomat' ? 'border-red-600 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">📱</div>
                    <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-tight">InPost Paczkomat 24/7</p>
                      <p className="text-xs text-slate-500 font-medium">Odbierz o dowolnej porze</p>
                    </div>
                  </div>
                  <span className="font-black text-sm">{cartMath.finalAmountToPay > 500 ? 'GRATIS' : '15.00 zł'}</span>
                </button>
              </div>
            </section>

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

          {/* PRAWA KOLUMNA: POTĘŻNE B2B PODSUMOWANIE */}
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

              {/* MODUŁ: SKARBONKA */}
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

              {/* PODSUMOWANIE KOSZTÓW Z UWZGLĘDNIENIEM NOWEJ MATEMATYKI */}
              <div className="space-y-3 text-xs font-bold text-slate-500 border-t border-slate-100 pt-4">
                
                <div className="flex justify-between items-center">
                  <span>Wartość części (brutto):</span>
                  <span className="text-slate-800">{cartMath.originalTotal.toFixed(2)} zł</span>
                </div>
                
                {/* WIECZNY RABAT B2B */}
                {cartMath.lifetimeDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600 font-black bg-red-50 p-2 rounded-lg -mx-2">
                    <span>Zniżka stała ({cartMath.tierName} -{cartMath.discountPercent}%):</span>
                    <span>-{cartMath.lifetimeDiscountAmount.toFixed(2)} zł</span>
                  </div>
                )}
                
                {/* ZNIŻKA ZE SKARBONKI */}
                {useCashback && cartMath.applicableCashback > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-black bg-emerald-50 p-2 rounded-lg -mx-2">
                    <span>Użyto ze Skarbonki:</span>
                    <span>-{cartMath.applicableCashback.toFixed(2)} zł</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span>Dostawa:</span>
                  <span className="text-slate-800">{deliveryCost === 0 ? 'GRATIS' : `${deliveryCost.toFixed(2)} zł`}</span>
                </div>
                
                {/* FINALNA CENA I ZYSK Z POWROTU KASY */}
                <div className="flex flex-col pt-4 border-t border-dashed border-slate-200 gap-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-900 font-black uppercase text-xs tracking-wider">Do zapłaty:</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{totalToPayWithDelivery.toFixed(2)} <span className="text-xs font-bold text-slate-400">zł</span></span>
                  </div>
                  
                  {/* INFORMACJA O ZWROCIE */}
                  <div className="bg-slate-900 text-white rounded-xl p-3 mt-2 flex items-center justify-between shadow-inner border border-slate-800">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Zyskujesz do skarbonki:</span>
                    <span className="text-sm font-black text-emerald-400">+{cartMath.cashbackEarned.toFixed(2)} zł</span>
                  </div>
                </div>
              </div>

              <button 
                 type="submit" 
                 disabled={isProcessing}
                className={`w-full mt-6 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 ${isProcessing ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 hover:scale-[1.02] active:scale-95'}`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Przetwarzanie...</span>
                ) : (
                  <><span>POTWIERDZAM I PŁACĘ</span><span className="text-xl">➔</span></>
                )}
              </button>
            </div>

            <div className="bg-slate-100/50 rounded-2xl p-4 flex flex-col gap-3">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">🛡️</div>
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-tight">Gwarancja dopasowania lub zwrot środków</p>
               </div>
            </div>
          </aside>
          
        </form>
      </main>
    </div>
  );
}