# Changelog

Alle nennenswerten Änderungen an dieser Karte.

## 1.11.0 – 2026-10-24

- **Eigener Bestätigungsdialog statt `window.confirm`:** Beim Entfernen eines Häkchens mit
  vorhandener Bewertung und beim Löschen eines Eintrags erscheint die Rückfrage jetzt in der
  Karte – mit „Abbrechen" **und** der Bestätigung. Vorher zeigte der Browser-Dialog in der
  Companion-App bzw. in WebViews teils nur ein einzelnes „OK", ein Abbrechen war nicht möglich.
  Escape oder ein Klick neben den Dialog bricht ebenfalls ab.
- **Schrift und Bedienelemente einen Tick größer:** Lebensmittelnamen, Ja/Nein-Knöpfe, Chips,
  Häkchen (27 px, Icon 18 px), Eingabefelder, Hinzufügen-Knopf, Zähler und Hinweiszeile – alles
  etwa 5–8 % größer, Zeilen etwas luftiger für die Fingerbedienung

## 1.10.3 – 2026-10-24

- README-Korrektur: Unter „Voraussetzungen" stand 2023.12, während `hacs.json` 2024.1.0
  erzwingt. Jetzt nennt das README den tatsächlich geprüften Wert (2024.1.0) und erklärt,
  warum die technisch nötige Untergrenze (2023.12) darunter liegt
- Nur Doku, die Karte selbst unverändert

## 1.10.2 – 2026-10-24

- **Screenshot im README** (`docs/screenshot.jpg`) – zeigt die Karte im Handy-Hochformat
  (Anzeige-Filter, Neues Lebensmittel, Kategorien mit Ja/Nein und Zählern)
- Nur Doku/Bild, die Karte selbst unverändert

## 1.10.1 – 2026-10-24

- **Neutral für fremde Nutzer:** Beim Hinzufügen der Karte wird als Titel nur noch
  „Beikost-Tracker" vorgeschlagen (vorher ein personalisierter Name); der Titel ist frei
  wählbar (`title:` in der Karten-Konfiguration), z. B. mit dem Namen des Kindes
- Kopfkommentar der Karte und README-Beispiele ohne Personennamen
- Neuer Test im Testlauf: die Karte darf keinen Personennamen enthalten

## 1.10.0 – 2026-10-24

Kein Funktionswechsel an der Karte – dieses Release macht das Repo für andere nutzbar:

- **Lebensmittel-Katalog liegt jetzt im Repo** (`tools/katalog.json`, 14 Kategorien,
  291 Lebensmittel)
- **`tools/setup.py`** spielt den Katalog in die eigenen To-do-Listen ein: Trockenlauf als
  Standard, `--apply` schreibt, idempotent (nichts wird doppelt angelegt), erkennt fehlende
  Listen und nennt sie zum Anlegen
- **README komplett überarbeitet:** Schritt-für-Schritt-Einrichtung (Listen anlegen, Katalog
  einspielen, Karte einbauen), Tabelle aller 14 Listennamen, Voraussetzungen
- **Mindest-Home-Assistant-Version von 2026.1.0 auf 2024.1.0 gesenkt** – die Karte braucht nur
  die To-do-Listen (ab 2023.11) und den Live-Abgleich `todo/item/subscribe` (ab 2023.12);
  vorher blockierte HACS Installationen auf älteren Versionen

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
