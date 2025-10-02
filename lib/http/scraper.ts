import * as cheerio from "cheerio";
import { AggregatedStats, GlobalPercentages, LegendAbsenceTypes, LegendModules, SessionCell, StudentSnapshot, UserIdentity, WeekSessions, RetoInfo } from "@/lib/types/faltas";
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

  // The modules block may be malformed: the <h2> MODULOS header can bleed into
  // the first line and tabs/newlines may appear before the actual "CODE: Label".
  // Strategy:
  // 1) Remove the <h2> header HTML from the cell entirely.
  // 2) Split by <br> or newlines as fallback.
  // 3) For each candidate line, drop everything before the last tab (if any).
  // 4) Parse "CODE: Description" pairs.
  const modulesTd = legendContainer
    .find("td")
    .filter((_, el) => $(el).find("h2:contains('MODULOS')").length > 0)
    .first();
  if (modulesTd.length) {
    // Clone to avoid mutating DOM selection chain unexpectedly
    const $cell = cheerio.load(`<div>${modulesTd.html() || ''}</div>`);
    // Remove header h2 (e.g., "MODULOS") inside the cell
    $cell("div h2").remove();
    const innerHtml = $cell("div").html() || "";
    const rawLines = innerHtml
      .replace(/&nbsp;/g, " ")
      .split(/<br\s*\/?>(?:\s*)|\n/gi)
      .map((s) => s.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
    rawLines.forEach((raw) => {
      let line = raw;
      // If the line contains tabs, content before the last tab is junk from malformed HTML
      const tabIdx = line.lastIndexOf("\t");
      if (tabIdx >= 0) line = line.slice(tabIdx + 1).trim();
      // Now extract CODE: Description
      const m = /^([^:]+):\s*(.+)$/.exec(line);
      if (m) {
        const code = m[1].trim();
        const desc = m[2].trim();
        if (code && desc) modules[code] = desc;
      }
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
  Object.keys(legend.modules || {}).forEach((key) => {
    if (!aggregated.modules[key]) {
      aggregated.modules[key] = { classesGiven: 0, absenceCounts: {} };
    }
  });
  
  // Detect retos and compute default coefficients server-side
  const isReto = (code: string, label: string | undefined) => /(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i.test(`${code} ${label || ""}`);
  const extractGroup = (code: string, label: string | undefined) => {
    const m = (`${code} ${label || ""}`).match(/(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i);
    return m ? m[0].toUpperCase() : null;
  };
  
  const retos: RetoInfo[] = Object.keys(aggregated.modules)
    .filter((code) => isReto(code, legend.modules[code]))
    .map((code) => ({
      id: code,
      label: legend.modules[code] || code,
      faltas: Object.entries(aggregated.modules[code]?.absenceCounts || {})
        .filter(([k]) => k !== "J")
        .reduce((a, [, v]) => a + (v as number), 0),
      group: extractGroup(code, legend.modules[code]),
    }));

  const nonReto = Object.keys(aggregated.modules).filter((code) => !isReto(code, legend.modules[code]));
  
  // Distribuir faltas de retos proporcionalmente según horas semanales configuradas
  const retoDistributed = { ...aggregated };
  
  for (const r of retos) {
    const retoFaltas = Object.entries(aggregated.modules[r.id]?.absenceCounts || {})
      .filter(([k]) => k !== "J")
      .reduce((a, [, v]) => a + (v as number), 0);
    
    if (retoFaltas > 0) {
      // Obtener horas semanales configuradas (simuladas para el servidor)
      // En el cliente se usarán las horas reales desde localStorage
      const hoursPerModule: Record<string, number> = {};
      const retoTargets: Record<string, Record<string, boolean>> = {};
      
      // Por ahora, distribuir a todos los módulos no-reto con coeficientes iguales
      // En el cliente se reemplazará con la lógica real de horas configuradas
      const targets = nonReto;
      if (targets.length > 0) {
        const equal = 1 / targets.length;
        
        // Sumar faltas del reto a los módulos destino (sin eliminar las del reto)
        for (const targetCode of targets) {
          if (!retoDistributed.modules[targetCode]) {
            retoDistributed.modules[targetCode] = { classesGiven: 0, absenceCounts: {} };
          }
          
          // Sumar faltas del reto proporcionalmente
          const distributedFaltas = Math.round(retoFaltas * equal);
          retoDistributed.modules[targetCode].absenceCounts["F"] = 
            (retoDistributed.modules[targetCode].absenceCounts["F"] || 0) + distributedFaltas;
          
          // Actualizar totales de faltas
          retoDistributed.absenceTotals["F"] = 
            (retoDistributed.absenceTotals["F"] || 0) + distributedFaltas;
        }
        
        // NO limpiar las faltas del reto original - mantenerlas para cálculos posteriores
      }
    }
  }

  const coeficientes: Record<string, Record<string, number>> = {};

  return { identity, legend, percentages, weeks, aggregated: retoDistributed, retos, coeficientes };
}


