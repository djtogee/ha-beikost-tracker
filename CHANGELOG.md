# Changelog

Alle nennenswerten Änderungen an dieser Karte.

## 1.9.0 – 2026-10-24

- **Noch kompakter:** In der Normalansicht zeigt jede Kategorie jetzt nur noch die ersten **3**
  Einträge (vorher 5); der Rest bleibt über „▸ N weitere anzeigen" erreichbar
- Einstellbar wie bisher über `max_items` in der Karten-Konfiguration

## 1.8.0 – 2026-10-24

- **Suche und Filter zeigen nur noch Kategorien mit Treffern:** Kategorien ohne passende
  Einträge werden beim Suchen oder bei aktivem Chip komplett ausgeblendet (vorher stand in
  jeder davon nur „Keine Einträge gefunden" im Weg)
- Findet die Suche/der Filter **gar nichts**, erscheint einmal zentral ein Hinweis, der beides
  benennt: „Keine Treffer für Suche ‚xyz' + Filter ‚Mag sie nicht'"
- Die Normalansicht (keine Suche, Chip „Alle") bleibt unverändert: alle Kategorien sichtbar,
  gekürzt auf `max_items`

## 1.7.0 – 2026-10-24

- **Klarere Gliederung oben:** Der Filterbereich (Suche, Kategorie-Auswahl, Chips) trägt jetzt die
  Überschrift **„Anzeige-Filter"**, der Eingabebereich die Überschrift **„Neues Lebensmittel"** –
  jeweils in kleiner Großschrift mit dünner Trennlinie über die Kartenbreite
- Damit ist auf einen Blick erkennbar, wofür die Bedienelemente da sind (filtern vs. eintragen)
- Nur Darstellung, keine Verhaltensänderung

## 1.6.0 – 2026-10-24

- **Bestätigung beim Hinzufügen:** Nach „Hinzufügen" erscheint unter der Eingabezeile eine
  grüne Meldung „✓ ‚Mango' zu ‚Obst' hinzugefügt"; sie blendet sich nach ~4 s von selbst aus
- Fehler werden sichtbar gemeldet statt still verschluckt: leeres Eingabefeld („Bitte zuerst
  einen Namen eingeben."), kein Schreibzugriff möglich („… konnte nicht hinzugefügt werden")
- Doppelte Einträge werden erkannt (Groß-/Kleinschreibung und Umlaute egal) und nicht zweimal
  angelegt: „‚Apfel' steht schon in ‚Obst'"
- Meldung ist mit `role="status"` ausgezeichnet und wird auch von Screenreadern vorgelesen

## 1.5.0 – 2026-10-23

- Wird das Häkchen „probiert" nach der Rückfrage entfernt, wird jetzt **auch die
  Ja/Nein-Bewertung gelöscht** – der Eintrag steht danach wieder komplett unbewertet da

## 1.4.0 – 2026-10-23

- Verdrück-Schutz: Das Häkchen „probiert" lässt sich bei einem Eintrag mit Ja/Nein-Bewertung
  nur nach einer Rückfrage entfernen („… ist schon mit Ja bewertet – Häkchen wirklich
  entfernen?"). Die Bewertung bleibt dabei erhalten.
- Abhaken selbst und Einträge ohne Bewertung fragen weiterhin nicht nach

## 1.3.0 – 2026-10-23

- Ja/Nein lässt sich zurücknehmen: derselbe Knopf nochmal antippen löscht die Angabe.
  War der Eintrag vorher „offen", wird er dabei auch wieder geöffnet (Verdrücker korrigierbar)
- Tooltip an den Knöpfen + Hinweiszeile erklärt das Zurücknehmen
- Häkchen-Kreis etwas kleiner (25 px statt 29 px, Icon 17 px) – Schriftgrößen unverändert

## 1.2.0 – 2026-10-23

- Neue Kategorie-Auswahl in der Werkzeugleiste: „Alle Kategorien (N)" oder eine einzelne
  Kategorie als Ansichtsfilter – kombinierbar mit Suche und den Filter-Chips
- Kopfzeilen-Statistik zeigt bei aktiver Auswahl nur diese Kategorie
- Der „Hinzufügen"-Bereich springt automatisch auf die gewählte Kategorie

## 1.1.1 – 2026-10-23

- Schrift und Bedienelemente einen Tick größer: Lebensmittelnamen, Ja/Nein-Buttons
  (mehr Fläche zum Treffen), Häkchen, Chips, Eingabefelder, Löschen-Symbol
- Etwas mehr Zeilenabstand für Finger-Bedienung auf dem Handy

## 1.1.0 – 2026-10-23

- Kompakter: pro Kategorie werden nur die ersten 5 Einträge gezeigt
  („▸ N weitere anzeigen" / „weniger anzeigen"), konfigurierbar über `max_items`
- Kürzung greift nur in der Normalansicht – sobald gesucht oder gefiltert wird, sind alle
  Treffer sichtbar
- Alphabetische Sortierung je Kategorie bleibt Standard

## 1.0.0 – 2026-10-23

Erste Version.

- Suchbare Lebensmittel-Liste, gruppiert nach Kategorien
- Abhaken = „schon probiert", Ja/Nein = „mag sie es" (gespeichert in `todo`-Beschreibung)
- Filter-Chips: Alle · Noch offen · Probiert · Mag sie · Mag nicht
- Neue Einträge direkt in der Karte anlegen, Einträge löschen
- Zähler je Kategorie und gesamt
- Kategorien automatisch aus `todo.beikost_*` oder per `lists`-Option (Reihenfolge + Icons)
