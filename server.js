const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const COMPOSITIONS_DIR = path.join(__dirname, "supercollider-experiments", "compositions");

app.use(express.static(path.join(__dirname, "ui", "dist")));

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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "ui", "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
