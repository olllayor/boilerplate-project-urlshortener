require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const validUrl = require('valid-url');
const cors = require("cors");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const dbPath = "./db.json";

app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

app.use("/public", express.static(`${process.cwd()}/public`));

async function readDB() {
  try {
    const data = await fs.readFile(dbPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return { urls: [] }; // Default empty structure
  }
}

async function writeDB(db) {
  await fs.writeFile(dbPath, JSON.stringify(db));
}

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;
  
  try {
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith('http')) {
      return res.json({ error: 'invalid url' });
    }
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
  const db = await readDB();
  const shortUrl = db.urls.length + 1;

  db.urls.push({ original_url: url, short_url: shortUrl });
  await writeDB(db);

  res.json({ original_url: url, short_url: shortUrl });
});

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const db = await readDB();
  const urlEntry = db.urls.find(entry => entry.short_url == shortUrl);

  if (urlEntry) {
    res.redirect(urlEntry.original_url);
  }
  else {
    res.status(404).json({ error: 'URL not found' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
