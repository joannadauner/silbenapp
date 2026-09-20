# Silben-App – Roadmap

## Projektziel

Die Web-App unterstützt Kinder beim Lesenlernen mit der Silbenmethode.

Eltern können wöchentlich neue Silben eintragen. Die App zeigt freigeschaltete Silben zufällig an und unterstützt Wiederholung, schrittweisen Lernfortschritt und später auch Wörter sowie optional Spracherkennung.

Die Anwendung soll:

- plattformunabhängig funktionieren
- auf Smartphone, Tablet und Desktop nutzbar sein
- möglichst datenschutzfreundlich sein
- ohne Benutzerkonto funktionieren
- ohne Backend auskommen
- möglichst einfach wartbar bleiben
- langfristig auch von anderen Familien genutzt werden können

Technisch soll die App zunächst nur aus:

- HTML
- CSS
- Vanilla JavaScript

bestehen.

Keine Frameworks, kein React und keine Datenbank, solange diese nicht wirklich notwendig werden.

---

# Version 0.1 – Grundfunktion

## Ziel

Eine erste vollständig nutzbare Version zum Testen des Lernprinzips.

## Funktionen

- Silben nach Wochen verwalten
- neue Wochen hinzufügen
- Silben lokal im Browser speichern
- Übungsrunde starten
- 15 reguläre Aufgaben pro Runde
- zufällige Auswahl der Silben
- aktuelle Woche stärker gewichten
- ältere Wochen weiterhin einbeziehen
- gleiche Silbe möglichst nicht direkt hintereinander anzeigen
- Silben zufällig darstellen als:
  - `ma`
  - `Ma`
- drei Bewertungen:
  - Richtig
  - Nochmal
  - bei „Nochmal“ oder „Weiß ich nicht“:
  - Silbe später erneut anzeigen
  - nicht direkt wiederholen
  - exakte Schreibweise erhalten
- Abschlussbildschirm nach der Übungsrunde

## Status

Umgesetzt.

---

# Version 0.2 – Lernlogik verbessern

## Ziel

Die Übungslogik robuster und lernpsychologisch sinnvoller machen.

## 0.2.1 – Übungswochen per Checkbox auswählen

Eltern wählen unter „Silben einstellen“ beliebige Wochen unabhängig voneinander
über Checkboxen aus. Das Dropdown für eine einzelne aktuelle Woche entfällt.
Nur angehakte Wochen werden für neue Aufgaben und offene Wiederholungen verwendet.

Beispiel: Sind Woche 1 und Woche 3 angehakt, werden nur deren Silben geübt.
Woche 2 wird nicht automatisch einbezogen. Woche 3 ist als höchste ausgewählte
Woche bei der Erzeugung neuer Aufgaben stärker gewichtet: Sind beide Silbenpools
gefüllt, entfallen 60 % der Auswahlwahrscheinlichkeit auf diese Woche und 40 %
auf die übrigen ausgewählten Wochen zusammen. Das ist keine feste Quote pro Runde.

Die Auswahl wird in localStorage gespeichert. Beim ersten Laden mit der neuen
Auswahl werden die bisher aktuelle und ihre vorherigen Wochen als Häkchen übernommen.
Neu hinzugefügte Wochen sind zunächst abgewählt. Zum Start muss mindestens eine
Woche mit Silben ausgewählt sein.

Offene Wiederholungen bleiben beim Abwählen einer Woche gespeichert. Sie warten,
bis ihre Silbe wieder in einer ausgewählten Woche enthalten ist. Kommt dieselbe
Silbe auch in einer anderen angehakten Woche vor, darf sie weiterhin geübt werden.
Die exakte Schreibweise des Wiederholungsauftrags bleibt erhalten.

### Status

Umgesetzt.

---

## 0.2.2 – Wiederholungslogik verbessern

### Ziel

Falsch oder unsicher gelesene Silben sollen zuverlässig erneut erscheinen.

### Gewünschtes Verhalten

- Start mit 15 Aufgaben: neue Aufgaben und bis zu fünf offene Wiederholungen gemischt
- ohne offene Wiederholungen werden 15 neue Aufgaben erzeugt
- zusätzliche Wiederholungen möglichst nach 3–5 anderen Aufgaben
- maximal 20 angezeigte Aufgaben pro Runde, unabhängig von der Fehlerzahl
- keine Leben und kein Abbruch wegen unsicherer Antworten
- offene Wiederholungen sofort in localStorage speichern und in nächste Runden übernehmen
- pro exakter Schreibweise nur ein offener Auftrag (`Ma` und `ma` bleiben getrennt)
- „Richtig“ erledigt den Auftrag und entfernt seine noch eingeplante Wiederholung
- übernommene Aufträge bleiben bis zur richtigen Antwort gespeichert, auch bei Neuladen
- nur ausgewählte Wochen werden verwendet; offene Aufträge für Silben außerhalb
  dieser Auswahl bleiben gespeichert und warten auf erneute Auswahl
- aus den Wochen entfernte Silben werden beim nächsten gültigen Rundenstart bereinigt

### Fortschrittsanzeige

Grüner Fortschrittsbalken im Stickerstil ohne sichtbaren Aufgabenzähler.
Am Rundenende erscheint „Für heute geschafft!“.

### Status

Umgesetzt. Offene Wiederholungen bleiben auch über die Grenze von 20 Aufgaben
hinaus für spätere Runden gespeichert. Am Rundenende können Wiederholungen
früher als nach drei anderen Aufgaben erscheinen, wenn weniger Aufgaben übrig sind.

---

## Visuelles Rundenfeedback (Ticket #2)

Umgesetzt: Der Abschluss zeigt eine feste, große SVG-Grafik. Alle drei Motive
sind gleich groß, zentral und durch ihre Form ohne Lesen unterscheidbar.

- Goldener Pokal: keine unsichere Antwort in der aktuellen Runde.
- Silberner Stern mit freundlichem Gesicht: mindestens eine unsichere Antwort,
  anschließend alle in dieser Runde unsicheren Schreibweisen richtig beantwortet.
- Grüner Haken im Kreis: bei Aufgabe 20 sind noch Schreibweisen aus dieser Runde offen.

Die letzte Antwort je exakter Schreibweise zählt; `Ma` und `ma` bleiben getrennt.
Nicht gezeigte gespeicherte Wiederholungen beeinflussen das Ergebnis nicht.
Direkt richtig gelesene übernommene Wiederholungen verhindern den Pokal nicht.
Es gibt keine zusätzliche Fehlergrenze für den Silberstern. Die Bewertung wird
bei jeder Runde zurückgesetzt und nicht dauerhaft gespeichert. Offene
Wiederholungen bleiben wie bisher in localStorage erhalten.

Die Grafiken haben zugängliche Textbeschreibungen; ergänzende kurze Texte richten
sich an Eltern. Keine Fehlerzahlen, Warnsymbole oder leeren Bewertungssterne.
„Noch eine Runde“ und „Zur Startseite“ bleiben verfügbar.

---

## Feedback nach jeder Silbe (Ticket #3)

Nach „Richtig“ erscheint ein grüner Haken, nach „Nochmal“
eine Lupe als feste SVG-Grafik rechts neben der Silbe, vertikal mittig, eingeblendet.
Die bewertete Silbe bleibt während des 1,0 Sekunden langen Overlays unverändert sichtbar, danach folgt automatisch
die nächste Aufgabe. Auch die letzte Antwort erhält Feedback vor der Rundenauszeichnung.

Währenddessen sind alle Antwortbuttons gesperrt; zusätzliche Bewertungen werden
ignoriert. Das Symbol liegt als Overlay über der Silbe, ohne das Layout zu verschieben.
Eine Textbeschreibung wird für Screenreader bereitgestellt. Es gibt keine Töne,
blinkenden Animationen oder negativen Symbole. Wiederholungen werden sofort gespeichert.
Eine neue Runde entfernt altes Feedback und bricht einen noch laufenden Timer ab.

---

# Version 0.3 – Interface vereinfachen

## Ziel

Die Aufmerksamkeit des Kindes stärker auf die Silbe lenken.

## Übungsansicht

Umgesetzt in Ticket #4: Zwei große Bewertungsbuttons zeigen ausschließlich
feste SVG-Symbole, ohne sichtbaren Text:

- Häkchen: „Richtig“, mit grünem Häkchen als Feedback.
- Lupe: „Nochmal“, mit blauer Lupe als Feedback.

Die zugänglichen Namen „Richtig“ und „Nochmal“ bleiben für Screenreader erhalten.
„Weiß ich nicht“ entfällt. Die Feedbackdauer von 1,0 Sekunden, die Klicksperre,
Wiederholungslogik, Speicherung und Rundenauszeichnungen bleiben unverändert.

## Anforderungen

- große Touchflächen
- geeignet für Tablet und Smartphone
- klare visuelle Hierarchie
- Silbe bleibt das wichtigste Element
- möglichst wenig Ablenkung
- keine unnötigen Animationen
- ruhige Rückmeldung statt starker Gamification

---

## Elternmodus

Die App soll zunächst davon ausgehen, dass ein Erwachsener die Antwort bewertet.

Das Kind konzentriert sich hauptsächlich auf die Silbe.

Der Erwachsene bedient:

- Richtig
- Nochmal

Später kann zusätzlich ein Selbstlernmodus entstehen.

---

# Version 0.4 – Wörter

## Status

Zweisilbige Wörter sind umgesetzt und werden mit einzelnen Silben in derselben
Runde geübt. Es gibt keinen separaten Wortmodus.

## Eingabe und Darstellung

Eltern tragen Wörter in die vorhandenen Wochenfelder ein. Ein Bindestrich markiert
die Silbengrenze: `O-mi, Mo-mo, O-mo, I-mo, Mi-mi, Mi-mo, Mi-o`.
Einträge bleiben durch Kommas getrennt. Leerzeichen um den Bindestrich werden entfernt.
Bei genau zwei nicht leeren Teilen wird der erste dunkelblau und der zweite rot
angezeigt, ohne sichtbaren Bindestrich und ohne Lücke im Wort.

Neue Aufgaben erscheinen wie bisher zufällig klein oder mit großem Anfangsbuchstaben,
z. B. `omi` oder `Omi`. Wiederholungen behalten Schreibweise und Silbengrenze exakt.
Wochenauswahl, Gewichtung, lokale Speicherung, Rundengröße, Feedback und Auszeichnungen
gelten für Wörter genauso wie für einzelne Silben. Bestehende Einträge ohne
Bindestrich werden weiterhin einfarbig angezeigt.

---

# Version 0.5 – Selbstlernmodus

## Ziel

Das Kind kann die App auch ohne direkte Bewertung durch einen Erwachsenen verwenden.

## Möglicher Ablauf

```text
Mi

[Weiter]
```

Das Kind liest laut und geht anschließend selbst weiter.

Optional:

```text
Nochmal ansehen
```

Eine Selbstbewertung mit „richtig“ oder „falsch“ ist nicht notwendig.

---

# Version 0.6 – Spracherkennung experimentell

## Ziel

Die App versucht automatisch zu erkennen, ob die angezeigte Silbe richtig gelesen wurde.

## Grundprinzip

```text
Silbe erscheint
↓
Kind liest laut
↓
Spracherkennung
↓
Ergebnis prüfen
```

Mögliche Ergebnisse:

```text
richtig
unsicher
nicht erkannt
```

Bei Unsicherheit:

```text
Noch einmal
```

Nicht sofort:

```text
Falsch
```

## Anforderungen

- Kinderstimmen sind schwieriger zu erkennen als Erwachsenenstimmen
- einzelne Silben sind schwieriger als ganze Wörter
- keine falsche Sicherheit erzeugen
- Spracherkennung nur als Zusatzfunktion
- manueller Modus muss immer verfügbar bleiben

## Datenschutz

Bevorzugt:

- lokale Verarbeitung im Browser
- keine dauerhafte Speicherung von Audio
- keine Benutzerkonten
- keine Übertragung von Sprachdaten, wenn vermeidbar

Cloud-basierte Spracherkennung nur prüfen, wenn lokale Lösungen nicht ausreichend funktionieren und der Datenschutz transparent geklärt ist.

---

# Version 0.7 – Progressive Web App

## Ziel

Die Web-App soll sich wie eine installierbare App verhalten.

## Funktionen

- PWA-Manifest
- eigenes Icon
- auf Homescreen installierbar
- Offline-Nutzung
- weiterhin normale Nutzung im Browser möglich

Unterstützte Geräte:

- iPhone
- iPad
- Android
- Desktop

---

# Version 0.8 – Nutzung durch andere Familien

## Ziel

Die App soll ohne technische Vorkenntnisse von anderen Eltern genutzt werden können.

## Funktionen

- kurze Einführung
- verständlicher Elternbereich
- Beispiel-Silben beim ersten Start
- Einstellungen zurücksetzen
- optional Export und Import der Silben

Mögliche Funktion:

```text
Silbenplan exportieren
```

Dadurch könnten Eltern oder Lehrkräfte vorbereitete Lernsets teilen, ohne Benutzerkonten oder Datenbank zu benötigen.

---

# Version 0.9 – Lernlogik weiterentwickeln

## Ziel

Die Auswahl der Silben kann später intelligenter gewichtet werden.

Nur umsetzen, wenn Tests zeigen, dass dies sinnvoll ist.

## Mögliche Gewichtung

```text
aktuelle Woche     50 %
letzte Woche       25 %
ältere Wochen      25 %
```

## Innerhalb einer Sitzung

Zusätzlich könnte berücksichtigt werden:

- häufig falsch gelesene Silben erscheinen häufiger
- richtig gelesene Silben erscheinen seltener
- schwierige Silben werden zeitversetzt erneut gezeigt

Wichtig:

Keine dauerhafte Leistungsbewertung des Kindes notwendig.

Die Anpassung kann ausschließlich innerhalb einer Sitzung erfolgen.

---

# Version 1.0 – Öffentliche stabile Version

## Ziel

Eine einfache, stabile und öffentlich nutzbare Lern-App.

## Mindestumfang

- Silben verwalten
- Wochen verwalten
- Übungswochen unabhängig per Checkbox auswählen
- sinnvolle Wiederholungslogik
- Groß- und Kleinschreibung
- Elternmodus
- Wörter
- einfache Bedienung
- mobile Nutzung
- lokale Datenspeicherung
- PWA
- Datenschutzhinweise
- keine Benutzerkonten
- kein Backend

Spracherkennung ist für Version 1.0 optional und darf die normale Nutzung nicht voraussetzen.

---

# Spätere Ideen

Nicht Teil des aktuellen Entwicklungsziels.

Mögliche Erweiterungen:

- Wortlisten aus vorhandenen Silben generieren
- Fantasiewörter
- Lesen ganzer kurzer Sätze
- Laut-Buchstaben-Training
- individuelle Gewichtung schwieriger Silben
- mehrere Lernprofile auf einem Gerät
- Teilen von Lernsets
- Lehrkraft-Modus
- vordefinierte Lernsets für verschiedene Silbenmethoden
- unterschiedliche Schwierigkeitsstufen
- optionale Audioausgabe
- unterschiedliche Übungsmodi

Diese Funktionen sollen erst geprüft werden, wenn die grundlegende App erfolgreich getestet wurde.

---

# Entwicklungsprinzipien

Bei jeder neuen Funktion gilt:

1. Die App soll einfach bleiben.
2. Bestehende Funktionen dürfen nicht unbeabsichtigt verschwinden.
3. Datenschutz hat hohe Priorität.
4. Keine unnötigen Abhängigkeiten einführen.
5. Keine Frameworks verwenden, solange HTML, CSS und JavaScript ausreichen.
6. Mobile Nutzung immer mitdenken.
7. Große Touchflächen verwenden.
8. Kindgerechte Gestaltung bedeutet nicht automatisch Gamification.
9. Lernlogik zuerst testen, danach technische Komplexität erhöhen.
10. Spracherkennung darf nie Voraussetzung für die Nutzung sein.
11. Neue Funktionen sollen zuerst möglichst einfach umgesetzt und getestet werden.
12. Die App soll auch ohne technische Vorkenntnisse verständlich bedienbar sein.

---

# Technische Grundstruktur

Die App besteht aktuell aus:

```text
silben-app/
│
├── index.html
├── style.css
├── app.js
├── AGENTS.md
└── ROADMAP.md
```

## index.html

Enthält:

- Seitenstruktur
- Screens
- Buttons
- Eingabefelder
- Elternbereich
- Übungsbereich

## style.css

Enthält:

- Layout
- Typografie
- Größen
- Touchflächen
- responsive Gestaltung

## app.js

Enthält:

- Wochenverwaltung
- localStorage
- Zufallsauswahl
- Übungslogik
- Wiederholungslogik
- Navigation zwischen Screens
- Groß- und Kleinschreibung
- Fortschrittsanzeige

## AGENTS.md

Enthält Regeln dafür, wie Codex am Projekt arbeiten soll.

## ROADMAP.md

Enthält Entwicklungsziele und geplante Versionen.

---

# Aktueller Entwicklungsstand

Aktuell vorhanden:

- HTML/CSS/JavaScript-Projekt
- lokale Entwicklung mit VS Code
- Live Server
- Wochenverwaltung
- localStorage
- neue Wochen hinzufügen
- zufällige Silbenauswahl
- stärkere Gewichtung der höchsten ausgewählten Woche
- freie Wochenauswahl per Checkbox mit lokaler Speicherung
- nur ausgewählte Wochen werden verwendet
- zufällige Groß-/Kleinschreibung
- exakte Schreibweise bei Wiederholung
- 15 Startaufgaben mit eingemischten offenen Wiederholungen, maximal 20 Aufgaben
- Wiederholungen möglichst nach 3–5 anderen Aufgaben
- grüner Fortschrittsbalken im Stickerstil, keine Leben
- offene Wiederholungen lokal über mehrere Runden speichern
- zwei Symbolbuttons: Häkchen (Richtig) und Lupe (Nochmal)
- Abschlussbildschirm
- Codex in VS Code eingerichtet

---

# Abschluss Version 0.2.2

## Version 0.2.2

Wiederholungslogik umgesetzt und anhand automatisierter Logikprüfungen geprüft.

Ziel:

- 15 Startaufgaben einschließlich übernommener Wiederholungen
- Wiederholungen auch nach Aufgabe 15 anzeigen
- maximal 20 Aufgaben
- offene Wiederholungen bis zur Obergrenze bearbeiten und den Rest für spätere Runden speichern
- exakte Schreibweise beibehalten
- verständliche Fortschrittsanzeige

Nächster Entwicklungsschritt:

## Version 0.3

Interface der Übungsansicht vereinfachen.


## Fortschrittsbalken

Der Balken beginnt leer. Bei „Richtig“ wächst er um den Anteil der Reststrecke,
der einer noch eingeplanten Aufgabe entspricht. Bei „Nochmal“ bleibt er stehen;
zusätzliche Wiederholungen werden bei der Größe der folgenden Schritte berücksichtigt.
Er geht nie zurück. Beim Rundenende wird er immer vollständig gefüllt, auch wenn
nach 20 Aufgaben noch Wiederholungen offen sind. Der volle Balken erscheint schon
während des letzten einsekündigen Stickerfeedbacks vor dem Abschlussbildschirm.
Eine neue Runde setzt ihn zurück. Grün (#40e866), weißer Rand und Schatten passen
zu den Feedbackstickern. Der Fortschrittswert ist für Screenreader zugänglich.


## Bewertungsbuttons und vorzeitiges Beenden

Die beiden Symbolbuttons für „Richtig“ und „Nochmal“ haben einen weißen Stickerrand
und Schatten. In der Übungsansicht befindet sich oben rechts ein blaues X auf grauem Hintergrund
mit dem zugänglichen Namen „Runde vorzeitig beenden“.
Nach einer bestätigten Rückfrage kehrt die App ohne Rundenauszeichnung zur Startseite
zurück. Ein laufender Feedbacktimer wird abgebrochen; bereits gespeicherte offene
Wiederholungen bleiben erhalten. Wird die Rückfrage abgebrochen, geht die Runde weiter.
