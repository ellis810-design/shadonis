/**
 * Parses content/readings.md and writes constants/interpretations.ts
 * Run: npm run readings:sync
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mdPath = path.join(root, "content", "readings.md");
const outPath = path.join(root, "constants", "interpretations.ts");

const PLANETS = new Set([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]);
const ANGLES = new Set(["asc", "dsc", "mc", "ic"]);

function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

function parseReadings(md) {
  const chunks = md.split(/^## /m);
  const readings = [];
  const errors = [];

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    const lines = chunk.split("\n");
    const headerLine = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();

    const sep = headerLine.includes("·") ? "·" : "/";
    const parts = headerLine.split(sep).map((p) => p.trim().toLowerCase());
    if (parts.length < 2) {
      errors.push(`Bad heading (use "planet · angle"): ## ${headerLine}`);
      continue;
    }
    const [planet, angle] = parts;
    if (!PLANETS.has(planet) || !ANGLES.has(angle)) {
      errors.push(`Unknown planet/angle in: ## ${headerLine}`);
      continue;
    }

    const sections = {};
    const subParts = body.split(/^### /m);
    for (let j = 1; j < subParts.length; j++) {
      const sub = subParts[j];
      const nl = sub.indexOf("\n");
      const title = (nl === -1 ? sub : sub.slice(0, nl)).trim().toLowerCase();
      const text = (nl === -1 ? "" : sub.slice(nl + 1)).trim();

      if (title.startsWith("short theme")) sections.shortTheme = normalizeWhitespace(text);
      else if (title.startsWith("what it feels")) sections.whatItFeelsLike = text.trim();
      else if (title.startsWith("best use")) sections.bestUseCases = normalizeWhitespace(text);
      else if (title.startsWith("watch out")) sections.watchOuts = normalizeWhitespace(text);
    }

    const missing = ["shortTheme", "whatItFeelsLike", "bestUseCases", "watchOuts"].filter(
      (k) => !sections[k]
    );
    if (missing.length) {
      errors.push(`## ${planet} · ${angle}: missing ${missing.join(", ")}`);
      continue;
    }

    readings.push({
      planet,
      angle,
      shortTheme: sections.shortTheme,
      whatItFeelsLike: sections.whatItFeelsLike.replace(/\n+/g, " ").trim(),
      bestUseCases: sections.bestUseCases,
      watchOuts: sections.watchOuts,
    });
  }

  return { readings, errors };
}

function emitTs(readings) {
  const rows = readings.map((r) => {
    const w = (s) => JSON.stringify(s);
    return `  {\n    planet: ${w(r.planet)},\n    angle: ${w(r.angle)},\n    whatItFeelsLike:\n      ${w(r.whatItFeelsLike)},\n    bestUseCases:\n      ${w(r.bestUseCases)},\n    watchOuts:\n      ${w(r.watchOuts)},\n    shortTheme: ${w(r.shortTheme)},\n  }`;
  });

  return `import { Interpretation } from "../types";

/**
 * AUTO-GENERATED from content/readings.md — do not edit by hand.
 * Run \`npm run readings:sync\` after changing the markdown source.
 */
export const STATIC_INTERPRETATIONS: Omit<Interpretation, "id" | "updatedAt">[] = [
${rows.join(",\n")},
];
`;
}

const md = fs.readFileSync(mdPath, "utf8");
const { readings, errors } = parseReadings(md);

if (errors.length) {
  console.error("sync-readings: issues:\n", errors.join("\n"));
  process.exit(1);
}

if (readings.length === 0) {
  console.error("sync-readings: no readings parsed from", mdPath);
  process.exit(1);
}

fs.writeFileSync(outPath, emitTs(readings), "utf8");
console.log(`sync-readings: wrote ${readings.length} entries → constants/interpretations.ts`);
