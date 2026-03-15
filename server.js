const express = require("express");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const COMPOSITIONS_DIR = path.join(__dirname, "supercollider-experiments", "compositions");

app.use(express.json());
app.use(express.static(path.join(__dirname, "ui", "dist")));

// SQLite setup — single-row table holds the currently running process
const db = new Database(path.join(__dirname, "night.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS current_process (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    pid INTEGER NOT NULL,
    composition TEXT NOT NULL
  )
`);

function killCurrent() {
  const row = db.prepare("SELECT pid FROM current_process WHERE id = 1").get();
  if (row) {
    try { process.kill(row.pid, "SIGTERM"); } catch (_) {}
    db.prepare("DELETE FROM current_process WHERE id = 1").run();
  }
}

// Kill any orphaned sclang left over from a previous server run
killCurrent();

app.get("/api/compositions", (req, res) => {
  const entries = fs.readdirSync(COMPOSITIONS_DIR, { withFileTypes: true });
  const compositions = entries
    .filter((e) => e.isDirectory() && e.name !== "_shared")
    .map((e) => {
      const files = fs.readdirSync(path.join(COMPOSITIONS_DIR, e.name));
      const scd = files.find((f) => f.endsWith(".scd"));
      return { name: e.name, file: scd || null };
    });
  res.json(compositions);
});

app.get("/api/status", (req, res) => {
  const row = db.prepare("SELECT composition FROM current_process WHERE id = 1").get();
  res.json({ playing: row ? row.composition : null });
});

app.post("/api/play", (req, res) => {
  const { composition, file } = req.body;

  // Prevent path traversal
  if (!composition || !file ||
      composition.includes("..") || composition.includes("/") ||
      file.includes("..") || file.includes("/")) {
    return res.status(400).json({ error: "invalid input" });
  }

  const scdPath = path.join(COMPOSITIONS_DIR, composition, file);
  if (!fs.existsSync(scdPath)) {
    return res.status(404).json({ error: "file not found" });
  }

  killCurrent();

  const child = spawn("sclang", [scdPath], { detached: false });
  db.prepare(
    "INSERT OR REPLACE INTO current_process (id, pid, composition) VALUES (1, ?, ?)"
  ).run(child.pid, composition);

  res.json({ playing: composition, pid: child.pid });
});

app.post("/api/stop", (req, res) => {
  killCurrent();
  res.json({ playing: null });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "ui", "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
