# Systemarchitektur: Black Wolves Website

Status: Entwurf
Datum: 2026-07-07

## Ziel

Eine schlanke, DSGVO-bewusste Website für die Black Wolves Volleyballmannschaft aus Salzburg. Die Seite startet statisch, funktioniert ohne eigene Fotos und kann später um Fotos, News, Spielberichte und eine automatisch aktualisierte Landesliga-Tabelle erweitert werden.

## Entscheidungen

- Website-Typ: statische Website
- Hosting-Ziel: GitHub Pages
- Domain: später, bevorzugt `.at`, alternativ `.com`
- Repository-Name: voraussichtlich `blackwolves`
- Vereinsfarben: Schwarz und Rot
- Sektion: Herren Landesliga
- Social Media: nur normale Links, keine eingebetteten Feeds
- Datenschutz: keine Cookies, keine Tracker, keine externen Fonts

## Zielbild

```text
Lokaler Projektordner
      |
      | Entwicklung
      v
GitHub Repository
      |
      | GitHub Pages
      v
Kostenloses Hosting bei GitHub
      |
      | Custom Domain später
      v
.at oder .com Domain
```

## Seitenstruktur

- Startseite
- Verein / Mannschaft
- Training
- Landesliga
- Links
- Kontakt
- Impressum und Datenschutz später

## Landesliga-Daten

Zum Start zeigt die Website einen Platzhalter für die Tabelle und einen offiziellen Link zu OeVV/Volleynet. Später kann die Tabelle automatisch aus einer offiziellen SVV-/OeVV-Quelle übernommen werden.

Bevorzugter technischer Weg:

1. Ein kleines Script holt die Daten.
2. Die Daten werden als statische Datei gespeichert.
3. Die Website zeigt die zuletzt gespeicherte Tabelle.
4. Falls der Import fehlschlägt, bleibt die alte Tabelle sichtbar.

## Datenschutzregeln

- Keine externen Google Fonts
- Keine Instagram- oder Facebook-Embeds
- Keine Analyse-Tools
- Kontakt zunächst per E-Mail-Link statt Formular
- Fotos nur mit Einwilligung der abgebildeten Personen
- Impressum und Datenschutzerklärung vor Onlinegang ergänzen

## Offene Punkte

- Trainingszeiten
- Trainingshalle und Adresse
- echte Instagram-URL
- echte Facebook-URL
- offizielle SVV-/Landesliga-Links
- Vereinsname für Impressum
- Kontaktadresse
- Domainauswahl `.at` oder `.com`
