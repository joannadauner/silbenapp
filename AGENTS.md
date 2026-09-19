# Projekt: Silben-App

Diese Web-App unterstützt Kinder beim Lesenlernen mit der Silbenmethode.

## Lernlogik
- Eltern tragen jede Woche neue Silben ein.
- Geübt werden die aktuelle Woche und alle vorherigen Wochen.
- Die aktuelle Woche wird stärker gewichtet.
- Silben erscheinen zufällig klein oder mit großem Anfangsbuchstaben.
- Wenn eine Silbe mit „Nochmal“ oder „Weiß ich nicht“ markiert wird,
  muss bei der Wiederholung exakt dieselbe Schreibweise erscheinen.
- Eine Runde beginnt mit 15 Aufgaben, darunter bis zu fünf offene Wiederholungen.
- Weitere Wiederholungen können die Runde auf maximal 20 Aufgaben verlängern.
- Offene Wiederholungen werden in localStorage gespeichert und in spätere Runden
  übernommen. Pro exakter Schreibweise gibt es nur einen offenen Auftrag.
- „Richtig“ erledigt den Auftrag für diese Schreibweise. Wiederholungen erscheinen
  möglichst nach 3–5 anderen Aufgaben; spätere Wochen bleiben ausgeschlossen.
- Es gibt keine Leben und keinen Fehlerabbruch. Die Anzeige lautet „Aufgabe 12“.
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
- Bestehende Funktionen nicht unbeabsichtigt entfernen.
- Vor größeren strukturellen Änderungen kurz erklären, warum sie nötig sind.
- Änderungen direkt im bestehenden Projekt vornehmen.
- Keine unnötigen Bibliotheken oder zusätzliche Infrastruktur hinzufügen.
– Bei Konzeptionellen Änderungen auch diese Datei nach Rückfrage anpassen.