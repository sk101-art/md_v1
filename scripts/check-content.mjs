// Validates content/*.json. Plain Node, no dependencies. Run: node scripts/check-content.mjs
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const errors = [];
const root = fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "content");
const docs = {};

for (const f of readdirSync(dir).filter(f => f.endsWith(".json"))) {
  try {
    docs[f] = JSON.parse(readFileSync(join(dir, f), "utf8"));
  } catch (e) {
    errors.push(`${f}: invalid JSON (${e.message})`);
  }
}

// 1. Validate events.json
const events = docs["events.json"]?.events;
const validStatuses = new Set(["upcoming", "open", "completed", "archived"]);

if (!Array.isArray(events)) {
  errors.push("events.json: missing 'events' array");
} else {
  const seen = new Set();
  events.forEach((ev, i) => {
    const id = `events.json event #${i + 1} (${ev.slug || ev.name || "?"})`;
    for (const k of ["slug", "name", "semester", "description"]) {
      if (!ev[k] || typeof ev[k] !== "string") errors.push(`${id}: missing string field '${k}'`);
    }
    if (ev.slug) {
      if (!/^[a-z0-9-]+$/.test(ev.slug)) errors.push(`${id}: slug must match ^[a-z0-9-]+$`);
      if (seen.has(ev.slug)) errors.push(`${id}: duplicate slug '${ev.slug}'`);
      seen.add(ev.slug);
    }
    if (ev.semester && !/^\d\d-\d\d (Odd|Even) Sem$/.test(ev.semester)) {
      errors.push(`${id}: semester must look like '24-25 Odd Sem'`);
    }
    if (ev.status && !validStatuses.has(ev.status)) {
      errors.push(`${id}: status '${ev.status}' must be one of: ${[...validStatuses].join(", ")}`);
    }
    for (const p of ev.photos || []) {
      if (String(p).startsWith("data:")) {
        errors.push(`${id}: photo is a data: URL`);
      } else if (!/^(https?:)?\/\//.test(p)) {
        const f = join(root, String(p).replace(/^\//, ""));
        if (!existsSync(f)) {
          errors.push(`${id}: photo not found on disk: ${p}`);
        } else {
          if (!/\.(jpe?g|png|webp|svg)$/i.test(p)) errors.push(`${id}: unsupported image type: ${p}`);
          const kb = statSync(f).size / 1024;
          if (kb > 1500) console.warn(`warning: ${p} is ${Math.round(kb)} KB (consider compressing)`);
        }
      }
    }
  });
}

// 2. Validate team.json
const team = docs["team.json"];
if (!team || !Array.isArray(team.current)) {
  errors.push("team.json: missing 'current' array");
} else {
  team.current.forEach((m, i) => {
    if (!m.name || !m.role) errors.push(`team.json current #${i + 1}: missing name or role`);
  });
}

// 3. Validate achievements.json
const ach = docs["achievements.json"];
if (!ach || !Array.isArray(ach.stats) || !Array.isArray(ach.apps)) {
  errors.push("achievements.json: missing stats or apps array");
}

// 4. Validate site.json
const site = docs["site.json"];
if (!site || !site.name || !site.hero_title) {
  errors.push("site.json: missing basic club name or hero title");
}

// 5. Check admin/cms/config.yml for placeholder
try {
  const cmsConfig = readFileSync(join(root, "admin/cms/config.yml"), "utf8");
  if (cmsConfig.includes("YOUR_GITHUB_USERNAME")) {
    console.warn("warning: admin/cms/config.yml still contains YOUR_GITHUB_USERNAME");
  }
} catch {}

if (errors.length) {
  console.error(errors.map(e => "error: " + e).join("\n"));
  process.exit(1);
}
console.log("content ok (all schemas valid)");
