# Changelog

Alle nennenswerten Änderungen an dieser Karte.

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
