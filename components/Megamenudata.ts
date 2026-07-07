// Jedno źródło prawdy o strukturze menu kategorii — używane przez MegaMenu (desktop)
// i MobileCategoryMenu (mobile). Zmieniasz tu raz, zmienia się w obu miejscach.

export type MegaLink = { text: string; href: string; badge?: string };
export type MegaColumn = { heading?: string; links: MegaLink[] };
export type MegaCategory = {
  id: string;
  title: string;
  fullTitle?: string;
  href: string;
  featured?: boolean;
  columns: MegaColumn[];
};

const P = "/kategoria/";

export const MEGA_MENU_DATA: MegaCategory[] = [
  {
    id: "hodowla",
    title: "Hodowla", fullTitle: "Hodowla i udój",
    href: P + "hodowla-i-zootechnika",
    featured: true,
    columns: [
      {
        heading: "Sprzęt udojowy",
        links: [
          { text: "Instalacje udojowe i rurociągi", href: P + "hodowla-i-zootechnika/instalacje-udojowe-i-rurociagi", badge: "flagowe" },
          { text: "Dojarki bańkowe i akcesoria", href: P + "hodowla-i-zootechnika/dojarki-bankowe-i-akcesoria" },
        ],
      },
      {
        heading: "Bydło i produkcja",
        links: [
          { text: "Artykuły dla bydła i cieląt", href: P + "hodowla-i-zootechnika/artykuly-dla-bydla-i-cielat" },
          { text: "Poidła, karmidła i paśniki", href: P + "hodowla-i-zootechnika/poidla-karmidla-i-pasniki" },
          { text: "Higiena, pielęgnacja, zdrowie", href: P + "hodowla-i-zootechnika/higiena-pielegnacja-i-zdrowie" },
          { text: "Wyposażenie budynków inwentarskich", href: P + "hodowla-i-zootechnika/wyposazenie-budynkow-inwentarskich" },
        ],
      },
      {
        heading: "Zwierzęta i wyposażenie",
        links: [
          { text: "Konie i jeździectwo", href: P + "hodowla-i-zootechnika/artykuly-dla-koni-i-jezdziectwo" },
          { text: "Ogrodzenia elektryczne", href: P + "hodowla-i-zootechnika/ogrodzenia-elektryczne" },
        ],
      },
    ],
  },
  {
    id: "ciagniki",
    title: "Ciągniki", fullTitle: "Części do ciągników",
    href: P + "czesci-do-ciagnikow",
    columns: [
      {
        links: [
          { text: "Kabina, szyby, karoseria", href: P + "czesci-do-ciagnikow/kabina-szyby-karoseria-i-silowniki-gazowe" },
          { text: "Układ napędowy i sprzęgła", href: P + "czesci-do-ciagnikow/uklad-napedowy-i-sprzegla" },
          { text: "Silnik i osprzęt", href: P + "czesci-do-ciagnikow/silnik-i-osprzet" },
          { text: "TUZ i hydraulika ciągnikowa", href: P + "czesci-do-ciagnikow/tuz-podnosnik-i-hydraulika-ciagnikowa" },
        ],
      },
      {
        links: [
          { text: "Układ paliwowy i wydechowy", href: P + "czesci-do-ciagnikow/uklad-paliwowy-i-wydechowy" },
          { text: "Układ chłodzenia", href: P + "czesci-do-ciagnikow/uklad-chlodzenia" },
          { text: "Instalacja elektryczna", href: P + "czesci-do-ciagnikow/instalacja-elektryczna-i-rozruszniki" },
          { text: "Siedzenia i fotele", href: P + "czesci-do-ciagnikow/siedzenia-i-fotele" },
        ],
      },
      {
        links: [
          { text: "Oświetlenie i LED", href: P + "czesci-do-ciagnikow/oswietlenie-lampy-robocze-i-led" },
          { text: "Układ hamulcowy", href: P + "czesci-do-ciagnikow/uklad-hamulcowy" },
        ],
      },
    ],
  },
  {
    id: "maszyny",
    title: "Maszyny", fullTitle: "Części do maszyn",
    href: P + "czesci-do-maszyn",
    columns: [
      {
        links: [
          { text: "Uprawa ziemi", href: P + "czesci-do-maszyn/uprawa-ziemi" },
          { text: "Zbiór i żniwa", href: P + "czesci-do-maszyn/zbior-i-zniwa" },
          { text: "Zbiór zielonki", href: P + "czesci-do-maszyn/zbior-zielonki" },
          { text: "Maszyny komunalne i mulczery", href: P + "czesci-do-maszyn/maszyny-komunalne-i-mulczery" },
        ],
      },
      {
        links: [
          { text: "Ładowacze czołowe (TUR)", href: P + "czesci-do-maszyn/ladowacze-czolowe-tur-i-osprzet" },
          { text: "Siew i sadzenie", href: P + "czesci-do-maszyn/siew-i-sadzenie" },
          { text: "Wycinaki i ładowacze kiszonki", href: P + "czesci-do-maszyn/wycinaki-do-kiszonki-i-ladowacze" },
          { text: "Beczkowozy i rozrzutniki", href: P + "czesci-do-maszyn/beczkowozy-asenizacja-i-rozrzutniki" },
        ],
      },
      {
        links: [
          { text: "Ochrona roślin i nawożenie", href: P + "czesci-do-maszyn/ochrona-roslin-i-nawozenie" },
          { text: "Wozy paszowe", href: P + "czesci-do-maszyn/wozy-paszowe-i-technika-paszowa" },
        ],
      },
    ],
  },
  {
    id: "zaczepy",
    title: "Zaczepy i koła", fullTitle: "Zaczepy, koła i osprzęt",
    href: P + "czesci-do-ciagnikow-i-maszyn",
    columns: [
      {
        links: [
          { text: "Pneumatyka rolnicza i złącza", href: P + "czesci-do-ciagnikow-i-maszyn/pneumatyka-rolnicza-i-zlacza" },
          { text: "Zaczepy, dyszle, technika sprzęgu", href: P + "czesci-do-ciagnikow-i-maszyn/zaczepy-dyszle-i-technika-sprzegu" },
        ],
      },
      {
        links: [
          { text: "Oświetlenie ostrzegawcze i znakowanie", href: P + "czesci-do-ciagnikow-i-maszyn/oswietlenie-ostrzegawcze-i-znakowanie" },
        ],
      },
    ],
  },
  {
    id: "hydraulika",
    title: "Hydraulika", fullTitle: "Hydraulika siłowa",
    href: P + "hydraulika-silowa",
    columns: [
      {
        links: [
          { text: "Szybkozłącza i złącza gwintowane", href: P + "hydraulika-silowa/szybkozlacza-i-zlacza-gwintowane", badge: "bestseller" },
          { text: "Siłowniki hydrauliczne", href: P + "hydraulika-silowa/silowniki-hydrauliczne" },
        ],
      },
      {
        links: [
          { text: "Pompy, silniki, hydroakumulatory", href: P + "hydraulika-silowa/pompy-silniki-i-hydroakumulatory" },
          { text: "Rozdzielacze i zawory", href: P + "hydraulika-silowa/rozdzielacze-i-zawory" },
        ],
      },
      {
        links: [
          { text: "Akcesoria i filtry hydrauliczne", href: P + "hydraulika-silowa/akcesoria-i-filtry-hydrauliczne" },
          { text: "Przewody, węże i rury", href: P + "hydraulika-silowa/przewody-weze-i-rury" },
        ],
      },
    ],
  },
  {
    id: "uniwersalne",
    title: "Uniwersalne", fullTitle: "Części uniwersalne",
    href: P + "czesci-uniwersalne",
    columns: [
      {
        heading: "Elementy złączne",
        links: [
          { text: "Śruby i nakrętki", href: P + "czesci-uniwersalne/elementy-zlaczne-i-montazowe/sruby-i-nakretki" },
          { text: "Pierścienie", href: P + "czesci-uniwersalne/elementy-zlaczne-i-montazowe/pierscienie" },
          { text: "Uchwyty", href: P + "czesci-uniwersalne/elementy-zlaczne-i-montazowe/uchwyty" },
        ],
      },
      {
        heading: "Łożyska i uszczelnienia",
        links: [
          { text: "Talerze", href: P + "czesci-uniwersalne/lozyska-uszczelnienia-i-o-ringi/talerze" },
          { text: "Pierścienie uszczelniające", href: P + "czesci-uniwersalne/lozyska-uszczelnienia-i-o-ringi/pierscienie-uszczelniajace" },
        ],
      },
      {
        heading: "Pasy i łańcuchy",
        links: [
          { text: "Pasy klinowe", href: P + "czesci-uniwersalne/pasy-klinowe-i-lancuchy-napedowe/pasy-klinowe" },
          { text: "Łańcuchy", href: P + "czesci-uniwersalne/pasy-klinowe-i-lancuchy-napedowe/lancuchy" },
        ],
      },
    ],
  },
  {
    id: "wiecej",
    title: "Więcej", fullTitle: "Pozostałe kategorie",
    href: P + "warsztat-i-uniwersalne",
    columns: [
      {
        links: [
          { text: "Warsztat i narzędzia", href: P + "warsztat-i-uniwersalne" },
          { text: "Filtry", href: P + "filtry" },
        ],
      },
      {
        links: [
          { text: "Elektronika i GPS", href: P + "elektronika-i-precyzja" },
          { text: "Chemia i smary", href: P + "chemia-i-smary" },
        ],
      },
      {
        links: [
          { text: "Dom, ogród, las", href: P + "dom-ogrod-las" },
          { text: "Materiały eksploatacyjne", href: P + "materialy-eksploatacyjne" },
        ],
      },
    ],
  },
];