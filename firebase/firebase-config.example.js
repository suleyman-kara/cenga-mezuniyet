// Firebase konsolu > Proje ayarlari > Uygulamalarin > Web uygulamasi > yapilandirma. (Istemci config'i gizli degildir; erisimi guvenlik kurallari korur.)
// Kullanim: bu dosyayi public/firebase-config.js olarak kopyalayip doldurun (ya da ../firebase-config.js'e yazip `npm run sync-config`).
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};
if (typeof window !== 'undefined') window.FIREBASE_CONFIG = FIREBASE_CONFIG;
if (typeof module !== 'undefined') module.exports = FIREBASE_CONFIG;
