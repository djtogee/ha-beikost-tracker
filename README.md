# Beikost Tracker

Eine Lovelace-Karte für Home Assistant, die eine Lebensmittel-Liste zum Ausprobieren mit
dem Baby führt: **abhaken = schon probiert**, **Ja/Nein = mag sie/er es**, durchsuchbar,
gruppiert nach Kategorien und mit direktem Hinzufügen neuer Lebensmittel.

Die Daten liegen in ganz normalen **To-do-Listen** (`todo.*`) – sie funktionieren also
weiterhin in der Home-Assistant-To-do-Ansicht, in der Companion-App und in Assist.
Im Repo liegt ein Katalog mit **14 Kategorien und 291 Lebensmitteln**, den du in einem
Schritt einspielen kannst.

## Voraussetzungen

- Home Assistant **2023.12 oder neuer** (getestet bis 2026.x) – die Karte nutzt die
  To-do-Listen von HA (`local_todo` gibt es ab 2023.11, den Live-Abgleich
  `todo/item/subscribe` ab 2023.12).
- Für den bequemen Weg: [HACS](https://hacs.xyz) installiert.

## Installation über HACS

1. HACS öffnen → **Dashboard** (in älteren Versionen „Frontend") → oben rechts **⋮** →
   **Benutzerdefinierte Repositories**.
2. `https://github.com/djtogee/ha-beikost-tracker` eintragen, Kategorie **Dashboard** →
   hinzufügen.
3. In der HACS-Liste **Beikost Tracker** öffnen → **Download**.
4. Browser hart neu laden (Cache). HACS legt die Datei unter `www/community/` ab und trägt
   die Lovelace-Ressource selbst ein – **keine** `/local/…`-Ressource zusätzlich anlegen.
   Bei älteren HACS-Versionen die Ressource notfalls von Hand eintragen:
   `/hacsfiles/ha-beikost-tracker/beikost-tracker.js`, Typ **JavaScript-Modul**.

## Einrichtung (einmalig)

### 1. To-do-Listen anlegen

Pro Kategorie eine lokale To-do-Liste über **Einstellungen → Geräte & Dienste → Helfer →
To-do-Liste**. Der Name muss mit `Beikost · ` beginnen (Mittelpunkt mit Leerzeichen davor und
danach). Das lässt sich nicht per Skript oder YAML erledigen – `local_todo` ist ein reiner
Einrichtungsassistent. Aus dem Namen entsteht die Entität:

| Listenname (genau so anlegen) | Entität | Lebensmittel |
|---|---|---|
| `Beikost · Obst` | `todo.beikost_obst` | 40 |
| `Beikost · Gemüse` | `todo.beikost_gemuse` | 44 |
| `Beikost · Getreide & Beilagen` | `todo.beikost_getreide_beilagen` | 33 |
| `Beikost · Hülsenfrüchte` | `todo.beikost_hulsenfruchte` | 14 |
| `Beikost · Milch & Käse` | `todo.beikost_milch_kase` | 26 |
| `Beikost · Fleisch & Wurst` | `todo.beikost_fleisch_wurst` | 20 |
| `Beikost · Fisch` | `todo.beikost_fisch` | 15 |
| `Beikost · Ei` | `todo.beikost_ei` | 7 |
| `Beikost · Nüsse & Samen` | `todo.beikost_nusse_samen` | 16 |
| `Beikost · Kräuter & Gewürze` | `todo.beikost_krauter_gewurze` | 20 |
| `Beikost · Öle & Fette` | `todo.beikost_ole_fette` | 10 |
| `Beikost · Süßes & Snacks` | `todo.beikost_susses_snacks` | 19 |
| `Beikost · Getränke` | `todo.beikost_getranke` | 13 |
| `Beikost · Brotaufstriche & Sonstiges` | `todo.beikost_brotaufstriche_sonstiges` | 14 |

Die Entitäts-ID leitet Home Assistant aus dem Namen ab (Umlaute werden dabei aufgelöst), du
musst sie nicht selbst setzen. Die Karte erkennt alle Listen mit dem Präfix `Beikost`
automatisch und ordnet sie über den Listennamen dem Katalog zu.

### 2. Katalog einspielen (empfohlen)

`tools/setup.py` füllt die Lebensmittel in die angelegten Listen. Es ist idempotent –
vorhandene Einträge werden nicht doppelt angelegt, und es ändert nichts an abgehakten oder
bewerteten Einträgen.

```bash
# Trockenlauf: zeigt, was fehlt, und ändert nichts
HASS_URL=http://homeassistant.local:8123 HASS_TOKEN=<dein-token> python3 tools/setup.py

# Schreiben
HASS_URL=http://homeassistant.local:8123 HASS_TOKEN=<dein-token> python3 tools/setup.py --apply
```

Den Token erzeugst du in Home Assistant unter **Profil → Sicherheit → Long-Lived Access
Token**. Das Skript braucht nur Python 3 (keine Zusatzpakete) und läuft auf deinem Rechner
oder direkt auf dem HA-Host. Es liest Zustände und legt fehlende Einträge an; Listen selbst
erstellt es nicht.

Alternativ legst du die Lebensmittel von Hand an – `tools/katalog.json` ist eine einfache
Zuordnung `Kategorie → [Lebensmittel, …]` und lässt sich frei anpassen (eigene Kategorien,
andere Auswahl).

### 3. Karte einbauen

Dashboard bearbeiten → Karte hinzufügen → manuell (YAML):

```yaml
type: custom:beikost-tracker
title: Beikost-Tracker
```

Optional mit `lists:` gibst du Reihenfolge, Anzeigenamen und Icons vor:

```yaml
type: custom:beikost-tracker
title: Beikost-Tracker        # frei wählbar, z. B. „Lina · Beikost"
lists:
  - entity: todo.beikost_obst
    name: Obst
    icon: mdi:fruit-cherries
  - entity: todo.beikost_gemuse
    name: Gemüse
    icon: mdi:carrot
```

### Optionen

| Option | Standard | Bedeutung |
|---|---|---|
| `title` | `Beikost-Tracker` | Überschrift der Karte |
| `lists` | automatisch | Liste aus `entity`, `name`, `icon`; bestimmt die Reihenfolge |
| `auto_add_missing` | `true` | weitere `todo.beikost_*`-Listen hinten anhängen |
| `max_items` | `3` | sichtbare Einträge je Kategorie in der Normalansicht; der Rest wird über „N weitere anzeigen" aufgeklappt |

## Bedienung

- **✓** neben dem Namen: schon probiert (To-do-Status *erledigt*). Ist der Eintrag bereits mit
  Ja/Nein bewertet, kommt beim Entfernen des Häkchens eine Rückfrage; nach dem Bestätigen sind
  Häkchen **und** Bewertung weg (Verdrück-Schutz).
- **Ja / Nein**: mag das Kind das Lebensmittel. Setzt automatisch „probiert".
  Denselben Knopf nochmal antippen nimmt die Angabe zurück (war der Eintrag vorher offen,
  wird er dabei auch wieder geöffnet) – so lassen sich Fehlgriffe korrigieren.
- **Kategorie-Auswahl** (oben): „Alle Kategorien (N)" oder eine einzelne Kategorie als
  Ansichtsfilter; wirkt zusammen mit Suche und Chips.
- Der obere Bereich ist in zwei beschriftete Abschnitte geteilt: **„Anzeige-Filter"** (Suche,
  Kategorie-Auswahl, Chips) und **„Neues Lebensmittel"** (Eingabefeld + Kategorie + Hinzufügen).
- **Suchfeld**: filtert über alle Kategorien, umlaut-tolerant („kurbis" findet „Kürbis").
  Kategorien ohne Treffer werden dabei ausgeblendet; findet sich gar nichts, kommt ein zentraler
  Hinweis („Keine Treffer für Suche ‚xyz'").
- **Chips**: Alle · Noch offen · Probiert · Mag sie · Mag nicht — dieselbe Regel: nur Kategorien
  mit Treffern bleiben stehen, kombinierbar mit Suche und Kategorie-Auswahl.
- **Hinzufügen**: Text eingeben, Kategorie wählen → Eintrag landet in der To-do-Liste.
  Darunter erscheint eine grüne Bestätigung („✓ ‚Mango' zu ‚Obst' hinzugefügt"), die sich nach
  ein paar Sekunden von selbst ausblendet. Steht das Lebensmittel schon in der Kategorie, kommt
  stattdessen ein Hinweis und es wird nichts doppelt angelegt.
- **🗑**: Eintrag löschen.

## Wie die Daten gespeichert werden

- „probiert" = Status des To-do-Eintrags (`completed` / `needs_action`).
- „Ja/Nein" = Text in der Beschreibung des Eintrags: `mag: ja` bzw. `mag: nein`.
  Anderer Text in der Beschreibung bleibt erhalten (`Erst seit 10/2026 · mag: ja`).

Damit sind die Daten auch ohne diese Karte les- und pflegbar – jede To-do-Karte, die
Companion-App und Assist arbeiten mit denselben Listen.

## Manuelle Installation (ohne HACS)

1. `beikost-tracker.js` nach `config/www/beikost/beikost-tracker.js` kopieren.
2. Einstellungen → Dashboards → **Ressourcen** → `/local/beikost/beikost-tracker.js`,
   Typ **JavaScript-Modul**.
3. Browser neu laden.

## Dateien im Repo

| Datei | Zweck |
|---|---|
| `beikost-tracker.js` | die Karte (das Einzige, was HACS installiert) |
| `hacs.json` | HACS-Manifest (Name, Dateiname, Mindestversion) |
| `tools/katalog.json` | 14 Kategorien mit 291 Lebensmitteln |
| `tools/setup.py` | spielt den Katalog in die To-do-Listen ein (Trockenlauf / `--apply`) |
| `CHANGELOG.md` | Versionshistorie |

## Lizenz

MIT – siehe [LICENSE](LICENSE).
