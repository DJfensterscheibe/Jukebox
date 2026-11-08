# 🎵 SONGWUNSCH – Anleitung

Gäste scannen einen QR-Code, wünschen sich Songs (ohne Anmeldung), und auf dem Host-Bildschirm erscheinen die Wünsche als Retro-Boxen.

**Kosten: 0 €.** Du brauchst zwei kostenlose Dienste, beide **ohne Kreditkarte**:

| Dienst | Wofür | Warum es keine Kostenfalle gibt |
|---|---|---|
| **Firebase** (Google) | Speichert die Songwünsche live | Der Gratis-Tarif „Spark“ braucht keine Zahlungsmethode. Ohne hinterlegte Karte kann nichts berechnet werden. Würde ein Limit erreicht, stoppt der Dienst einfach. Für eine Party reicht das locker (bis 100 gleichzeitige Gäste). |
| **GitHub Pages** | Stellt die Webseite ins Internet | Komplett kostenlos für öffentliche Projekte, ebenfalls ohne Kreditkarte. |

Rechne mit ca. **15–20 Minuten** für die Einrichtung.

---

## Erst mal ausprobieren (optional, 1 Minute)

Du kannst den Look vorab testen, ganz ohne Einrichtung: Die App läuft dann im **Demo-Modus** (gelber Balken oben). Der Demo-Modus funktioniert nur innerhalb **eines** Browsers auf **einem** Gerät.

Da die Seiten über einen kleinen Webserver laufen müssen, geht das am einfachsten erst nach Schritt 2 (GitHub Pages). Öffne dort `host.html` in einem Tab und `index.html` in einem zweiten Tab.

---

## Schritt 1: Firebase-Datenbank anlegen

1. Gehe auf **https://console.firebase.google.com** und melde dich mit einem Google-Konto an.
2. **„Projekt erstellen“** bzw. **„Neues Firebase-Projekt erstellen“** → Name z. B. `songwunsch` → weiter.
   Google Analytics kannst du **ausschalten**, das brauchst du nicht.
3. Links im Menü: **Erstellen → Realtime Database** → **„Datenbank erstellen“**
   - Standort: **Belgien (europe-west1)**
   - Sicherheitsregeln: **„Im gesperrten Modus starten“** → Aktivieren
4. Oben in der Datenbank-Ansicht steht jetzt eine URL wie
   `https://songwunsch-xxxxx-default-rtdb.europe-west1.firebasedatabase.app`
   → **kopieren**, die brauchst du gleich.
5. Wechsle in der Datenbank auf den Reiter **„Regeln“**. Lösche den Inhalt komplett und füge den Inhalt der Datei **`database.rules.json`** ein → **„Veröffentlichen“**.
   *(Diese Regeln erlauben nur kurze Songwünsche bis 80 Zeichen und sonst nichts.)*
6. Klicke oben links auf das ⚙️ Zahnrad → **Projekteinstellungen**. Scrolle runter zu „Meine Apps“ → klicke auf das **`</>`-Symbol (Web)**.
   - App-Name: `songwunsch` → **„App registrieren“** (Firebase Hosting **nicht** anhaken)
   - Du siehst jetzt einen Code-Block mit `const firebaseConfig = { apiKey: "...", ... }`.
7. Öffne **`config.js`** mit einem Texteditor und übertrage die Werte in den Block `firebase: { ... }`.
   **Wichtig:** `databaseURL` muss die URL aus Punkt 4 sein. Falls sie im Firebase-Code-Block fehlt, trag sie einfach selbst ein.

   So sieht das fertig ungefähr aus:
   ```js
   firebase: {
     apiKey: "AIzaSy...",
     authDomain: "songwunsch-xxxxx.firebaseapp.com",
     databaseURL: "https://songwunsch-xxxxx-default-rtdb.europe-west1.firebasedatabase.app",
     projectId: "songwunsch-xxxxx",
     storageBucket: "songwunsch-xxxxx.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123"
   }
   ```
8. In `config.js` kannst du auch den **Partynamen**, die **Cooldown-Zeit** (Standard 30 Sekunden) und die **Flammen-Grenze** (Standard ab 5 Wünschen) ändern.

> Keine Sorge: Diese Firebase-Daten dürfen öffentlich sichtbar sein, das ist bei Web-Apps so vorgesehen. Geschützt wird die Datenbank durch die Regeln aus Punkt 5.

---

## Schritt 2: Webseite online stellen (GitHub Pages)

1. Konto anlegen auf **https://github.com** (kostenlos).
2. Oben rechts **„+“ → „New repository“**
   - Name: `songwunsch` (oder `party`, wird Teil der Adresse)
   - **Public** auswählen → **„Create repository“**
3. Auf der nächsten Seite: **„uploading an existing file“** anklicken.
4. **Alle Dateien und den Ordner `fonts`** aus diesem Paket ins Browserfenster ziehen
   (`index.html`, `host.html`, `app.js`, `config.js`, `style.css`, `qrcode.js`, `fonts/` …) → unten **„Commit changes“**.
5. Im Repository: **Settings → Pages** (linke Spalte)
   - Source: **„Deploy from a branch“**
   - Branch: **`main`**, Ordner **`/ (root)`** → **Save**
6. Nach 1–2 Minuten ist die Seite online unter:
   **`https://DEIN-GITHUB-NAME.github.io/songwunsch/`**

---

## Schritt 3: Auf der Party

| Wer | Adresse |
|---|---|
| **Host-Bildschirm** (Laptop am TV/Beamer) | `https://DEIN-GITHUB-NAME.github.io/songwunsch/host.html` |
| **Gäste** | `https://DEIN-GITHUB-NAME.github.io/songwunsch/` → steht automatisch als **QR-Code** auf dem Host-Bildschirm |

**Bedienung am Host-Bildschirm:**
- **Box anklicken → „✓ JA“** = Song als gespielt entfernen (z. B. nachdem du ihn in die Spotify-Warteschlange gepackt hast)
- **⛶ VOLLBILD**: Vollbildmodus fürs TV
- **↺ ALLES LÖSCHEN** (zweimal klicken): alle Wünsche zurücksetzen, z. B. nach dem Testen
- Die Steuer-Knöpfe sind halb durchsichtig und werden sichtbar, wenn du mit der Maus drüberfährst.

**Tipp:** Mach am Vortag einen kurzen Test mit deinem Handy, danach einmal „Alles löschen“.
Wer den QR-Code ausdrucken will: einfach einen Screenshot vom Host-Bildschirm machen.

---

## So funktioniert das Zusammenfassen

- Groß/Kleinschreibung, Satzzeichen, Umlaute (ü/ue) und Artikel am Anfang werden ignoriert:
  „Ein Ehrenwertes Haus“ = „Ehrenwertes Haus“ = „ehrenwertes haus“
- Künstler davor oder dahinter wird erkannt:
  „Aber bitte mit Sahne“ = „Aber bitte mit Sahne - Udo Jürgens“ = „Udo Jürgens - Aber bitte mit Sahne“
  Auf der Box steht dann der Titel groß und der Künstler klein darunter.
- Kleine Tippfehler werden toleriert: „Bohemian Rapsody“ = „Bohemian Rhapsody“
- Zusätze in Klammern werden ignoriert: „Schrei nach Liebe (Live)“ = „Schrei nach Liebe“
- Verschiedene Zahlen bleiben getrennt: „Teil 1“ ≠ „Teil 2“

**Größe der Boxen:** 1× normal · 2× breiter + „x2“ · ab 3× groß · ab 5× 🔥 Flammen · ab 8× riesig

---

## Gut zu wissen

- Der Cooldown gilt pro Handy bzw. Browser. Wer es drauf anlegt, kann ihn umgehen, für eine Party ist das aber völlig ausreichend.
- Da es keine Anmeldung gibt, könnte ein technisch versierter Gast theoretisch Einträge löschen. Bei einer privaten Party ist das kein reales Problem.
- Nach der Party: „Alles löschen“ drücken. Du kannst das Firebase-Projekt behalten (kostet nichts) oder in den Projekteinstellungen löschen.
