// ============================================================
//  SONGWUNSCH – Einstellungen
//  Nur diese Datei musst du anpassen.
// ============================================================
window.SONGWUNSCH_CONFIG = {
  // Name der Party (erscheint auf Gäste-Seite und Host-Bildschirm)
  partyName: "LAURENZ 20. GEBURTSTAG",

  // Wartezeit in Sekunden zwischen zwei Wünschen pro Handy (Anti-Spam)
  cooldownSeconds: 5,

  // Ab so vielen Wünschen bekommt eine Box die Flammen-Animation
  flameAt: 5,

  // Design: "synthwave" (Standard), "arcade", "vapor" oder "gameboy"
  theme: "synthwave",

  // Effekte auf dem Host-Bildschirm: "high" (immer alles, Standard),
  // "auto" (reduziert nur bei starkem Ruckeln) oder "low" (immer sparsam)
  effects: "high",

  // ----------------------------------------------------------
  //  Firebase-Zugangsdaten (siehe ANLEITUNG.md, Schritt 1)
  //  Solange databaseURL leer ist, läuft die App im DEMO-MODUS:
  //  dann funktioniert alles nur lokal in einem Browser (zum Testen).
  // ----------------------------------------------------------
  firebase: {
    apiKey: "AIzaSyCI8IY5oZ9UJ-5Lta-JnUStfMZUcxtJPTQ",
    authDomain: "jukebox-3f4c6.firebaseapp.com",
    databaseURL: "https://jukebox-3f4c6-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "jukebox-3f4c6",
    storageBucket: "jukebox-3f4c6.firebasestorage.app",
    messagingSenderId: "298003213871",
    appId: "1:298003213871:web:80daa4bd59dd2b63cce0da"
  }
};
