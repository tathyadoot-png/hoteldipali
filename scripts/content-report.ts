import { writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  CONTENT_FILES,
  pageForFile,
  runAudit,
  type PlaceholderImage,
  type TrustNode,
} from "./content-audit";

const result = runAudit();
const today = new Date().toISOString().slice(0, 10);

// Preserve the page order declared in CONTENT_FILES.
const pageOrder: string[] = [];
for (const { page } of CONTENT_FILES) {
  if (!pageOrder.includes(page)) pageOrder.push(page);
}

function groupByPage<T extends { file: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const page = pageForFile(item.file);
    const list = map.get(page) ?? [];
    list.push(item);
    map.set(page, list);
  }
  return map;
}

const unverified = result.trustNodes.filter((n) => n.status !== "verified");
const nodesByPage = groupByPage(unverified);
const photosByPage = groupByPage(result.placeholderImages);

const lines: string[] = [];
lines.push("# Data needed — Hotel Dipali");
lines.push("");
lines.push("> Auto-generated — do not edit by hand; run `pnpm content:report`.");
lines.push("");
lines.push(`Last generated: ${today}`);
lines.push("");
lines.push(
  "Everything below is still **sample** (we invented it) or **public-unverified** " +
    "(found online, not confirmed by the hotel). The hotel needs to confirm or replace " +
    "each item before launch. See also `docs/public-data.md`.",
);
lines.push("");

function describe(node: TrustNode): string {
  const parts: string[] = [`**${node.label}**`, `_(${node.status})_`];
  if (node.note) parts.push(`— ${node.note}`);
  if (node.source) parts.push(`· source: ${node.source}`);
  parts.push(`· \`${node.path}\``);
  return parts.join(" ");
}

lines.push("## What to confirm or supply");
lines.push("");
for (const page of pageOrder) {
  const nodes = nodesByPage.get(page);
  if (!nodes || nodes.length === 0) continue;
  lines.push(`### ${page}`);
  lines.push("");
  for (const node of nodes) {
    lines.push(`- [ ] ${describe(node)}`);
  }
  lines.push("");
}

lines.push("## Photos needed");
lines.push("");
lines.push(
  "Every image below is a labelled placeholder. Provide an original photograph " +
    "matching the described shot and aspect ratio; file names can stay the same.",
);
lines.push("");

function describePhoto(photo: PlaceholderImage): string {
  return `${photo.shot} — aspect ${photo.aspect} · \`${photo.src}\``;
}

for (const page of pageOrder) {
  const photos = photosByPage.get(page);
  if (!photos || photos.length === 0) continue;
  lines.push(`### ${page}`);
  lines.push("");
  for (const photo of photos) {
    lines.push(`- [ ] ${describePhoto(photo)}`);
  }
  lines.push("");
}

lines.push("---");
lines.push("");
lines.push(
  `Totals: ${unverified.length} items/facts to confirm · ${result.placeholderImages.length} photos to replace.`,
);
lines.push("");

const out = join(process.cwd(), "docs", "data-needed.md");
writeFileSync(out, lines.join("\n"), "utf8");
console.log(`Wrote ${out} (${unverified.length} items, ${result.placeholderImages.length} photos).`);
