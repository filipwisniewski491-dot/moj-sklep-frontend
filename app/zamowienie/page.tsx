'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { calculateCartMath } from '@/lib/cashbackEngine';
import { trackAddShippingInfo, trackAddPaymentInfo, trackPurchase, identifyUser, GA4Item } from '@/lib/analytics';

// 1. IMPORTY DO PANCERNEJ WALIDACJI
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// 2. SCHEMAT ZOD - Twarde reguły dla każdego pola
const checkoutSchema = z.object({
  orderType: z.enum(['company', 'person']),
  email: z.string().email('Podaj poprawny adres e-mail (np. jan@kowalski.pl)'),
  phone: z.string().regex(/^(?:\+48)?\s?(?:\d{3}[-\s]?){2}\d{3}$/, 'Podaj poprawny polski numer telefonu (9 cyfr)'),
  companyName: z.string().min(3, 'To pole musi zawierać co najmniej 3 znaki'),
  nip: z.string().optional(),
  street: z.string().min(3, 'Podaj dokładną ulicę i numer domu'),
  zip: z.string().regex(/^\d{2}-\d{3}$/, 'Format kodu pocztowego to XX-XXX'),
  city: z.string().min(2, 'Podaj nazwę miejscowości'),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Warunkowa walidacja NIPu tylko, gdy wybrano "Firma"
  if (data.orderType === 'company') {
    const nipClean = data.nip?.replace(/[\s-]/g, '') || '';
    if (!/^\d{10}$/.test(nipClean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'NIP firmy musi składać się dokładnie z 10 cyfr',
        path: ['nip'],
      });
    }
  }
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart() as any;
  
  const [checkoutStep, setCheckoutStep] = useState<'login_wall' | 'form'>('login_wall');
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'paczkomat'>('courier');
  const [paymentMethod, setPaymentMethod] = useState<'blik' | 'card' | 'pobranie'>('blik');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitDiscountApplied, setExitDiscountApplied] = useState(false);
  
  const [userTotalSpent] = useState(105000); 
  const [availableCashback, setAvailableCashback] = useState(250.50);
  const [useCashback, setUseCashback] = useState(false);

  // 3. INICJALIZACJA REACT HOOK FORM
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue,
    formState: { errors } 
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      orderType: 'company', // Domyślnie na firmę
    }
  });

  const currentOrderType = watch('orderType');

  const ga4Items: GA4Item[] = items.map((item: any) => ({
    item_id: String(item.id),
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
    item_category: item.category || 'Brak kategorii',
  }));

  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      router.push('/');
    }
  }, [items, router, isProcessing]);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !showExitIntent && !exitDiscountApplied && items.length > 0) {
      const closedAt = localStorage.getItem('exit_intent_closed_at');
      if (closedAt) {
        const hoursPassed = (new Date().getTime() - parseInt(closedAt)) / (1000 * 60 * 60);
        if (hoursPassed < 24) return; 
      }
      setShowExitIntent(true);
    }
  }, [showExitIntent, exitDiscountApplied, items.length]);

  useEffect(() => {
    if (checkoutStep === 'form') {
      document.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [checkoutStep, handleMouseLeave]);

  const applyExitDiscount = () => {
    setExitDiscountApplied(true);
    setShowExitIntent(false);
  };

  const closeExitIntent = () => {
    setShowExitIntent(false);
    localStorage.setItem('exit_intent_closed_at', new Date().getTime().toString());
  };

  const totalBrutto = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  let cartMath = calculateCartMath(totalBrutto, userTotalSpent, availableCashback, useCashback);
  
  let finalToPayBeforeDelivery = cartMath.finalAmountToPay;
  let exitDiscountValue = 0;
  if (exitDiscountApplied) {
     exitDiscountValue = finalToPayBeforeDelivery * 0.03;
     finalToPayBeforeDelivery -= exitDiscountValue;
  }

  const deliveryCost = finalToPayBeforeDelivery > 500 ? 0 : (deliveryMethod === 'courier' ? 25 : 15);
  const totalToPayWithDelivery = finalToPayBeforeDelivery + deliveryCost;

  const handleDeliveryChange = (method: 'courier' | 'paczkomat') => {
    setDeliveryMethod(method);
    trackAddShippingInfo(ga4Items, totalToPayWithDelivery, method);
  };

  const handlePaymentChange = (method: 'blik' | 'card' | 'pobranie') => {
    setPaymentMethod(method);
    trackAddPaymentInfo(ga4Items, totalToPayWithDelivery, method);
  };

  // 4. NOWY HANDLER Z WALIDACJĄ
  const onSubmitForm = (data: CheckoutFormValues) => {
    setIsProcessing(true);

    identifyUser('usr-10293', cartMath.tierName, userTotalSpent + totalToPayWithDelivery);

    const transactionId = `CR-${Date.now()}`;
    const tax = totalToPayWithDelivery * 0.187;
    const netValue = finalToPayBeforeDelivery / 1.23;
    const estimatedProfit = netValue * 0.35; 

    let firstName, lastName;
    if (data.orderType === 'person') {
      const nameParts = data.companyName.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    const isNewCustomer = userTotalSpent === 0;

    trackPurchase(
      ga4Items,
      transactionId,
      totalToPayWithDelivery,
      tax,
      deliveryCost,
      {
        email: data.email,
        phone: data.phone,
        firstName: firstName,
        lastName: lastName,
        city: data.city,
        zip: data.zip
      },
      estimatedProfit,
      isNewCustomer,
      exitDiscountApplied ? 'EXIT-INTENT-3' : undefined,
      exitDiscountApplied ? exitDiscountValue : 0
    );

    setTimeout(() => {
      clearCart();
      router.push('/podziekowanie-za-zakup');
    }, 2500);
  };

  if (items.length === 0 && !isProcessing) return null;

  if (checkoutStep === 'login_wall') {
    return (
        // Kod ekrany logowania pozostaje bez zmian wizualnych
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-slate-900">Masz już konto?</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">Wybierz sposób finalizacji zamówienia</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col h-full opacity-90 hover:opacity-100 transition-opacity">
              <div className="mb-8">
                <span className="text-3xl mb-4 block">🏃</span>
                <h2 className="text-xl font-black uppercase tracking-tight mb-2">Szybkie zakupy</h2>
                <p className="text-sm text-slate-500 font-medium">Kupuję bez zakładania konta jako gość.</p>
              </div>
              
              <div className="mt-auto pt-6">
                <button onClick={() => setCheckoutStep('form')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-colors mb-4 min-h-[56px]">
                  Kupuję jako gość ➔
                </button>
                <div className="bg-red-50 border border-red-100 text-red-800 p-3 rounded-xl text-[10px] font-bold text-center uppercase tracking-widest">
                  ⚠️ Tracisz ok. <span className="font-black text-red-600">{cartMath.cashbackEarned.toFixed(2)} zł</span> do Skarbonki
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-800 flex flex-col h-full relative overflow-hidden transform hover:-translate-y-1 transition-transform">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500 rounded-full blur-[80px] opacity-20"></div>
              
              <div className="mb-8 relative z-10">
                <span className="text-3xl mb-4 block">👑</span>
                <h2 className="text-xl font-black uppercase tracking-tight mb-2">Załóż konto i oszczędzaj</h2>
                <p className="text-sm text-slate-400 font-medium mb-6">Zajmie to 15 sekund, a zyskasz od razu:</p>
                
                <ul className="space-y-4 text-xs font-bold text-slate-300">
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-400 text-lg">✓</span> 
                    Odbierzesz natychmiast <span className="text-white font-black underline decoration-emerald-500 underline-offset-4">{cartMath.cashbackEarned.toFixed(2)} zł</span> z tego zamówienia.
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-400 text-lg">✓</span> 
                    Odblokujesz zapisywanie maszyn w "Garażu".
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-400 text-lg">✓</span> 
                    Śledzenie kuriera na żywo.
                  </li>
                </ul>
              </div>
              
              <div className="mt-auto pt-6 relative z-10">
                <button onClick={() => setCheckoutStep('form')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95 mb-4 min-h-[56px]">
                  Załóż konto w 15 sekund
                </button>
                <p className="text-center">
                  <button onClick={() => setCheckoutStep('form')} className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-white underline underline-offset-4 transition-colors">
                    Mam już konto, zaloguj mnie
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      
      {/* Sekcja Exit Intent pozostaje bez zmian */}
      {showExitIntent && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeExitIntent}></div>
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[40px] p-8 md:p-12 shadow-2xl relative z-10 overflow-hidden text-center transform animate-in zoom-in-95 duration-300">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
             <button onClick={closeExitIntent} className="absolute top-5 right-5 text-slate-500 hover:text-white text-xl">✕</button>
             <span className="text-6xl mb-6 block animate-bounce">🎁</span>
             <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Poczekaj! Nie zostawiaj maszyny w polu!</h3>
             <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
               Zauważyliśmy, że chcesz przerwać zakupy. Zależy nam, abyś dokończył naprawę sprzętu. Dokładamy <strong className="text-amber-400 font-black">-3% DODATKOWEGO RABATU</strong> do koszyka, ważne przez 15 minut.
             </p>
             <button onClick={applyExitDiscount} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-xs md:text-sm uppercase tracking-widest py-5 rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 mb-4">
               Odbieram -3% i zamawiam ➔
             </button>
             <button onClick={closeExitIntent} className="text-[10px] text-slate-500 uppercase font-black tracking-widest hover:text-slate-300 transition-colors">
               Nie dziękuję, rezygnuję z naprawy
             </button>
          </div>
        </div>
      )}

      <header className="bg-white border-b py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
          <Link href="/" className="font-black text-xl tracking-tighter text-slate-900 cursor-pointer">
            CentrumRolnictwa<span className="text-slate-400">.pl</span>
          </Link>
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <span className="text-emerald-500 text-lg">🔒</span> Bezpieczne zakupy
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Zmiana na RHF handleSubmit */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white rounded-[32px] p-6 lg:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md">1</span>
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Twoje dane</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input {...register('email')} placeholder="E-mail (do wysłania faktury)" className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${errors.email ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} />
                  {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{errors.email.message}</p>}
                </div>
                <div>
                  <input {...register('phone')} placeholder="Numer telefonu (dla kuriera)" className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${errors.phone ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} />
                  {errors.phone && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="mt-8 flex gap-4 border-b border-slate-100 pb-8">
                 <button type="button" onClick={() => setValue('orderType', 'company')} className={`flex-1 py-4 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border-2 transition-all ${currentOrderType === 'company' ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}>Firma / Rolnik (NIP)</button>
                 <button type="button" onClick={() => setValue('orderType', 'person')} className={`flex-1 py-4 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border-2 transition-all ${currentOrderType === 'person' ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}>Osoba prywatna</button>
              </div>

              <div className="mt-8 space-y-4">
                {currentOrderType === 'company' && (
                  <div>
                    <div className="relative flex items-center">
                      <input {...register('nip')} placeholder="NIP (Pobierzemy dane z bazy GUS)" className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-black tracking-widest text-slate-900 pr-36 ${errors.nip ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} />
                      <button type="button" className="absolute right-2 bg-slate-900 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-md active:scale-95">Pobierz z GUS</button>
                    </div>
                    {errors.nip && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{errors.nip.message}</p>}
                  </div>
                )}
                
                <div>
                  <input {...register('companyName')} placeholder={currentOrderType === 'company' ? "Pełna nazwa firmy / gospodarstwa" : "Imię i nazwisko"} className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${errors.companyName ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} />
                  {errors.companyName && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{errors.companyName.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input {...register('street')} placeholder="Ulica i numer" className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${errors.street ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} />
                    {errors.street && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{errors.street.message}</p>}
                  </div>
                  <div>
                    <input {...register('zip')} placeholder="Kod pocztowy (XX-XXX)" className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${errors.zip ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} />
                    {errors.zip && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{errors.zip.message}</p>}
                  </div>
                </div>
                
                <div>
                  <input {...register('city')} placeholder="Miejscowość" className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${errors.city ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} />
                  {errors.city && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{errors.city.message}</p>}
                </div>

                <textarea {...register('notes')} placeholder="Uwagi do zamówienia / dla kuriera..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none focus:border-red-600 transition-colors text-sm font-medium min-h-[100px] resize-y mt-2"></textarea>
              </div>
            </section>

            {/* SEKCJA DOSTAWY I PŁATNOŚCI - Kod identyczny z pierwotnym pod kątem UI */}
            <section className="bg-white rounded-[32px] p-6 lg:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md">2</span>
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Sposób dostawy</h2>
              </div>
              <div className="space-y-4">
                <button type="button" onClick={() => handleDeliveryChange('courier')} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${deliveryMethod === 'courier' ? 'border-red-600 bg-red-50/40 ring-4 ring-red-50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-5">
                    <div className="text-3xl">📦</div>
                    <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-tight text-slate-900">Kurier pod drzwi (DPD / DHL)</p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dostawa jutro rano do gospodarstwa</p>
                    </div>
                  </div>
                  <span className="font-black text-sm text-slate-900">{cartMath.finalAmountToPay > 500 ? <span className="text-emerald-600">GRATIS</span> : '25.00 zł'}</span>
                </button>
                <button type="button" onClick={() => handleDeliveryChange('paczkomat')} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${deliveryMethod === 'paczkomat' ? 'border-red-600 bg-red-50/40 ring-4 ring-red-50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-5">
                    <div className="text-3xl">📱</div>
                    <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-tight text-slate-900">InPost Paczkomat 24/7</p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Odbierz o dowolnej porze</p>
                    </div>
                  </div>
                  <span className="font-black text-sm text-slate-900">{cartMath.finalAmountToPay > 500 ? <span className="text-emerald-600">GRATIS</span> : '15.00 zł'}</span>
                </button>
              </div>
            </section>

            <section className="bg-white rounded-[32px] p-6 lg:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md">3</span>
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Płatność</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button type="button" onClick={() => handlePaymentChange('blik')} className={`p-5 rounded-2xl border-2 text-center transition-all ${paymentMethod === 'blik' ? 'border-red-600 bg-red-50/40 ring-4 ring-red-50' : 'border-slate-100 hover:border-slate-200'}`}>
                   <div className="bg-slate-900 text-white px-2 py-0.5 rounded-md inline-block text-[10px] font-black mb-3 shadow-sm">BLIK</div>
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Szybki przelew</p>
                </button>
                <button type="button" onClick={() => handlePaymentChange('card')} className={`p-5 rounded-2xl border-2 text-center transition-all ${paymentMethod === 'card' ? 'border-red-600 bg-red-50/40 ring-4 ring-red-50' : 'border-slate-100 hover:border-slate-200'}`}>
                   <div className="text-2xl mb-2 grayscale opacity-80">💳</div>
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Karta / PayU</p>
                </button>
                <button type="button" onClick={() => handlePaymentChange('pobranie')} className={`p-5 rounded-2xl border-2 text-center transition-all ${paymentMethod === 'pobranie' ? 'border-red-600 bg-red-50/40 ring-4 ring-red-50' : 'border-slate-100 hover:border-slate-200'}`}>
                   <div className="text-2xl mb-2 grayscale opacity-80">🚚</div>
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Przy odbiorze</p>
                </button>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-xl border border-slate-200">
              <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 text-slate-400">Podsumowanie rezerwacji</h3>
              
              <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-4 custom-scrollbar">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 p-1 shrink-0 relative flex items-center justify-center overflow-hidden">
                      {item.image && item.image.trim() !== '' ? (
                        <Image loader={bunnyLoader} src={item.image} alt={item.name} fill className="object-contain mix-blend-multiply p-1" />
                      ) : (
                        <span className="text-[8px] font-black text-slate-300 uppercase">BRAK</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 truncate uppercase leading-tight">{item.name}</p>
                      <p className="text-[10px] font-black text-slate-400 mt-1">{item.quantity} szt. <span className="text-slate-300 mx-1">|</span> {(item.price * item.quantity).toFixed(2)} zł</p>
                    </div>
                  </div>
                ))}
              </div>

              {availableCashback > 0 && (
                <div className="mb-6 bg-emerald-50 border border-emerald-100 p-5 rounded-2xl transition-colors shadow-inner">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useCashback} 
                      onChange={(e) => setUseCashback(e.target.checked)} 
                      className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase text-emerald-800 tracking-widest leading-none mb-1.5">Użyj ze Skarbonki</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Dostępne: {availableCashback.toFixed(2)} zł</p>
                    </div>
                  </label>
                </div>
              )}

              <div className="space-y-4 text-xs font-bold text-slate-500 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center">
                  <span>Wartość części (brutto):</span>
                  <span className="text-slate-900">{cartMath.originalTotal.toFixed(2)} zł</span>
                </div>
                
                {cartMath.lifetimeDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600 font-black bg-red-50 p-2.5 rounded-lg -mx-2.5">
                    <span>Zniżka stała ({cartMath.tierName} -{cartMath.discountPercent * 100}%):</span>
                    <span>-{cartMath.lifetimeDiscountAmount.toFixed(2)} zł</span>
                  </div>
                )}
                
                {exitDiscountApplied && (
                  <div className="flex justify-between items-center text-amber-600 font-black bg-amber-50 p-2.5 rounded-lg -mx-2.5 shadow-inner">
                    <span className="flex items-center gap-1.5">🎁 Rabat specjalny (Exit):</span>
                    <span>-{exitDiscountValue.toFixed(2)} zł</span>
                  </div>
                )}
                
                {useCashback && cartMath.applicableCashback > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-black bg-emerald-50 p-2.5 rounded-lg -mx-2.5">
                    <span>Użyto ze Skarbonki:</span>
                    <span>-{cartMath.applicableCashback.toFixed(2)} zł</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span>Koszt dostawy:</span>
                  <span className="text-slate-900">{deliveryCost === 0 ? <span className="text-emerald-600 font-black">GRATIS</span> : `${deliveryCost.toFixed(2)} zł`}</span>
                </div>
                
                <div className="flex flex-col pt-6 border-t border-slate-200 mt-2">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-900 font-black uppercase text-[10px] tracking-widest mb-1">Do zapłaty brutto:</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{totalToPayWithDelivery.toFixed(2)} <span className="text-sm font-bold text-slate-400">zł</span></span>
                  </div>
                  
                  <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-md border border-slate-800">
                    <span className="text-[9px] uppercase tracking-widest font-black text-slate-300">Zyskujesz do skarbonki:</span>
                    <span className="text-sm font-black text-emerald-400">+{cartMath.cashbackEarned.toFixed(2)} zł</span>
                  </div>
                </div>
              </div>

              <button 
                 type="submit" 
                 disabled={isProcessing}
                className={`w-full mt-6 py-5 rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isProcessing ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 hover:scale-[1.02] active:scale-95'}`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Autoryzacja...</span>
                ) : (
                  <><span>ZAMAWIAM I PŁACĘ</span><span className="text-xl leading-none">➔</span></>
                )}
              </button>

              <div className="mt-6 flex flex-col items-center gap-4 border-t border-slate-50 pt-6">
                <div className="flex items-center justify-center gap-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/blik.svg" alt="BLIK" className="h-4 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <span className="text-slate-300">|</span>
                  <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Szyfrowanie SSL 256-bit</span>
                </div>
                
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase leading-relaxed">
                  Klikając zamawiam akceptujesz <br className="hidden lg:block"/>
                  <Link href="/regulamin" target="_blank" className="text-slate-600 hover:text-red-600 underline underline-offset-2 transition-colors">regulamin</Link> oraz <Link href="/polityka-prywatnosci" target="_blank" className="text-slate-600 hover:text-red-600 underline underline-offset-2 transition-colors">politykę prywatności</Link>.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4 mt-6">
               <div className="text-2xl bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0">🛡️</div>
               <div>
                 <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest mb-0.5">Gwarancja dopasowania</p>
                 <p className="text-xs text-emerald-900 font-medium leading-tight">Jeśli część nie będzie pasować do maszyny, zwrócimy 100% środków na konto.</p>
               </div>
            </div>
          </aside>
          
        </form>
      </main>
    </div>
  );
}