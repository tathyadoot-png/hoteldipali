import { runAudit, pageForFile, type TrustStatus } from "./content-audit";

const strict = process.argv.includes("--strict");

const result = runAudit();

const unverified = result.trustNodes.filter((n) => n.status !== "verified");

// Summary counts by status and by file.
const byStatus: Record<TrustStatus, number> = {
  sample: 0,
  "public-unverified": 0,
  verified: 0,
};
const byFile = new Map<string, number>();
for (const node of result.trustNodes) {
  byStatus[node.status] += 1;
  if (node.status !== "verified") {
    byFile.set(node.file, (byFile.get(node.file) ?? 0) + 1);
  }
}

console.log("\nContent trust report\n====================\n");

console.log("Counts by status (all tracked items/facts):");
console.log(`  sample             ${byStatus.sample}`);
console.log(`  public-unverified  ${byStatus["public-unverified"]}`);
console.log(`  verified           ${byStatus.verified}`);

console.log("\nUnverified items by file:");
for (const { file } of [...byFile.keys()].sort().map((file) => ({ file }))) {
  console.log(`  ${file.padEnd(32)} ${byFile.get(file)}  (${pageForFile(file)})`);
}

console.log(`\nUnverified items/facts (${unverified.length}):`);
for (const node of unverified) {
  const src = node.source ? ` · source: ${node.source}` : "";
  const note = node.note ? ` · note: ${node.note}` : "";
  console.log(`  [${node.status}] ${node.file} ${node.path} — ${node.label}${src}${note}`);
}

console.log(`\nFlags`);
console.log(`  placeholder images (/sample/):     ${result.placeholderImages.length}`);
console.log(`  placeholder phone numbers:         ${result.placeholderPhones.length}`);
console.log(`  reviews without permission:        ${result.reviewsNoPermission.length}`);
console.log(`  visible prices not verified:       ${result.priceVisibleUnverified.length}`);

const notVerified = unverified.length;

if (strict) {
  const problems =
    notVerified +
    result.placeholderImages.length +
    result.placeholderPhones.length +
    result.reviewsNoPermission.length +
    result.priceVisibleUnverified.length;
  if (problems > 0) {
    console.error(
      `\n✖ strict mode: ${problems} item(s) are not production-ready (nothing may remain unverified).\n`,
    );
    process.exit(1);
  }
  console.log("\n✓ strict mode: all content is verified.\n");
  process.exit(0);
}

console.log("\n(report mode — exits 0. Run with --strict to fail on anything unverified.)\n");
process.exit(0);
