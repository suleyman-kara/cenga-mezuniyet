/* Salon Yarışması · SORULAR — etkinlik için yalnızca bu dosyayı düzenleyin.
 *
 * Her soru:
 *   soru:       ekranda ve telefonda görünen metin (en çok 140 karakter; kısa olsun, arkadan okunsun)
 *   secenekler: 2–4 seçenek (her biri en çok 60 karakter). Telefondaki 1-2-3-4 düğmeleri bu sırayla.
 *   dogru:      doğru seçeneğin SIRASI, 0'dan başlar (0 = ilk seçenek). Yazmazsanız soru ANKET olur: puan yok,
 *               "salon böyle düşünüyor" gösterilir.
 *   sure:       (isteğe bağlı) saniye, 5–120. Yazmazsanız ayarlar.sure.
 *   aciklama:   (isteğe bağlı) cevap açıklanınca altta çıkan kısa not.
 *   etiket:     (isteğe bağlı) soru başlığının yanındaki küçük etiket (ör. "Isınma", "Zor").
 *
 * Sayfa açılırken dosya denetlenir; hata varsa projektörde hangi soruda ne olduğu yazar.
 * Denetim komut satırından da: node --test site/test/puan.test.mjs
 */
window.YARISMA = {
  baslik: 'Salon Yarışması',
  altBaslik: 'CENGA · Bilgisayar Mühendisliği Kulübü',

  ayarlar: {
    sure: 20,            // varsayılan soru süresi (sn)
    tablo: true,         // her puanlı sorudan sonra sıralama ekranı
    canliCubuk: true,    // soru açıkken oy çubukları canlı dolsun (false: yalnızca "kaç kişi cevapladı")
    taban: 500,          // doğru cevabın en düşük puanı (süre bitmek üzereyken)
    tavan: 1000,         // doğru cevabın en yüksek puanı (anında cevap)
    otoBekleme: 7,       // O ile otomatik akış açıkken ekranlar arası bekleme (sn)
  },

  sorular: [
    {
      etiket: 'Isınma',
      soru: 'Hangisi gerçek bir HTTP durum kodu?',
      secenekler: ['418 Ben bir çaydanlığım', '420 Sakin ol', '299 Neredeyse oldu', '600 Sunucu tatilde'],
      dogru: 0,
      aciklama: '418 I\'m a teapot — 1998 tarihli bir 1 Nisan RFC\'si (RFC 2324).',
    },
    {
      soru: 'İkili sistemde 1010 sayısı onluk sistemde kaçtır?',
      secenekler: ['8', '10', '12', '1010'],
      dogru: 1,
      sure: 15,
    },
    {
      soru: 'İlk "bilgisayar böceği (bug)" aslında neydi?',
      secenekler: ['Röleye sıkışmış bir güve', 'Bir hamamböceği', 'Bir yazım hatası', 'Kablo kemiren fare'],
      dogru: 0,
      aciklama: '1947, Harvard Mark II: güve kayıt defterine bantlandı.',
    },
    {
      soru: 'Son commit mesajını düzeltmenin yolu hangisi?',
      secenekler: ['git commit --amend', 'git oops', 'git blame', 'git push --dua'],
      dogru: 0,
    },
    {
      etiket: 'Anket',
      soru: 'Sınav haftası gece 03.00\'te seni ne ayakta tutar?',
      secenekler: ['Çay', 'Kahve', 'Enerji içeceği', 'Saf panik'],
    },
    {
      soru: 'Sıralı bir dizide ikili arama (binary search) kaç adımda biter?',
      secenekler: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      dogru: 1,
    },
    {
      soru: 'Python\'da len("CENGA") ne döndürür?',
      secenekler: ['4', '5', '6', 'Hata verir'],
      dogru: 1,
      sure: 15,
    },
    {
      etiket: 'Final',
      soru: 'Hangisi JVM üzerinde ÇALIŞMAZ?',
      secenekler: ['Kotlin', 'Scala', 'JavaScript', 'Groovy'],
      dogru: 2,
      aciklama: 'JavaScript\'in Java ile tek ortak noktası isminin ilk dört harfi.',
    },
  ],
};
