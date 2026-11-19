// cenga-mezuniyet Firebase web yapılandırması (istemci tarafı; gizli değildir, erişimi güvenlik kuralları korur)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAuBPpArQMcvXD0ppu7zHhDCLD1uVXXQBA",
  authDomain: "cenga-mezuniyet.firebaseapp.com",
  projectId: "cenga-mezuniyet",
  storageBucket: "cenga-mezuniyet.firebasestorage.app",
  messagingSenderId: "888843426719",
  appId: "1:888843426719:web:7e0ecfbfd0175292dbbbaa"
};
if (typeof window !== 'undefined') window.FIREBASE_CONFIG = FIREBASE_CONFIG;
if (typeof module !== 'undefined') module.exports = FIREBASE_CONFIG;
