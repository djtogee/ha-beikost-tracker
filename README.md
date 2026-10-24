# Beikost Tracker

Eine Lovelace-Karte für Home Assistant, die eine Lebensmittel-Liste zum Ausprobieren mit
dem Baby führt: **abhaken = schon probiert**, **Ja/Nein = mag sie/er es**, durchsuchbar,
gruppiert nach Kategorien und mit direktem Hinzufügen neuer Lebensmittel.

Die Daten liegen in ganz normalen **To-do-Listen** (`todo.*`) – sie funktionieren also
weiterhin in der Home-Assistant-To-do-Ansicht, in der Companion-App und in Assist.

## Installation über HACS

1. HACS öffnen → **Frontend** → oben rechts **⋮** → **Benutzerdefinierte Repositories**.
2. Repository-URL eintragen, Kategorie **Dashboard** (bzw. „Lovelace"), hinzufügen.
3. In der HACS-Liste **Beikost Tracker** öffnen → **Download**.
4. Browser hart neu laden (Cache).

HACS legt die Ressource selbst an – `/local/…`-Ressource nicht zusätzlich eintragen.

## Manuelle Installation

1. `beikost-tracker.js` nach `config/www/beikost/beikost-tracker.js` kopieren.
2. Einstellungen → Dashboards → **Ressourcen** → `/local/beikost/beikost-tracker.js`,
   Typ **JavaScript-Modul**.
3. Browser neu laden.

## To-do-Listen anlegen

Pro Kategorie eine lokale To-do-Liste über **Einstellungen → Geräte & Dienste → Helfer →
To-do-Liste**. Der Name muss mit `Beikost · ` beginnen (z. B. `Beikost · Obst`), daraus
entsteht `todo.beikost_obst`. Ohne `lists`-Option in der Karte werden **alle** Listen mit
diesem Präfix automatisch erkannt und alphabetisch angezeigt.

Empfehlung: Einträge ohne Status anlegen (offen = noch nicht probiert).

## Karte einbauen

```yaml
type: custom:beikost-tracker
title: Isabella · Beikost-Tracker
lists:                        # optional – gibt Reihenfolge und Icons vor
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
| `max_items` | `5` | sichtbare Einträge je Kategorie in der Normalansicht; der Rest wird über „N weitere anzeigen" aufgeklappt |

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
- **Suchfeld**: filtert über die angezeigten Kategorien, umlaut-tolerant („kurbis" findet „Kürbis").
- **Chips**: Alle · Noch offen · Probiert · Mag sie · Mag nicht.
- **Hinzufügen**: Text eingeben, Kategorie wählen → Eintrag landet in der To-do-Liste.
  Darunter erscheint eine grüne Bestätigung („✓ ‚Mango' zu ‚Obst' hinzugefügt"), die sich nach
  ein paar Sekunden von selbst ausblendet. Steht das Lebensmittel schon in der Kategorie, kommt
  stattdessen ein Hinweis und es wird nichts doppelt angelegt.
- **🗑**: Eintrag löschen.

## Wie die Daten gespeichert werden

- „probiert" = Status des To-do-Eintrags (`completed` / `needs_action`).
- „Ja/Nein" = Text in der Beschreibung des Eintrags: `mag: ja` bzw. `mag: nein`.
  Anderer Text in der Beschreibung bleibt erhalten (`Erst seit 10/2026 · mag: ja`).

Damit sind die Daten auch ohne diese Karte les- und pflegbar.

## Lizenz

MIT – siehe [LICENSE](LICENSE).
