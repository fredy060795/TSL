# TSL – Tactical Situation Log

Leichtgewichtiges Lagetagebuch für taktische Lagen.

## Funktion

- **Einheitenliste** (Sidebar): Einheiten hinzufügen / entfernen; werden automatisch in den Dropdowns verfügbar
- **Neuer Eintrag**: Zeit (automatisch), Von, An, Art, Inhalt — mit Enter oder Schaltfläche eintragen
- **Arten**: Anforderung · Truppenmeldung · Feindmeldung · Meldung · Sonstiges
- **Lagetagebuch**: fortlaufend nummeriert, farbige Badges pro Art, scrollbar
- **Export**: CSV-Export aller Einträge
- **Persistenz**: Daten werden auf dem Server in einer SQLite-Datenbank gespeichert (Fallback: IndexedDB / localStorage)

## Nutzung (Server-Betrieb)

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18 oder neuer)

### Installation

```bash
npm install
```

### Starten

**Windows:**
```
start.bat
```

**Linux / macOS / CMD:**
```bash
node server.js
```

Der Server läuft auf **Port 5008**.  
Im Browser öffnen: [http://localhost:5008](http://localhost:5008)

Der Port kann über die Umgebungsvariable `PORT` geändert werden:
```bash
PORT=8080 node server.js
```

### Datenbank

Die Daten werden in `tsl.db` (SQLite) im Projektverzeichnis gespeichert.  
Die Datei wird beim ersten Start automatisch erstellt.

### Dateistruktur

```
TSL/
├── public/          # Frontend-Dateien (HTML, Bilder)
│   ├── index.html
│   ├── KARTE.jpg
│   └── SITREP.jfif
├── server.js        # Backend (Express + SQLite)
├── start.bat        # Windows-Startskript
├── package.json
└── tsl.db           # Datenbank (wird automatisch erstellt)
```
