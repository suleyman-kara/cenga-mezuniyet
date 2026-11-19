# Seslendirme üretici (Gemini TTS).
# Kullanım:  python ses_uret_gemini.py <oyun_klasoru> [--ornek] [--yeniden]
#   <oyun>/ses/replikler.json : [{"id","voice","text"}]            (replik_cikar.js üretir)
#   <oyun>/sesler.json        : {"voice": ["GeminiSesi", "oyunculuk tarifi (İngilizce)"], ...}
#   --ornek   : her karakter için tek replik üretir -> <oyun>/ses_ornek/<voice>.wav (onay için)
#   --yeniden : var olan dosyaların üzerine yazar
# Anahtar: GEMINI_API_KEY ortam değişkeni, yoksa gemini_key.txt (bu dosyanın yanında ya da ..\demo-oyun içinde).
import base64, json, os, pathlib, sys, time, urllib.request, urllib.error

MODEL = "gemini-3.8-flash-tts"
URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
kok = pathlib.Path(__file__).parent

def anahtar_oku():
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    for p in (kok / "gemini_key.txt", kok.parent / "demo-oyun" / "gemini_key.txt"):
        if p.exists():
            return p.read_text(encoding="utf-8").strip()
    raise SystemExit("gemini_key.txt bulunamadı")

anahtar = anahtar_oku()

def ses_bul(o):
    if isinstance(o, dict):
        if o.get("type") == "audio" and o.get("data"):
            return o["data"]
        o = list(o.values())
    if isinstance(o, list):
        for x in reversed(o):
            r = ses_bul(x)
            if r:
                return r
    return None

def uret(metin, ses, stil):
    govde = {"model": MODEL,
             "input": [{"type": "user_input", "content": [{"type": "text", "text": metin,
                        "annotations": [{"type": "speech_metadata", "style": stil}]}]}],
             "response_format": {"type": "audio"},
             "generation_config": {"speech_config": [{"voice": ses}]}}
    istek = urllib.request.Request(URL, data=json.dumps(govde).encode("utf-8"),
                                   headers={"x-goog-api-key": anahtar, "Content-Type": "application/json"})
    with urllib.request.urlopen(istek, timeout=180) as r:
        veri = ses_bul(json.load(r))
    if not veri:
        raise RuntimeError("yanıtta ses yok")
    return base64.b64decode(veri)

def bir(l, dosya, SESLER):
    ses, stil = SESLER[l["voice"]]
    ses, stil = l.get("ses", ses), l.get("stil", stil)
    if dosya.exists() and "--yeniden" not in sys.argv:
        return f"var {dosya.stem}"
    hata = ""
    for deneme in range(4):
        try:
            dosya.write_bytes(uret(l["text"], ses, stil))
            return f"ok {dosya.stem} {ses} {dosya.stat().st_size / 48000:.1f} sn"
        except urllib.error.HTTPError as e:
            # anahtar URL'de değil başlıkta; gövdeyi kısaltarak yaz
            hata = f"HATA {dosya.stem} {e.code} {e.read().decode('utf-8', 'replace')[:300]}"
            if e.code not in (429, 500, 503):
                return hata
            time.sleep(8 + deneme * 10)
        except Exception as e:
            hata = f"HATA {dosya.stem} {type(e).__name__}"; time.sleep(5)
    return hata

def main():
    from concurrent.futures import ThreadPoolExecutor
    oyun = pathlib.Path(sys.argv[1]).resolve()
    SESLER = json.load(open(oyun / "sesler.json", encoding="utf-8"))
    satirlar = json.load(open(oyun / "ses" / "replikler.json", encoding="utf-8"))
    eksik = sorted({l["voice"] for l in satirlar} - set(SESLER))
    if eksik:
        raise SystemExit(f"sesler.json içinde tarifi olmayan sesler: {eksik}")
    if "--ornek" in sys.argv:
        out = oyun / "ses_ornek"; isler = []
        for v in SESLER:
            aday = [l for l in satirlar if l["voice"] == v]
            if not aday:
                continue
            # karakteri iyi gösteren, orta uzunlukta bir replik
            aday.sort(key=lambda l: abs(len(l["text"]) - 130))
            isler.append((aday[0], out / f"{v}.wav"))
    else:
        out = oyun / "ses"
        isler = [(l, out / f"{l['id']}.wav") for l in satirlar]
    out.mkdir(parents=True, exist_ok=True)
    say = {"ok": 0, "var": 0, "HATA": 0}; sure = 0.0
    with ThreadPoolExecutor(4) as havuz:
        for sonuc in havuz.map(lambda t: bir(t[0], t[1], SESLER), isler):
            say[sonuc.split()[0]] += 1
            if sonuc.startswith("ok"):
                sure += float(sonuc.split()[-2])
            if not sonuc.startswith("var"):
                print(sonuc, flush=True)
    print(f"bitti: {say} yeni ses {sure / 60:.1f} dk", flush=True)

main()
