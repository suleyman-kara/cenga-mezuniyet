/* ---------- HİKÂYE ---------- */
// Mezuniyet.exe Yanıt Vermiyor · hikâye kodu (saf: DOM yok). Metin kaynağı: hikaye/replikler-taslak.md
// YAPIŞTIRMA NOTU: oyun/index.html'de A..S, VOICE, NDEC/NEND, hid/decVid/endVid ve yeni(c) zaten tanımlıysa
// "=== MOTOR ORTAK BLOK ===" ile "=== MOTOR ORTAK BLOK SONU ===" arasını ATLAYIN; motorunkiler geçerlidir.

/* === MOTOR ORTAK BLOK (sözleşme §1-§3 ile birebir; motorda varsa atlanır) === */
const A='ANLATICI',D='DENİZ',O='OZAN',B='BUSE',T='TOLGA',S='ASUMAN';
const VOICE={[A]:'anlatici',[D]:'deniz',[O]:'ozan',[B]:'buse',[T]:'tolga',[S]:'asuman'};
const NDEC=6,NEND=5;
const endVid=c=>'son'+hid(c.title);
const decVid=d=>'k'+hid([d.q].concat(d.o.map(o=>o[0])).join('|'));
function hid(s){let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return h.toString(36);}
function yeni(c){
 const s=[], st={g:0,c:0,y:0,durum:0}; let id=0,no=0,pend=null,P=0;
 const K={bg:'yokus',v:'',sakal:0};
 const b=o=>{
  if(o.bg!==undefined&&o.bg!==K.bg&&o.v===undefined) K.v='';
  for(const k in K) if(o[k]!==undefined) K[k]=o[k];
  const x=Object.assign({k:'beat'},o,K,{sayac:{g:st.g,c:st.c,y:st.y,durum:st.durum},perde:P}); // NOT: sözleşmedeki g,c,y alanları kadro 'c' ile çakışır; sayaçlar 'sayac' altında
  if(pend){ x.d0=pend; pend=null; }
  s.push(x);
 };
 const Dk=(q,o)=>{ s.push({k:'dec',id,no:++no,d:{q,o}}); return c[id++]; };
 const N=(q,o)=>{ s.push({k:'dec',id,nabiz:1,d:{q,o}}); return c[id++]; };
 const M=(mid,frames)=>s.push({k:'montage',id:mid,frames});
 const perde=(n,title,sub,sty)=>{ P=n; s.push({k:'card',type:'act',n,title,sub,sty}); };
 const art=(g,cc,y)=>{ st.g+=g; st.c+=cc; st.y+=y; pend=[g,cc,y]; };
 const sifir=()=>{ pend=[0,0,0]; };
 const son=(n,title,moral)=>s.push({k:'card',type:'end',n,title,moral,tone:'s'+n});
 const final=(title,sub)=>s.push({k:'card',type:'final',title:title||'Mezuniyet.exe yanıt veriyor.',sub:sub||''});
 return {s,b,D:Dk,N,M,perde,art,sifir,son,final,st};
}
/* === MOTOR ORTAK BLOK SONU === */

// ---- Ayarlanabilir kararlar (kullanıcı değiştirebilir) ----
const BASLIK='Mezuniyet.exe Yanıt Vermiyor';
const S1_CEVRE=5, S1_GORUNUR=3;        // S1 Referans Kapısı: Ç ≥ 5 ve G ≥ 3 (Y şartı yok)
const G_ESIK=3, Y_ESIK=5;              // S2/S3 görünürlük, S3/S4 yetkinlik eşiği
const S4_G_MAX=2, S4_C_MAX=3;          // S4: görünmez ve tanınmaz
const FINAL_ALT='Bu salondan, henüz adını bilmediğin biriyle tanışmadan çıkma.';

// Son seçimi (öncelik sırası; ilk tutan kazanır). incil §3 / son_dagilimi.py ile aynı.
function sonSec(x){
 if(x.c>=S1_CEVRE&&x.g>=S1_GORUNUR) return 1;
 if(x.durum&&x.g>=G_ESIK) return 2;
 if(x.y>=Y_ESIK&&x.g>=G_ESIK) return 3;
 if(x.y>=Y_ESIK&&x.g<=S4_G_MAX&&x.c<=S4_C_MAX) return 4;
 return 5;
}

// Sık kullanılan paneller
const ILAN=o=>Object.assign({type:'ilan',id:'ilan',sirket:'YILDIZLAR HOLDING',baslik:'Junior Yazılım Geliştirici',satirlar:['En az 5 yıl deneyim','Java, Go, Rust, Kubernetes','COBOL tercih sebebi'],maas:'Rekabetçi'},o);
const OZAN_GH={type:'github',id:'ozgh',kul:'ozan-k',isim:'Ozan K.',takipci:0,bio:'',avatar:'gri',yogun:1};
const ASU_LI={type:'linkedin',id:'asuli',ad:'Asuman Yıldız',baslik:'Chief Innovation Intern @ Yıldızlar Holding',alt:'"Kendi yolumu kendim çiziyorum"',foto:'asuman',baglanti:'500+'};
const SELIN=[['Selin','İK','Kuzey Yazılım']];
const pan=(a,bb)=>[['deniz',a||260,'look'],['buse',bb||1660,'look']];

function build(c){
 const H=yeni(c), {s,b,D:K,N,M,perde,art,sifir,son,final}=H;
 s.push({k:'card',type:'title',title:BASLIK});

 // ---------- M0 · açılış montajı ----------
 M('M0',[
  {ms:3000,bg:'oda',c:[],panel:{type:'pencere',id:'win',baslik:'Mezuniyet.exe',metin:'Mezuniyet.exe yanıt vermiyor.'},fx:'p:bekle'},
  {ms:3800,bg:'oda',c:[['deniz',1500,'cheer:happy']],panel:{type:'kod',id:'k',satirlar:['$ ./merhaba','Hello, World!'],tur:'ok'},cap:'1. SINIF',alt:'Her şey çalışıyor.'},
  {ms:3800,bg:'oda',v:'gece',c:[['deniz',1500,'shock:shock']],panel:{type:'kod',id:'k',satirlar:['$ ./odev2','Segmentation fault (core dumped)'],tur:'hata'},cap:'2. SINIF',alt:'Hiçbir şey çalışmıyor. Kahve de döküldü.',fx:'shake'},
  {ms:4400,bg:'yokus',c:[['deniz',960,'tired:tired']],panel:{type:'hava',id:'hava',yer:'Balcalı',t:'41°C',his:'hissedilen 47',durum:'güneşli'},cap:'3. SINIF',alt:'Yokuş aynı yokuş.',fx:'sweat'}
 ]);

 // ================= PERDE 1 =================
 perde(1,'3. SINIF','Staj zorunludur. Ücret: —','yonetmelik');
 b({who:A,bg:'yokus',yer:'Balcalı Yerleşkesi · 41°C',c:[['deniz',1300,'tired','inL']],panel:{type:'hava',id:'hava',yer:'Balcalı',t:'41°C',his:'hissedilen 47',durum:'güneşli',x:160,y:160},fx:'sweat',cue:[[.5,'deniz','sip'],[.85,'deniz','worry']],text:'Çukurova, haziran. Bilgisayar mühendisliği üçüncü sınıf öğrencisi Deniz, yokuşu çıkarken staj yeri arıyor. Yokuş da onu arıyor.'});
 b({who:D,bg:'koridor',c:[['deniz',960,'present']],panel:{type:'defter',id:'defter',baslik:'STAJ DEFTERİ',satirlar:['40 iş günü','Defter · İmza · Kaşe','Kabul eden kurum: ______'],imza:''},cue:[[.15,'deniz','present'],[.55,'deniz','shrug'],[.85,'deniz','facepalm']],text:'Staj zorunlu: kırk iş günü, defter, imza, kaşe. Bir de birinin beni kabul etmesi lazım. O kısım yönetmelikte yazmıyor.'});
 b({who:O,c:[['deniz',260,'look'],['ozan',1660,'laptop','inR']],panel:OZAN_GH,cue:[[.2,'fx','p:yesil'],[.6,'ozan','type'],[.9,'deniz','brow']],text:"Ben staja başvurmadım. Önce şu algoritmayı O(n log n)'e indireceğim. İyi iş kendini gösterir, değil mi?"});
 b({who:B,c:[['deniz',260,'look'],['buse',1660,'wave','inR']],panel:{type:'yaka',id:'yaka',kartlar:[['Buse','Katılımcı','Staj Fuarı'],['Buse','Gönüllü','Kariyer Zirvesi'],['Buse','Konuk','Teknoloji Buluşması']]},cue:[[.12,'buse','wave'],[.35,'buse','point'],[.6,'buse','sip'],[.88,'buse','brow']],text:"Deniz! Bu Selin Hanım, İK'dan. Bu kantinci Hüseyin Abi, oğlu yazılımcı. Hepsiyle staj fuarında tanıştım. Sen neredeydin?"});
 b({who:D,c:[['deniz',620,'shrug'],['buse',1300,'brow']],cue:[[.3,'deniz','present'],[.6,'deniz','heart'],[.85,'buse','facepalm']],text:'Fuar mı vardı? Ben o gün staj defterimin kapağını kaplıyordum. Şeffaf naylonla. Çok güzel oldu, gerçekten.'});
 b({who:T,c:[['deniz',260,'look'],['tolga',1660,'sip','inR']],panel:{type:'klasor',id:'klasor',baslik:'Tolga · Dosyalar',satirlar:[['CV','2 MB'],['caps','4,1 GB']],vurgu:1,catlak:1},cue:[[.2,'fx','p:sec:0'],[.55,'fx','p:sec:1'],[.6,'tolga','smug'],[.9,'deniz','brow']],text:'Abi benim CV klasörüm iki megabayt, caps klasörüm dört gigabayt. Hayatta öncelikler var abi.'});
 b({who:D,c:[['deniz',620,'smug'],['tolga',1300,'brow']],cue:[[.3,'deniz','present'],[.7,'deniz','shrug'],[.9,'tolga','clap']],text:'Benim de caps klasörüm var, ama adı "Staj Belgeleri". Annem açmasın diye. Annem açmıyor; staj belgesi de yok.'});
 b({who:A,bg:'holding',yer:'Yıldızlar Holding · Genel Merkez',c:[['asuman',1500,'look']],panel:ASU_LI,cue:[[.5,'asuman','sip'],[.85,'asuman','wave']],text:'Bu sırada Asuman da staj yerini bulmuştu. Daha doğrusu, staj yeri yirmi iki yıldır onu bekliyordu.'});
 b({who:S,c:[['asuman',960,'cheer:happy']],cue:[[.2,'asuman','wave'],[.5,'asuman','heart'],[.75,'asuman','present'],[.9,'asuman','shrug']],text:'İlk günüm! Kimse beni tanımıyordu. Sadece güvenlik "hoş geldiniz Asuman Hanım" dedi. Bir de genel müdür. Bir de herkes.'});
 b({who:A,bg:'koridor',yer:'Bilgisayar Mühendisliği · 2. kat',c:[['deniz',960,'think']],cue:[[.4,'deniz','look'],[.8,'deniz','worry']],text:"Deniz'in ise önünde üç kapı var. Hangisini çalacağına bu akşam salon karar verecek."});
 const k1=K('Deniz stajını nerede yapıyor?',[['Tanıdık torpili',"Babanın askerlik arkadaşının yeğeninin şirketi: Yıldızlar Holding."],['Ücretsiz startup','Maaş yok, vizyon var. Bir de armut koltuk.'],['Kendi projen','Patron sensin. Defteri imzalayacak kimse de yok.']]);
 if(k1===undefined) return s;
 if(k1===0){
  art(0,2,0);
  b({who:A,bg:'holding',yer:'Yıldızlar Holding · Bodrum kat',c:[['deniz',300,'look','inL']],panel:{type:'fotokopi',id:'foto',sayi:3412},cue:[[.4,'deniz','shrug'],[.8,'deniz','tired']],text:"Yıldızlar Holding, bodrum kat. Deniz'e bir masa verildi, bilgisayar verilmedi. Fotokopi makinesi zaten oradaydı."});
  b({who:D,bg:'cayocagi',c:[['deniz',960,'sip']],cue:[[.3,'deniz','tired'],[.55,'deniz','present'],[.85,'deniz','smug']],text:'Kırk gün fotokopi çektim. Ama çay ocağında herkes adımı biliyor; Sevgi Abla kimin kaç şekerli içtiğini bana devretti.'});
  b({who:S,bg:'holding',c:[['deniz',400,'look'],['asuman',1450,'sip']],cue:[[.2,'deniz','shock'],[.5,'asuman','think'],[.85,'asuman','heart'],[.9,'deniz','facepalm']],text:'Fotokopi mi? Ben hiç çekmedim. Herhalde sıra bana gelmedi. Çok öğretici olmuştur, değil mi?'});
 }else if(k1===1){
  art(0,1,2);
  b({who:D,bg:'startup',c:[['deniz',260,'laptop']],panel:{type:'jira',id:'jira',sprint:'Sprint 1/1',atanan:'Deniz',gorev:47,kolonlar:['Yapılacak','Yapılıyor','Prod düştü']},fx:'shake',cue:[[.3,'fx','p:ekle'],[.55,'deniz','shock'],[.6,'fx','p:ekle'],[.85,'deniz','shrug']],text:"Üçüncü gün production'a kod attım. Beşinci gün production'ı ben düşürdüm. Kimse kızmadı, çünkü kimse fark etmedi."});
  b({who:A,yer:'Loft ofis · 1 CTO, 1 armut koltuk',c:[['deniz',620,'sit']],cue:[[.5,'deniz','look'],[.85,'deniz','brow']],text:"Şirketin CTO'su onun adını öğrendi. CTO aynı zamanda kurucu, muhasebeci ve armut koltuğun tek sahibiydi."});
  b({who:D,c:[['deniz',260,'think']],panel:{type:'fis',id:'hisse',baslik:'MAAŞ BİLDİRİMİ',satirlar:[['Maaş','—'],['Hisse','binde 2'],['Şirket değeri','0 ₺']],toplam:'0 ₺'},cue:[[.3,'deniz','write'],[.65,'deniz','shrug'],[.9,'deniz','smug']],text:'Maaş yerine binde iki hisse verdiler. Şirketin değeri şu an sıfır. Binde ikisini hesapladım, yine sıfır çıktı. Tutarlı.'});
 }else{
  art(0,0,3);
  b({who:D,bg:'oda',v:'gece',c:[['deniz',260,'laptop']],panel:{type:'kod',id:'k1c',satirlar:['$ npm start','GölgePark çalışıyor ✓','(localhost)'],tur:'ok'},cue:[[.4,'deniz','cheer'],[.75,'deniz','shrug']],text:'Kendi projemi yazdım: kampüste gölgeli otopark bulan bir uygulama. Çalışıyor. Bende çalışıyor.'});
  b({who:A,c:[['deniz',960,'present']],cue:[[.25,'deniz','smug'],[.55,'deniz','point'],[.85,'deniz','wag']],text:"Kırk iş günü boyunca patron da oydu, stajyer de. Patron stajyerden çok memnundu. Stajyer zam istedi; patron \"bütçe yok\" dedi."});
  b({who:D,c:[['deniz',260,'think']],panel:{type:'defter',id:'defter',baslik:'STAJ DEFTERİ',satirlar:['Gün 40 · Kendi projem','İşyeri amiri imzası:'],imza:'______',not:'ben atarım? — annen'},cue:[[.5,'fx','p:not'],[.8,'deniz','facepalm']],text:"Staj defterini anneme imzalatmayı düşündüm. \"Ben atarım\" dedi. Kaşesi yok ama imzası okulda tanınıyor; on iki yıl karnemi o imzaladı."});
 }
 b({who:B,bg:'koridor',v:'',yer:'Eylül',c:[['deniz',260,'look'],['buse',1660,'present','inR']],panel:{type:'afis',id:'afis',baslik:'KARİYER SÖYLEŞİSİ',satirlar:['Cuma · 18.00','Konuk: Kuzey Yazılım'],alt:'sonunda pizza'},cue:[[.2,'buse','point'],[.6,'buse','wave'],[.9,'deniz','think']],text:'Cuma akşamı söyleşi var: bir şirketten mühendis gelecek, sonunda pizza. Gel, en kötü ihtimalle pizza yersin.'});
 const k2=K('Buse seni söyleşiye çağırıyor. Ne yapıyorsun?',[['Git, tanış','Konuşmacıya soru sor. Evet, sesli.'],['Seriyi bozma','Leetcode serisi 247 gün. Bu akşam 248 olacak.'],['Pizza gelince kaç','Etkinliğe değil, ikrama katılım.']]);
 if(k2===undefined) return s;
 if(k2===0){
  art(1,2,0);
  b({who:D,bg:'soylesi',c:[['deniz',260,'point']],panel:{type:'kartvizit',id:'kaan',ad:'Kaan Er',unvan:'Engineering Manager',sirket:'Kuzey Yazılım'},cue:[[.15,'deniz','worry'],[.4,'deniz','shrug'],[.75,'deniz','phone'],[.8,'fx','ding']],text:"Soru sordum. Sesim titredi, soru da biraz saçmaydı. Çıkışta adımı söyledim, akşam LinkedIn'den ekledim. İstek hâlâ beklemede."});
  b({who:B,c:[['deniz',620,'heart'],['buse',1300,'clap']],cue:[[.3,'buse','point'],[.7,'buse','smug'],[.9,'deniz','facepalm']],text:'Gördün mü? Saçma soru diye bir şey yok, hatırlanan soru var. Seninki çok hatırlanacak, inan bana.'});
  b({who:A,c:[['deniz',960,'phone']],panel:{type:'linkedin',id:'dli0',ad:'Kaan Er',baslik:'Engineering Manager · Kuzey Yazılım',alt:'Bağlantı isteği: Beklemede · 3 ay',foto:'gri'},cue:[[.8,'deniz','sad']],text:"Bağlantı isteği üç ay beklemede kaldı. Konuşmacı bir sonraki söyleşide o soruyu örnek verdi: \"Geçen sefer biri şunu sormuştu.\" Biri."});
 }else if(k2===1){
  art(0,0,1);
  b({who:D,bg:'oda',v:'gece',c:[['deniz',260,'laptop:tired']],panel:{type:'leetcode',id:'lc',gun:248,cozulen:612,zorluk:'Hard',durum:'Kabul edildi',alev:1},cue:[[.3,'deniz','cheer'],[.6,'deniz','phone'],[.85,'deniz','sad']],text:'İki yüz kırk sekizinci gün, Hard soru, kabul edildi. Kutlayacak kimse yoktu; herkes söyleşiden sonra konuşmacıyla yemeğe gitmişti.'});
  b({who:A,c:[['deniz',260,'phone:tired']],panel:{type:'insta',id:'insta',ad:'buse',metin:"Kaan Bey'e teşekkürler!",sahne:'soylesi'},cue:[[.6,'deniz','sad']],text:"Gecenin sonunda Deniz'in serisi iki yüz kırk sekiz gündü. Buse'nin rehberi iki kişi büyümüştü."});
  b({who:O,c:[['deniz',260,'phone:tired'],['ozan',1660,'laptop','inR']],cue:[[.3,'ozan','type'],[.85,'deniz','brow']],text:'İki yüz kırk sekiz mi? Benim serim altı yüz on gün. Söyleşiye ben de gitmedim. Gitmeyenler kulübüyüz, toplanmıyoruz.'});
 }else{
  art(0,1,0);
  b({who:D,bg:'soylesi',v:'pizza',c:[['deniz',620,'sip']],cue:[[.3,'deniz','look'],[.6,'deniz','shock'],[.85,'deniz','present']],text:'Son beş dakikaya girdim. Pizza kuyruğunda arkamdaki adam "sucuklu kaldı mı" dedi. Konuşmacıymış. Sucukluyu ona verdim.'});
  b({who:A,c:[['deniz',260,'look']],panel:{type:'kartvizit',id:'kaan',ad:'Kaan Er',unvan:'Engineering Manager',sirket:'Kuzey Yazılım',yagli:1},cue:[[.5,'deniz','heart']],text:'Konuşmacı ona kartını uzattı. Kartın üstünde bir yağ lekesi, altında bir telefon numarası vardı. İkisi de kalıcıydı.'});
  b({who:B,c:[['deniz',620,'sip'],['buse',1300,'shock','inR']],cue:[[.2,'buse','shock'],[.6,'buse','point'],[.9,'buse','smug']],text:'Konuşmacıyla pizza paylaşmışsın! Ben bir saat soru sordum, sen bir dilimle geçtin. Strateji değil ama işe yarıyor.'});
 }
 b({who:B,bg:'kahve',c:[['buse',700,'sip'],['deniz',1700,'look']],panel:{type:'yaka',id:'selin',kartlar:SELIN,x:1180,y:180},cue:[[.3,'buse','wave'],[.7,'buse','present']],text:'Bu makine hep şekerli veriyor, değil mi? Ben Buse, bilgisayar üçüncü sınıf. Siz de mi şekersiz seviyorsunuz?'});
 b({who:A,bg:'yokus',v:'aksam',yer:'Eylül sonu · 38°C',c:[['deniz',960,'tired']],panel:{type:'defter',id:'defter2',baslik:'STAJ DEFTERİ',satirlar:['1. gün: gözlem','2. gün: gözlem','…','40. gün: gözlem']},cue:[[.6,'deniz','sip']],text:"Yaz bitti. Deniz'in staj defterinde kırk iş günü vardı. Kırkının karşısında da aynı kelime yazıyordu: gözlem."});

 // ================= PERDE 2 =================
 perde(2,'4. SINIF','BITIRME-1 · Mezun ol · Öncelik: Yüksek · Atanan: Sen · Son tarih: Dün','jira');
 M('B21',[{ms:3200,bg:'lab',c:[],panel:{type:'lbildirim',id:'bnot',ad:'Buse',foto:'buse',metin:"Kuzey Yazılım'da gönüllü etkinlik asistanı olarak başladı. (Ücretsiz)",zaman:'şimdi'},fx:'ding'}]);
 b({who:A,bg:'lab',yer:'Bitirme Laboratuvarı · Ekim',c:[['deniz',420,'laptop'],['ozan',960,'laptop'],['tolga',1500,'sip']],cue:[[.5,'tolga','tired'],[.85,'deniz','think']],text:"Dördüncü sınıf. Herkes bitirme projesine bir isim buldu, bazıları logo da yaptı. Projeyi bulmak sonraya kaldı."});
 b({who:D,c:[['deniz',260,'present'],['ozan',1660,'laptop']],panel:{type:'dosya',id:'serin',ad:'SerinYol',alt:'gölgeden gölgeye en kısa rota · −2°C',ikon:'pdf'},cue:[[.2,'deniz','present'],[.7,'deniz','smug']],text:'Benimki SerinYol: kampüste gölgeden gölgeye en kısa rotayı buluyor. Balcalı yokuşunu iki derece serin çıkıyorsunuz.'});
 b({who:O,c:[['deniz',620,'look'],['ozan',1300,'laptop']],cue:[[.3,'ozan','type'],[.85,'ozan','calm'],[.9,'deniz','brow']],text:'Ben bir derleyici yazdım, kendi dilim için. Dilin adı yok, dokümantasyonu yok, kullanıcısı yok. Ama çok hızlı.'});
 b({who:T,c:[['deniz',620,'look'],['tolga',1300,'present']],panel:{type:'dosya',id:'rapor',ad:'Bitirme_Raporu_SON_son2.pdf',alt:'İçindekiler: otomatik ✓',ikon:'pdf',x:1180,y:160},cue:[[.3,'tolga','sip'],[.75,'tolga','smug']],text:"Ben raporu yazdım abi. Proje henüz yok ama rapor çok güzel; içindekiler tablosu otomatik, kaynakça da hazır."});
 b({who:S,bg:'holding',c:[['asuman',1660,'present']],panel:{type:'dosya',id:'asupp',ad:'Yıldızlar Holding Dijital Dönüşüm Stratejisi.pptx',alt:'112 slayt · Saha desteği: Yıldızlar Holding',ikon:'pptx'},cue:[[.25,'asuman','cheer'],[.5,'asuman','clap'],[.85,'asuman','heart']],text:"Projemi şirketteki herkese sundum, hepsi ayakta alkışladı! Sonra öğrendim, toplantı odasında sandalye yokmuş. Yine de çok duygusaldı."});
 b({who:A,bg:'lab',c:[['deniz',960,'laptop']],cue:[[.6,'deniz','think']],text:"SerinYol hazır. Şu an varlığından haberi olan üç kişi var: Deniz, danışman hocası ve pek emin olmayan bir asistan."});
 const k3=K('SerinYol dünyaya nasıl çıkıyor?',[['Demo videoyla paylaş','Doksan saniyelik video. Arkada epik müzik, önde Balcalı yokuşu.'],["Sessizce GitHub'a koy",'README dosyası: "TODO: README yaz."'],["Hackathon'a götür",'48 saat, sınırsız enerji içeceği, sıfır uyku.']]);
 if(k3===undefined) return s;
 if(k3===0){
  art(2,0,1);
  b({who:D,bg:'oda',v:'',c:[['deniz',260,'phone']],panel:{type:'lgonderi',id:'serinli',ad:'Deniz',foto:'cuppe',unvan:'Öğrenci',metin:"SerinYol'u tanıtmaktan mutluluk duyuyorum! ▶ 1:30",begeni:214,yorumlar:[['Halam','Maşallah'],['İK Uzmanı · Akdeniz Teknoloji','Tebrikler!']]},cue:[[.25,'deniz','worry'],[.55,'fx','p:yorum'],[.6,'fx','ding'],[.8,'fx','p:yorum'],[.85,'deniz','shock']],text:'Paylaşımı yaptım, telefonu ters çevirdim. Yarım saat sonra baktım: halam beğenmiş, bir de bir İK uzmanı. Ona mesaj attım. Görüldü.'});
  b({who:A,bg:'lab',c:[['ozan',1660,'laptop']],panel:Object.assign({},OZAN_GH,{commit:42}),cue:[[.3,'fx','p:yesil']],text:"Aynı gün Ozan kırk iki commit attı. Profili yemyeşil oldu. O yeşili gören tek kişi yine Ozan'dı."});
  b({who:B,bg:'kahve',c:[['buse',960,'phone']],cue:[[.2,'buse','wave'],[.6,'buse','present'],[.9,'buse','smug']],text:'Videonu ben de paylaştım! İki yüz on dört beğeninin otuzu benim çevremden. Merak etme, sana fatura etmeyeceğim.'});
 }else if(k3===1){
  art(0,0,2);
  b({who:D,bg:'oda',v:'gece',c:[['deniz',260,'laptop']],panel:{type:'repo',id:'repo',ad:'serinyol',yildiz:1,fork:0,readme:'TODO: README yaz.'},cue:[[.3,'deniz','cheer'],[.55,'deniz','brow'],[.8,'fx','p:dus'],[.85,'deniz','sad']],text:'Kodu GitHub\'a koydum. Bir yıldız geldi. Profiline baktım, bot. Ertesi gün bot da yıldızı geri aldı.'});
  b({who:O,bg:'lab',c:[['deniz',620,'sad'],['ozan',1300,'laptop']],cue:[[.3,'ozan','calm'],[.7,'ozan','type'],[.9,'deniz','facepalm']],text:'README yazmamışsın. Ben de yazmadım. Kodu okuyan anlar. Şimdiye kadar okuyan çıkmadı ama anlardı.'});
  b({who:D,bg:'oda',v:'gece',c:[['deniz',260,'laptop']],panel:{type:'repo',id:'repo',ad:'serinyol',yildiz:0,fork:0,readme:'Kurulum için bana yazın.'},cue:[[.3,'deniz','type'],[.85,'deniz','shrug']],text:'README\'ye sonunda bir satır yazdım: "Kurulum için bana yazın." Kimse yazmadı. Demek ki herkes kurabiliyor.'});
 }else{
  art(1,1,1);
  b({who:D,bg:'hackathon',yer:'Hackathon · 04.00 · 3. enerji içeceği',c:[['deniz',260,'tired']],panel:{type:'yaka',id:'juri',kartlar:[['Jüri','CTO','Lezzet Teknoloji']]},cue:[[.15,'deniz','cheer'],[.35,'deniz','panic'],[.75,'deniz','present']],text:'Sabah dörtte demo çalıştı. Jüri önünde çalışmadı. Jürideki CTO "bizde de hiç çalışmaz" dedi ve kartını verdi.'});
  b({who:T,c:[['deniz',620,'tired'],['tolga',1300,'sip']],cue:[[.3,'tolga','present'],[.6,'tolga','sip'],[.85,'tolga','cheer']],text:'Ben hackathona yemek için gelmiştim abi. Kırk sekiz saatte on bir pizza. Bizim takım birinci oldu; yemekte.'});
  b({who:A,c:[['deniz',260,'tired']],panel:{type:'yaka',id:'juri',kartlar:[['Jüri','CTO','Lezzet Teknoloji']]},cue:[[.6,'deniz','heart']],text:'Jürideki CTO, Deniz\'in numarasını telefonuna kaydetti: "Deniz, hackathon, çalışmayan demo". Rehberinde dört yüz kişi daha vardı.'});
 }
 b({who:O,bg:'kariyer',yer:'Kariyer Günü · Kongre Merkezi',c:[['ozan',260,'laptop'],['asuman',1200,'selfie']],panel:ILAN({id:'rollup',rollup:1,x:1400,y:140}),cue:[[.3,'ozan','present'],[.7,'ozan','calm']],text:'Bir stant "kendinden bahset" dedi. GitHub linkimi söyledim. Harf harf. Sonra "biz sizi ararız" dediler. Numaramı sormadılar.'});
 b({who:B,c:[['buse',620,'wave'],['tolga',1300,'sip']],cue:[[.2,'buse','wave'],[.5,'buse','present'],[.85,'buse','smug']],text:'Ben bugün otuz kişiyle tanıştım. Sırrı basit: ikinci kez gidiyorum. İkinci kez gidince insanlar seni hatırladıklarını sanıyor.'});
 b({who:T,c:[['buse',620,'look'],['tolga',1300,'present']],cue:[[.2,'fx','bubble:9 KALEM:1300:200'],[.5,'tolga','cheer'],[.85,'tolga','smug']],text:'Dokuz kalem, üç termos, bir stres topu. Kariyer günü benim için verimli geçti abi. Mezun olunca kalem almayacağım.'});
 b({who:S,c:[['asuman',1660,'selfie']],panel:ILAN({id:'rollup',rollup:1}),cue:[[.2,'asuman','wave'],[.55,'asuman','present'],[.9,'asuman','heart']],text:'Standımızda junior alıyoruz! En az beş yıl deneyim. Bence çok makul; ben de beş yıldır şirkette stajyerim. Yaz tatillerinde.'});
 b({who:D,c:[['deniz',260,'think']],panel:ILAN({id:'rollup',rollup:1}),cue:[[.25,'fx','p:maas'],[.45,'deniz','write'],[.85,'deniz','point']],text:"Dört yılda bitirirsem bir yıl eksik kalıyor. Demek ki bu ilan bize değil. Okulu uzatan arkadaşlar, sonunda sizin devriniz geldi."});
 b({who:A,bg:'oda',v:'gece',yer:'LinkedIn · Doğal yaşam alanı',c:[['deniz',960,'phone']],cue:[[.6,'deniz','tired']],text:"LinkedIn. Türkiye'nin en kalabalık motivasyon konuşması. Herkes konuşuyor, kimse dinlemiyor, herkes beğeniyor."});
 M('M1',[{ms:24000,bg:'oda',v:'gece',c:[],panel:{type:'akis',id:'akis',sure:24000,gonderiler:[
  {ad:'Emre T.',foto:'gri',unvan:'Stajyer',metin:'Bugün stajımda bana çay ikram edildi. Bu bana liderlik hakkında 7 ders öğretti.',begeni:842},
  {ad:'Cem A.',foto:'gri',unvan:'Passionate | Visionary | AI Enthusiast | Öğrenci',metin:'Yeni bir yolculuğa başlıyorum.',begeni:96},
  {ad:'Kerem B.',foto:'gri',unvan:'Serial Entrepreneur · 3. sınıf',metin:"3. sınıfta 4 şirket kurdum. 4'ü de kapandı. İşte öğrendiklerim:",begeni:1530},
  {ad:'Zehra K.',foto:'gri',unvan:'Yazılım Mühendisi Adayı',metin:"Leetcode'da 1.000. soru! Kimse bana inanmadı (kimseye söylemedim).",begeni:311},
  {ad:'#OpenToWork',foto:'gri',unvan:'6 profil',metin:'Yeni fırsatlara açığım.',yesil:1,begeni:12},
  {ad:'İK Uzmanı',foto:'gri',unvan:'Talent Acquisition',metin:'Yorumlara CV bırakın, inceleyeceğim. · 4.812 yorum',begeni:2209},
  {ad:'Asuman Yıldız',foto:'asuman',unvan:'Chief Innovation Intern @ Yıldızlar Holding',metin:'Bitirme projemi Yıldızlar Holding yönetim kuruluna sundum. Kendi yolumu kendim çizdim.',begeni:1200},
  {ad:'Ozan K.',foto:'gri',unvan:'—',metin:'0 bağlantı',begeni:0,flas:1}
 ]}}]);
b({who:T,bg:'oda',v:'gece',c:[['tolga',1660,'phone']],cue:[[.3,'tolga','sip'],[.8,'tolga','smug']],text:"Abi ben LinkedIn'e caps atıyorum. En çok İK'cılar beğeniyor. CV atınca beğenmiyorlar ama; caps atınca beğeniyorlar."});
 b({who:D,c:[['deniz',260,'facepalm']],panel:{type:'linkedin',id:'dli',ad:'Deniz',baslik:'',alt:'Çukurova Üniversitesi',foto:'cuppe',baglanti:38},cue:[[.3,'deniz','phone'],[.7,'deniz','facepalm']],text:'Herkes yeşil çerçeveyle dolaşıyor. Benim profilimde hâlâ lise mezuniyet fotoğrafım var. Cüppeli. Bıyıklı.'});
 b({who:B,bg:'koridor',v:'',c:[['deniz',620,'sad'],['buse',1300,'present']],cue:[[.3,'buse','point'],[.75,'buse','smug'],[.9,'deniz','brow']],text:'İnsanlar seninle tanışmadan önce profiline bakıyor. Profilin boşsa tanışmıyorlar. Ben öyle değilim tabii, ben herkesle tanışırım.'});
 const k4=K("Deniz'in profili nasıl olacak?",[['Düzgün profil','Gün ışığında fotoğraf, net başlık, ayda iki paylaşım.'],['Kod konuşsun','Profil boş, GitHub linki yeter. Ozan gibi.'],['Dürümlü fotoğraf','Elinde Adana dürüm, arkada 44 derecelik termometre. Samimi.']]);
 if(k4===undefined) return s;
 if(k4===0){
  art(2,0,0);
  b({who:D,bg:'oda',v:'',c:[['deniz',260,'laptop']],panel:{type:'linkedin',id:'dli',ad:'Deniz',baslik:'Mobil Geliştirici · SerinYol',alt:'Çukurova Üniversitesi',foto:'deniz',gor:[3,47],eski:{foto:'cuppe',baslik:''}},cue:[[.3,'deniz','type'],[.6,'deniz','worry'],[.85,'deniz','smug']],text:'Başlığa "Mobil geliştirici, SerinYol" yazdım. "Passionate" yazmadım. Kendimi tutmak çok zor oldu.'});
  b({who:A,c:[['deniz',260,'phone']],panel:{type:'linkedin',id:'dli',ad:'Deniz',baslik:'Mobil Geliştirici · SerinYol',alt:'Çukurova Üniversitesi',foto:'deniz',gor:[3,47]},cue:[[.1,'fx','p:say'],[.8,'deniz','brow']],text:'Profili bir haftada kırk yedi kişi görüntüledi. Üçü halasıydı; hala tek ama üç ayrı hesabı var.'});
 }else if(k4===1){
  art(0,0,1);
  b({who:D,bg:'oda',v:'',c:[['deniz',260,'laptop']],panel:{type:'linkedin',id:'dli',ad:'Deniz',baslik:'',alt:'github.com/deniz',foto:'gri',baglanti:12},cue:[[.3,'deniz','present'],[.85,'deniz','shrug']],text:"Profili boş bıraktım, sadece GitHub linki var. Kodum her şeyi anlatıyor. Linke tıklayan olursa anlatacak, söz verdi."});
  b({who:O,bg:'lab',c:[['deniz',620,'look'],['ozan',1300,'laptop']],cue:[[.3,'ozan','calm'],[.7,'ozan','type'],[.9,'deniz','worry']],text:'Doğru karar. Ben de öyle yaptım, iki yıldır bekliyorum. Ama doğru karar.'});
 }else{
  art(1,0,0); H.st.durum=1;
  b({who:D,bg:'oda',v:'',c:[['deniz',260,'phone']],panel:{type:'durum',id:'durum',gor:[3,31],not:'ikisi kebapçı'},fx:'sweat',cue:[[.25,'deniz','phone'],[.6,'deniz','shrug'],[.85,'deniz','sip']],text:'Fotoğrafı yükledim. Annem aradı: "Oğlum, İK bunu görünce aç olduğunu düşünür." Açtım zaten, o yüzden dürüm.'});
  b({who:T,c:[['deniz',260,'look'],['tolga',1660,'present','inR']],panel:{type:'durum',id:'durum',gor:[3,31],not:'ikisi kebapçı'},cue:[[.3,'tolga','smug'],[.7,'tolga','sip'],[.9,'deniz','facepalm']],text:'Abi o fotoğrafı ben çektim. Profesyonelim, caps arşivim dört gigabayt. Işık doğal, ter doğal, dürüm acılı.'});
 }

 // ================= PERDE 3 =================
 perde(3,'MEZUNİYET','Aranan: Junior. Deneyim: en az 5 yıl.','ilan');
 b({who:A,bg:'mezuniyet',yer:'Mezuniyet Töreni · Öğle · 43°C',c:[['deniz',620,'cheer'],['buse',1000,'clap'],['asuman',1400,'smug']],fx:'kep',cue:[[.3,'fx','kep'],[.7,'deniz','look']],text:'Mezuniyet. Kepler havaya atıldı. Üçü geri gelmedi; Çukurova rüzgârı kep sever.'});
 b({who:D,c:[['deniz',960,'shrug']],cue:[[.3,'deniz','present'],[.7,'deniz','shrug'],[.9,'deniz','sad']],text:'Rektör "artık hayata atılıyorsunuz" dedi. Nereye atıldığımızı söylemedi. Ben odama atıldım.'});
 b({who:O,c:[['ozan',960,'present']],cue:[[.3,'ozan','present'],[.6,'ozan','shrug'],[.9,'ozan','calm']],text:'Bölüm birincisi olarak kürsüye çıktım. Mikrofon kapalıydı. Konuşmamı bölümün sitesine koydular. Sayfa açılmıyor.'});
 b({who:S,c:[['asuman',960,'heart:happy']],cue:[[.2,'asuman','wave'],[.5,'asuman','present'],[.85,'asuman','heart']],text:'Mezuniyetime babam da geldi! Kürsüde konuşma yaptı. Aslında her yıl yapıyormuş ama bu yıl bana baktı.'});
 b({who:B,c:[['buse',960,'selfie']],cue:[[.3,'buse','selfie'],[.6,'buse','phone'],[.85,'buse','cheer']],text:'Kep atmadan önce yirmi üç kişiyle fotoğraf çektim, hepsini etiketledim. Kepim kayboldu ama rehberim kaldı.'});
 b({who:A,bg:'oda',v:'',c:[['deniz',260,'laptop']],panel:ILAN({}),cue:[[.5,'fx','p:maas'],[.8,'deniz','brow']],text:"Deniz ilk ilanı açtı. Teknolojiler, yan haklar, masa tenisi, meyve tabağı. Her şey yazıyordu. Bir şey hariç."});
 const n1=N('İlanda "Maaş: Rekabetçi" yazıyor. Sence rakam ne?',[['Asgari ücret','Rekabet, asgari ücretle.'],['Asgari artı yemek kartı','Rekabetçi olan yemek kartı.'],['Yazsalar başvururdum','Rakamsız sevgi olmaz.']]);
 if(n1===undefined) return s;
 b({who:O,bg:'oda',v:'gece',c:[['ozan',260,'laptop']],panel:{type:'tablo',id:'xls',dosya:'Basvuru_takip.xlsx',sutunlar:['#','Şirket','Durum'],satirlar:[['845','—','Değerlendirmeniz sonucunda…'],['846','—','Değerlendirmeniz sonucunda…'],['847','—','Değerlendirmeniz sonucunda…']],toplam:'847 satır'},cue:[[.2,'fx','p:kay'],[.85,'ozan','calm']],text:'Sekiz yüz kırk yedi başvuru. Hepsini Excel\'de takip ediyorum. Durum sütununda tek bir cümle var: "Değerlendirmeniz sonucunda".'});
 b({who:B,bg:'kahve',c:[['buse',1660,'phone']],panel:{type:'arama',id:'ara',ad:'Selin · Kuzey Yazılım İK',alt:'arıyor…'},cue:[[.2,'fx','ding'],[.5,'buse','shrug'],[.85,'buse','sip']],text:"Kuzey'e üç kez başvurdum, üçünde de otomatik ret. Dördüncüde Selin Hanım'a yazdım. Mülakata çağırdılar. Sadece mülakata."});
 b({who:T,bg:'oda',v:'',c:[['tolga',1660,'phone']],panel:{type:'dosya',id:'tdosya',ad:'site_calisiyor_ekran.jpg',alt:'Halı saha kalecisine gönderildi',ikon:'jpg',yukle:1},cue:[[.3,'tolga','sip'],[.6,'tolga','shrug'],[.85,'tolga','smug']],text:"Abi halı sahada rakip kaleciyle laflandık. Yedek parça satıyormuş, sitesi iki gündür çökükmüş. Akşam oturdum, düzelttim. \"Bizde bir yer var\" dedi."});
 const TEKLIF={type:'mail',id:'teklif',kimden:'İK',konu:'Teklif Mektubu',satirlar:['Sitemizi ayağa kaldırdınız.','Ekibimize bekleriz.','~Maaş: ₺ ██.███ (rekabetçi)'],etiket:'Teklif'};
 const nT=['Teklif geldi abi. Maaş: rekabetçi. Salon "asgari" demişti. Zarfı açmadan bilen bu kadar insan görmedim. Helal.',
           'Teklif geldi abi. Maaş: rekabetçi. Salon "yemek kartı da vardır" demişti. Salon iyimsermiş. Yemek kartı yok.',
           "Teklif geldi abi. Maaş: rekabetçi. Salon \"rakam yazsalar başvururdum\" demişti. Ben hiç başvurmadım ki; halı sahaya gittim."];
 b({who:T,c:[['tolga',1660,'present']],panel:TEKLIF,cue:[[.1,'fx','p:ac'],[.4,'tolga','point'],[.85,'tolga','shrug']],text:nT[n1]});
 b({who:D,bg:'oda',v:'',c:[['deniz',260,'laptop']],panel:{type:'dosya',id:'dcv',ad:'Deniz_CV_final_v7.pdf',alt:'+ Hobiler: halı saha?',ikon:'pdf'},cue:[[.3,'deniz','clap'],[.6,'deniz','think'],[.9,'deniz','brow']],text:"Tolga'yı tebrik ettim. Sonra kendi CV'mi açtım, \"Hobiler: halı saha\" eklesem mi diye düşündüm. Top oynamayı bilmiyorum."});
 b({who:A,bg:'mulakat',yer:'Mülakat mevsimi',c:[],panel:{type:'mulakat',id:'mlk',kisi:0,soru:'',saat:'10:00'},text:'Mülakat mevsimi açıldı. Deniz yedi mülakata girdi. Sorular hep aynıydı, cevaplar hiç yeterli değildi.'});
 const mq=(k,soru,o)=>Object.assign({ms:2800,panel:{type:'mulakat',id:'mlk',kisi:k,soru},alt:soru},o);
 M('M3',[
  mq(1,'Kendinizi 5 yıl sonra nerede görüyorsunuz?',{bg:'mulakat',c:[]}),
  mq(2,"Bir binary tree'yi ters çevirin. Tahta yok, havada gösterin."),
  mq(3,'Askerlik durumunuz?'),
  mq(4,'Neden biz?'),
  mq(5,"Hafta sonu çalışmak hakkında ne düşünürsünüz? 'Evet' dışında bir cevap var mı?",{ms:3200}),
  mq(6,'Bu kalemi bana satın.'),
  {ms:2800,panel:{type:'mulakat',id:'mlk',kisi:7,soru:'Maaş beklentiniz?',kopuk:1},alt:'Maaş beklentiniz?',fx:'flash'},
  {ms:3500,panel:{type:'mulakat',id:'mlk',kisi:0,soru:'Sizi olumlu ya da olumsuz bilgilendireceğiz.',saat:'+3 hafta'},alt:'Sizi olumlu ya da olumsuz bilgilendireceğiz.'}
 ]);
 b({who:D,bg:'oda',v:'',c:[['deniz',960,'phone']],cue:[[.3,'deniz','worry'],[.6,'deniz','phone'],[.9,'deniz','facepalm']],text:'Maaş beklentimi söyleyecektim, bağlantı koptu. Tekrar bağlandım. Bu sefer onlar "biz sizi ararız" dedi.'});
 b({who:A,bg:'oda',v:'',c:[['deniz',260,'phone']],panel:{type:'mail',id:'yp',kimden:'Yetenek Programı',konu:'Tebrikler!',satirlar:['12 aylık ücretsiz Yetenek Programımıza','kabul edildiniz.','~Ücret: —']},cue:[[.2,'fx','p:ac'],[.8,'deniz','brow']],text:'Deniz\'in ilk teklifi geldi: on iki aylık ücretsiz "yetenek programı". Yetenek ondan, program onlardan.'});
 b({who:D,c:[['deniz',960,'think']],cue:[[.15,'fx','bubble:İŞ → DENEYİM → İŞ:960:180'],[.5,'deniz','facepalm'],[.85,'deniz','shrug']],text:'İş için deneyim, deneyim için iş lazım. Bu döngüyü birinci sınıfta ben de yazmıştım. Çıkış koşulunu unutmuştum.'});
 const k5=K('Deniz işi nasıl arıyor?',[['500 Kolay Başvuru','Tek tık, beş yüz ilan. Okuyan bir algoritma.'],['Buluşma ve referans','Buluşmalara git, insanlarla konuş, "beni önerir misin" de.'],['Zaman kazan','Yüksek lisans ya da askerlik. Belki piyasa düzelir.']]);
 if(k5===undefined) return s;
 if(k5===0){
  M('M2',[{ms:25000,bg:'oda',v:'gece',c:[['deniz',260,'type']],hud:1,fx:'plus0',panel:{type:'kolay',id:'kolay',hedef:500,mailler:[
   'Değerlendirmeniz sonucunda, şu an için…','Profilinizi çok beğendik ancak…','Bu pozisyon kapanmıştır. (ilan hâlâ açık · 3 saat önce)',
   'Ön elemeye takıldınız. Anahtar kelime eşleşmesi: %12','Junior · Min. 5 yıl · Yıldızlar Holding · Başvurunuz alındı','Junior · Yıldızlar Holding · Olumsuz',
   'Başvuru deneyiminizi puanlar mısınız? ★★★★★']}}]);
  sifir();
  b({who:D,bg:'oda',v:'gece',c:[['deniz',960,'tired']],cue:[[.4,'deniz','sad'],[.8,'deniz','smug']],text:'Beş yüz başvuru: dört yüz doksan iki ret, yedi sessizlik, bir anket. "Başvuru deneyiminizi puanlayın." Bir yıldız verdim.'});
  b({who:O,c:[['deniz',260,'tired'],['ozan',1660,'laptop','inR']],panel:{type:'mailkutu',id:'otomat',mailler:[['Ozan','Re: Değerlendirmeniz','Teşekkür ederim.'],['İK Botu','Re: Re: Değerlendirmeniz','Biz teşekkür ederiz.'],['Ozan','Re: Re: Re:','Teşekkür ederim.']]},cue:[[.3,'ozan','type'],[.85,'deniz','facepalm']],text:'Beş yüz mü? Ben bir ara ret maillerine otomatik teşekkür yanıtı yazdım. Şimdi onlar da bana otomatik teşekkür ediyor.'});
 }else if(k5===1){
  art(1,2,0);
  b({who:D,bg:'kafe',yer:'Yazılımcılar Buluşması · Adana',c:[['deniz',260,'sip']],panel:{type:'etkinlik',id:'bulusma',baslik:'Yazılımcılar Buluşması',yer:'Adana · Kafe',tarih:'Perşembe 19.00',katilimci:32},cue:[[.25,'deniz','worry'],[.55,'deniz','sip'],[.85,'deniz','cheer']],text:'Bir buluşmaya gittim. Konuşmak, kod yazmaktan zormuş. Üçüncü çayda biri "CV\'ni at, içeriye iletirim" dedi. İletmiş. İçeride biri okumuş.'});
  b({who:B,c:[['deniz',620,'heart'],['buse',1300,'point','inR']],cue:[[.2,'buse','point'],[.6,'buse','smug'],[.9,'buse','shrug']],text:"Gördün mü? CV'yi bir insana atınca okunuyormuş. Okunmak işe alınmak demek değil ama. Benimkini üç kez okudular; üçünde de okuyan bir yazılımdı."});
  b({who:A,c:[['deniz',620,'sip']],panel:{type:'etkinlik',id:'bulusma',baslik:'Yazılımcılar Buluşması',yer:'Adana · Kafe',tarih:'Perşembe 19.00',katilimci:32},cue:[[.7,'deniz','smug']],text:'Buluşmada otuz iki kişi vardı. Otuz biri ona iş teklif etmedi. Bu, şimdiye kadarki en iyi oranıydı.'});
 }else{
  art(0,0,1);
  b({who:D,bg:'oda',v:'',c:[['deniz',260,'laptop']],panel:{type:'kayit',id:'kayit',baslik:'Tezsiz Yüksek Lisans',alt:'Kayıt tamamlandı ✓',zarf:'Askerlik Şubesi'},cue:[[.3,'deniz','present'],[.85,'deniz','smug']],text:'Yüksek lisansa kaydoldum. Annem komşulara "master yapıyor" diyor. Ben kendime "zaman yapıyorum" diyorum.'});
  b({who:A,c:[['deniz',260,'look']],panel:{type:'kayit',id:'kayit',baslik:'Tezsiz Yüksek Lisans',alt:'Kayıt tamamlandı ✓',zarf:'Askerlik Şubesi'},cue:[[.6,'deniz','worry']],text:"Askerlik şubesi de kaydı not aldı. Acele etmiyor; yüksek lisans biter, doktora biter, şube yine oradadır."});
  b({who:T,c:[['deniz',260,'look'],['tolga',1660,'sip','inR']],cue:[[.3,'tolga','present'],[.65,'tolga','shrug'],[.9,'tolga','smug']],text:'Yüksek lisans mı abi? Ben de düşündüm. Sonra caps sayfamın takipçisi yüz bini geçti, bıraktım. Akademi kaybetti.'});
 }

 // ================= PERDE 4 =================
 perde(4,'MEZUNİYETİN 4. AYI','Bayram. Sofrada 12 kişi, 1 soru.','bayram');
 b({who:A,bg:'bayram',yer:'Bayram · Sofrada 12 kişi',sakal:1,c:[['deniz',960,'sit']],panel:{type:'balonlar',id:'balon',metinler:['İş ne oldu?','Kuzenin bankaya girdi.','Yazılım dediğin, evden mi çalışıyorsun?',"Almanya'ya gitsene.",'Bizim yazıcı da bozuk, bir bakarsın.']},cue:[[.5,'deniz','tired']],text:'Bayram. Sofrada on iki kişi, bir soru. Soru her yemekte yeniden soruluyor, cevap hiç değişmiyor.'});
 b({who:D,c:[['deniz',960,'present']],panel:{type:'balonlar',id:'balon',metinler:['İş ne oldu?','Kuzenin bankaya girdi.','Yazılım dediğin, evden mi çalışıyorsun?',"Almanya'ya gitsene.",'Bizim yazıcı da bozuk, bir bakarsın.']},cue:[[.2,'deniz','calm'],[.55,'deniz','wag'],[.85,'deniz','tired']],text:'Evet, yazılımcıyım. Hayır, yazıcı tamir etmiyoruz. Evet, yemekten sonra bakarım.'});
 b({who:D,c:[['deniz',960,'cheer']],fx:'confetti',cue:[[.3,'deniz','type'],[.6,'deniz','cheer'],[.9,'deniz','smug']],text:'Yazıcıya baktım. Kâğıt sıkışmış. Çıkardım, çalıştı. Sofrada artık mühendis olduğuma herkes ikna oldu.'});
 b({who:S,bg:'holding',v:'',c:[['asuman',960,'heart:happy']],cue:[[.2,'asuman','wave'],[.55,'asuman','present'],[.9,'asuman','sip']],text:"Bizim bayram da çok kalabalık geçti! Babam bütün çalışanlara ikramiye dağıttı. Ben de aldım; ben de çalışıyorum sonuçta."});
 M('M4',[{ms:24000,bg:'oda',v:'gece',c:[['deniz',260,'phone']],panel:{type:'whatsapp',id:'wa',grup:"CENG '27 Mezunları",uye:64,yaziyor:'Deniz',mesajlar:[
  ['Mert',"Almanya'dan selamlar, mavi kart çıktı"],['Kaan',"Şubatta askere gidiyorum, adres bilen?"],['Elif','Yüksek lisansa başladım, zaman kazanıyorum'],
  ['Barış','Remote iş buldum, maaş dolar, stand-up gece 2\'de'],['Can','Leetcode grubu kuran?'],['Ece','ben'],['Onur','ben'],['Seda','ben'],['Ali','ben'],
  ['Tolga','abi bizim şirket caps sayfası açtı, beni başına geçirdiler'],['Buse',"Kuzey Yazılım'da junior alımı var, CV'si olan bana atsın"],['Ozan','1.204']]}}]);
 b({who:D,bg:'oda',v:'gece',c:[['deniz',960,'phone:sad']],cue:[[.4,'deniz','type'],[.7,'deniz','sad']],text:'Herkes bir yere gitmiş. Ben de bir şey yazacaktım. "İyiyim" yazdım, sildim. "Bakıyorum" yazdım, onu da sildim.'});
 b({who:O,c:[['ozan',1660,'laptop']],panel:{type:'mail',id:'ickaynak',kimden:'İK',konu:'Başvurunuz hk.',satirlar:['Pozisyon iç kaynaklardan karşılanmıştır.','İlginiz için teşekkür ederiz.']},cue:[[.2,'fx','p:ac'],[.85,'ozan','think']],text:'Bin iki yüz dört başvuru. Bugün bir tanesi döndü: "Pozisyon iç kaynaklardan karşılanmıştır." İç kaynak kim, merak ediyorum.'});
 b({who:B,bg:'kahve',c:[['buse',960,'phone']],cue:[[.2,'buse','phone'],[.6,'buse','brow'],[.9,'buse','wag']],text:'Deniz, grupta hiçbir şey yazmadın. Bir şey soracağım: bu ay kaç kişiyle konuştun? İnsanla diyorum, botla değil.'});
 b({who:A,bg:'yokus',v:'aksam',yer:'Mezuniyetin 4. ayı',c:[['deniz',960,'look']],cue:[[.5,'deniz','think'],[.85,'deniz','worry']],text:"Mezuniyetin dördüncü ayı. Deniz'in son bir hamle hakkı var. Ondan sonra annesi devreye girecek."});
 const k6=K("Deniz'in son hamlesi ne?",[['Gece gündüz Leetcode','Medium, Hard, Hard, uykusuzluk.'],['Her hafta paylaş','Ne öğrendiysen yaz. Okuyan olmasa bile.'],['Kahve ısmarla','Eski hocana, eski amirine, tanıdığın herkese. Kahveler senden.']]);
 if(k6===undefined) return s;
 if(k6===0){
  art(0,0,2);
  b({who:D,bg:'oda',v:'gece',c:[['deniz',260,'laptop:tired']],panel:{type:'leetcode',id:'lc6',gun:612,cozulen:612,zorluk:'Hard',durum:'Kabul edildi · O(n)',alev:1},cue:[[.3,'deniz','tired'],[.6,'deniz','sad'],[.88,'deniz','smug']],text:'Altı yüz on iki soru çözdüm. Rüyamda iki işaretçi birbirine yaklaşıyordu. Uyandım, hâlâ işsizdim. Ama O(n).'});
  b({who:A,c:[['deniz',260,'type']],panel:{type:'arama',id:'anne',ad:'Bankacı Müdür (annenin ayarladığı)',alt:'cevapsız arama'},cue:[[.3,'fx','ding'],[.7,'deniz','type']],text:'Bu arada annesi devreye girdi. Kuzeninin bankasından bir müdür aradı. Deniz açmadı; Hard soru çözüyordu.'});
  b({who:O,c:[['deniz',260,'tired'],['ozan',1660,'laptop','inR']],cue:[[.3,'ozan','calm'],[.85,'deniz','facepalm']],text:'Altı yüz on iki mi? Hoş geldin. Ben bin dört yüze geldim. Rüyamda artık işaretçiler değil, ret mailleri yaklaşıyor.'});
 }else if(k6===1){
  art(2,0,0);
  b({who:D,bg:'oda',v:'',c:[['deniz',260,'laptop']],panel:{type:'lgonderi',id:'hafta7',ad:'Deniz',foto:'deniz',unvan:'Yazılım Geliştirici',metin:'Hafta 7: Bir hatayı 3 gün aradım. Noktalı virgülmüş. Öğrendiklerim:',begeni:61,yorumlar:[['İK Uzmanı','Noktalı virgül bizde de oldu.']]},cue:[[.45,'fx','p:yorum'],[.5,'fx','ding'],[.85,'deniz','cheer']],text:'Yedi hafta üst üste yazdım. Bir İK uzmanı yorum yaptı: "Noktalı virgül bizde de oldu." Ona mesaj attım. Görüldü. Hâlâ görüldü.'});
  b({who:B,bg:'kahve',c:[['buse',960,'phone']],cue:[[.2,'buse','wave'],[.6,'buse','present'],[.85,'buse','smug']],text:'Yazılarını okuyorum! Geçen haftakini ekibe attım, herkes noktalı virgülü konuştu. Adını da söyledim tabii.'});
  b({who:A,bg:'oda',v:'',c:[['deniz',960,'phone']],cue:[[.6,'deniz','heart']],text:"Yedinci yazının altında altmış bir beğeni vardı. Elli dokuzunu tanımıyordu. Hiçbiri işe alım yapmıyordu. Hepsi adını biliyordu, o kadar."});
 }else{
  art(0,2,0);
  b({who:D,bg:'kafe',yer:'Adana · Kafe',c:[['deniz',260,'sip']],panel:{type:'fis',id:'fis',baslik:'ADİSYON',satirlar:[['Filtre kahve','70 ₺'],['Filtre kahve','70 ₺'],['Filtre kahve','70 ₺']],toplam:'210 ₺'},cue:[[.3,'deniz','present'],[.65,'deniz','cheer'],[.9,'deniz','smug']],text:"Üç kişiye kahve ısmarladım, iki yüz on lira tuttu. Biri beni bir ekibe önerdi. İş değil, mülakat sözü. Bu piyasada yetmiş liraya alınabilecek en iyi şey."});
  b({who:T,c:[['deniz',620,'sip'],['tolga',1300,'sip','inR']],cue:[[.25,'tolga','point'],[.6,'tolga','present'],[.88,'tolga','smug']],text:'Kahveyi bana da ısmarlasaydın abi. Şirkette caps sayfasının başındayım, İK her gün uğruyor. Ben de bir tanıdığım.'});
  b({who:B,c:[['deniz',260,'sip'],['buse',1660,'cheer','inR']],cue:[[.2,'buse','cheer'],[.6,'buse','sip'],[.9,'buse','smug']],text:'Kahve mi ısmarladın? Sonunda! Ben bunu dört yıldır yapıyorum. Artık işim de var. Maaşım kahveye yetmiyor, o ayrı.'});
 }
 b({who:A,bg:'oda',v:'aksam',yer:'Son sorudan önce',c:[['deniz',960,'look']],cue:[[.6,'deniz','think']],text:"Deniz'in hikâyesi bitmek üzere. Sonu açmadan önce salona tek bir soru."});
 const n2=N('Bu ülkede iş bulmanın en büyük belirleyicisi ne?',[['Yetenek','İyi olan kazanır. Eninde sonunda.'],['Çevre','Kimi tanıdığın, ne bildiğinden önce gelir.'],['Şans','Doğru dosya, yanlış zaman. Ya da tersi.'],['Baba','Açıklama gerekmiyor.']]);
 if(n2===undefined) return s;

 // ---------- SON SAHNESİ ----------
 const E=sonSec(H.st);
 const SON=[null,
  ['Referans Kapısı','Çevre kapıyı aralar; içeri girmek ve içeride tutunmak yine senin işin. Görünür ol, tanış, ne yaptığını anlat. Garanti değil; ama bu ülkede onsuz kapı neredeyse hiç aralanmıyor.'],
  ['Viral Kaza','Şans gerçek ama kira ödemez. O da ancak ortada duranı bulur; o linki bırakmasaydın üç bin kişi gülüp geçerdi. Şans kapıyı açar, içeride tutmaz; orada yetkinlik ve çevre sınanır, onlar da garanti vermez.'],
  ['Remote Dolar','Yetkinlik seni hazırlar, görünürlük seni bulunabilir yapar. Ama sınırı aşan iş, sınırı aşan riskle gelir. İşini göster, insanlarla bağını koru: bir kapı kapanınca ikincisini çoğu zaman seni hatırlayan biri aralar.'],
  ['Mükemmel CV · Sıfır Dönüş','Çok çalışmak olmazsa olmazdır ama yetmez. Kimse görmüyor, kimse tanımıyorsa en iyi kod bir klasörde bekler. Yaptığını göster, insanlarla tanış, stratejiyle başvur. Hiçbiri garanti değil; hiçbirini yapmamak ise garanti.'],
  ['Yüksek Lisans Döngüsü','Zaman kazanmak strateji değildir; zamanı neye harcadığın stratejidir. Her şeyden biraz yapmak, hiçbir şey yapmamanın en yorucu hâlidir. Bir yön seç, görünür ol, insanlarla tanış. Garantisi yok; beklemenin de yok.']];
 if(E===1){
  b({who:D,bg:'oda',v:'',muzik:'s1',c:[['deniz',960,'phone']],cue:[[.15,'fx','ding'],[.4,'deniz','think'],[.85,'deniz','cheer']],text:'Telefon çaldı. Arayan bir zamanlar tanıştığım biriydi. "Söz veremem ama bir mülakat ayarlarım" dedi. Bu ülkede buna kapı denir.'});
  b({who:A,bg:'ofis',muzik:'s1',yer:'Kuzey Yazılım · İK',c:[],panel:{type:'cv3',id:'cv3',gonderen:['Kaan Er','Selin T.','Sevgi Abla (?)']},text:"Deniz'in CV'si şirkete üç farklı kişiden ulaştı. İK, CV'yi üç kez okudu. Bu bir rekordu."});
  b({who:D,muzik:'s1',c:[['deniz',960,'present']],cue:[[.3,'deniz','worry'],[.6,'deniz','present'],[.9,'deniz','heart']],text:'Mülakatta Leetcode sorusu bekliyordum. "SerinYol\'u anlat" dediler. İki hafta sonra teklif geldi. Maaş: rekabetçi.'});
  b({who:A,muzik:'s1',bg:'ofis',yer:'Kuzey Yazılım · Ayın 20si',c:[['deniz',260,'tired']],panel:{type:'fis',id:'maas',baslik:'MAAŞ BORDROSU',satirlar:[['Kira','%50'],['Yol','%25'],['Kalan','ayın 20sine kadar']],toplam:'Rekabetçi'},cue:[[.7,'deniz','sad']],text:'Maaşın yarısı kiraya, dörtte biri yola gitti. Deniz ayın yirmisine kadar mühendisti. Yirmisinden sonra yine öğrenci.'});
 b({who:B,muzik:'s1',c:[['deniz',620,'cheer'],['buse',1300,'wave','inR']],cue:[[.2,'buse','cheer'],[.5,'buse','shrug'],[.85,'buse','smug']],text:"Kuzey'e hoş geldin! Selin Hanım'a adını ben söyledim, kimseye söyleme. Bir gün ben de senden bir şey isteyeceğim; onu da kimseye söyleme."});
 }else if(E===2){
  b({who:D,bg:'oda',v:'',muzik:'s2',c:[['deniz',260,'phone:shock']],panel:{type:'caps',id:'caps',ust:'İK: 5 yıl deneyimli junior arıyoruz',alt:"Adana'dan başvuran aday:",begeni:'48 bin',yorum:'3.112'},fx:'shake',cue:[[.3,'deniz','shock'],[.85,'deniz','facepalm']],text:'Fotoğrafım bir caps sayfasında paylaşılmış. Altında üç bin yorum var. Hiçbiri kodumla ilgili değil.'});
  b({who:T,muzik:'s2',c:[['deniz',260,'look'],['tolga',1660,'sip','inR']],panel:{type:'caps',id:'caps',ust:'İK: 5 yıl deneyimli junior arıyoruz',alt:"Adana'dan başvuran aday:",begeni:'48 bin',yorum:'3.112'},cue:[[.25,'tolga','present'],[.6,'tolga','shrug'],[.88,'tolga','sip']],text:"Abi o caps'i ben yaptım. Bir sayfaya attım, gerisi bende değil. Komisyon da istemiyorum. Bir dürüm yeter."});
  b({who:A,muzik:'s2',yer:'İstanbul → Adana',c:[['deniz',260,'phone']],panel:{type:'dm',id:'dm',kimden:'Kurucu · Lezzet Teknoloji',metin:'Hemşehrim! Yorumdaki linke baktım, kod fena değil. Pazartesi bir gel, konuşalım.'},cue:[[.2,'fx','ding'],[.8,'deniz','cheer']],text:"Deniz utancından yorumlara kodunun linkini bıraktı. Üç bin yorumda kimse tıklamadı. Biri hariç: caps'i paylaşan yemek şirketinin Adanalı kurucusu."});
  b({who:D,bg:'mulakat',muzik:'s2',c:[['deniz',960,'cheer']],panel:{type:'mulakat',id:'mlk2',kisi:2,soru:'Acılı mı, acısız mı?'},cue:[[.35,'deniz','think'],[.6,'deniz','point'],[.9,'fx','confetti']],text:"Mülakat görüntülüydü. Yarım saat SerinYol'u sordu, sonra \"Acılı mı, acısız mı?\" dedi. Doğru cevabı verdim. Asıl soru oymuş."});
  b({who:A,bg:'yokus',v:'aksam',muzik:'s2',yer:'Adana · 6 ay sonra',c:[['deniz',960,'sip']],cue:[[.6,'deniz','tired'],[.9,'deniz','sip']],text:"Deniz İstanbul'a taşındı. Kira maaşın üçte ikisiydi. Altı ay sonra caps unutuldu, şirket küçüldü. Deniz Adana'ya döndü."});
 }else if(E===3){
  b({who:D,bg:'oda',v:'gece',muzik:'s3',c:[['deniz',260,'laptop']],panel:{type:'davet',id:'davet',baslik:'Daily Stand-up',saat:'02:00 (GMT+3)',alt:'Berlin · Lizbon · Adana',doviz:1},cue:[[.3,'deniz','type'],[.7,'deniz','smug']],text:"Avrupa'daki bir ilana yazılarımın ve kodumun linkiyle başvurdum. Biri tıklamış. Remote başladım. Maaş dolar, kira lira. İlk kez kurdan yanayım."});
  b({who:A,muzik:'s3',yer:'Adana · 02.00',c:[['deniz',960,'laptop:tired']],cue:[[.6,'deniz','tired']],text:'Deniz\'in mesaisi gece ikide başlıyor. Annesi komşulara "bilgisayarla bir şeyler yapıyor" diyor. Gerçek bir iş bulmasını bekliyor.'});
  b({who:O,bg:'lab',muzik:'s3',c:[['ozan',960,'laptop']],cue:[[.4,'ozan','think'],[.85,'ozan','calm']],text:"Avrupa'dan iş mi? Benim kodum da açık, ben de başvurdum. Dönmediler. Belki kodumun saat dilimi uymuyordur."});
  b({who:D,bg:'oda',v:'gece',muzik:'s3',c:[['deniz',960,'tired']],cue:[[.3,'deniz','present'],[.8,'deniz','shrug']],text:'Stand-up\'ta herkes dün ne yaptığını anlatıyor. Ben "uyudum" diyemiyorum; benim dünüm onların bugünü.'});
  b({who:A,muzik:'s3',yer:'Adana · 02.00 · 3. ay',c:[['deniz',260,'sad']],panel:{type:'mail',id:'layoff',kimden:'People Team',konu:'Organizasyonel güncelleme',satirlar:['Zor bir karar aldık.','Deneme süresindeki ekip arkadaşlarımız…','~Kıdem: —']},cue:[[.2,'fx','p:ac'],[.8,'deniz','sad']],text:'Üçüncü ayın sonunda şirket "yeniden yapılanma" duyurdu. Deneme süresindekiler önce gitti. Deniz son stand-up\'a saat ikide bağlandı.'});
 }else if(E===4){
  b({who:D,bg:'bank',muzik:'s4',c:[['ozan',620,'sit'],['deniz',1300,'sit','inR']],hudp:'deniz',cue:[[.4,'deniz','present'],[.85,'deniz','sad']],text:'Kodum temiz, testlerim yeşil, karmaşıklığım yerinde. Bunları benden başka bilen yok. Bir de Ozan.'});
  b({who:O,muzik:'s4',c:[['ozan',260,'laptop'],['deniz',1660,'sit']],panel:{type:'tablo',id:'xls2',dosya:'Basvuru_takip.xlsx (paylaşılan)',sutunlar:['Ad','Başvuru','Durum'],satirlar:[['Ozan','1.204','Değerlendirmeniz sonucunda…'],['Deniz','—','Değerlendirmeniz sonucunda…']]},cue:[[.3,'ozan','present'],[.75,'ozan','calm']],text:"Hoş geldin. Excel'i paylaşayım mı? Durum sütunu hazır, formülü de yazdım. Hepsi aynı cümleyle doluyor zaten."});
  b({who:D,muzik:'s4',c:[['ozan',620,'sit'],['deniz',1300,'sit']],cue:[[.3,'deniz','point'],[.6,'ozan','calm'],[.85,'deniz','sad']],text:'Ozan\'a profil fotoğrafı koymayı önerdim. "Kod konuşsun" dedi. Kod konuşuyor aslında. Sadece kimse dinlemiyor.'});
  b({who:A,muzik:'s4',yer:'Kampüs · Akşam',c:[['ozan',620,'sit'],['deniz',1300,'sit']],panel:{type:'linkedin',id:'s4li',ad:'Deniz',baslik:'',alt:'',foto:'gri',gor:[0,0]},hudp:'deniz',text:'İkisi akşama kadar bankta oturdu. Bu sırada bölümün en iyi iki yazılımcısını hiçbir şirket aramadı.'});
  b({who:D,muzik:'s4',c:[['ozan',620,'sit'],['deniz',1300,'write']],panel:{type:'fis',id:'hesap',baslik:'OLASI MAAŞ',satirlar:[['Kira','−'],['Yol','−'],['Yemek','−']],toplam:'eksi',x:1180,y:160},hudp:'deniz',cue:[[.3,'deniz','write'],[.7,'deniz','shrug'],[.9,'deniz','sad']],text:"Bir gün teklif gelirse diye maaş hesabı yaptım: kira, yol, yemek. Teklif gelmedi ama hesap eksi çıktı. En azından hazırlıklıyım."});
 }else{
  b({who:D,bg:'koridor',v:'asistan',muzik:'s5',c:[['deniz',960,'sit']],cue:[[.4,'deniz','write'],[.85,'deniz','tired']],text:'Yüksek lisansı bitirdim, piyasa düzelmedi. Doktoraya başladım. Hocam "piyasa düzelince çıkarsın" dedi.'});
  b({who:A,muzik:'s5',yer:'Bölüm koridoru · 2033',c:[['deniz',1660,'sit']],panel:{type:'takvim',id:'tkv',sayfalar:['2027','2029','2033']},text:'Hocası doksanlardan beri bekliyor. Bu arada yeni bir üçüncü sınıf öğrencisi kapıyı çaldı: staj defterini imzalatacaktı.'});
  b({who:T,muzik:'s5',c:[['deniz',620,'sit'],['tolga',1300,'sip','inR']],cue:[[.25,'tolga','clap'],[.6,'tolga','present'],[.88,'tolga','smug']],text:'Doktora mı abi? Helal. Bizim şirkette de bir doktoralı var, caps sayfasının altyazılarını düzeltiyor. Çok titiz.'});
  b({who:D,muzik:'s5',c:[['deniz',960,'shrug']],cue:[[.3,'deniz','present'],[.85,'deniz','smug']],text:'Biraz görünürdüm, biraz tanıdık, biraz yetkin. Piyasa "biraz"ı sevmiyormuş. Ben de "biraz daha" okudum.'});
 }

 // ---------- ASUMAN FİNALİ (her sonda) ----------
 const ASU_CIO={type:'lbildirim',id:'cio',ad:'Asuman Yıldız',foto:'asuman',metin:"Yeni bir pozisyona başladı: Chief Innovation Officer @ Yıldızlar Holding · 'Kendi yolumu kendim çizdim.'",zaman:'şimdi'};
 const nS=['Salon "yetenek" demiş. Ne güzel! Ben de hep söylüyorum: yeteneğin önünde kimse duramaz. Babam da öyle der.',
           'Salon "çevre" demiş. Çok haklısınız! Ben de çevremi hep kendim seçtim. Genelde pazar kahvaltılarında.',
           'Salon "şans" demiş. Ben şansa pek inanmam. Hayatımda hiç şansa ihtiyacım olmadı. Herhalde çok çalıştığım içindir.',
           "Salon \"baba\" demiş. Çok tatlısınız! Babama söyleyeceğim, çok gurur duyacak. Kendisi de hep \"her şey emek\" der."];
 b({who:S,bg:'holding',v:'lobi',muzik:'epilog',c:[['asuman',1660,'heart:happy']],panel:ASU_CIO,cue:[[.2,'asuman','wave'],[.6,'asuman','present'],[.9,'asuman','heart']],text:nS[n2]});
 b({who:S,c:[['asuman',1660,'present']],panel:ILAN({id:'ilan2'}),cue:[[.3,'asuman','cheer'],[.7,'fx','p:maas'],[.85,'asuman','clap']],text:'Yeni pozisyonumdaki ilk işim, genç yeteneklere kapı açmak! Junior alımı başlattık. En az beş yıl deneyim arıyoruz.'});

 // ---------- M5 · epilog ----------
 M('M5',[
  {ms:3500,bg:'oda',v:'',c:[],panel:{type:'epilog',id:'ep',kim:'ozan',metin:'1.204. başvuruda teklif aldı. Maaş kirayı karşılamadı. Şimdi yüksek lisansta; akşamları özel ders veriyor.'}},
  {ms:3500,panel:{type:'epilog',id:'ep',kim:'buse',metin:"Dördüncü denemede Kuzey Yazılım'da. Kahve makinesi hâlâ şekerli veriyor."}},
  {ms:3500,panel:{type:'epilog',id:'ep',kim:'tolga',metin:'Şirket maaşları üç ay geciktirdi. Caps sayfası bir gün bile gecikmedi.'}},
  {ms:3500,panel:{type:'epilog',id:'ep',kim:'asuman',metin:'Chief Innovation Officer. Maaşı: rekabetçi. Yolunu kendi çizdi.'}}
 ]);
 son(E,SON[E][0],SON[E][1]);
 final('Mezuniyet.exe yanıt veriyor.',FINAL_ALT);
 return s;
}
