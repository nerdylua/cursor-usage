import "server-only"

import { readFileSync } from "node:fs"
import { join } from "node:path"

type UsageRow = {
  date: Date
  isoDate: string
  day: string
  hour: number
  kind: string
  model: string
  maxMode: string
  inputWithCacheWrite: number
  inputWithoutCacheWrite: number
  cacheRead: number
  output: number
  total: number
  cost: string
}

export type CursorUsageDashboardData = ReturnType<typeof getCursorUsageDashboard>

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }

    if (char === "," && !quoted) {
      row.push(cell)
      cell = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1
      }
      row.push(cell)
      if (row.some(Boolean)) {
        rows.push(row)
      }
      row = []
      cell = ""
      continue
    }

    cell += char
  }

  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  const [headers, ...records] = rows

  return records.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    )
  )
}

function numberValue(value: string) {
  const parsed = Number(value.replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function compactModel(model: string) {
  return model
    .replace("-thinking", "")
    .replace("claude-", "claude ")
    .replace("gpt-", "gpt ")
}

function addMetric<T extends Record<string, number>>(
  map: Map<string, T>,
  key: string,
  seed: T,
  updates: Partial<T>
) {
  const current = map.get(key) ?? { ...seed }

  for (const [field, value] of Object.entries(updates)) {
    current[field as keyof T] += value ?? 0
  }

  map.set(key, current)
}

export function getCursorUsageDashboard() {
  const source = readFileSync(
    join(process.cwd(), "public", "cursor-usage.csv"),
    "utf8"
  )

  const rows: UsageRow[] = parseCsv(source)
    .map((row) => {
      const date = new Date(row.Date)

      return {
        date,
        isoDate: date.toISOString(),
        day: date.toISOString().slice(0, 10),
        hour: date.getUTCHours(),
        kind: row.Kind || "Unknown",
        model: row.Model || "Unknown",
        maxMode: row["Max Mode"] || "Unknown",
        inputWithCacheWrite: numberValue(row["Input (w/ Cache Write)"]),
        inputWithoutCacheWrite: numberValue(row["Input (w/o Cache Write)"]),
        cacheRead: numberValue(row["Cache Read"]),
        output: numberValue(row["Output Tokens"]),
        total: numberValue(row["Total Tokens"]),
        cost: row.Cost || "Included",
      }
    })
    .filter((row) => Number.isFinite(row.date.valueOf()))
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())

  const totals = rows.reduce(
    (acc, row) => {
      acc.inputWithCacheWrite += row.inputWithCacheWrite
      acc.inputWithoutCacheWrite += row.inputWithoutCacheWrite
      acc.cacheRead += row.cacheRead
      acc.output += row.output
      acc.total += row.total
      acc.maxMode += row.maxMode === "Yes" ? row.total : 0
      return acc
    },
    {
      inputWithCacheWrite: 0,
      inputWithoutCacheWrite: 0,
      cacheRead: 0,
      output: 0,
      total: 0,
      maxMode: 0,
    }
  )

  const daily = new Map<
    string,
    {
      freshInput: number
      cacheWrite: number
      cacheRead: number
      output: number
      total: number
      sessions: number
    }
  >()
  const models = new Map<string, { total: number; sessions: number }>()
  const kinds = new Map<string, { total: number; sessions: number }>()
  const hours = new Map<string, { total: number; sessions: number }>()

  for (const row of rows) {
    addMetric(
      daily,
      row.day,
      {
        freshInput: 0,
        cacheWrite: 0,
        cacheRead: 0,
        output: 0,
        total: 0,
        sessions: 0,
      },
      {
        freshInput: row.inputWithoutCacheWrite,
        cacheWrite: row.inputWithCacheWrite,
        cacheRead: row.cacheRead,
        output: row.output,
        total: row.total,
        sessions: 1,
      }
    )
    addMetric(
      models,
      compactModel(row.model),
      { total: 0, sessions: 0 },
      { total: row.total, sessions: 1 }
    )
    addMetric(
      kinds,
      row.kind,
      { total: 0, sessions: 0 },
      { total: row.total, sessions: 1 }
    )
    addMetric(
      hours,
      `${String(row.hour).padStart(2, "0")}:00`,
      { total: 0, sessions: 0 },
      { total: row.total, sessions: 1 }
    )
  }

  const modelMix = [...models.entries()]
    .map(([model, value]) => ({
      model,
      tokens: value.total,
      sessions: value.sessions,
    }))
    .sort((a, b) => b.tokens - a.tokens)

  const topModels = modelMix.slice(0, 7)
  const otherModels = modelMix.slice(7).reduce(
    (acc, item) => {
      acc.tokens += item.tokens
      acc.sessions += item.sessions
      return acc
    },
    { model: "Other", tokens: 0, sessions: 0 }
  )

  const days = [...daily.entries()]
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const peakDay = days.toSorted((a, b) => b.total - a.total)[0]
  const busiestHours = [...hours.entries()]
    .map(([hour, value]) => ({ hour, tokens: value.total, sessions: value.sessions }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 8)
    .reverse()

  const kindBreakdown = [...kinds.entries()]
    .map(([kind, value]) => ({
      kind,
      tokens: value.total,
      sessions: value.sessions,
    }))
    .sort((a, b) => b.tokens - a.tokens)

  const composition = [
    { name: "Cache read", value: totals.cacheRead, fill: "var(--color-cache)" },
    {
      name: "Fresh input",
      value: totals.inputWithoutCacheWrite,
      fill: "var(--color-fresh)",
    },
    {
      name: "Cache write",
      value: totals.inputWithCacheWrite,
      fill: "var(--color-write)",
    },
    { name: "Output", value: totals.output, fill: "var(--color-output)" },
  ].filter((item) => item.value > 0)

  const topSessions = rows
    .toSorted((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((row) => ({
      date: row.isoDate,
      model: compactModel(row.model),
      kind: row.kind,
      tokens: row.total,
      cacheRead: row.cacheRead,
      output: row.output,
      maxMode: row.maxMode,
    }))

  const cacheEfficiency =
    totals.cacheRead /
    Math.max(1, totals.cacheRead + totals.inputWithoutCacheWrite)
  const outputShare = totals.output / Math.max(1, totals.total)
  const maxModeShare = totals.maxMode / Math.max(1, totals.total)

  return {
    range: {
      start: days[0]?.date ?? "",
      end: days.at(-1)?.date ?? "",
    },
    totals,
    kpis: {
      rows: rows.length,
      totalTokens: totals.total,
      cacheEfficiency,
      outputShare,
      maxModeShare,
      peakDay: peakDay?.date ?? "",
      peakDayTokens: peakDay?.total ?? 0,
    },
    daily: days,
    modelMix:
      otherModels.tokens > 0 ? [...topModels, otherModels] : topModels,
    kindBreakdown,
    busiestHours,
    composition,
    topSessions,
  }
}
