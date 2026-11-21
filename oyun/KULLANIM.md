# Mezuniyet.exe Yanıt Vermiyor — sunum notu

## Başlatma
1. Chrome/Edge'de **https://cenga-mezuniyet.pages.dev/oyun/** adresini aç.
   - **Önceden bir kez** (etkinlikten önceki gün/sabah, iyi internette) sunum dizüstünde aç ve sağ altta
     **"✓ Çevrimdışı oynamaya hazır"** yazısını bekle (ilk seferde ~57 MB ses iner: "Çevrimdışı için hazırlanıyor… %42 (65/154)").
     Bundan sonra oyun ve sesler internetsiz de açılır (sağ altta "Çevrimdışı · önbellekten"); internet yalnız **canlı oylama** için gerekir.
   - Aynı tarayıcı ve aynı profil kullanılmalı; gizli pencere önbellek tutmaz. Tarayıcı verilerini temizleme.
   - Repoda yeni sürüm yayınlanınca açılışta yalnız değişen dosyalar iner; "Güncelleme indirildi — sayfayı yenileyince geçerli"
     yazısı çıkar. Açık sayfa kendiliğinden yenilenmez (sunum bölünmez); yeni sürüm sonraki açılışta geçerli olur.
   - `?sw=0` önbelleği devre dışı bırakır (sorun ayıklama). Diğer parametreler aynen çalışır: `.../oyun/?sahte=1`, `?test=1`.
   - Yedek yol: `baslat.bat`'a çift tıkla (yerel sunucu; siyah pencere açık kalmalı). Python yoksa bu klasörde `npx serve -l 8765`.
     Dosyaya çift tıklayarak açma: canlı oylama çalışmaz.
   - Kurulum notu: Firebase Console > Authentication > Settings > Authorized domains listesinde `cenga-mezuniyet.pages.dev`
     olmalı (oy sayfası /v/ orada çalıştığına göre büyük olasılıkla zaten ekli).
2. Oyun açılır. Sol altta **"● Canlı oylama hazır · oturum xxxxxx"** yazısını gör.
   "Çevrimdışı" yazıyorsa internet/Wi-Fi'ı kontrol et, sayfayı yenile (F5).
3. **F** ile tam ekran, sonra boşluk ya da tıklama: oyun başlar ve kendi kendine akar.

## Oylama
- Karar anında ekranda gerçek QR çıkar (cenga-mezuniyet.pages.dev/v/?s=...). Herkes telefonla okutur, 30 sn içinde oy verir; süre bitene kadar oyunu değiştirebilir.
- Sayfa yenilenirse (F5) ya da tarayıcı çökerse **aynı oturum ve aynı QR** sürdürülür (12 saat içinde); telefonların yeniden okutması gerekmez. Sol altta "● Oturum sürdürüldü (aynı QR)" yazar. Açık bir oylama varsa telefonlar "sıradaki karar" ekranına döner; karara dönünce oylama yeniden açılır.
- Tamamen yeni oturum (yeni QR) istersen: adresin sonuna `?yeni=1` ekle (ör. `http://localhost:8765/index.html?yeni=1`). Prova bittikten sonra, etkinlikten önce bir kez böyle açmak iyi olur.
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
| R | baştan başla (kayıtlı ilerleme de silinir) |
| P | duraklat / devam (ses, müzik, yazı, montaj ve oylama sayacı durur; telefonlardaki oylama da durur) |
| K | o anki ekranın kaydını başlat (köşede ● KAYIT); tekrar K: durdur ve dosyayı indir (mezuniyet-kesit-SSDDss) |
| U | telefon kumandası QR'ını göster/gizle (eşleşince kendiliğinden kapanır) |
| Shift+U | kumandayı sıfırla: yeni QR, eski telefonun bağlantısı kesilir |
| Enter / N | açılıştaki "Kaldığın yerden devam?" sorusu: Enter devam, N baştan |

Dikkat: oylama sırasında ekrana tıklamak oylamayı erken bitirir.

## Kaldığın yerden devam
- Oyun her adımda nerede kaldığını (seçilen kararlar + adım) tarayıcıya kaydeder.
- Sayfa yenilenir ya da çökerse başlık ekranında **"Kaldığın yerden devam? Enter: devam · N: baştan"** çıkar. Enter: o adıma atlar (bir kararda kaldıysan oylama yeniden açılır). N: baştan başlar ve kaydı siler.
- R tuşu da kaydı siler. `?test=1`, `?yol=`, `?vitrin=1` kipleri kayıt tutmaz.

## Telefon kumandası (sunucu için)
1. **Projektör ekranı salona göstermeden önce** (ya da en başta) dizüstünde **U**'ya bas; köşede kumanda QR'ı çıkar.
2. Kendi telefonunla okut. Telefon bağlanınca ekranda "✓ Kumanda bağlandı" yazar ve QR kendiliğinden kaybolur.
3. Telefonda: büyük **İleri ▶**, **◀ Geri**, **⏸ Duraklat / ▶ Devam**, **Ses**, **Oto**; oylama sırasında seçeneklerin canlı sayıları, kalan süre, **Bunu kazandır** (1–4 tuşları gibi) ve **Oylamayı bitir**. Üstte o anki replik ve kimin konuştuğu, adım sayacı görünür.
- Kumanda **bir kerelik eşleşir**: ilk okutan telefon sahibi olur, sonra kimse (QR'ı salondan okutan biri dahil) kullanamaz; başka telefon "Bu kumanda başka bir telefona bağlı" görür.
- QR yanlışlıkla salona göründüyse ya da telefon değiştireceksen: **Shift+U** → yeni QR, eski telefon düşer.
- Sayfa yenilenirse (F5) eşleşmiş telefon bağlı kalır.
- Telefon tarayıcıda sesi açamaz: oyunu başlatırken dizüstünde bir kez bir tuşa bas (ör. F ile tam ekran).
- Duraklatılmışken İleri/Geri/Oto/Kazandır klavyedeki gibi yok sayılır; önce ▶ Devam.
- Kumanda yalnızca canlı bağlantıda çalışır (sahte/çevrimdışı kipte U yalnızca uyarı gösterir).

## B planları
- İnternet yok: oyun "çevrimdışı" kipte akar; kararlar kurayla ya da senin 1–4 seçiminle.
- Prova / sahte oylar: `https://cenga-mezuniyet.pages.dev/oyun/?sahte=1` (yerelde: `http://localhost:8765/index.html?sahte=1`)
- Test: `?test=1` (bütün yolları dener), `?vitrin=1` (bütün sahneler).
- Paylaşım için tek kişilik demo: `?demo=1` (Firebase yok, QR yok; seçeneğe tıklanır, sayaç 45 sn). İletişim/repo bağlantısı: `index.html` içinde `DEMO_BAGLANTI`.

## Prova kontrol listesi (sabah)
- [ ] Projektör + ses çıkışı
- [ ] "Canlı oylama hazır" yazısı (sol alt) ve "✓ Çevrimdışı oynamaya hazır" (sağ alt)
- [ ] 2-3 telefonla ilk kararda oy verip sonucun ekrana düştüğünü gör
- [ ] Salon Wi-Fi'ında telefonlar pages.dev'e girebiliyor mu
