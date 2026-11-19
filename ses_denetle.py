# Ses dosyalarını dinlemeden denetler: her dosyanın süresi, metin uzunluğundan beklenen süreyle karşılaştırılır.
# Çok uzun (talimatı da okumuş / tekrar etmiş) ya da çok kısa (yarıda kesilmiş) dosyalar şüphelidir.
# Kullanım: python ses_denetle.py <oyun> [--sil]     (--sil: şüpheli dosyaları siler ki yeniden üretilsin)
import json, pathlib, sys
oyun = pathlib.Path(sys.argv[1]); HIZ = 13.2
L = json.load(open(oyun / "ses" / "replikler.json", encoding="utf-8"))
var = eksik = 0; supheli = []; toplam = 0.0
for l in L:
    f = oyun / "ses" / f"{l['id']}.wav"
    if not f.exists():
        eksik += 1; continue
    var += 1; sn = (f.stat().st_size - 44) / 48000; toplam += sn
    bek = len(l["text"]) / HIZ + 0.6
    if sn > bek * 1.55 + 1.0 or sn < bek * 0.55:
        supheli.append((l, sn, bek, f))
print(f"{oyun.name}: {var} dosya, {eksik} eksik, {toplam / 60:.1f} dk, {len(supheli)} şüpheli")
for l, sn, bek, f in supheli:
    print(f"  {l['id']} {l['voice']} {sn:.1f} sn (beklenen ~{bek:.1f}) :: {l['text'][:60]}")
    if "--sil" in sys.argv:
        f.unlink()
