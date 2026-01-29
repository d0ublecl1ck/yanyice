import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const prismaRoot = path.join(repoRoot, "node_modules", ".prisma");
const packageJsonPath = path.join(prismaRoot, "package.json");

try {
  await mkdir(prismaRoot, { recursive: true });
} catch {
  // best-effort; generate may run in restricted environments
}

try {
  const existing = await readFile(packageJsonPath, "utf8");
  if (existing.trim().length > 0) process.exit(0);
} catch {
  // missing, fall through
}

try {
  await writeFile(
    packageJsonPath,
    JSON.stringify({ name: ".prisma", private: true }, null, 2) + "\n",
    "utf8",
  );
} catch {
  // best-effort; failing here should not block prisma generate
}

