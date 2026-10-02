import { readFileSync } from "node:fs";
import { join } from "node:path";

// Importing the barrel runs every loader's module-level Zod validation.
import "@/content";
import { PLACEHOLDER_PHONE } from "@/content/schemas";

export type TrustStatus = "sample" | "public-unverified" | "verified";

const TRUST = new Set<TrustStatus>(["sample", "public-unverified", "verified"]);

export type TrustNode = {
  file: string;
  path: string;
  label: string;
  status: TrustStatus;
  source?: string;
  note?: string;
};

export type PlaceholderImage = {
  file: string;
  path: string;
  src: string;
  shot: string;
  aspect: string;
};

export type AuditResult = {
  trustNodes: TrustNode[];
  placeholderImages: PlaceholderImage[];
  placeholderPhones: Array<{ file: string; path: string }>;
  reviewsNoPermission: Array<{ file: string; path: string }>;
  priceVisibleUnverified: Array<{ file: string; path: string; status: TrustStatus }>;
};

// Content files in load order, mapped to a reader-friendly page bucket.
export const CONTENT_FILES: Array<{ file: string; page: string }> = [
  { file: "site.json", page: "Site-wide & Contact" },
  { file: "rooms.json", page: "Rooms" },
  { file: "venues.json", page: "Weddings & Events" },
  { file: "outlets.json", page: "Dining" },
  { file: "menus/restaurant.json", page: "Dining" },
  { file: "leisure.json", page: "Pool & Gym" },
  { file: "faqs.json", page: "FAQ" },
  { file: "reviews.json", page: "Home (reviews)" },
  { file: "gallery.json", page: "Gallery" },
  { file: "offers.json", page: "Offers" },
];

export function pageForFile(file: string): string {
  const normalized = file.replace(/^content\//, "");
  return CONTENT_FILES.find((c) => c.file === normalized)?.page ?? "Other";
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function labelFor(node: UnknownRecord, path: string): string {
  for (const key of ["name", "title", "question", "slug", "id", "department", "label"]) {
    const v = node[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  const seg = path.split(".").pop();
  return seg ?? path;
}

function walk(
  node: unknown,
  path: string,
  file: string,
  inheritedStatus: TrustStatus | undefined,
  ctx: AuditResult,
): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, file, inheritedStatus, ctx));
    return;
  }
  if (!isRecord(node)) return;

  let status = inheritedStatus;
  const ownStatus = node.status;
  if (typeof ownStatus === "string" && TRUST.has(ownStatus as TrustStatus)) {
    status = ownStatus as TrustStatus;
    ctx.trustNodes.push({
      file,
      path: path || "(root)",
      label: labelFor(node, path),
      status,
      source: typeof node.source === "string" ? node.source : undefined,
      note: typeof node.note === "string" ? node.note : undefined,
    });
  }

  if (typeof node.src === "string" && node.src.startsWith("/sample/")) {
    ctx.placeholderImages.push({
      file,
      path,
      src: node.src,
      shot: typeof node.shot === "string" ? node.shot : "",
      aspect: typeof node.aspect === "string" ? node.aspect : "",
    });
  }

  if (node.value === PLACEHOLDER_PHONE) {
    ctx.placeholderPhones.push({ file, path });
  }

  if (node.permissionToPublish === false) {
    ctx.reviewsNoPermission.push({ file, path });
  }

  if (node.currency === "INR" && node.showOnSite === true && status !== "verified") {
    ctx.priceVisibleUnverified.push({ file, path, status: status ?? "sample" });
  }

  for (const [key, value] of Object.entries(node)) {
    walk(value, path ? `${path}.${key}` : key, file, status, ctx);
  }
}

export function runAudit(): AuditResult {
  const ctx: AuditResult = {
    trustNodes: [],
    placeholderImages: [],
    placeholderPhones: [],
    reviewsNoPermission: [],
    priceVisibleUnverified: [],
  };

  for (const { file } of CONTENT_FILES) {
    const raw = readFileSync(join(process.cwd(), "content", file), "utf8");
    const data: unknown = JSON.parse(raw);
    walk(data, "", `content/${file}`, undefined, ctx);
  }

  return ctx;
}
