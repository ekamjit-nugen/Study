// Prints the exact lesson slugs and titles of one module, so lesson bodies can be keyed correctly.
// Usage: npx tsx scripts/slugs.ts 7
import { MODULES } from "../src/path/index";

const n = Number(process.argv[2]);
const m = MODULES.find((x) => x.num === n);
if (!m) {
  console.error("No module " + process.argv[2]);
  process.exit(1);
}
console.log(`Module ${m.num}: ${m.title}\nGoal: ${m.goal}${m.examples ? "\nExamples: " + m.examples : ""}\n`);
for (const l of m.lessons) console.log(`${l.body ? "✓" : "·"} ${l.slug}    ${l.title}`);
