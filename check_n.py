#!/usr/bin/env python3
# Pokazuje stan kolejki zadań Meili - czy numapply (dokumenty + ustawienia n_) już się przetworzył.
import json, urllib.request, urllib.error

HOST = "http://178.104.130.90:7700"
KEY  = "3497dcd504ded68f751f174def7791ec1830e1c0830fefad6e045a9c53974a4f"

def req(p):
    r = urllib.request.Request(HOST + p, headers={"Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode())

pend = req("/tasks?statuses=enqueued,processing&limit=500")["results"]
print("Zadań w toku / oczekujących:", len(pend))
if pend:
    # pokaż typy oczekujących
    from collections import Counter
    c = Counter(t["type"] for t in pend)
    for typ, n in c.items():
        print("   %s: %d" % (typ, n))
    print("   (czekaj aż dojdzie do 0)")

print("\nStatus kluczowych zadań ustawień:")
for u in (403, 404):
    try:
        t = req("/tasks/%d" % u)
        err = ""
        if t["status"] == "failed":
            err = "  BŁĄD: " + str(t.get("error", {}).get("message", ""))[:120]
        print("   task %d (%s): %s%s" % (u, t["type"], t["status"], err))
    except urllib.error.HTTPError as e:
        print("   task %d: nie znaleziono (%s)" % (u, e.code))

last = req("/tasks?limit=3")["results"]
print("\nOstatnie 3 zadania:")
for t in last:
    print("   #%s %-26s %s" % (t["uid"], t["type"], t["status"]))

print("\n=> Jak 'w toku/oczekujących' = 0 i task 403 = succeeded, odpal: python3 check_n.py")