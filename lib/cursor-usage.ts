import "server-only"

import { readFileSync } from "node:fs"
import { join } from "node:path"

type RawUsageRow = {
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
}

type BaseTokenRates = {
  prompt: number
  inputCacheRead: number
  inputCacheWrite: number
  completion: number
  highContext?: {
    inputTokensAbove: number
    prompt: number
    inputCacheRead: number
    inputCacheWrite: number
    completion: number
  }
}

type TokenRates = BaseTokenRates & {
  sourceModel: string
  source: string
}

type UsageRow = RawUsageRow & {
  rates: TokenRates
  inputCost: number
  cacheWriteCost: number
  cacheReadCost: number
  outputCost: number
  estimatedCost: number
}

export type CursorUsageDashboardData = ReturnType<typeof getCursorUsageDashboard>

const CURSOR_MODELS_SOURCE = "https://cursor.com/docs/models-and-pricing"

const BASE_MODEL_RATES: Record<string, BaseTokenRates> = {
  "anthropic/claude-sonnet-4": {
    prompt: 3,
    inputCacheRead: 0.3,
    inputCacheWrite: 3.75,
    completion: 15,
    highContext: {
      inputTokensAbove: 200_000,
      prompt: 6,
      inputCacheRead: 0.6,
      inputCacheWrite: 7.5,
      completion: 22.5,
    },
  },
  "anthropic/claude-sonnet-4.5": {
    prompt: 3,
    inputCacheRead: 0.3,
    inputCacheWrite: 3.75,
    completion: 15,
  },
  "anthropic/claude-opus-4.5": {
    prompt: 5,
    inputCacheRead: 0.5,
    inputCacheWrite: 6.25,
    completion: 25,
  },
  "anthropic/claude-opus-4.6": {
    prompt: 5,
    inputCacheRead: 0.5,
    inputCacheWrite: 6.25,
    completion: 25,
  },
  "anthropic/claude-opus-4.7": {
    prompt: 5,
    inputCacheRead: 0.5,
    inputCacheWrite: 6.25,
    completion: 25,
  },
  "openai/gpt-5": {
    prompt: 1.25,
    inputCacheRead: 0.125,
    inputCacheWrite: 1.25,
    completion: 10,
  },
  "openai/gpt-5-fast": {
    prompt: 2.5,
    inputCacheRead: 0.25,
    inputCacheWrite: 2.5,
    completion: 20,
  },
  "openai/gpt-5-mini": {
    prompt: 0.25,
    inputCacheRead: 0.025,
    inputCacheWrite: 0.25,
    completion: 2,
  },
  "openai/gpt-5.5": {
    prompt: 5,
    inputCacheRead: 0.5,
    inputCacheWrite: 5,
    completion: 30,
    highContext: {
      inputTokensAbove: 272_000,
      prompt: 10,
      inputCacheRead: 1,
      inputCacheWrite: 10,
      completion: 30,
    },
  },
  "openai/gpt-5-codex": {
    prompt: 1.25,
    inputCacheRead: 0.125,
    inputCacheWrite: 1.25,
    completion: 10,
  },
  "openai/gpt-5.1-codex": {
    prompt: 1.25,
    inputCacheRead: 0.125,
    inputCacheWrite: 1.25,
    completion: 10,
  },
  "openai/gpt-5.2-codex": {
    prompt: 1.75,
    inputCacheRead: 0.175,
    inputCacheWrite: 1.75,
    completion: 14,
  },
  "openai/gpt-5.3-codex": {
    prompt: 1.75,
    inputCacheRead: 0.175,
    inputCacheWrite: 1.75,
    completion: 14,
  },
  "openai/gpt-5.4": {
    prompt: 2.5,
    inputCacheRead: 0.25,
    inputCacheWrite: 2.5,
    completion: 15,
    highContext: {
      inputTokensAbove: 272_000,
      prompt: 5,
      inputCacheRead: 0.5,
      inputCacheWrite: 5,
      completion: 15,
    },
  },
  "openai/gpt-5.4-mini": {
    prompt: 0.75,
    inputCacheRead: 0.075,
    inputCacheWrite: 0.75,
    completion: 4.5,
  },
  "openai/gpt-4.1": {
    prompt: 2,
    inputCacheRead: 0.5,
    inputCacheWrite: 2,
    completion: 8,
  },
  "openai/o3": {
    prompt: 2,
    inputCacheRead: 0.5,
    inputCacheWrite: 2,
    completion: 8,
  },
  "google/gemini-3.1-pro-preview": {
    prompt: 2,
    inputCacheRead: 0.2,
    inputCacheWrite: 0.375,
    completion: 12,
  },
  "google/gemini-2.5-pro-preview-05-06": {
    prompt: 1.25,
    inputCacheRead: 0.125,
    inputCacheWrite: 0.375,
    completion: 10,
  },
  "x-ai/grok-3-beta": {
    prompt: 3,
    inputCacheRead: 0.75,
    inputCacheWrite: 3,
    completion: 15,
  },
  "cursor/auto": {
    prompt: 1.25,
    inputCacheRead: 0.25,
    inputCacheWrite: 1.25,
    completion: 6,
  },
  "cursor/composer-1": {
    prompt: 1.25,
    inputCacheRead: 0.125,
    inputCacheWrite: 1.25,
    completion: 10,
  },
  "cursor/composer-1.5": {
    prompt: 3.5,
    inputCacheRead: 0.35,
    inputCacheWrite: 3.5,
    completion: 17.5,
  },
  "cursor/composer-2": {
    prompt: 0.5,
    inputCacheRead: 0.2,
    inputCacheWrite: 0.5,
    completion: 2.5,
  },
}

const MODEL_ALIAS_TO_BASE: Record<string, string> = {
  "claude-4-sonnet-thinking": "anthropic/claude-sonnet-4",
  "claude-4-sonnet": "anthropic/claude-sonnet-4",
  "claude-4.5-sonnet-thinking": "anthropic/claude-sonnet-4.5",
  "claude-3.5-sonnet": "anthropic/claude-sonnet-4",
  "claude-4.5-opus-high-thinking": "anthropic/claude-opus-4.5",
  "claude-4.6-opus-max-thinking": "anthropic/claude-opus-4.6",
  "claude-4.6-opus-high-thinking": "anthropic/claude-opus-4.6",
  "claude-opus-4-7-thinking-high": "anthropic/claude-opus-4.7",
  "claude-opus-4-7-thinking-xhigh": "anthropic/claude-opus-4.7",
  "claude-opus-4-7-thinking-medium": "anthropic/claude-opus-4.7",
  "gpt-5": "openai/gpt-5",
  "gpt-5-fast": "openai/gpt-5-fast",
  "gpt-5-high-fast": "openai/gpt-5-fast",
  "gpt-5-low-fast": "openai/gpt-5-fast",
  "gpt-5.5-medium": "openai/gpt-5.5",
  "gpt-5.5-high": "openai/gpt-5.5",
  "gpt-5.5-low": "openai/gpt-5.5",
  "gpt-5-codex-high": "openai/gpt-5-codex",
  "gpt-5.1-codex-high": "openai/gpt-5.1-codex",
  "gpt-5.2-codex-xhigh-fast": "openai/gpt-5.2-codex",
  "gpt-5.3-codex": "openai/gpt-5.3-codex",
  "gpt-5.3-codex-high": "openai/gpt-5.3-codex",
  "gpt-5.4-high": "openai/gpt-5.4",
  "gpt-5.4-medium": "openai/gpt-5.4",
  "gpt-4.1": "openai/gpt-4.1",
  o3: "openai/o3",
  "gemini-3-pro-preview": "google/gemini-3.1-pro-preview",
  "gemini-2.5-pro-preview-05-06": "google/gemini-2.5-pro-preview-05-06",
  "grok-3-beta": "x-ai/grok-3-beta",
  auto: "cursor/auto",
  "composer-1": "cursor/composer-1",
  "composer-1.5": "cursor/composer-1.5",
  "composer-2-fast": "cursor/composer-2",
}

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

function toUsd(tokens: number, usdPerMillionTokens: number) {
  return (tokens * usdPerMillionTokens) / 1_000_000
}

function getKnownRates(model: string): TokenRates | null {
  const sourceModel = MODEL_ALIAS_TO_BASE[model]

  if (!sourceModel) {
    return null
  }

  const rates = BASE_MODEL_RATES[sourceModel]

  if (!rates) {
    return null
  }

  return {
    ...rates,
    sourceModel,
    source: CURSOR_MODELS_SOURCE,
  }
}

function buildBlendedRates(rows: RawUsageRow[]): TokenRates {
  const fallbackBase = BASE_MODEL_RATES["openai/gpt-5"]
  const weighted = {
    prompt: { tokens: 0, cost: 0 },
    inputCacheWrite: { tokens: 0, cost: 0 },
    inputCacheRead: { tokens: 0, cost: 0 },
    completion: { tokens: 0, cost: 0 },
  }

  for (const row of rows) {
    const rates = getKnownRates(row.model)

    if (!rates) {
      continue
    }

    weighted.prompt.tokens += row.inputWithoutCacheWrite
    weighted.prompt.cost += toUsd(row.inputWithoutCacheWrite, rates.prompt)

    weighted.inputCacheWrite.tokens += row.inputWithCacheWrite
    weighted.inputCacheWrite.cost += toUsd(
      row.inputWithCacheWrite,
      rates.inputCacheWrite
    )

    weighted.inputCacheRead.tokens += row.cacheRead
    weighted.inputCacheRead.cost += toUsd(row.cacheRead, rates.inputCacheRead)

    weighted.completion.tokens += row.output
    weighted.completion.cost += toUsd(row.output, rates.completion)
  }

  return {
    prompt:
      weighted.prompt.tokens > 0
        ? (weighted.prompt.cost * 1_000_000) / weighted.prompt.tokens
        : fallbackBase.prompt,
    inputCacheWrite:
      weighted.inputCacheWrite.tokens > 0
        ? (weighted.inputCacheWrite.cost * 1_000_000) /
          weighted.inputCacheWrite.tokens
        : fallbackBase.inputCacheWrite,
    inputCacheRead:
      weighted.inputCacheRead.tokens > 0
        ? (weighted.inputCacheRead.cost * 1_000_000) /
          weighted.inputCacheRead.tokens
        : fallbackBase.inputCacheRead,
    completion:
      weighted.completion.tokens > 0
        ? (weighted.completion.cost * 1_000_000) / weighted.completion.tokens
        : fallbackBase.completion,
    sourceModel: "blended-fallback",
    source: `${CURSOR_MODELS_SOURCE} (weighted from known-model usage)`,
  }
}

function resolveRates(model: string, blendedFallbackRates: TokenRates) {
  const knownRates = getKnownRates(model)

  if (knownRates) {
    return knownRates
  }

  return blendedFallbackRates
}

function resolveRowRates(row: RawUsageRow, blendedFallbackRates: TokenRates) {
  const rates = resolveRates(row.model, blendedFallbackRates)
  const inputTokens =
    row.inputWithCacheWrite + row.inputWithoutCacheWrite + row.cacheRead

  if (rates.highContext && inputTokens > rates.highContext.inputTokensAbove) {
    return {
      ...rates,
      prompt: rates.highContext.prompt,
      inputCacheRead: rates.highContext.inputCacheRead,
      inputCacheWrite: rates.highContext.inputCacheWrite,
      completion: rates.highContext.completion,
      sourceModel: `${rates.sourceModel} >${rates.highContext.inputTokensAbove.toLocaleString("en-US")} input tokens`,
    }
  }

  return rates
}

export function getCursorUsageDashboard() {
  const source = readFileSync(
    join(process.cwd(), "public", "cursor-usage.csv"),
    "utf8"
  )

  const rawRows: RawUsageRow[] = parseCsv(source)
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
      }
    })
    .filter((row) => Number.isFinite(row.date.valueOf()))

  const blendedFallbackRates = buildBlendedRates(rawRows)

  const rows: UsageRow[] = rawRows
    .map((row) => {
      const rates = resolveRowRates(row, blendedFallbackRates)
      const inputCost = toUsd(row.inputWithoutCacheWrite, rates.prompt)
      const cacheWriteCost = toUsd(row.inputWithCacheWrite, rates.inputCacheWrite)
      const cacheReadCost = toUsd(row.cacheRead, rates.inputCacheRead)
      const outputCost = toUsd(row.output, rates.completion)
      const estimatedCost = inputCost + cacheWriteCost + cacheReadCost + outputCost

      return {
        ...row,
        rates,
        inputCost,
        cacheWriteCost,
        cacheReadCost,
        outputCost,
        estimatedCost,
      }
    })
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())

  const totals = rows.reduce(
    (acc, row) => {
      acc.inputWithCacheWrite += row.inputWithCacheWrite
      acc.inputWithoutCacheWrite += row.inputWithoutCacheWrite
      acc.cacheRead += row.cacheRead
      acc.output += row.output
      acc.total += row.total
      acc.maxMode += row.maxMode === "Yes" ? row.total : 0
      acc.cost += row.estimatedCost
      return acc
    },
    {
      inputWithCacheWrite: 0,
      inputWithoutCacheWrite: 0,
      cacheRead: 0,
      output: 0,
      total: 0,
      maxMode: 0,
      cost: 0,
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
      cost: number
    }
  >()
  const models = new Map<
    string,
    {
      total: number
      sessions: number
      estimatedCost: number
      inputCost: number
      cacheWriteCost: number
      cacheReadCost: number
      outputCost: number
    }
  >()
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
        cost: 0,
      },
      {
        freshInput: row.inputWithoutCacheWrite,
        cacheWrite: row.inputWithCacheWrite,
        cacheRead: row.cacheRead,
        output: row.output,
        total: row.total,
        sessions: 1,
        cost: row.estimatedCost,
      }
    )
    addMetric(
      models,
      compactModel(row.model),
      {
        total: 0,
        sessions: 0,
        estimatedCost: 0,
        inputCost: 0,
        cacheWriteCost: 0,
        cacheReadCost: 0,
        outputCost: 0,
      },
      {
        total: row.total,
        sessions: 1,
        estimatedCost: row.estimatedCost,
        inputCost: row.inputCost,
        cacheWriteCost: row.cacheWriteCost,
        cacheReadCost: row.cacheReadCost,
        outputCost: row.outputCost,
      }
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
      estimatedCost: value.estimatedCost,
      inputCost: value.inputCost,
      cacheWriteCost: value.cacheWriteCost,
      cacheReadCost: value.cacheReadCost,
      outputCost: value.outputCost,
      costPerMillionTokens:
        (value.estimatedCost / Math.max(1, value.total)) * 1_000_000,
    }))
    .sort((a, b) => b.tokens - a.tokens)

  const topModels = modelMix.slice(0, 7)
  const otherModels = modelMix.slice(7).reduce(
    (acc, item) => {
      acc.tokens += item.tokens
      acc.sessions += item.sessions
      acc.estimatedCost += item.estimatedCost
      acc.inputCost += item.inputCost
      acc.cacheWriteCost += item.cacheWriteCost
      acc.cacheReadCost += item.cacheReadCost
      acc.outputCost += item.outputCost
      return acc
    },
    {
      model: "Other",
      tokens: 0,
      sessions: 0,
      estimatedCost: 0,
      inputCost: 0,
      cacheWriteCost: 0,
      cacheReadCost: 0,
      outputCost: 0,
      costPerMillionTokens: 0,
    }
  )
  otherModels.costPerMillionTokens =
    (otherModels.estimatedCost / Math.max(1, otherModels.tokens)) * 1_000_000

  let cumulativeCost = 0
  const days = [...daily.entries()]
    .map(([date, value]) => ({
      date,
      ...value,
      dailyCost: value.cost,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      cumulativeCost += entry.dailyCost
      return {
        ...entry,
        cumulativeCost,
      }
    })

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
      estimatedCost: row.estimatedCost,
      pricingModel: row.rates.sourceModel,
    }))

  const cacheEfficiency =
    totals.cacheRead /
    Math.max(1, totals.cacheRead + totals.inputWithoutCacheWrite)
  const outputShare = totals.output / Math.max(1, totals.total)
  const maxModeShare = totals.maxMode / Math.max(1, totals.total)
  const costPerMillionTokens = (totals.cost / Math.max(1, totals.total)) * 1_000_000

  return {
    range: {
      start: days[0]?.date ?? "",
      end: days.at(-1)?.date ?? "",
    },
    totals,
    kpis: {
      rows: rows.length,
      totalTokens: totals.total,
      totalCost: totals.cost,
      costPerMillionTokens,
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
