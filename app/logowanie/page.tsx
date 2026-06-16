'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- SCHEMATY WALIDACJI (ZOD) ---
const loginSchema = z.object({
  email: z.string().email('Podaj poprawny adres e-mail'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'Podaj imię i nazwisko lub nazwę firmy'),
  email: z.string().email('Podaj poprawny adres e-mail'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  isCompany: z.boolean().default(false),
  nip: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.isCompany) {
    const nipClean = data.nip?.replace(/[\s-]/g, '') || '';
    if (!/^\d{10}$/.test(nipClean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'NIP musi składać się z 10 cyfr',
        path: ['nip'],
      });
    }
  }
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Formularz Logowania
  const { 
    register: registerLogin, 
    handleSubmit: handleLoginSubmit, 
    formState: { errors: loginErrors } 
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  // Formularz Rejestracji
  const { 
    register: registerSignup, 
    handleSubmit: handleSignupSubmit, 
    watch: watchSignup,
    formState: { errors: signupErrors } 
  } = useForm<RegisterFormValues>({ 
    resolver: zodResolver(registerSchema),
    defaultValues: { isCompany: false }
  });

  const isCompanySelected = watchSignup('isCompany');

  const onLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    console.log('Logowanie danymi:', data);
    // Symulacja uderzenia do API
    setTimeout(() => {
      setIsLoading(false);
      router.push('/konto');
    }, 1500);
  };

  const onRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    console.log('Rejestracja danymi:', data);
    // Symulacja uderzenia do API
    setTimeout(() => {
      setIsLoading(false);
      router.push('/konto');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      
      {/* LEWA STRONA - MARKETING I KORZYŚCI (Widoczna na desktopie) */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white p-12 lg:p-20 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[120px] opacity-20 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-10 -ml-20 -mb-20"></div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-16 hover:opacity-80 transition-opacity">
            <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa Logo" className="h-12 w-auto brightness-0 invert" />
          </Link>
          
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight mb-8">
            Więcej niż <br/> <span className="text-red-500">sklep rolniczy</span>
          </h1>
          
          <div className="space-y-8">
            <div className="flex gap-5 items-start">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">💰</div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm mb-1">Skarbonka - Zwrot 2%</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">Z każdego zrealizowanego zamówienia oddajemy Ci 2% w postaci środków na kolejne zakupy.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">🚜</div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm mb-1">Twój Wirtualny Garaż</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">Zapisz swoje maszyny na koncie. System automatycznie ukryje części, które do nich nie pasują.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">👑</div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm mb-1">Program Lojalnościowy</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">Kupujesz więcej na gospodarstwo? Zdobądź stały, wieczny rabat przypisany do Twojego NIPu (nawet do -15%).</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-12">
          © {new Date().getFullYear()} CentrumRolnictwa.pl - Wszystkie prawa zastrzeżone.
        </div>
      </div>

      {/* PRAWA STRONA - FORMULARZE */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 relative">
        <Link href="/" className="md:hidden absolute top-6 left-6 text-2xl">
          🏠
        </Link>
        
        <div className="w-full max-w-md">
          {/* PRZEŁĄCZNIK WIDOKU */}
          <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-10">
            <button 
              onClick={() => setView('login')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${view === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Logowanie
            </button>
            <button 
              onClick={() => setView('register')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${view === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Załóż konto
            </button>
          </div>

          {/* WIDOK LOGOWANIA */}
          {view === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Witaj z powrotem</h2>
                <p className="text-slate-500 font-medium text-sm">Zaloguj się, aby uzyskać dostęp do zniżek i Skarbonki.</p>
              </div>

              <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
                <div>
                  <input 
                    {...registerLogin('email')} 
                    type="email" 
                    placeholder="Adres e-mail" 
                    className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${loginErrors.email ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} 
                  />
                  {loginErrors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{loginErrors.email.message}</p>}
                </div>
                <div>
                  <input 
                    {...registerLogin('password')} 
                    type="password" 
                    placeholder="Hasło" 
                    className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${loginErrors.password ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} 
                  />
                  {loginErrors.password && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{loginErrors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-red-600 rounded cursor-pointer" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Zapamiętaj mnie</span>
                  </label>
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors">
                    Zapomniałeś hasła?
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 mt-4 flex items-center justify-center h-14"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Zaloguj się ➔'}
                </button>
              </form>
            </div>
          )}

          {/* WIDOK REJESTRACJI */}
          {view === 'register' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Rozpocznij oszczędzanie</h2>
                <p className="text-slate-500 font-medium text-sm">Załóż darmowe konto w 30 sekund.</p>
              </div>

              <form onSubmit={handleSignupSubmit(onRegister)} className="space-y-4">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input {...registerSignup('isCompany')} type="checkbox" className="w-5 h-5 accent-red-600 rounded cursor-pointer" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none mb-1">Kupuję na Firmę / Gospodarstwo</p>
                      <p className="text-[10px] font-bold text-slate-500 leading-none">Wymagane do faktur VAT i przypisania rabatów NIP</p>
                    </div>
                  </label>
                </div>

                {isCompanySelected && (
                  <div>
                    <input 
                      {...registerSignup('nip')} 
                      type="text" 
                      placeholder="Twój numer NIP" 
                      className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${signupErrors.nip ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} 
                    />
                    {signupErrors.nip && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{signupErrors.nip.message}</p>}
                  </div>
                )}

                <div>
                  <input 
                    {...registerSignup('name')} 
                    type="text" 
                    placeholder={isCompanySelected ? "Nazwa gospodarstwa lub firmy" : "Imię i nazwisko"} 
                    className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${signupErrors.name ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} 
                  />
                  {signupErrors.name && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{signupErrors.name.message}</p>}
                </div>

                <div>
                  <input 
                    {...registerSignup('email')} 
                    type="email" 
                    placeholder="Adres e-mail" 
                    className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${signupErrors.email ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} 
                  />
                  {signupErrors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{signupErrors.email.message}</p>}
                </div>
                
                <div>
                  <input 
                    {...registerSignup('password')} 
                    type="password" 
                    placeholder="Wymyśl bezpieczne hasło" 
                    className={`w-full bg-slate-50 border rounded-xl px-5 py-4 outline-none transition-colors text-sm font-bold text-slate-900 ${signupErrors.password ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-red-600'}`} 
                  />
                  {signupErrors.password && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2">{signupErrors.password.message}</p>}
                </div>

                <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed py-2">
                  Zakładając konto akceptujesz <Link href="/regulamin" className="text-slate-600 underline">Regulamin Sklepu</Link> oraz <Link href="/polityka" className="text-slate-600 underline">Politykę Prywatności</Link>.
                </p>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/30 hover:scale-[1.02] active:scale-95 flex items-center justify-center h-14"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Załóż darmowe konto ➔'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}