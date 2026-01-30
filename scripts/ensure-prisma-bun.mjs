import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const prismaRoot = path.join(repoRoot, "node_modules", ".prisma");
const packageJsonPath = path.join(prismaRoot, "package.json");
const prismaClientRoot = path.join(repoRoot, "node_modules", "@prisma", "client");
const prismaClientLinkPath = path.join(prismaClientRoot, ".prisma");
const prismaClientLinkTarget = path.relative(prismaClientRoot, prismaRoot);

try {
  await mkdir(prismaRoot, { recursive: true });
} catch {
  // best-effort; generate may run in restricted environments
}

try {
  await mkdir(prismaClientRoot, { recursive: true });
} catch {
  // best-effort
}

let needsPackageJson = true;
try {
  const existing = await readFile(packageJsonPath, "utf8");
  needsPackageJson = existing.trim().length === 0;
} catch {
  // missing, fall through
}

try {
  await symlink(prismaClientLinkTarget, prismaClientLinkPath, "dir");
} catch {
  // best-effort; may already exist or be unsupported
}

if (needsPackageJson) {
  try {
    await writeFile(
      packageJsonPath,
      JSON.stringify({ name: ".prisma", private: true }, null, 2) + "\n",
      "utf8",
    );
  } catch {
    // best-effort; failing here should not block prisma generate
  }
}
