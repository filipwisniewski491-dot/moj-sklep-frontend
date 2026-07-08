#!/usr/bin/env python3
# Test listy facetow: znajduje pola NIEfiltrowalne, sprawdza panike, liczy top-5.
import json, urllib.request, urllib.error

HOST = "http://178.104.130.90:7700"
KEY  = "3497dcd504ded68f751f174def7791ec1830e1c0830fefad6e045a9c53974a4f"
HANDLE = "czesci-do-ciagnikow"

CANDIDATE = ['Średnica wewnętrzna (DN) [mm]', 'Średnica wewnętrzna [mm]', 'Średnica zewnętrzna [mm]', 'Średnica [mm]', 'Średnica sworznia [mm]', 'Średnica sworznia zaczepu [mm]', 'Średnica przyłącza [mm]', 'Średnica tłoczyska [mm]', 'Średnica tłoka [mm]', 'Średnica cylindra wewn. [mm]', 'Średnica otworu [mm]', 'Średnica koła pasowego [mm]', 'Średnica talerza [mm]', 'Średnica węża zewnętrzna [mm]', 'Ø wew. (mm)', 'Szerokość/Grubość [mm]', 'Szerokość [mm]', 'Szerokość robocza [mm]', 'Szerokość paska [mm]', 'Szerokość siedzenia [mm]', 'Szerokość szyny (mm)', 'Szerokość prowadnicy (mm)', 'Wysokość [mm]', 'Grubość [mm]', 'Grubość elementu [mm]', 'Grubość lemiesza/dłuta [mm]', 'Długość [mm]', 'Długość robocza [mm]', 'Długość paska [mm]', 'Długość śruby/elementu [mm]', 'Długość [cm]', 'Skok siłownika [mm]', 'Rozstaw otworów kołnierza [mm]', 'Rozstaw otworów montażowych [mm]', 'Napięcie [V]', 'Natężenie [A]', 'Moc [kW]', 'Moc [W]', 'Pojemność [l]', 'Pojemność [Ah]', 'Max. ciśnienie [bar]', 'Max. ciśnienie robocze [bar]', 'Ciśnienie robocze [bar]', 'Przepływ max [l/min]', 'Siła wyrzutu [N]', 'Siła nacisku/uciągu [t]', 'Wartość D [kN]', 'Nacisk pionowy [kg]', 'Obciążenie (kg)', 'Udźwig [kg]', 'Twardość Shore', 'Ilość zębów', 'Ilość sekcji', 'Ilość ogniw/żeber', 'Ilość pierścieni', 'Ilość oplotów stalowych (SN)', 'Wydajność geometryczna [cm3/obr]', 'Wymiar gwintu', 'Rozmiar klucza/końcówki [mm]', 'Materiał', 'Materiał (Żeliwo/Tworzywo)', 'Materiał obicia', 'Gwint', 'Kategoria zaczepu (Kat.)', 'Seria (L-Lekka / S-Ciężka)', 'Typ uszczelnienia (np. 2RS, Simmering)', 'Typ uszczelnienia', 'Kolor', 'Kolor szyby', 'Typ złącza (Męski/Żeński)', 'Typ złącza (Miękkie/Twarde)', 'Wersja', 'Rozmiar', 'Rozmiar gwintów przyłączeniowych', 'Kierunek obrotów (L/P)', 'Strona', 'Strona montażu (L/P)', 'Profil paska/łańcucha', 'Blokada', 'Funkcje światła', 'Typ sterowania (Ręczne/Elektryczne)', 'Standard (EURO/PUSH-PULL)', 'Klasa twardości (np. 8.8, 10.9)', 'Typ wałka (Stożek/Frez)', 'Typ łba', 'Rodzaj amortyzacji', 'Norma', 'Kategoria', 'Przeznaczenie', 'Model silnika']

def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(HOST + path, data=data, method=method,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode())

# 1) lista filtrowalnych w Meili
filterable = set(req("GET", "/indexes/products/settings/filterable-attributes"))
bad = [f for f in CANDIDATE if f not in filterable]
good = [f for f in CANDIDATE if f in filterable]

print("Kandydatow:", len(CANDIDATE), "| filtrowalnych:", len(good), "| NIEfiltrowalnych:", len(bad))
if bad:
    print("\n>>> TE POLA NIE SA FILTROWALNE (wyrzuc je z page.tsx):")
    for f in bad:
        print("   -", f)

# 2) jedno zapytanie ze WSZYSTKIMI poprawnymi -> test paniki
print("\nTest zbiorczego zapytania (%d pol)..." % len(good))
base = 'category_handles = "%s"' % HANDLE
try:
    res = req("POST", "/indexes/products/search",
              {"q": "", "filter": base, "limit": 0, "facets": good})
    dist = res.get("facetDistribution", {})
    print("HTTP 200 OK - NIE panikuje. Pol z danymi:",
          sum(1 for v in dist.values() if v), "/", len(dist))

    RANK_HIDE = {"Pasuje do marki","Pasuje do modelu","Marka"}
    scored = []
    for k, vals in dist.items():
        if k in RANK_HIDE: continue
        n = len(vals)
        if n < 2 or n > 200: continue
        scored.append((k, sum(vals.values()), n))
    scored.sort(key=lambda x: -x[1])
    print("\n5 filtrow, ktore front pokaze dla tej kategorii:")
    for i,(k,cov,n) in enumerate(scored[:5],1):
        print("  %d. %s  (pokrycie %d, wartosci %d)" % (i,k,cov,n))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, "-", e.read().decode()[:200])
    if e.code == 500:
        print(">>> PANIKA na zbiorczym zapytaniu - trzeba przyciac liste.")
    elif e.code == 400:
        print(">>> 400 mimo odsiania niefiltrowalnych - cos innego (zglos mi tresc bledu).")