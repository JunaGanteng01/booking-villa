import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const generatedClient = fileURLToPath(
  new URL("../node_modules/.prisma/client/default.js", import.meta.url),
);

let needsGeneration = true;

try {
  const clientSource = readFileSync(generatedClient, "utf8");
  needsGeneration = clientSource.includes("PrismaClient did not initialize yet");
} catch {
  needsGeneration = true;
}

if (!needsGeneration) {
  console.log("Prisma Client already generated; skipping prisma generate.");
  process.exit(0);
}

const prismaCli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url),
);
const result = spawnSync(process.execPath, [prismaCli, "generate"], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
