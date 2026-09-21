# Silben-App – Stand und nächste Schritte

## Getesteter stabiler Stand · 22.09.2026

Die App wurde vom Nutzer mit Kindern erfolgreich im Alltag getestet. Inhalte,
Rundenlänge und Wiederholungen passen zum wochenweisen Lernfortschritt.
Referenz des aktuellen App-Stands: Commit `6f61988`.
Dies ist eine Dokumentation des getesteten Stands, keine neue Release-Nummer
und kein neu angelegter Git-Tag. Frühere Versionspläne sind keine offenen Aufträge.

Öffentliche App: https://joannadauner.github.io/silbenapp/

## Vorhandene Funktionen

### Inhalte und Wochenauswahl

- Wochen mit Silben und zweisilbigen Wörtern verwalten; beliebige Wochen per Checkbox auswählen.
- Nur ausgewählte Wochen üben. Die höchste ausgewählte Woche erhält bei gefüllten
  Pools 60 % Auswahlwahrscheinlichkeit, die übrigen zusammen 40 %; keine feste Rundenquote.
- Neue Aufgaben beginnen zufällig klein oder groß. Wiederholungen behalten die exakte Schreibweise.
- Zweisilbige Wörter mit Bindestrich eingeben, etwa `o-mi`. Die Lernansicht zeigt
  Blau (#1327e3) und Rot (#ff0000) ohne Trennstrich. Einfache Silben bleiben blau.
- Neue Geräte erhalten beide Standardwochen ausgewählt; vorhandene Daten werden nicht ersetzt:
  - Woche 1: `mi, mo, mu, um, im`
  - Woche 2: `im, um, om, o-mi, mo-mo, o-mo, i-mo, mi-o, mi-mo, mi-mi`
- Neue zusätzliche Wochen sind zunächst abgewählt.

### Leserunden und Wiederholungen

- 10 Startaufgaben einschließlich bis zu fünf übernommener Wiederholungen;
  maximal 15 angezeigte Aufgaben pro Runde. Keine Leben oder Fehlergrenze.
- „Richtig“ erledigt den Wiederholungsauftrag der exakten Schreibweise und entfernt
  seine noch eingeplanten Wiederholungen. `Ma` und `ma` sind getrennte Aufträge.
- „Nochmal“ speichert einen offenen Auftrag und plant dieselbe Aufgabe erneut ein,
  möglichst nach 3–5 anderen Aufgaben, am Rundenende gegebenenfalls früher.
- Erneutes „Nochmal“ ist möglich. Nach Erreichen der Obergrenze bleiben offene
  Aufträge für spätere Runden gespeichert. Pro Schreibweise gibt es nur einen Auftrag.
- Aufträge aus abgewählten Wochen warten. Gelöschte Einträge werden beim nächsten
  gültigen Rundenstart aus dem Wiederholungsspeicher entfernt.
- Grüner Fortschrittsbalken: wächst bei „Richtig“, bleibt bei „Nochmal“ stehen und
  ist am Rundenende immer voll, auch wenn bei Aufgabe 15 noch Wiederholungen offen sind.
- Grünes Häkchen bzw. grüne Lupe im Stickerstil erscheinen eine Sekunde rechts
  neben der Aufgabe. Währenddessen sind weitere Bewertungen gesperrt.
- Blaues X auf grauem Hintergrund beendet nach Rückfrage vorzeitig: zurück zur
  Startseite, ohne Auszeichnung, gespeicherte Wiederholungen bleiben erhalten.

### Abschluss und Elternübersicht

| Ergebnis der aktuellen Runde | Auszeichnung | Überschrift |
| --- | --- | --- |
| Keine unsichere Antwort | Goldener Pokal | Leserunde super geschafft! |
| Unsichere Antworten später alle gelöst | Farbiger Stern | Leserunde mit etwas Übung geschafft! |
| Noch unsichere Schreibweisen offen | Grüner Haken | Leserunde geschafft! Bleib dran! |

Nicht gezeigte offene Aufträge aus früheren Runden beeinflussen die Auszeichnung nicht.
Direkt richtig gelesene übernommene Wiederholungen verhindern den Pokal nicht.

Der Stern ist ein um 25 % vergrößerter Sticker in #eeff00 mit blauen und roten
Gesichtsdetails. Er hüpft dreimal 22 px hoch, mit dezenter Verformung, insgesamt
1,8 Sekunden. „Bewegung reduzieren“ deaktiviert die Animation.
Die Abschlussbuttons heißen „Nochmal“ und „Genug für heute.“.

„Für Eltern“ ist zunächst zugeklappt und zeigt:
- **Nicht sofort erkannt:** alle in dieser Runde mit „Nochmal“ bewerteten Einträge,
  auch später gelöste, einmal je Schreibweise. Diese Liste wird je Runde zurückgesetzt.
- **Das üben wir weiter:** alle noch offenen Wiederholungen, auch aus früheren
  Runden und abgewählten Wochen. Dieser Stand bleibt lokal gespeichert.

Keine Fehlerquote, Rangliste oder dauerhafte Leistungsbewertung.

### Darstellung und Geräte

- Hintergrund wie liniertes Heft; Textgrundlinien am Linienraster ausgerichtet.
- Kindertexte verwenden fest hinterlegte Silbengrenzen mit Blau/Grau, auf blauen
  Buttons Weiß/Hellgrau. Lernaufgaben behalten Blau/Rot. Elterntexte sind unverändert.
- Startseite ohne den früheren Untertitel „Welche Silbe siehst du?“.
- Responsive Darstellung ab Start, dynamische Fensterhöhe und sichere Bildschirmränder.
- Bewertungsbuttons im Querformat nebeneinander; Neuausrichtung beim Drehen,
  Wiederöffnen und bei Größenänderungen, einschließlich verzögerter Layoutmaße.
- Lange Einstellungen und Elternlisten bleiben scrollbar.
- Symbolbuttons und Grafiken haben zugängliche Beschreibungen; farbige Kindertexte
  werden für Screenreader zusätzlich als zusammenhängender Text bereitgestellt.

### Speicherung und Datentransfer

Nur HTML, CSS und Vanilla JavaScript, keine zusätzlichen Bibliotheken, kein Backend
und keine Benutzerkonten. Lerndaten liegen im lokalen Browserspeicher:
`readingWeeks`, `readingSelectedWeeks`, `readingPendingRepeats`.
Die frühere Wochenauswahl `readingCurrentWeek` wird bei Bedarf migriert.
Keine automatische Synchronisierung zwischen Geräten oder Webadressen.

Exportdatei `silbenapp-wochen.json`:
- `format: "silbenapp-wochen"`, `version: 1`
- `weeks`: Wochen mit Texteingaben einschließlich Bindestrichen
- `selectedWeeks`: ausgewählte Wochen als nullbasierte Indizes

Der Export berücksichtigt aktuelle Formulareingaben. Import validiert vor dem
Ersetzen und fragt nach Bestätigung; Abbruch oder ungültige Dateien ändern keine
Wochen. Offene Wiederholungen werden weder exportiert noch importiert.

### Installation, Offlinebetrieb und Updates

Manifest, App-Icons und Service Worker ermöglichen Installation und Offlinebetrieb
nach vollständigem Online-Laden. Es werden nur statische App-Dateien gecacht.

GitHub Pages veröffentlicht nach Push auf `main` über `.github/workflows/pages.yml`.
Nur App-Dateien werden hochgeladen; der Workflow setzt die Commit-ID als Cache-Version
und die kurze Commit-ID als sichtbare Version in den Einstellungen ein.

Ein fertig geladenes Update wird auf der Startseite angeboten. „Jetzt aktualisieren“
aktiviert den wartenden Worker und lädt dieses Fenster nach Aktivierung einmal neu.
Andere Fenster und laufende Runden laden nicht automatisch neu. Bei Rückkehr und
wiederhergestellter Verbindung wird nach Updates gesucht. App-Dateien werden beim
Update mit `cache: reload` angefordert, damit alte HTTP-Cache-Inhalte nicht übernommen
werden. Nach Zeitüberschreitung ist ein erneuter Versuch möglich.

## Bestätigte Tests und Grenzen

Vom Nutzer bestätigt:
- Erfolgreiche Leserunden mit Kindern, passende Inhalte und hilfreiche Wiederholungen;
  erneute positive Rückmeldung am 22.09.2026.
- Kürzere Runden und Elternübersicht funktionieren.
- Installation auf MacBook und iPad; Offlinebetrieb auf dem iPad im Flugmodus ohne WLAN.
- Smartphone-Querformat und Aktualisierung nach Gerätedrehung funktionieren.
- Wochenexport und -import funktionieren.
- Update über „Jetzt aktualisieren“ nach der Cache-Korrektur erfolgreich getestet;
  vom Nutzer am 22.09.2026 bestätigt.

Gezielte automatisierte Logikprüfungen wurden während der Entwicklung durchgeführt,
u. a. für Wiederholungen, Import, Standardwochen und Updatezustände. Sie ersetzen
keinen vollständigen Browsertest; es gibt derzeit keine eingecheckte Testsuite.

Nicht als geprüft gelten Android,
alle Browser-/Gerätevarianten oder eine vollständige Barrierefreiheitsprüfung.

## Nächste Schritte

1. Rückmeldung der Lehrerin einholen und als konkrete GitHub-Tickets festhalten.
2. Neue Funktionen nur aus beobachtetem Bedarf ableiten; derzeit kein zusätzlicher
   Silben-/Wortfilter und keine Änderung der bewährten Lernlogik geplant.

Optionale spätere Ideen, ohne zugesagte Version oder Umsetzung: Selbstlernmodus,
Sätze, Audioausgabe, zusätzliche Lernprofile, Lehrkraft-Funktionen und experimentelle
Spracherkennung. Spracherkennung darf keine Voraussetzung für die normale Nutzung sein.
Eine Einführung, ein Zurücksetzen der Einstellungen und gesonderte Datenschutzhinweise
waren frühere Ideen und sind nicht als umgesetzt dokumentiert.

## Entwicklung und Prüfung

- Regeln für Änderungen: `AGENTS.md`.
- Oberfläche: `index.html`, `style.css`; Lernlogik und Speicherung: `app.js`.
- PWA: `manifest.webmanifest`, `sw.js`, `icons/`.
- Deployment: `.github/workflows/pages.yml`.
- Live Server nutzt standardmäßig keinen Service Worker. Lokaler PWA-Test über
  `http://localhost:5500/index.html?pwa-test=1`; danach Registrierung und App-Cache
  in den Entwicklerwerkzeugen entfernen, ohne den lokalen Lernstand zu löschen.
- Bei App-Änderungen die lokale Cache-Version in `sw.js` erhöhen. Reine
  Dokumentationsänderungen benötigen keine Änderung am App-Code oder Cache.
- Nach Änderungen gezielt relevante Abläufe prüfen: Start, Bewertungen,
  Wiederholungen, Abschluss, Speicherung; bei Layoutänderungen beide Ausrichtungen.
