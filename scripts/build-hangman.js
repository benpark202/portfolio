const fs = require("node:fs");
const path = require("node:path");
const { stripTypeScriptTypes } = require("node:module");

const rootDir = path.join(__dirname, "..");
const sourcePath = path.join(rootDir, "projects/hangman/script.ts");
const outputPath = path.join(rootDir, "projects/hangman/script.js");

const source = fs.readFileSync(sourcePath, "utf8");
const transformed = stripTypeScriptTypes(source, { mode: "transform" });

fs.writeFileSync(outputPath, transformed);

// eslint-disable-next-line no-console
console.log(`Built ${path.relative(rootDir, outputPath)}`);
