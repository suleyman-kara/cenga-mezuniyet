# Mezuniyet.exe — son dağılımı doğrulaması
# Sayaçlar: G=Görünürlük, C=Çevre, Y=Yetkinlik. Hepsi 0'dan başlar. Bayrak: DURUM (K4-C).
import itertools, collections

KARARLAR = [
 ("K1 Staj", [("Tanıdık torpili",      dict(C=2)),
              ("Ücretsiz startup",     dict(Y=2, C=1)),
              ("Kendi projen",         dict(Y=3))]),
 ("K2 Cuma etkinliği", [("Git, tanış",  dict(C=2, G=1)),
              ("Seriyi bozma",         dict(Y=1)),
              ("Pizza gelince kaç",    dict(C=1))]),
 ("K3 Bitirme", [("Paylaş + demo",     dict(G=2, Y=1)),
              ("Sessizce GitHub",      dict(Y=2)),
              ("Hackathon",            dict(C=1, G=1, Y=1))]),
 ("K4 Profil", [("Düzgün profil",      dict(G=2)),
              ("Kod konuşsun",         dict(Y=1)),
              ("Dürümlü fotoğraf",     dict(G=1, DURUM=1))]),
 ("K5 İş arama", [("500 Kolay Başvuru", dict()),
              ("Etkinlik + referans",  dict(C=2, G=1)),
              ("Zaman kazan",          dict(Y=1))]),
 ("K6 Son hamle", [("Gece gündüz Leetcode", dict(Y=2)),
              ("Her hafta paylaş",     dict(G=2)),
              ("Kahve ısmarla",        dict(C=2))]),
]

def son(G, C, Y, DURUM):
    # Öncelik sırası: yukarıdan aşağı ilk tutan koşul kazanır.
    if C >= 5 and G >= 3:            return "S1 Referans Kapısı"
    if DURUM and G >= 3:             return "S2 Viral Kaza (Dürüm)"
    if Y >= 5 and G >= 3:            return "S3 Remote Dolar"
    if Y >= 5 and G <= 2 and C <= 3: return "S4 Mükemmel CV · Sıfır Dönüş"
    return "S5 Yüksek Lisans Döngüsü"

def toplam(secim):
    t = collections.Counter()
    for (ad, ops), i in zip(KARARLAR, secim):
        t.update(ops[i][1])
    return t

if __name__ == "__main__":
    say = collections.Counter(); ornek = {}
    hepsi = list(itertools.product(range(3), repeat=len(KARARLAR)))
    for s in hepsi:
        t = toplam(s)
        e = son(t["G"], t["C"], t["Y"], t["DURUM"])
        say[e] += 1
        ornek.setdefault(e, s)
    assert sum(say.values()) == len(hepsi) == 729   # her birleşim tam olarak bir sona
    print(f"Toplam yol: {len(hepsi)}\n")
    print("| Son | Yol | Oran | Örnek yol (K1..K6) |")
    print("|---|---:|---:|---|")
    for e in sorted(say):
        s = ornek[e]
        yol = " / ".join(KARARLAR[k][1][i][0] for k, i in enumerate(s))
        print(f"| {e} | {say[e]} | %{100*say[e]/len(hepsi):.1f} | {yol} |")
    assert len(say) == 5 and min(say.values()) >= 10, "ulaşılamayan / çok nadir son var"
    # Son başına sayaç aralıkları
    print("\n| Son | G aralığı | Ç aralığı | Y aralığı |\n|---|---|---|---|")
    for e in sorted(say):
        ss=[toplam(x) for x in hepsi if son(**{k:toplam(x)[k] for k in ("G","C","Y","DURUM")})==e]
        r=lambda k: f"{min(t[k] for t in ss)}–{max(t[k] for t in ss)}"
        print(f"| {e} | {r('G')} | {r('C')} | {r('Y')} |")
    # Son karar sonu tek başına belirliyor mu?
    print("\nK6 seçeneğine göre dağılım (son karar sonu belirlemez):")
    for i,(ad,_) in enumerate(KARARLAR[5][1]):
        c=collections.Counter(son(**{k:toplam(x)[k] for k in ("G","C","Y","DURUM")}) for x in hepsi if x[5]==i)
        print(f"  {ad}: " + ", ".join(f"{e.split()[0]}={c[e]}" for e in sorted(say)))
    # Sayaç aralıkları
    for k in "GCY":
        v = [toplam(s)[k] for s in hepsi]
        print(f"\n{k}: min {min(v)}, max {max(v)}", end="")
    print()
