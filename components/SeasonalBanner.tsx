import Link from "next/link";

// Blok sezonowy — sam dobiera treść do aktualnego miesiąca, więc zawsze trafia
// w to, co rolnik robi TERAZ. Renderowany serwerowo; przy ISR (revalidate) treść
// odświeży się wraz ze stroną. Kieruje do kategorii z częściami na dany sezon.
function getSeason(month: number) {
  // marzec–maj: siew/uprawa | czerwiec–sierpień: żniwa/zbiór
  // wrzesień–październik: uprawa pożniwna | listopad–luty: serwis zimowy
  if (month >= 2 && month <= 4) {
    return {
      tag: "Wiosna w polu",
      title: "Sezon siewu i uprawy",
      desc: "Przygotuj pługi, brony, siewniki i opryskiwacze. Redlice, talerze, rozpylacze i części do uprawy — wszystko na czas.",
      cta: "Części do uprawy i siewu",
      href: "/kategoria/czesci-do-maszyn/uprawa-ziemi",
      icon: "🌱",
    };
  }
  if (month >= 5 && month <= 7) {
    return {
      tag: "Szczyt sezonu",
      title: "Żniwa i zbiór — bądź gotowy",
      desc: "Awaria kombajnu w żniwa to strata plonu. Noże, paski, łożyska, sita i części do pras — na magazynie, z wysyłką w 24h.",
      cta: "Części do zbioru i żniw",
      href: "/kategoria/czesci-do-maszyn/zbior-i-zniwa",
      icon: "🌾",
    };
  }
  if (month >= 8 && month <= 9) {
    return {
      tag: "Po żniwach",
      title: "Uprawa pożniwna i podorywka",
      desc: "Czas na talerzówki, głębosze i kultywatory. Wymień zużyte elementy robocze przed jesienną orką.",
      cta: "Części do uprawy ziemi",
      href: "/kategoria/czesci-do-maszyn/uprawa-ziemi",
      icon: "🍂",
    };
  }
  return {
    tag: "Sezon serwisowy",
    title: "Zima to czas przeglądów",
    desc: "Przygotuj maszyny na wiosnę bez pośpiechu. Filtry, oleje, płyny, uszczelnienia i części eksploatacyjne w komplecie.",
    cta: "Filtry, oleje i eksploatacja",
    href: "/kategoria/materialy-eksploatacyjne",
    icon: "❄️",
  };
}

export default function SeasonalBanner() {
  const season = getSeason(new Date().getMonth());

  return (
    <section aria-label="Oferta sezonowa" className="mb-20">
      <Link
        href={season.href}
        prefetch={false}
        className="group block bg-gradient-to-br from-red-600 to-red-700 rounded-[32px] md:rounded-[48px] p-8 md:p-12 relative overflow-hidden shadow-xl hover:shadow-2xl transition-shadow"
      >
        <div className="absolute top-0 right-0 text-[180px] md:text-[240px] leading-none opacity-15 -mr-6 -mt-10 pointer-events-none select-none">
          {season.icon}
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-white/20 border border-white/30 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-sm">
            {season.tag}
          </span>
          <h2 className="text-white text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight mt-5 mb-3">
            {season.title}
          </h2>
          <p className="text-red-50 text-sm md:text-base font-medium leading-relaxed mb-6">
            {season.desc}
          </p>
          <span className="inline-flex items-center gap-2 bg-white text-slate-900 px-7 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest group-hover:gap-3 transition-all">
            {season.cta} <span>➔</span>
          </span>
        </div>
      </Link>
    </section>
  );
}