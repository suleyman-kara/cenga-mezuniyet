# Mezuniyet.exe Yanıt Vermiyor — sunum notu

## Başlatma
1. `baslat.bat`'a çift tıkla. Siyah pencere (yerel sunucu) açık kalmalı, kapatma.
   (Python yoksa: bu klasörde `npx serve -l 8765` de olur. Dosyaya çift tıklayarak açma: canlı oylama çalışmaz.)
2. Tarayıcıda oyun açılır. Sol altta **"● Canlı oylama hazır · oturum xxxxxx"** yazısını gör.
   "Çevrimdışı" yazıyorsa internet/Wi-Fi'ı kontrol et, sayfayı yenile (F5).
3. **F** ile tam ekran, sonra boşluk ya da tıklama: oyun başlar ve kendi kendine akar.

## Oylama
- Karar anında ekranda gerçek QR çıkar (cenga-mezuniyet.pages.dev/v/?s=...). Herkes telefonla okutur, 30 sn içinde oy verir; süre bitene kadar oyunu değiştirebilir.
- Sayfa yenilenirse oturum ve QR değişir; telefonlar yeni QR'ı okutmalı. Oyun boyunca sayfayı yenileme.
- Oy gelmezse ya da eşitlik olursa kazanan kurayla seçilir (ekranda yazar).

## Tuşlar
| Tuş | İş |
|---|---|
| Boşluk / → / tıklama | ileri; oylama sırasında: oylamayı hemen bitir |
| ← | geri |
| 1–4 | oylamada o seçeneği kazandır (1,5 sn sonra kapanır) |
| O | otomatik akışı aç/kapat (varsayılan açık) |
| M | sesi kapat/aç |
| F | tam ekran |
| R | baştan başla |
| K | ekran kaydı (video) |

Dikkat: oylama sırasında ekrana tıklamak oylamayı erken bitirir.

## B planları
- İnternet yok: oyun "çevrimdışı" kipte akar; kararlar kurayla ya da senin 1–4 seçiminle.
- Prova / sahte oylar: `http://localhost:8765/index.html?sahte=1`
- Test: `?test=1` (bütün yolları dener), `?vitrin=1` (bütün sahneler).

## Prova kontrol listesi (sabah)
- [ ] Projektör + ses çıkışı
- [ ] "Canlı oylama hazır" yazısı
- [ ] 2-3 telefonla ilk kararda oy verip sonucun ekrana düştüğünü gör
- [ ] Salon Wi-Fi'ında telefonlar pages.dev'e girebiliyor mu
