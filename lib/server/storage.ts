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
  // Use a unique temp filename to avoid conflicts with concurrent writes
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const tmp = `${filePath}.tmp.${uniqueSuffix}`;
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(tmp, json, "utf-8");
  try {
    await fs.rename(tmp, filePath);
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      // Ensure directory exists and retry
      await ensureDir(dir);
      try {
        await fs.rename(tmp, filePath);
        return;
      } catch (e2: any) {
        // On Windows, rename can still fail due to locks; fall back to copy+unlink
        await fs.copyFile(tmp, filePath);
        await fs.rm(tmp, { force: true });
        return;
      }
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

// Funciones específicas para manejar la persistencia de snapshot y archivos relacionados
export async function loadSnapshot(): Promise<any> {
  try {
    const dni = await getCookieDni();
    if (!dni) {
      throw new Error("No DNI found in cookies");
    }

    const userDir = getUserDataDir(dni);
    const snapshotPath = path.join(userDir, "snapshot.json");

    const data = await fs.readFile(snapshotPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load snapshot:", error);
    return {};
  }
}

export async function saveSnapshot(snapshot: any): Promise<void> {
  try {
    const dni = await getCookieDni();
    if (!dni) {
      throw new Error("No DNI found in cookies");
    }

    const userDir = getUserDataDir(dni);
    const snapshotPath = path.join(userDir, "snapshot.json");

    await writeJsonFile(snapshotPath, snapshot);
  } catch (error) {
    console.error("Failed to save snapshot:", error);
    throw error;
  }
}

export async function saveTheme(theme: any): Promise<void> {
  try {
    const dni = await getCookieDni();
    if (!dni) {
      throw new Error("No DNI found in cookies");
    }

    const userDir = getUserDataDir(dni);
    const themePath = path.join(userDir, "theme.json");

    await writeJsonFile(themePath, theme);
  } catch (error) {
    console.error("Failed to save theme:", error);
    throw error;
  }
}