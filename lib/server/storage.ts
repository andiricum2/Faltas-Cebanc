import { cookies } from "next/headers";
import fs from "node:fs/promises";
import path from "node:path";

export function getBaseDir(): string {
  return process.env.APP_DATA_DIR || process.cwd();
}

export function getUserDataDir(dni: string): string {
  return path.join(getBaseDir(), ".data", dni);
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export async function readJsonFileOptional<T = unknown>(filePath: string): Promise<T | null> {
  try {
    return await readJsonFile<T>(filePath);
  } catch {
    return null;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmp = `${filePath}.tmp`;
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(tmp, json, "utf-8");
  try {
    await fs.rename(tmp, filePath);
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      // Ensure directory exists and retry
      await ensureDir(dir);
      await fs.rename(tmp, filePath);
      return;
    }
    if (err?.code === "EXDEV") {
      // Cross-device link not permitted; fall back to copy+unlink
      await fs.copyFile(tmp, filePath);
      await fs.rm(tmp, { force: true });
      return;
    }
    if (err?.code === "EEXIST" || err?.code === "EPERM" || err?.code === "EACCES" || err?.code === "EBUSY") {
      // Windows often cannot rename over existing files; try remove then rename, else copy+unlink
      try {
        await fs.rm(filePath, { force: true });
      } catch {}
      try {
        await fs.rename(tmp, filePath);
        return;
      } catch {}
      await fs.copyFile(tmp, filePath);
      await fs.rm(tmp, { force: true });
      return;
    }
    // Unknown error; clean up temp and rethrow
    try { await fs.rm(tmp, { force: true }); } catch {}
    throw err;
  }
}

export async function getCookieDni(): Promise<string | null> {
  const store = await cookies();
  return store.get("DNI")?.value || null;
}

export async function requireCookieDni(): Promise<string | null> {
  return await getCookieDni();
}
