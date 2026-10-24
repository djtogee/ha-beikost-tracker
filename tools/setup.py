#!/usr/bin/env python3
"""Beikost-Tracker: Lebensmittel-Katalog in die eigenen To-do-Listen einspielen.

Die Listen selbst lassen sich *nicht* per Skript anlegen (local_todo ist ein
Config-Flow-Helfer ohne YAML-Support). Dieses Skript füllt daher nur die
Einträge in bereits vorhandene Listen und sagt dir genau, welche Listen noch
fehlen.

Aufruf:
    # 1) Listen im HA-UI anlegen (Namen siehe Ausgabe unten / README)
    # 2) Trockenlauf (zeigt nur, was passieren würde):
    HASS_URL=http://homeassistant.local:8123 HASS_TOKEN=<token> python3 setup.py
    # 3) Schreiben:
    HASS_URL=... HASS_TOKEN=... python3 setup.py --apply

Alternativ als Argumente: --url http://... --token eyJ...
Der Token ist ein Long-Lived Access Token (HA-Profil -> Sicherheit -> Token erstellen).
Das Skript ist idempotent: bereits vorhandene Einträge werden nicht doppelt angelegt.
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PREFIX = "beikost"  # todo.beikost_*


def norm(text):
    """Vergleichsform: Kleinschreibung, Umlaute/ß aufgelöst, Sonderzeichen weg."""
    text = text.lower().replace("ä", "a").replace("ö", "o").replace("ü", "u").replace("ß", "ss")
    text = text.replace("&", " ").replace("·", " ")
    return " ".join(re.sub(r"[^a-z0-9]+", " ", text).split())


class HA:
    def __init__(self, url, token):
        self.url = url.rstrip("/")
        self.token = token

    def call(self, path, payload=None):
        data = json.dumps(payload).encode() if payload is not None else None
        req = urllib.request.Request(
            self.url + path,
            data=data,
            headers={"Authorization": "Bearer " + self.token, "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode()
        return json.loads(body) if body.strip() else None

    def states(self):
        return self.call("/api/states") or []

    def items(self, entity_id):
        """Vorhandene Einträge einer Liste (rekursiv aus der Service-Antwort gezogen)."""
        result = self.call(
            "/api/services/todo/get_items?return_response",
            {"entity_id": entity_id, "status": ["needs_action", "completed"]},
        )
        found = []

        def walk(node):
            if isinstance(node, dict):
                if "summary" in node:
                    found.append(str(node["summary"]))
                for value in node.values():
                    walk(value)
            elif isinstance(node, list):
                for value in node:
                    walk(value)

        walk(result)
        return found

    def add(self, entity_id, summary):
        self.call("/api/services/todo/add_item", {"entity_id": entity_id, "item": summary})


def load_katalog(path):
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        sys.exit(f"{path}: erwartet ein Objekt {{Kategorie: [Lebensmittel, …]}}")
    return data


def main():
    ap = argparse.ArgumentParser(description="Beikost-Katalog in die HA-To-do-Listen einspielen")
    ap.add_argument("--url", default=os.environ.get("HASS_URL"), help="z. B. http://homeassistant.local:8123")
    ap.add_argument("--token", default=os.environ.get("HASS_TOKEN"), help="Long-Lived Access Token")
    ap.add_argument("--katalog", default=os.path.join(HERE, "katalog.json"))
    ap.add_argument("--apply", action="store_true", help="wirklich schreiben (sonst nur Trockenlauf)")
    args = ap.parse_args()

    if not args.url or not args.token:
        sys.exit("HASS_URL und HASS_TOKEN nötig (Umgebungsvariablen oder --url/--token).")

    katalog = load_katalog(args.katalog)
    ha = HA(args.url, args.token)

    lists = {}
    for state in ha.states():
        entity_id = state.get("entity_id", "")
        if entity_id.startswith(f"todo.{PREFIX}_"):
            lists[entity_id] = state.get("attributes", {}).get("friendly_name", entity_id)

    print(f"Katalog: {len(katalog)} Kategorien, {sum(len(v) for v in katalog.values())} Lebensmittel")
    print(f"In Home Assistant gefundene Beikost-Listen: {len(lists)}")
    print("Modus:", "SCHREIBEN (--apply)" if args.apply else "Trockenlauf (nichts wird geändert)")

    # Zuordnung Katalog-Kategorie -> Liste über den Listennamen (ohne "Beikost"-Präfix)
    by_name = {}
    for entity_id, friendly in lists.items():
        key = norm(re.sub(r"^beikost\b", "", norm(friendly).replace(PREFIX, "")))
        by_name[key] = (entity_id, friendly)

    missing_lists = []
    plan = []
    for category, foods in katalog.items():
        entry = by_name.pop(norm(category), None)
        if entry is None:
            missing_lists.append(category)
            continue
        entity_id, friendly = entry
        existing = ha.items(entity_id)
        have = {norm(summary) for summary in existing}
        todo = [food for food in foods if norm(food) not in have]
        plan.append({
            "category": category, "friendly": friendly, "entity": entity_id,
            "total": len(foods), "count": len(existing), "todo": todo,
        })

    unknown = list(by_name.values())

    print()
    for row in plan:
        todo = row["todo"]
        mark = "OK " if not todo else "-> "
        extra = f", {len(todo)} fehlen" if todo else ""
        print(f"  {mark}{row['category']:28s} {row['entity']:38s} "
              f"{row['count']:3d} Einträge ({row['total']} im Katalog){extra}")
        if todo:
            print(f"       fehlt noch: {', '.join(todo[:8])}"
                  + (f" … (+{len(todo) - 8} weitere)" if len(todo) > 8 else ""))

    if missing_lists:
        print("\nDiese Listen fehlen noch — bitte im UI anlegen")
        print("(Einstellungen -> Geräte & Dienste -> Helfer -> To-do-Liste, Name exakt so):")
        for category in missing_lists:
            print(f"  Beikost · {category}")

    if unknown:
        print("\nListen ohne Katalog-Eintrag (bleiben unangetastet):")
        for entity_id, friendly in unknown:
            print(f"  {friendly}  ({entity_id})")

    additions = sum(len(row["todo"]) for row in plan)
    print(f"\nFehlende Einträge gesamt: {additions}")

    if not args.apply:
        print("Trockenlauf beendet — mit --apply werden die Einträge geschrieben.")
        return

    written = 0
    failed = 0
    for row in plan:
        for food in row["todo"]:
            try:
                ha.add(row["entity"], food)
                written += 1
            except urllib.error.HTTPError as exc:
                failed += 1
                print(f"  FEHLER {food} -> {row['friendly']}: {exc.code} {exc.reason}")
    print(f"\nGeschrieben: {written} Einträge" + (f", Fehler: {failed}" if failed else ""))
    print("Fertig — die Karte zeigt die neuen Einträge sofort (Listen sind abonniert).")


if __name__ == "__main__":
    main()
