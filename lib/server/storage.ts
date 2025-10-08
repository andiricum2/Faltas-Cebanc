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
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, filePath);
}

export async function getCookieDni(): Promise<string | null> {
  const store = await cookies();
  return store.get("DNI")?.value || null;
}

export async function requireCookieDni(): Promise<string | null> {
  return await getCookieDni();
}
