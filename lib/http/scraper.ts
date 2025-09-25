import * as cheerio from "cheerio";
import { AggregatedStats, GlobalPercentages, LegendAbsenceTypes, LegendModules, SessionCell, StudentSnapshot, UserIdentity, WeekSessions } from "@/lib/types/faltas";
import { extractAbsenceCode } from "@/lib/utils";

function parseIdentity($: cheerio.CheerioAPI): UserIdentity {
  const titleTexts = $(".form-title h2").toArray().map((el) => $(el).text().trim()).filter(Boolean);
  const first = titleTexts[0] || "";
  const second = titleTexts[1] || "";
  const m = /^(.*)\s+(\w{7,9}[A-Z])$/.exec(first.replace(/,/g, ""));
  const fullName = m ? m[1].trim() : first.trim();
  const dni = m ? m[2].trim() : "";
  const group = second || undefined;
  return { fullName, dni, group };
}

function normalizeDate(d: string): string {
  // input like 24-09-2025 => 2025-09-24
  const m = /(\d{2})-(\d{2})-(\d{4})/.exec(d);
  if (!m) return d;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseWeekHeaders($: cheerio.CheerioAPI): string[] {
  // Find header row containing weekdays and dates
  const headerRow = $("table:contains('Sesiones') tr").filter((_, el) => $(el).find("td.colcabecera").length >= 5).first();
  const dayCells = headerRow.find("td.colcabecera").toArray().slice(-5);
  const dates = dayCells.map((el) => {
    const html = $(el).html() || "";
    const parts = html.split("<br>");
    const dateText = (parts[1] || parts[0] || "").replace(/<[^>]+>/g, "").trim();
    return normalizeDate(dateText);
  });
  return dates;
}

function parseSessions($: cheerio.CheerioAPI, daysISO: string[]): SessionCell[] {
  const table = $("table:contains('Sesiones')").first();
  const rows = table.find("tr").toArray().filter((el) => $(el).find("td.colcabecera").first().text().trim().match(/^\d+$/));
  const sessions: SessionCell[] = [];
  rows.forEach((row) => {
    const tds = $(row).find("td").toArray();
    const hourText = $(tds[0]).text().trim();
    const hour = Number(hourText) || 0;
    const dayCells = tds.slice(1, 6);
    dayCells.forEach((cell, idx) => {
      const text = $(cell).text().trim() || null;
      const classAttr = $(cell).attr("class") || null;
      sessions.push({
        hour,
        weekday: (idx + 1) as 1 | 2 | 3 | 4 | 5,
        dateISO: daysISO[idx] || "",
        title: text && text !== "-" ? text : null,
        cssClass: classAttr,
      });
    });
  });
  return sessions;
}

function parseLegend($: cheerio.CheerioAPI): { modules: LegendModules; absence: LegendAbsenceTypes } {
  // The legend sits inside the same ".form-container" that contains the text "LEYENDA"
  const legendContainer = $(".form-container:contains('LEYENDA')").first();

  const modules: LegendModules = {};
  const absence: LegendAbsenceTypes = {};

  // The modules block is plain text with <br> separators inside the left <td>
  // Extract text, split by <br>, and parse "CODE: Description" pairs
  const modulesTd = legendContainer.find("td").filter((_, el) => $(el).find("h2:contains('MODULOS')").length > 0).first();
  if (modulesTd.length) {
    const html = modulesTd.html() || "";
    const lines = html
      .split(/<br\s*\/?>(?:\s*)/i)
      .map((s) => s.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
    lines.forEach((line) => {
      const m = /^([^:]+):\s*(.+)$/.exec(line);
      if (m) modules[m[1].trim()] = m[2].trim();
    });
  }

  // The absence types are in spans in the right <td>
  const absenceTd = legendContainer.find("td").filter((_, el) => $(el).find("h2:contains('FALTAS')").length > 0).first();
  absenceTd.find("span").each((_, el) => {
    const t = $(el).text().trim();
    const m = /^([A-Z]):\s*(.+)$/.exec(t);
    if (m) absence[m[1]] = m[2].trim();
  });

  return { modules, absence };
}

function parsePercentages($: cheerio.CheerioAPI): GlobalPercentages {
  const table = $("#tabladerecha #tablafaltasfija").first();
  const row = table.find("tr").eq(1); // first data row
  const tds = row.find("td").toArray();
  const name = cheerio.load($(tds[0]).html() || "")("a").text().trim() || $(tds[0]).text().trim();
  const totalPercent = parseFloat(($(tds[1]).text().replace("%", "").trim() || "0").replace(",", ".")) || 0;
  const headers = table.find("tr").first().find("th").toArray().slice(2);
  const byModule: Record<string, number> = {};
  headers.forEach((th, idx) => {
    const key = $(th).text().trim();
    const valTd = tds[idx + 2];
    const val = parseFloat(($(valTd).text().replace("%", "").trim() || "0").replace(",", ".")) || 0;
    byModule[key] = val;
  });
  return { name, totalPercent, byModule };
}

function aggregateStats(weeks: WeekSessions): never;
function aggregateStats(weeks: WeekSessions[]): AggregatedStats;
function aggregateStats(weeks: WeekSessions | WeekSessions[]): AggregatedStats {
  const list = Array.isArray(weeks) ? weeks : [weeks];
  const modules: AggregatedStats["modules"] = {};
  const absenceTotals: AggregatedStats["absenceTotals"] = {};

  const absenceClassToCode = (cls: string | null): string | null => extractAbsenceCode(cls);

  list.forEach((w) => {
    w.sessions.forEach((s) => {
      if (!s.title) return;
      const moduleKey = s.title.trim();
      const entry = (modules[moduleKey] ||= { classesGiven: 0, absenceCounts: {} });
      entry.classesGiven += 1;
      const code = absenceClassToCode(s.cssClass);
      if (code) {
        entry.absenceCounts[code] = (entry.absenceCounts[code] || 0) + 1;
        absenceTotals[code] = (absenceTotals[code] || 0) + 1;
      }
    });
  });

  return { modules, absenceTotals };
}

export function parseMostrarAlumno(html: string): {
  identity: UserIdentity;
  week: WeekSessions;
  legend: { modules: LegendModules; absenceTypes: LegendAbsenceTypes };
  percentages: GlobalPercentages;
} {
  const $ = cheerio.load(html);
  const identity = parseIdentity($);
  const daysISO = parseWeekHeaders($);
  const sessions = parseSessions($, daysISO);
  const legendParsed = parseLegend($);
  const percentages = parsePercentages($);
  const week: WeekSessions = {
    weekStartISO: daysISO[0],
    weekEndISO: daysISO[4],
    daysISO,
    sessions,
  };
  return {
    identity,
    week,
    legend: { modules: legendParsed.modules, absenceTypes: legendParsed.absence },
    percentages,
  };
}

export function buildSnapshot(weeks: WeekSessions[], identity: UserIdentity, legend: { modules: LegendModules; absenceTypes: LegendAbsenceTypes }, percentages: GlobalPercentages): StudentSnapshot {
  const aggregated = aggregateStats(weeks);
  return { identity, legend, percentages, weeks, aggregated };
}


