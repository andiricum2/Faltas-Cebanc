import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { FaltasClient } from "@/lib/http/faltasClient";
import { parseMostrarAlumno, buildSnapshot } from "@/lib/http/scraper";
import { getAcademicYearRange, enumerateMondaysBetween, isoToDDMMYYYY } from "@/lib/utils";
import { logger } from "@/lib/logging/appLogger";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("PHPSESSID")?.value;
    if (!session) {
      return new Response(JSON.stringify({ ok: false, errorMessage: "Not authenticated" }), { status: 401 });
    }

    const client = new FaltasClient();
    client.setSession(session);

    const { start, end } = getAcademicYearRange(new Date());
    const mondays = enumerateMondaysBetween(start, end);

    const weeks = [] as ReturnType<typeof parseMostrarAlumno>["week"][];
    let identity: ReturnType<typeof parseMostrarAlumno>["identity"] | null = null;
    let legend: ReturnType<typeof parseMostrarAlumno>["legend"] | null = null;
    let percentages: ReturnType<typeof parseMostrarAlumno>["percentages"] | null = null;

    // simple limiter
    const concurrency = 4;
    let idx = 0;
    async function worker() {
      while (true) {
        const i = idx++;
        if (i >= mondays.length) break;
        const mondayISO = mondays[i];
        // retry up to 3 times with backoff
        let attempt = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const html = await client.fetchMostrarAlumno({ date: isoToDDMMYYYY(mondayISO) });
            const parsed = parseMostrarAlumno(html);
            if (!identity) identity = parsed.identity;
            if (!legend) legend = parsed.legend;
            if (!percentages) percentages = parsed.percentages;
            weeks[i] = parsed.week; // keep order
            break;
          } catch (err: any) {
            attempt += 1;
            if (attempt >= 3) {
              logger.error({ msg: "Week fetch failed", mondayISO, error: String(err?.message || err) });
              throw err;
            }
            const delayMs = 300 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100);
            await new Promise((r) => setTimeout(r, delayMs));
          }
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, mondays.length) }, () => worker()));

    if (!identity || !legend || !percentages) {
      return new Response(JSON.stringify({ ok: false, errorMessage: "Unable to parse data" }), { status: 500 });
    }

    const snapshot = buildSnapshot(weeks, identity, legend, percentages);

    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    const baseDir = path.join(baseBase, ".data", snapshot.identity.dni);
    await fs.mkdir(baseDir, { recursive: true });
    // atomic-ish writes
    await fs.writeFile(path.join(baseDir, "snapshot.json.tmp"), JSON.stringify(snapshot, null, 2), "utf-8");
    await fs.rename(path.join(baseDir, "snapshot.json.tmp"), path.join(baseDir, "snapshot.json"));
    await fs.writeFile(path.join(baseDir, "weeks.json.tmp"), JSON.stringify(weeks, null, 2), "utf-8");
    await fs.rename(path.join(baseDir, "weeks.json.tmp"), path.join(baseDir, "weeks.json"));
    await fs.writeFile(path.join(baseDir, "legend.json.tmp"), JSON.stringify(snapshot.legend, null, 2), "utf-8");
    await fs.rename(path.join(baseDir, "legend.json.tmp"), path.join(baseDir, "legend.json"));
    await fs.writeFile(path.join(baseDir, "percentages.json.tmp"), JSON.stringify(snapshot.percentages, null, 2), "utf-8");
    await fs.rename(path.join(baseDir, "percentages.json.tmp"), path.join(baseDir, "percentages.json"));

    // refresh session cookie if renewed during scraping
    const renewed = client.getSession();
    if (renewed && renewed !== session) {
      cookieStore.set({ name: "PHPSESSID", value: renewed, httpOnly: true, path: "/" });
    }

    // ensure DNI is available for subsequent snapshot reads
    cookieStore.set({ name: "DNI", value: snapshot.identity.dni, httpOnly: true, secure: true, sameSite: "lax", path: "/" });

    return new Response(JSON.stringify({ ok: true, dni: snapshot.identity.dni, weeks: weeks.length }), { status: 200 });
  } catch (error: any) {
    logger.error({ msg: "Unhandled error in sync", error: String(error?.message || error) });
    return new Response(JSON.stringify({ ok: false, errorMessage: "Internal error" }), { status: 500 });
  }
}


