# Seslendirme üretici — Gemini Batch API (günlük istek sınırına takılmadan toplu üretim).
# Kullanım:
#   python ses_toplu_gemini.py gonder <oyun> [--en-cok N]   eksik replikler için toplu iş açar (-> <oyun>/ses/_toplu.json)
#   python ses_toplu_gemini.py al <oyun>                    işin durumuna bakar; bittiyse wav dosyalarını yazar
# Anahtar ses_uret_gemini.py ile aynı yerden okunur. Ses: 24 kHz, 16 bit, mono PCM -> WAV.
import base64, json, os, pathlib, struct, sys, urllib.request, urllib.error

MODEL = "gemini-3.8-flash-tts"
KOK = "https://generativelanguage.googleapis.com/v1beta"
kok = pathlib.Path(__file__).parent

def anahtar_oku():
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    for p in (kok / "gemini_key.txt", kok.parent / "demo-oyun" / "gemini_key.txt"):
        if p.exists():
            return p.read_text(encoding="utf-8").strip()
    raise SystemExit("gemini_key.txt bulunamadı")

anahtar = anahtar_oku()

def cagir(url, govde=None, ham=False):
    istek = urllib.request.Request(url, data=json.dumps(govde).encode("utf-8") if govde is not None else None,
                                   headers={"x-goog-api-key": anahtar, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(istek, timeout=300) as r:
            veri = r.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:600]}")
    return veri if ham else json.loads(veri)

def wav(pcm, hiz=24000):
    return (b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, hiz, hiz * 2, 2, 16)
            + b"data" + struct.pack("<I", len(pcm)) + pcm)

def istem(stil, metin):
    return f"### DIRECTOR'S NOTES\n{stil}\n\n#### TRANSCRIPT\n{metin}"

def gonder(oyun):
    SESLER = json.load(open(oyun / "sesler.json", encoding="utf-8"))
    satirlar = json.load(open(oyun / "ses" / "replikler.json", encoding="utf-8"))
    eksik = [l for l in satirlar if not (oyun / "ses" / f"{l['id']}.wav").exists()]
    if "--en-cok" in sys.argv:
        eksik = eksik[:int(sys.argv[sys.argv.index("--en-cok") + 1])]
    if not eksik:
        print("eksik replik yok"); return
    istekler = []
    for l in eksik:
        ses, stil = SESLER[l["voice"]]
        istekler.append({"request": {"contents": [{"parts": [{"text": istem(stil, l["text"])}]}],
                                     "generationConfig": {"responseModalities": ["AUDIO"],
                                                          "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": ses}}}}},
                         "metadata": {"key": l["id"]}})
    y = cagir(f"{KOK}/models/{MODEL}:batchGenerateContent",
              {"batch": {"display_name": f"ses-{oyun.name}", "input_config": {"requests": {"requests": istekler}}}})
    json.dump({"ad": y.get("name"), "idler": [l["id"] for l in eksik]}, open(oyun / "ses" / "_toplu.json", "w", encoding="utf-8"))
    print(f"toplu iş açıldı: {len(eksik)} replik, ad: {y.get('name')}")

def bul(o, ad):
    if isinstance(o, dict):
        if ad in o:
            return o[ad]
        for v in o.values():
            r = bul(v, ad)
            if r is not None:
                return r
    if isinstance(o, list):
        for v in o:
            r = bul(v, ad)
            if r is not None:
                return r
    return None

def al(oyun):
    kayit = json.load(open(oyun / "ses" / "_toplu.json", encoding="utf-8"))
    y = cagir(f"{KOK}/{kayit['ad']}")
    durum = bul(y, "state")
    print("durum:", durum)
    if durum != "JOB_STATE_SUCCEEDED" and durum != "BATCH_STATE_SUCCEEDED":
        if durum and ("FAILED" in durum or "CANCEL" in durum or "EXPIRED" in durum):
            print(json.dumps(y, ensure_ascii=False)[:800])
        return
    yanitlar = bul(y, "inlinedResponses")
    if isinstance(yanitlar, dict):
        yanitlar = yanitlar.get("inlinedResponses", [])
    if yanitlar is None:
        dosya = bul(y, "responsesFile")
        ham = cagir(f"https://generativelanguage.googleapis.com/download/v1beta/{dosya}:download?alt=media", ham=True)
        yanitlar = [json.loads(s) for s in ham.decode("utf-8").splitlines() if s.strip()]
    ok = hata = 0; sure = 0.0
    for i, yn in enumerate(yanitlar):
        kimlik = (yn.get("metadata") or {}).get("key") or yn.get("key") or kayit["idler"][i]
        veri = bul(yn.get("response") or {}, "data")
        if not veri:
            hata += 1; print("HATA", kimlik, json.dumps(yn.get("error") or yn, ensure_ascii=False)[:200]); continue
        pcm = base64.b64decode(veri)
        (oyun / "ses" / f"{kimlik}.wav").write_bytes(pcm if pcm[:4] == b"RIFF" else wav(pcm))
        ok += 1; sure += len(pcm) / 48000
    print(f"yazıldı: {ok}, hata: {hata}, {sure / 60:.1f} dk ses")

oyun = pathlib.Path(sys.argv[2]).resolve()
{"gonder": gonder, "al": al}[sys.argv[1]](oyun)
