import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function ensureSqliteDirectory(databaseUrl: string): void {
  if (!databaseUrl.startsWith("file:")) return;

  const fileUrl = databaseUrl.slice("file:".length);
  if (!fileUrl) return;

  let filePath: string | undefined;

  if (fileUrl.startsWith("//")) {
    try {
      filePath = fileURLToPath(databaseUrl);
    } catch {
      return;
    }
  } else {
    const [rawPath] = fileUrl.split("?", 2);
    if (!rawPath) return;
    filePath = rawPath;
  }

  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
}
