# Projekt: Silben-App

Diese Web-App unterstützt Kinder beim Lesenlernen mit der Silbenmethode.

## Lernlogik
- Eltern tragen jede Woche neue Silben und zweisilbige Wörter ein.
- Neue Geräte starten mit Woche 1 und 2; vorhandene gespeicherte Daten bleiben erhalten.
- Wörter werden mit Bindestrich eingegeben (z. B. `o-mi`). Die Lernansicht zeigt
  die erste Silbe blau (#1327e3), die zweite rot (#ff0000), ohne Bindestrich.
- Eltern wählen die Übungswochen unabhängig voneinander per Checkbox aus;
  nur ausgewählte Wochen werden verwendet. Die Auswahl bleibt lokal gespeichert.
- Die höchste ausgewählte Woche wird bei neuen Aufgaben stärker gewichtet.
- Silben erscheinen zufällig klein oder mit großem Anfangsbuchstaben.
- Bewertet wird mit zwei Symbolbuttons: Häkchen („Richtig“) und Lupe („Nochmal“).
- Wenn eine Silbe mit „Nochmal“ markiert wird,
  muss bei der Wiederholung exakt dieselbe Schreibweise erscheinen.
- Eine Runde beginnt mit 10 Aufgaben, darunter bis zu fünf offene Wiederholungen.
- Weitere Wiederholungen können die Runde auf maximal 15 Aufgaben verlängern.
- Offene Wiederholungen werden in localStorage gespeichert und in spätere Runden
  übernommen. Pro exakter Schreibweise gibt es nur einen offenen Auftrag.
- „Richtig“ erledigt den Auftrag für diese Schreibweise. Wiederholungen erscheinen
  möglichst nach 3–5 anderen Aufgaben. Aufträge für Silben, die in keiner
  ausgewählten Woche vorkommen, bleiben gespeichert und warten auf erneute Auswahl.
- Es gibt keine Leben und keinen Fehlerabbruch. Ein Fortschrittsbalken zeigt den Verlauf.
- Nach der Runde zeigt eine zunächst zugeklappte Elternübersicht alle noch offenen
  Silben und Wörter, auch aus früheren Runden, ohne Fehlerquote oder Zusatzbewertung.
- Die Elternübersicht zeigt außerdem alle in dieser Runde nicht sofort erkannten
  Einträge, auch wenn sie später richtig gelesen wurden. Keine dauerhafte Fehlerstatistik.
- Kindertexte wechseln silbenweise zwischen Blau und Grau, auf blauen Buttons
  zwischen Weiß und Hellgrau. Lernaufgaben behalten Blau und Rot.
- Ein vorzeitiger Abbruch benötigt eine Rückfrage und zeigt keine Rundenauszeichnung.

## Technische Vorgaben
- möglichst einfach halten
- nur HTML, CSS und Vanilla JavaScript
- kein React
- kein Framework
- kein Backend
- keine Benutzerkonten
- Daten lokal im Browser speichern
- Datenschutz möglichst hoch
- plattformunabhängig
- Smartphone, Tablet und Desktop unterstützen

## Genehmigter Sprachprototyp
- Ein separater Testbereich darf Transformers.js und ein lokales Sprachmodell nutzen.
- Audio bleibt ausschließlich auf dem Gerät, ohne Speicherung oder Cloud-Fallback.
- Downloads nur nach ausdrücklichem Start; keine automatische Bewertung der Leserunden.

## Veröffentlichung und Speicherung
- Wochen, Auswahl und offene Wiederholungen werden in localStorage gespeichert.
- JSON-Export/-Import umfasst Wochen und Auswahl, nicht den Wiederholungsstand.
  Import ersetzt die Wochen erst nach Validierung und Bestätigung.
- Die PWA funktioniert nach vollständiger Installation offline.
- GitHub Pages veröffentlicht nach Push auf `main`; die Versionsanzeige nutzt die Commit-ID.
- Bei Änderungen an App-Dateien die lokale Cache-Version in `sw.js` erhöhen.
  Der Deployment-Workflow setzt dafür automatisch die Commit-ID ein.
- Updates nur nach Antippen übernehmen; laufende Runden nicht automatisch neu laden.

## Arbeitsweise
- Bei Unklarheiten in Tickets oder Anforderungen vor der betroffenen Umsetzung
  eine Rückfrage stellen. Unabhängige, eindeutig beschriebene Arbeiten können
  währenddessen fortgesetzt werden.
- Bestehende Funktionen nicht unbeabsichtigt entfernen.
- Vor größeren strukturellen Änderungen kurz erklären, warum sie nötig sind.
- Änderungen direkt im bestehenden Projekt vornehmen.
- Keine unnötigen Bibliotheken oder zusätzliche Infrastruktur hinzufügen.
- Bei konzeptionellen Änderungen auch diese Datei nach Rückfrage anpassen.
