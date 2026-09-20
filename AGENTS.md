# Projekt: Silben-App

Diese Web-App unterstützt Kinder beim Lesenlernen mit der Silbenmethode.

## Lernlogik
- Eltern tragen jede Woche neue Silben ein.
- Eltern wählen die Übungswochen unabhängig voneinander per Checkbox aus;
  nur ausgewählte Wochen werden verwendet. Die Auswahl bleibt lokal gespeichert.
- Die höchste ausgewählte Woche wird bei neuen Aufgaben stärker gewichtet.
- Silben erscheinen zufällig klein oder mit großem Anfangsbuchstaben.
- Wenn eine Silbe mit „Nochmal“ oder „Weiß ich nicht“ markiert wird,
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
- Später sollen auch Wörter und optionale Spracherkennung hinzukommen.

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

## Arbeitsweise
- Bei Unklarheiten in Tickets oder Anforderungen vor der betroffenen Umsetzung
  eine Rückfrage stellen. Unabhängige, eindeutig beschriebene Arbeiten können
  währenddessen fortgesetzt werden.
- Bestehende Funktionen nicht unbeabsichtigt entfernen.
- Vor größeren strukturellen Änderungen kurz erklären, warum sie nötig sind.
- Änderungen direkt im bestehenden Projekt vornehmen.
- Keine unnötigen Bibliotheken oder zusätzliche Infrastruktur hinzufügen.
– Bei Konzeptionellen Änderungen auch diese Datei nach Rückfrage anpassen.
