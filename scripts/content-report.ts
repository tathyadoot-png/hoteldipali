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

// Needed by pages and features but not (yet) a field in /content, so the
// audit above cannot see them. Keep in step with docs/PLAN.md open questions.
const ALSO_NEEDED: ReadonlyArray<{ group: string; items: string[] }> = [
  {
    group: "Footer & Contact page",
    items: [
      "**Department phone lines** — Restaurant, Bakery & Sweets, Infinity Bar, Pool & Gym and Reception are sample placeholders, so the footer and the contact page leave them out (only Reservations and Weddings & Events show). Supply the real numbers and they appear automatically.",
      "**Reception email** — sample; not shown anywhere until confirmed.",
      "**Social profiles** — the footer shows a social link only once it is `verified`. Confirm that facebook.com/hoteldeepalisagar is the hotel's own page, and supply the Instagram handle (and any others).",
      "**Legal pages** — Privacy Policy, Terms, Booking & Cancellation: the footer links them only once their pages exist (`isBuiltRoute` in `src/lib/routes.ts`). Supply the texts (or approve drafts) — step 13.",
      "**Hosted form endpoint** — `NEXT_PUBLIC_FORM_ENDPOINT` (+ access key) for production. Without it every enquiry form shows \"Online enquiries aren't connected yet\" with Call / WhatsApp instead.",
      "**Copy approval** — the footer invitation (\"We look forward to welcoming you\", \"Book a stay, or tell us what you are planning.\"), the contact page's lead and enquiry copy, and the enquiry choices (\"A stay, A wedding, An event, Dining, Pool & gym, Something else\").",
      "**The lamps** — the footer's row of oil lamps is a decorative motif (Dipali/Deepali evokes a row of lamps). Confirm the hotel is happy with it; no claim about the name is made on the site.",
    ],
  },
];

lines.push("## Also needed (not yet in /content)");
lines.push("");
for (const { group, items } of ALSO_NEEDED) {
  lines.push(`### ${group}`);
  lines.push("");
  for (const item of items) lines.push(`- [ ] ${item}`);
  lines.push("");
}

lines.push("---");
lines.push("");
lines.push(
  `Totals: ${unverified.length} items/facts to confirm · ${result.placeholderImages.length} photos to replace · ${ALSO_NEEDED.reduce((n, g) => n + g.items.length, 0)} further items above.`,
);
lines.push("");

const out = join(process.cwd(), "docs", "data-needed.md");
writeFileSync(out, lines.join("\n"), "utf8");
console.log(`Wrote ${out} (${unverified.length} items, ${result.placeholderImages.length} photos).`);
