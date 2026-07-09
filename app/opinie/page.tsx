import type { Metadata } from "next";
import ReviewsSection from "@/components/ReviewsSection";
import ReviewForm from "@/components/ReviewForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

// ISR: strona opinii serwuje się statycznie, odświeża co godzinę.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Opinie klientów — CentrumRolnictwa.pl",
  description: "Zobacz, co o nas mówią rolnicy. Prawdziwe opinie o dostawie, dopasowaniu części i obsłudze. Dodaj własną opinię.",
};

export default function OpiniePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-10">
          <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Zaufali nam rolnicy</p>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Opinie klientów</h1>
        </div>

        {/* Lista wszystkich zatwierdzonych opinii (ten sam komponent co na stronie głównej, bez limitu) */}
        <ReviewsSection limit={999} />

        {/* Formularz dodawania */}
        <section className="mt-4 mb-16 max-w-2xl">
          <ReviewForm />
        </section>
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}