const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const rootDir = __dirname;
const workDataPath = path.join(rootDir, "./lib/work.json");

app.use(express.json());

app.get("/projects/melanoma", (_request, response) => {
  response.sendFile(path.join(rootDir, "projects/melanoma/index.html"));
});

app.use(express.static(rootDir));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "portfolio-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/work", async (_request, response) => {
  try {
    const fileContents = await fs.readFile(workDataPath, "utf8");
    const payload = JSON.parse(fileContents);
    response.json(payload);
  } catch (_error) {
    response.status(500).json({
      ok: false,
      error: "Unable to load work data",
    });
  }
});

app.get("/", (_request, response) => {
  response.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Portfolio server running at http://localhost:${port}`);
});
