#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Normalizacja pól produktów w Meilisearch dla centrumrolnictwa.

Scala warianty pisowni tego samego parametru w jedną nazwę kanoniczną,
żeby pokrycie filtrów przestało być rozsypane po kilku polach.

Tryby:
  python3 normalize_meili.py backup    # zrzuca WSZYSTKIE produkty do pliku (polisa)
  python3 normalize_meili.py dryrun     # tylko raport — NIC nie zmienia w Meili
  python3 normalize_meili.py apply       # wykonuje scalanie (nadpisuje dokumenty)
  python3 normalize_meili.py restore <plik_backup.json>   # przywraca z backupu
  python3 normalize_meili.py setfilters  # KROK PÓŹNIEJSZY: ustawia filtrowalne na nazwy kanoniczne

Kolejność użycia: backup  ->  dryrun (przejrzyj raport)  ->  apply  ->  (potem) setfilters
"""

import sys, json, time, re, os, urllib.request, urllib.error

# ----------------------------------------------------------------------------
HOST = "http://178.104.130.90:7700"
KEY  = "3497dcd504ded68f751f174def7791ec1830e1c0830fefad6e045a9c53974a4f"
INDEX = "products"
PRIMARY_KEY = "id"
BATCH = 1000
# ----------------------------------------------------------------------------

# Mapowanie: NAZWA_KANONICZNA -> [warianty, które do niej zlewamy]
# Kolejność wariantów = priorytet przy konflikcie (pierwszy wygrywa).
# UWAGA: tu są TYLKO bezpieczne klastry (ten sam parametr + ta sama jednostka).
# Pola z różnymi jednostkami (g vs kg, l vs Ah, W vs kW) są celowo ROZDZIELONE.
CANON = {
    # --- dopasowanie maszyny ---
    "Pasuje do marki": [
        "Pasuje do marki", "Pasuje do marka",
    ],
    "Pasuje do modelu": [
        "Pasuje do modelu", "Pasuje do model",
        "Pasuje do modelu (Maszyna)", "Pasuje do modelu (Masyna)",
        "Pasuje do modelo (Maszyna)",
    ],

    # --- napięcie (V) — NIE łączymy z prądem/natężeniem ---
    "Napięcie [V]": [
        "Napięcie [V]", "Napięcie (V)", "Napięcie",
        "Napięcie nominalne (V)", "Napięcie nominalne", "Napięcie_nominalne_V",
        "Napięcie znamionowe",
    ],

    # --- średnice — KAŻDA osobno (wew. != zew. != ogólna) ---
    "Średnica wewnętrzna [mm]": [
        "Średnica wewnętrzna [mm]", "Średnica wewnętrzna (mm)",
        "Średnica wewnętrzna", "Średnica wew. (mm)", "Średnica wew.",
    ],
    "Średnica zewnętrzna [mm]": [
        "Średnica zewnętrzna [mm]", "Średnica zewnętrzna (mm)",
        "Średnica zewnętrzna", "Średnica zew. (mm)", "Średnica zew.",
    ],
    "Średnica [mm]": [
        "Średnica [mm]", "Średnica (mm)", "Średnica",
    ],

    # --- wymiary liniowe (mm) — (cm) i (m) celowo POMINIĘTE (inna jednostka) ---
    "Długość [mm]": [
        "Długość [mm]", "Długość (mm)", "Długość",
    ],
    "Długość całkowita [mm]": [
        "Długość całkowita [mm]", "Długość całkowita (mm)", "Długość całkowita",
    ],
    "Szerokość [mm]": [
        "Szerokość [mm]", "Szerokość (mm)", "Szerokość",
    ],
    "Wysokość [mm]": [
        "Wysokość [mm]", "Wysokość (mm)", "Wysokość",
    ],
    "Szerokość/Grubość [mm]": [
        "Szerokość/Grubość [mm]", "Szerokość/Grubość", "Szerokość/grubość",
    ],

    # --- waga: TYLKO kg (wersję w gramach zostawiamy osobno) ---
    "Waga [kg]": [
        "Waga [kg]", "Waga (kg)", "Waga",
    ],

    # --- pojemność: litry osobno, amperogodziny osobno ---
    "Pojemność [l]": [
        "Pojemność [l]", "Pojemność [L]", "Pojemność (l)", "Pojemność (L)",
    ],
    "Pojemność [Ah]": [
        "Pojemność [Ah]", "Pojemność (Ah)", "Pojemność akumulatora (Ah)",
    ],

    # --- gwint / złącza ---
    "Wymiar gwintu": [
        "Wymiar gwintu", "Rozmiar gwintu", "Gwint (mm)", "Gwint [mm]",
    ],

    # --- pozostałe częste, bezpieczne ---
    "Ilość zębów": [
        "Ilość zębów", "Liczba zębów",
    ],
    "Strona montażu (L/P)": [
        "Strona montażu (L/P)", "Strona montażu", "Strona zabudowy", "Strona zabudowy (L/P)",
    ],
    "Twardość Shore": [
        "Twardość Shore", "Twardość (Shore)",
    ],
    "Wartość D [kN]": [
        "Wartość D [kN]", "Wartość D (kN)", "Wartość D",
    ],
    "Max. ciśnienie robocze [bar]": [
        "Max. ciśnienie robocze [bar]", "Ciśnienie robocze maks. (bar)", "Ciśnienie robocze maks.",
    ],
    "Kierunek obrotów (L/P)": [
        "Kierunek obrotów (L/P)", "Kierunek obrotów",
    ],
}

# Wartości traktowane jako "puste"
EMPTY = {None, "", "-", "—", "brak", "Brak", "n/d", "N/D"}


def _req(method, path, body=None):
    url = HOST + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer " + KEY,
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def fetch_all():
    out, off = [], 0
    while True:
        page = _req("GET", "/indexes/%s/documents?limit=%d&offset=%d" % (INDEX, BATCH, off))
        rows = page["results"]
        out.extend(rows)
        sys.stderr.write("\r  pobrano %d / %d" % (len(out), page["total"])); sys.stderr.flush()
        if len(rows) < BATCH:
            break
        off += BATCH
    sys.stderr.write("\n")
    return out


def _is_empty(v):
    if isinstance(v, list):
        return len([x for x in v if not _is_empty(x)]) == 0
    if isinstance(v, dict):
        return len(v) == 0
    try:
        return v in EMPTY
    except TypeError:
        return False


def _vstr(v):
    return json.dumps(v, ensure_ascii=False, sort_keys=True)


def transform(doc):
    """Zwraca (nowy_doc, lista_konfliktow). Nie modyfikuje oryginału."""
    d = dict(doc)
    conflicts = []
    for canon, variants in CANON.items():
        present = [(name, d[name]) for name in variants if name in d and not _is_empty(d[name])]
        # usuń wszystkie warianty z dokumentu
        for name in variants:
            d.pop(name, None)
        if not present:
            continue
        chosen = present[0][1]  # priorytet = kolejność na liście
        distinct = {_vstr(v) for _, v in present}
        if len(distinct) > 1:
            conflicts.append((canon, [(n, v) for n, v in present]))
        d[canon] = chosen
    return d, conflicts


def cmd_backup():
    docs = fetch_all()
    fn = "products_backup_%s.json" % time.strftime("%Y%m%d_%H%M%S")
    with open(fn, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False)
    print("Backup zapisany: %s  (%d produktów)" % (fn, len(docs)))


def cmd_dryrun():
    docs = fetch_all()
    # pokrycie PRZED: max z pojedynczego wariantu; PO: unia wariantów
    before = {c: 0 for c in CANON}          # najlepszy pojedynczy wariant
    per_variant = {}
    after = {c: 0 for c in CANON}
    conflict_count = {c: 0 for c in CANON}
    total_conflicts = 0
    for doc in docs:
        for canon, variants in CANON.items():
            hit = [n for n in variants if n in doc and not _is_empty(doc[n])]
            for n in hit:
                per_variant[(canon, n)] = per_variant.get((canon, n), 0) + 1
            if hit:
                after[canon] += 1
        _, confs = transform(doc)
        for canon, _details in confs:
            conflict_count[canon] += 1
            total_conflicts += 1
    for (canon, n), cnt in per_variant.items():
        before[canon] = max(before[canon], cnt)

    print("\n=== RAPORT DRY-RUN (nic nie zmieniono) ===\n")
    print("%-32s %8s %8s %8s %9s" % ("Pole kanoniczne", "było", "będzie", "+zysk", "konflikty"))
    print("-" * 72)
    for canon in CANON:
        gain = after[canon] - before[canon]
        print("%-32s %8d %8d %8d %9d" % (canon, before[canon], after[canon], gain, conflict_count[canon]))
    print("-" * 72)
    print("Łącznie produktów z konfliktem wartości: %d" % total_conflicts)
    print("(konflikt = produkt ma >1 wariant z RÓŻNĄ wartością; wygrywa pierwszy z listy)")
    print("\nJeśli liczby wyglądają sensownie -> uruchom:  python3 normalize_meili.py apply")


def cmd_apply():
    print("Pobieram produkty...")
    docs = fetch_all()
    print("Transformuję...")
    new_docs, n_conf = [], 0
    for doc in docs:
        nd, confs = transform(doc)
        n_conf += len(confs)
        new_docs.append(nd)
    print("Wysyłam z powrotem (replace) w paczkach po %d... konfliktów rozstrzygniętych: %d" % (BATCH, n_conf))
    tasks = []
    for i in range(0, len(new_docs), BATCH):
        chunk = new_docs[i:i + BATCH]
        # POST = add-or-REPLACE po kluczu głównym -> stare warianty znikają
        res = _req("POST", "/indexes/%s/documents" % INDEX, chunk)
        tasks.append(res.get("taskUid"))
        sys.stderr.write("\r  wysłano %d / %d" % (min(i + BATCH, len(new_docs)), len(new_docs))); sys.stderr.flush()
    sys.stderr.write("\n")
    print("Gotowe. Meili przetwarza zadania w tle (taskUid: %s ...)." % tasks[:3])
    print("Status sprawdzisz tu: %s/tasks" % HOST)


def cmd_restore(path):
    with open(path, encoding="utf-8") as f:
        docs = json.load(f)
    print("Przywracam %d produktów z %s..." % (len(docs), path))
    for i in range(0, len(docs), BATCH):
        _req("POST", "/indexes/%s/documents" % INDEX, docs[i:i + BATCH])
        sys.stderr.write("\r  %d / %d" % (min(i + BATCH, len(docs)), len(docs))); sys.stderr.flush()
    sys.stderr.write("\n")
    print("Przywrócono.")


# Pola, które NIGDY nie są filtrem (identyfikatory, tekst, media, ceny)
BLOCK = {
    "title", "description", "id", "handle", "thumbnail", "external_images",
    "price", "category_text", "Opis", "Uwagi", "Informacje dodatkowe",
    "Dane techniczne", "Cechy", "Cechy produktu", "Specyfikacja", "Parametry",
    "Numer katalogowy / OEM", "Numer OEM", "Numer OE", "Numer części", "Nr części",
    "Nr katalogowy", "Nr kat.", "Numer", "Numer artykułu", "Nr artykułu",
    "Numer porównawczy2", "Numer porównawczy3", "Numer porównawczy4", "Numer porównawczy5",
    "Numery", "Numery części", "Numery katalogowe", "Numery zamienne", "Numery porównawcze",
    "Numery OEM", "Kod EAN", "Główny EAN-13", "ETN", "Kod", "Kod produktu",
    "Kod dostawcy", "Kod producenta", "Kod CN", "Symbol", "Indeks", "Nr seryjny",
    "Nr.", "Nr porównawcze", "Zamiennik", "Zastępuje", "Odpowiednik", "Drzewo kategorii",
    # etykiety z rysunku technicznego — bez znaczenia jako filtr dla kupującego
    "A (mm)", "B (mm)", "C (mm)", "D (mm)", "E (mm)", "F (mm)", "G (mm)", "H (mm)",
    "I (mm)", "K (mm)", "L (mm)", "S (mm)", "T (mm)", "Ø (mm)", "Ø D (mm)",
    "A", "B", "C", "D", "E", "F", "G", "H", "L", "S", "T",
}

LATEST_GLOB = "products_backup_*.json"


def _find_backup(path=None):
    if path:
        return path
    import glob
    files = sorted(glob.glob(LATEST_GLOB))
    if not files:
        sys.exit("Brak pliku backupu (%s). Uruchom najpierw: python3 normalize_meili.py backup" % LATEST_GLOB)
    return files[-1]


def cmd_proposefilters(min_cov=200, backup=None):
    """Buduje listę filtrowalnych z backupu (offline), po symulacji normalizacji.
       Próg pokrycia = min_cov produktów. Wyklucza identyfikatory/tekst oraz
       pola wyglądające na wolny tekst (za dużo unikalnych wartości)."""
    bf = _find_backup(backup)
    print("Czytam backup: %s  (próg pokrycia >= %d)" % (bf, min_cov))
    with open(bf, encoding="utf-8") as f:
        docs = json.load(f)

    cov = {}        # pole -> liczba produktów z wartością
    distinct = {}   # pole -> zbiór wartości (do wykrycia wolnego tekstu)
    for doc in docs:
        nd, _ = transform(doc)   # symuluj scalanie wariantów -> nazwy kanoniczne
        for k, v in nd.items():
            if _is_empty(v):
                continue
            cov[k] = cov.get(k, 0) + 1
            s = distinct.setdefault(k, set())
            if len(s) <= 400:    # czapka, żeby nie zżerać RAM
                vals = v if isinstance(v, list) else [v]
                for x in vals:
                    s.add(_vstr(x))

    rows = []
    for k, c in cov.items():
        nd_count = len(distinct.get(k, ()))
        ratio = nd_count / c if c else 1.0
        if k in BLOCK:
            status = "blok (identyfikator/tekst)"
        elif c < min_cov:
            status = "pomin (pokrycie < %d)" % min_cov
        elif c > 80 and ratio > 0.6:
            status = "pomin (wyglada na wolny tekst: %d unikalnych)" % nd_count
        else:
            status = "OK"
        rows.append((k, c, nd_count, ratio, status))

    rows.sort(key=lambda r: -r[1])
    chosen = [r[0] for r in rows if r[4] == "OK"]
    chosen = sorted(set(chosen + ["category_handles"]))

    print("\n=== PROPOZYCJA FILTROW ===")
    print("%-40s %8s %9s %6s  %s" % ("Pole", "pokrycie", "unikalne", "ratio", "decyzja"))
    print("-" * 92)
    for k, c, nd_count, ratio, status in rows:
        if c < 50 and status != "OK":
            continue   # nie zasmiecaj wydruku drobnica
        print("%-40s %8d %9d %6.2f  %s" % (k[:40], c, nd_count, ratio, status))
    print("-" * 92)
    print("WYBRANO %d pol filtrowalnych." % len(chosen))

    with open("proposed_filters.json", "w", encoding="utf-8") as f:
        json.dump(chosen, f, ensure_ascii=False, indent=2)
    print("Zapisano do proposed_filters.json - przejrzyj, edytuj recznie jesli chcesz,")
    print("a potem:  python3 normalize_meili.py setfilters")


def cmd_setfilters():
    # KROK POZNIEJSZY (po apply): uzywa listy z proposed_filters.json
    try:
        with open("proposed_filters.json", encoding="utf-8") as f:
            filterable = json.load(f)
    except FileNotFoundError:
        sys.exit("Brak proposed_filters.json. Uruchom najpierw: python3 normalize_meili.py proposefilters")
    _req("PUT", "/indexes/%s/settings/filterable-attributes" % INDEX, filterable)
    print("Ustawiono %d pol filtrowalnych. Meili przeindeksuje w tle." % len(filterable))


# ============================================================================
#  UJEDNOLICANIE WARTOŚCI (warstwa 2): liczby -> jedna postać; tekst -> trim/case
# ============================================================================

# Pole liczbowe rozpoznajemy po jednostce w nazwie; wykluczamy pola kategoryczne/sklejone.
NUM_NAME_RE = re.compile(r'\[(mm|cm|m|bar|mpa|psi|v|a|ah|mah|kg|g|w|kw|n|t|nm|kn|l|ml|°c|c|lm|j|cm3/obr|l/min|l/h|mikrony|µm|rpm)\]', re.I)
NUM_EXCLUDE = ('wymiar', 'gwint', 'profil', 'klasa', 'rozmiar', 'typ', 'seria', 'numer',
               'kod', 'rodzaj', 'strona', 'kierunek', 'norma', 'standard', 'kategoria',
               'wersja', 'kolor', 'materia', 'zastosowanie', 'marka', 'model', 'pasuje',
               'grupa', 'forma', 'funkcj', 'blokada', 'jednostk', 'profil')

def is_numeric_field(name):
    n = name.lower()
    if any(w in n for w in NUM_EXCLUDE):
        return False
    return bool(NUM_NAME_RE.search(name)) or 'twardość shore' in n

_WS = re.compile(r'\s+')
_NUMTOK = re.compile(r'-?\d+(?:[.,]\d+)?')
_RESIDUE = re.compile(r'[\s.,;:()\[\]/×x°²³"\'\-]+')
_UNITS = ['mm', 'cm', 'bar', 'mpa', 'psi', 'mah', 'ah', 'kw', 'kg', 'nm', 'kn', 'ml',
          'rpm', 'µm', 'obr', 'min', '°c', 'mikrony', 'v', 'a', 'g', 'w', 'n', 't', 'l', 'c', 'j', 'm']

def _collapse(s):
    return _WS.sub(' ', str(s).strip())

def parse_number(v):
    """'15,9'/'15.90'/'8 mm' -> float; 'M16x1.5'/'10-20'/'120x80x40' -> None."""
    if isinstance(v, list):
        if len(v) != 1:
            return None
        v = v[0]
    if v is None:
        return None
    s = _collapse(v).lower()
    if not s:
        return None
    nums = _NUMTOK.findall(s)
    if len(nums) != 1:
        return None
    residue = s.replace(nums[0], ' ', 1)
    for u in sorted(_UNITS, key=len, reverse=True):
        residue = residue.replace(u, ' ')
    if _RESIDUE.sub('', residue):   # zostały litery = to nie czysta liczba
        return None
    try:
        return float(nums[0].replace(',', '.'))
    except ValueError:
        return None

def _fmt_num(n):
    return str(int(n)) if n == int(n) else ('%g' % n)

def _normkey(is_num, raw):
    s = _collapse(raw)
    if is_num:
        n = parse_number(s)
        if n is not None:
            return ('n', n)          # 15.9 == 15,9 == 15.90
    return ('t', s.casefold())       # "Case " == "case" == "Case"


def cmd_valdryrun(backup=None, top=45):
    """Pokazuje, ile wartości w każdym filtrze da się scalić (offline, nic nie zmienia)."""
    bf = _find_backup(backup)
    print("Czytam backup: %s" % bf)
    with open(bf, encoding="utf-8") as f:
        docs = json.load(f)
    try:
        with open("proposed_filters.json", encoding="utf-8") as f:
            fields = [k for k in json.load(f) if k != "category_handles"]
    except FileNotFoundError:
        fields = None  # brak listy -> analizuj wszystkie pola

    groups = {}  # pole -> {normkey: set(surowych wartości)}
    for doc in docs:
        keys = fields if fields is not None else list(doc.keys())
        for k in keys:
            if k not in doc:
                continue
            isnum = is_numeric_field(k)
            vals = doc[k] if isinstance(doc[k], list) else [doc[k]]
            g = groups.setdefault(k, {})
            for x in vals:
                if x is None or x == "":
                    continue
                g.setdefault(_normkey(isnum, x), set()).add(str(x))

    rows = []
    for k, g in groups.items():
        before = sum(len(s) for s in g.values())
        after = len(g)
        if before == 0:
            continue
        rows.append((k, before, after, before - after, is_numeric_field(k)))
    rows.sort(key=lambda r: -r[3])

    print("\n=== WARTOŚCI DO UJEDNOLICENIA (dry-run, NIC nie zmienia) ===")
    print("%-40s %7s %7s %7s  %s" % ("Pole", "unik.", "po", "scali", "typ"))
    print("-" * 80)
    for k, before, after, saved, isnum in rows[:top]:
        if saved <= 0:
            continue
        print("%-40s %7d %7d %7d  %s" % (k[:40], before, after, saved, "liczba" if isnum else "tekst"))
    print("-" * 80)

    print("\nPrzykłady scaleń (warianty -> jedna wartość):")
    shown = 0
    for k, *_rest in rows:
        for nk, raws in sorted(groups[k].items(), key=lambda kv: -len(kv[1])):
            if len(raws) > 1 and shown < 18:
                canon = _fmt_num(nk[1]) if nk[0] == "n" else sorted(raws, key=len)[0]
                sample = sorted(raws)[:6]
                print("  [%s] %s  ->  %s" % (k, sample, canon))
                shown += 1
        if shown >= 18:
            break
    print("\nTyp 'liczba' = kandydat na SUWAK (po zamianie na liczbę).")
    print("Typ 'tekst'  = czyszczenie zapisu (spacje/wielkość liter).")


def cmd_catdebug(handle):
    """Pyta o KAŻDE pole osobno (odporne na panikę Meili) i pokazuje, co front powinien wybrać."""
    if not handle:
        sys.exit("Podaj handle, np: python3 normalize_meili.py catdebug czesci-do-ciagnikow")

    try:
        with open("proposed_filters.json", encoding="utf-8") as f:
            fields = [k for k in json.load(f) if k != "category_handles"]
    except FileNotFoundError:
        fields = [k for k in _req("GET", "/indexes/%s/settings/filterable-attributes" % INDEX)
                  if k != "category_handles"]

    base = 'category_handles = "%s"' % handle
    total = _req("POST", "/indexes/%s/search" % INDEX,
                 {"q": "", "filter": base, "limit": 0}).get("estimatedTotalHits", 0)

    RANK_HIDE = set(BLOCK) | {
        "Waga [kg]", "Zastosowanie", "Grupa produktowa",
        "Wymiary", "Wymiary [mm]", "Wymiary (mm)", "Wymiary (Dł. x Szer. x Wys.) [mm]",
        "Pasuje do marki", "Pasuje do modelu", "Marka", "category_handles",
    }
    MAXV = 200

    rows = []      # [field, cov, distinct]  (cov=-1 => PANIC)
    panics = []
    for i, k in enumerate(fields, 1):
        try:
            r = _req("POST", "/indexes/%s/search" % INDEX,
                     {"q": "", "filter": base, "limit": 0, "facets": [k]})
            vals = r.get("facetDistribution", {}).get(k, {}) or {}
            rows.append([k, sum(vals.values()), len(vals)])
        except urllib.error.HTTPError:
            rows.append([k, -1, -1])
            panics.append(k)
        sys.stderr.write("\r  sprawdzam %d/%d" % (i, len(fields))); sys.stderr.flush()
    sys.stderr.write("\n")

    rows.sort(key=lambda r: -r[1])
    eligible = []
    for r in rows:
        k, cov, distinct = r
        if cov == -1:
            r.append("PANIKA Meili na tym polu")
        elif k in RANK_HIDE:
            r.append("ukryte (marka/model/wykluczone)")
        elif cov == 0:
            r.append("puste w tej kategorii")
        elif distinct < 2:
            r.append("odpada: <2 wartości")
        elif distinct > MAXV:
            r.append("odpada: >%d wartości" % MAXV)
        else:
            eligible.append(k)
            r.append("kandydat")
    top5 = eligible[:5]

    print("\n=== KATEGORIA: %s  (produktów: %d) ===" % (handle, total))
    print("%-42s %8s %8s  %s" % ("Pole", "pokrycie", "wart.", "decyzja"))
    print("-" * 90)
    for r in rows:
        k, cov, distinct, dec = r[0], r[1], r[2], r[3]
        if cov == 0:
            continue
        mark = (" <== POKAŻ #%d" % (top5.index(k) + 1)) if k in top5 else ""
        cov_s = "PANIC" if cov == -1 else str(cov)
        dist_s = "-" if distinct == -1 else str(distinct)
        print("%-42s %8s %8s  %s%s" % (k[:42], cov_s, dist_s, dec, mark))
    print("-" * 90)
    if panics:
        print("\n⚠ POLA, NA KTÓRYCH MEILI PANIKUJE (%d): %s" % (len(panics), ", ".join(panics)))
        print("  -> te pola trzeba wykluczyć z facetów na froncie.")
    print("\n5 filtrów, które front POWINIEN pokazać dla '%s':" % handle)
    for i, k in enumerate(top5, 1):
        print("  %d. %s" % (i, k))
    if len(top5) < 5:
        print("  (tylko %d — patrz kolumna 'decyzja')" % len(top5))


NUM_PREFIX = "n_"
OUTLIER_PCT = 0.995   # górne 0,5% wartości odcinamy (ekstremalne wyskoki/błędy)
MIN_PARSE_RATE = 0.5  # jeśli <50% wartości to liczba (reszta składana np. "83x56") -> pole pomijamy
NUM_BATCH = 1000      # paczka dokumentów; wysyłamy SERYJNIE (czekając), by Meili nie sklejał w 1 transakcję
FILT_CHUNK = 10       # ile pól n_ dodajemy do filtrowalności NARAZ (mały reindeks = nie pada MDB_TXN_FULL)

# Pola liczbowe, których NIE robimy suwakami: Waga (nie jest filtrem) + składane 2D ("72x100", "83x56").
SLIDER_EXCLUDE = {'Waga [kg]', 'Rozstaw otworów kołnierza [mm]', 'Rozstaw otworów montażowych [mm]'}


def _wait_task(uid):
    """Czeka aż zadanie Meili się zakończy. Zwraca (status, komunikat_błędu)."""
    while True:
        t = _req("GET", "/tasks/%s" % uid)
        st = t.get("status")
        if st in ("succeeded", "failed", "canceled"):
            return st, (t.get("error") or {}).get("message", "")
        time.sleep(1)


def _numeric_filterable_fields():
    """WSZYSTKIE filtrowalne pola liczbowe (oprócz wykluczonych). parse_rate w raporcie odsiewa składane."""
    flist = _req("GET", "/indexes/%s/settings/filterable-attributes" % INDEX)
    fset = set(flist) if isinstance(flist, list) else set()
    return sorted(f for f in fset if not f.startswith(NUM_PREFIX) and is_numeric_field(f) and f not in SLIDER_EXCLUDE)


def _unit_cap(field):
    """Twardy, zdroworozsądkowy limit po jednostce. Część do ciągnika > 10 m = błąd (pomyłka mm/cm)."""
    f = field.lower()
    if "[mm]" in f or "(mm)" in f:
        return 10000   # 10 metrów
    return None


def _numeric_report(docs, fields):
    """Per pole: ile wartości, ile liczb, ile ujemnych/wyskoków odrzucono, czysty min/max, próg odcięcia, czy pomijać."""
    rep = {}
    for f in fields:
        have = neg = 0
        vals = []
        bad = []
        for d in docs:
            if f not in d or _is_empty(d.get(f)):
                continue
            have += 1
            n = parse_number(d[f])
            if n is None:
                if len(bad) < 3:
                    bad.append(d[f])
                continue
            if n < 0:               # długość/ciśnienie/waga nie bywają ujemne -> błąd danych
                neg += 1
                continue
            vals.append(n)
        if have == 0:
            continue
        parseable = len(vals) + neg
        parse_rate = parseable / have
        fence = None
        out = 0
        kept = vals
        if vals:
            s = sorted(vals)
            def _q(p): return s[min(len(s) - 1, int(len(s) * p))]
            p995 = _q(OUTLIER_PCT)
            q1, q3 = _q(0.25), _q(0.75)
            iqr = q3 - q1
            # IQR łapie POWTARZALNE błędy/klastry (np. 9 MW w wielu produktach), których percentyl nie utnie.
            # ×50 = bardzo łagodne, nie tnie naturalnie długich ogonów (śruba 5800 mm zostaje).
            iqr_fence = (q3 + 50 * iqr) if iqr > 0 else p995
            fence = min(p995, iqr_fence)
            cap = _unit_cap(f)
            if cap is not None:
                fence = min(fence, cap)
            kept = [x for x in vals if x <= fence]
            out = len(vals) - len(kept)
        rep[f] = {
            "have": have, "parseable": parseable, "neg": neg, "out": out,
            "kept": len(kept), "lo": (min(kept) if kept else None), "hi": (max(kept) if kept else None),
            "fence": fence, "parse_rate": parse_rate, "skip": parse_rate < MIN_PARSE_RATE, "bad": bad,
        }
    return rep


def cmd_numdryrun():
    """Pokazuje, które pola liczbowe da się zamienić na liczby (pod suwaki) — NIC nie zmienia."""
    fields = _numeric_filterable_fields()
    if not fields:
        sys.exit("Brak filtrowalnych pól liczbowych. Najpierw uruchom setfilters.")
    print("Pól liczbowych (filtrowalnych):", len(fields))
    print("Pobieram produkty z Meili...")
    docs = fetch_all()
    rep = _numeric_report(docs, fields)

    rows = sorted(rep.items(), key=lambda kv: -kv[1]["kept"])
    print("\n%-38s %7s %7s %6s %6s %9s %9s  %s" %
          ("Pole", "z war.", "liczby", "ujem.", "wysk.", "min", "max", "uwaga"))
    print("-" * 108)
    skipped = []
    for f, r in rows:
        if r["skip"]:
            skipped.append(f)
            continue
        note = ""
        if r["bad"] and r["parse_rate"] < 0.9:
            note = "np. nie-liczby: " + ", ".join(map(str, r["bad"]))
        print("%-38s %7d %7d %6d %6d %9s %9s  %s" % (
            f[:38], r["have"], r["kept"], r["neg"], r["out"],
            _fmt_num(r["lo"]) if r["lo"] is not None else "-",
            _fmt_num(r["hi"]) if r["hi"] is not None else "-", note))
    print("-" * 108)
    if skipped:
        print("\nPOMINIĘTE (mniej niż 50%% to liczby — wartości składane typu '83x56', nie nadają się na suwak):")
        for f in skipped:
            print("   -", f, "(%d%% liczb)" % int(rep[f]["parse_rate"] * 100))
    print("\nKolumny 'ujem.'/'wysk.' = ile wartości odrzucono jako błędne (ujemne / ekstremalne wyskoki).")
    print("min–max to JUŻ czyste zakresy = takie będą domyślne zakresy suwaków.")
    print("Jak wygląda OK:  python3 normalize_meili.py backup  potem  python3 normalize_meili.py numapply")


def cmd_numapply():
    """Tworzy pola n_<pole> (czyste liczby) przez PUT (scala, NIE kasuje innych pól) i ustawia je filtrowalne+sortowalne."""
    fields = _numeric_filterable_fields()
    if not fields:
        sys.exit("Brak filtrowalnych pól liczbowych. Najpierw uruchom setfilters.")
    print("UWAGA: zrób wcześniej świeży backup (python3 normalize_meili.py backup).")
    print("Pobieram produkty z Meili...")
    docs = fetch_all()
    rep = _numeric_report(docs, fields)

    use_fields = [f for f in fields if f in rep and not rep[f]["skip"]]
    fence = {f: rep[f]["fence"] for f in use_fields}
    skipped = [f for f in fields if f in rep and rep[f]["skip"]]
    print("Pól do konwersji:", len(use_fields), "| pominiętych (składane):", len(skipped))

    pk = "id"
    updates = []
    counts = {f: 0 for f in use_fields}
    for d in docs:
        if pk not in d:
            continue
        patch = {pk: d[pk]}
        for f in use_fields:
            if f in d and not _is_empty(d.get(f)):
                n = parse_number(d[f])
                if n is None or n < 0:
                    continue
                if fence[f] is not None and n > fence[f]:   # odetnij ekstremalny wyskok
                    continue
                patch[NUM_PREFIX + f] = n
                counts[f] += 1
        if len(patch) > 1:
            updates.append(patch)

    print("Dokumentów z choć jedną liczbą:", len(updates))
    print("Wysyłam SERYJNIE (czekam na każdą paczkę), batch =", NUM_BATCH, "- to potrwa, ale nie przepełni Meili.")
    sent = 0
    for i in range(0, len(updates), NUM_BATCH):
        chunk = updates[i:i + NUM_BATCH]
        task = _req("PUT", "/indexes/%s/documents" % INDEX, chunk)
        uid = task.get("taskUid")
        st, err = _wait_task(uid)
        sent += len(chunk)
        sys.stderr.write("\r  %d / %d  (task %s: %s)            " % (sent, len(updates), uid, st)); sys.stderr.flush()
        if st != "succeeded":
            sys.stderr.write("\n")
            print("PRZERWANO na paczce dokumentów: %s — %s" % (st, err))
            print("Jeśli to znów MDB_TXN_FULL: zmniejsz NUM_BATCH (np. 250) i/lub CURATED_NUM.")
            return
    sys.stderr.write("\n")

    # Dodaj pola n_ do FILTROWALNYCH — PARTIAMI (mały reindeks na partię = nie pada MDB_TXN_FULL).
    new_fields = [NUM_PREFIX + f for f in use_fields]
    cur_filt = _req("GET", "/indexes/%s/settings/filterable-attributes" % INDEX) or []
    cur_filt = set(cur_filt) if isinstance(cur_filt, list) else set()
    to_add = [nf for nf in new_fields if nf not in cur_filt]
    print("Pól n_ do dodania do filtrowalności:", len(to_add), "- partiami po", FILT_CHUNK, "(czekam na reindeks każdej)")
    committed = set(cur_filt)
    added = 0
    for i in range(0, len(to_add), FILT_CHUNK):
        chunk = to_add[i:i + FILT_CHUNK]
        merged = sorted(committed | set(chunk))
        t = _req("PUT", "/indexes/%s/settings/filterable-attributes" % INDEX, merged)
        st, err = _wait_task(t.get("taskUid"))
        if st == "succeeded":
            committed |= set(chunk); added += len(chunk)
            sys.stderr.write("\r  dodano %d / %d filtrowalnych        " % (added, len(to_add))); sys.stderr.flush()
        else:
            sys.stderr.write("\n")
            print("Partia filtrowalności padła (%s): %s" % (st, err))
            print("Dodano %d z %d. To limit pamięci Meili — zmniejsz FILT_CHUNK (np. 5) i odpal ponownie," % (added, len(to_add)))
            print("albo podbij MEILI_MAX_INDEXING_MEMORY na serwerze. Co dodano - zostaje (re-run dobierze resztę).")
            break
    sys.stderr.write("\n")
    total_ok = len(committed & set(new_fields))

    print("\nGotowe ✓ Zapisane liczby per pole (top 20):")
    for f, c in sorted(counts.items(), key=lambda x: -x[1])[:20]:
        print("  %-40s %d" % (f[:40], c))
    print("\nFiltrowalnych pól n_ (suwaki): %d z %d zamierzonych." % (total_ok, len(new_fields)))
    print("Sprawdź: python3 check_n.py. Potem odśwież front — suwaki wskoczą na polach liczbowych.")


def _text_filterable_fields():
    """Filtrowalne pola TEKSTOWE (nie liczbowe, nie n_, nie ścieżka kategorii)."""
    flist = _req("GET", "/indexes/%s/settings/filterable-attributes" % INDEX)
    fset = set(flist) if isinstance(flist, list) else set()
    skip = {'category_handles'}
    return sorted(f for f in fset if not f.startswith(NUM_PREFIX) and not is_numeric_field(f) and f not in skip)


def _collect_text_counts(docs, fields):
    """{pole: {wartość_raw: liczba_produktów}} — obsługuje też wartości listowe."""
    out = {f: {} for f in fields}
    for d in docs:
        for f in fields:
            v = d.get(f)
            if _is_empty(v):
                continue
            vals = [str(x) for x in v if not _is_empty(x)] if isinstance(v, list) else [str(v)]
            for x in vals:
                out[f][x] = out[f].get(x, 0) + 1
    return out


def _safe_key(s):
    """Klucz bezpiecznego scalania: trim + zwinięte spacje + bez wielkości liter."""
    return _collapse(s).casefold()


def _safe_merge_map(counts):
    """{raw: kanonik} dla wariantów różniących się TYLKO spacją/wielkością liter. Kanonik = najczęstszy zapis."""
    groups = {}
    for raw, c in counts.items():
        groups.setdefault(_safe_key(raw), []).append((raw, c))
    mapping = {}
    for _, variants in groups.items():
        if len(variants) < 2:
            continue
        canonical = sorted(variants, key=lambda rc: (-rc[1], -len(rc[0]), rc[0]))[0][0]
        for raw, _c in variants:
            if raw != canonical:
                mapping[raw] = canonical
    return mapping


def _load_synonyms():
    if os.path.exists("synonyms.json"):
        try:
            return json.load(open("synonyms.json", encoding="utf-8"))
        except Exception as e:
            print("UWAGA: nie mogę wczytać synonyms.json:", e)
    return {}


def cmd_textscan(field=None):
    """Pokazuje bałagan w wartościach tekstowych. Bez pola: ranking pól. Z polem: wszystkie warianty."""
    fields = [field] if field else _text_filterable_fields()
    print("Pobieram produkty z Meili...")
    docs = fetch_all()
    counts = _collect_text_counts(docs, fields)

    if field:
        c = counts.get(field, {})
        if not c:
            print("Pole '%s' nie ma wartości albo nie jest filtrowalne." % field)
            return
        m = _safe_merge_map(c)
        after_safe = len(set(_safe_key(x) for x in c))
        print("\nPole: %s" % field)
        print("Różnych wartości: %d  ->  po bezpiecznym scaleniu: %d  (scali %d)" % (len(c), after_safe, len(c) - after_safe))
        print("\nWszystkie wartości (malejąco; '->' = zostanie scalone bezpiecznie):")
        for raw, cnt in sorted(c.items(), key=lambda x: -x[1]):
            tag = ("   ->  " + m[raw]) if raw in m else ""
            print("  %6d  %-40s%s" % (cnt, raw[:40], tag))
        print("\nPozostałe (różne litery, np. 'Prawa' vs 'Prawy') NIE scalają się same —")
        print("dodaj je do synonyms.json, np:  {\"%s\": {\"Prawa\": \"Prawy\", \"Lewa\": \"Lewy\"}}" % field)
    else:
        rows = []
        for f in fields:
            c = counts[f]
            if not c:
                continue
            after = len(set(_safe_key(x) for x in c))
            rows.append((f, len(c), after, len(c) - after))
        rows.sort(key=lambda r: -r[3])
        print("\n%-44s %8s %8s %8s" % ("Pole", "warianty", "po scal.", "scali"))
        print("-" * 74)
        for f, before, after, red in rows[:45]:
            print("%-44s %8d %8d %8d" % (f[:44], before, after, red))
        print("-" * 74)
        print("\n'scali' = ile wariantów zniknie po samym scaleniu spacji/wielkości liter (bezpieczne).")
        print("Obejrzyj jedno pole:  python3 normalize_meili.py textscan \"Strona montażu (L/P)\"")


def cmd_textapply(field=None):
    """Scala wartości tekstowe: bezpiecznie (spacje/wielkość liter) + synonyms.json. Wysyła SERYJNIE."""
    fields = [field] if field else _text_filterable_fields()
    syn = _load_synonyms()
    print("Pobieram produkty z Meili...")
    docs = fetch_all()
    counts = _collect_text_counts(docs, fields)

    # Zbuduj mapę raw -> nowa wartość per pole (bezpieczne scalenie + synonimy).
    field_map = {}
    for f in fields:
        safe = _safe_merge_map(counts[f])
        sm = syn.get(f, {})
        full = {}
        for raw in counts[f]:
            tgt = safe.get(raw, raw)          # najpierw bezpieczny kanonik
            tgt = sm.get(raw, sm.get(tgt, tgt))  # potem synonim (na raw albo na kanoniku)
            if tgt != raw:
                full[raw] = tgt
        if full:
            field_map[f] = full

    if not field_map:
        print("Nic do scalenia (brak wariantów spacja/wielkość liter i pustych synonimów).")
        return

    print("Pola do poprawy:", len(field_map))
    for f, fm in list(field_map.items())[:20]:
        print("  %-40s scala %d wartości" % (f[:40], len(fm)))

    # Zbuduj częściowe dokumenty (PUT scala, nie kasuje innych pól).
    updates = []
    for d in docs:
        if "id" not in d:
            continue
        patch = {"id": d["id"]}
        changed = False
        for f, fm in field_map.items():
            v = d.get(f)
            if _is_empty(v):
                continue
            if isinstance(v, list):
                nv = [fm.get(str(x), x) for x in v]
                if nv != v:
                    patch[f] = nv; changed = True
            else:
                s = str(v)
                if s in fm:
                    patch[f] = fm[s]; changed = True
        if changed:
            updates.append(patch)

    print("Dokumentów do zmiany:", len(updates))
    if not updates:
        return
    print("Wysyłam SERYJNIE (czekam na każdą paczkę)...")
    sent = 0
    for i in range(0, len(updates), NUM_BATCH):
        chunk = updates[i:i + NUM_BATCH]
        task = _req("PUT", "/indexes/%s/documents" % INDEX, chunk)
        st, err = _wait_task(task.get("taskUid"))
        sent += len(chunk)
        sys.stderr.write("\r  %d / %d  (%s)        " % (sent, len(updates), st)); sys.stderr.flush()
        if st != "succeeded":
            sys.stderr.write("\n")
            print("PRZERWANO: %s — %s" % (st, err))
            print("Jeśli MDB_TXN_FULL: zmniejsz NUM_BATCH (np. 250) i odpal ponownie.")
            return
    sys.stderr.write("\n")
    print("Gotowe ✓ Wartości scalone. Odśwież front — filtry będą miały mniej duplikatów.")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        if cmd == "backup":      cmd_backup()
        elif cmd == "dryrun":    cmd_dryrun()
        elif cmd == "apply":     cmd_apply()
        elif cmd == "proposefilters":
            cmd_proposefilters(int(sys.argv[2]) if len(sys.argv) > 2 else 200)
        elif cmd == "setfilters":cmd_setfilters()
        elif cmd == "valdryrun": cmd_valdryrun()
        elif cmd == "numdryrun": cmd_numdryrun()
        elif cmd == "numapply":  cmd_numapply()
        elif cmd == "textscan":  cmd_textscan(sys.argv[2] if len(sys.argv) > 2 else None)
        elif cmd == "textapply": cmd_textapply(sys.argv[2] if len(sys.argv) > 2 else None)
        elif cmd == "catdebug" and len(sys.argv) > 2: cmd_catdebug(sys.argv[2])
        elif cmd == "restore" and len(sys.argv) > 2: cmd_restore(sys.argv[2])
        else:
            print(__doc__)
    except urllib.error.HTTPError as e:
        print("HTTP %s: %s" % (e.code, e.read().decode("utf-8", "replace")))