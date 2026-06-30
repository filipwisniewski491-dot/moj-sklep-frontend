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

import sys, json, time, urllib.request, urllib.error

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


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        if cmd == "backup":      cmd_backup()
        elif cmd == "dryrun":    cmd_dryrun()
        elif cmd == "apply":     cmd_apply()
        elif cmd == "proposefilters":
            cmd_proposefilters(int(sys.argv[2]) if len(sys.argv) > 2 else 200)
        elif cmd == "setfilters":cmd_setfilters()
        elif cmd == "restore" and len(sys.argv) > 2: cmd_restore(sys.argv[2])
        else:
            print(__doc__)
    except urllib.error.HTTPError as e:
        print("HTTP %s: %s" % (e.code, e.read().decode("utf-8", "replace")))