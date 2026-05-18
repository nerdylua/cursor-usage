import { readFileSync } from "node:fs"
import { join } from "node:path"

const sourcePath = join(process.cwd(), "public", "cursor-usage.csv")
const CURSOR_MODELS_SOURCE = "https://cursor.com/docs/models-and-pricing"

const BASE_MODEL_RATES = {
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
      completion: 45,
    },
  },
  "openai/gpt-5.5-fast": {
    prompt: 12.5,
    inputCacheRead: 1.25,
    inputCacheWrite: 12.5,
    completion: 75,
    highContext: {
      inputTokensAbove: 272_000,
      prompt: 25,
      inputCacheRead: 2.5,
      inputCacheWrite: 25,
      completion: 112.5,
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
      completion: 22.5,
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

const MODEL_ALIAS_TO_BASE = {
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
  "gpt-5.5-extra-high": "openai/gpt-5.5",
  "gpt-5.5-extra-high-fast": "openai/gpt-5.5-fast",
  "gpt-5.5-low": "openai/gpt-5.5",
  "gpt-5-codex-high": "openai/gpt-5-codex",
  "gpt-5.1-codex-high": "openai/gpt-5.1-codex",
  "gpt-5.2-codex-xhigh-fast": "openai/gpt-5.2-codex",
  "gpt-5.3-codex": "openai/gpt-5.3-codex",
  "gpt-5.3-codex-high": "openai/gpt-5.3-codex",
  "gpt-5.3-codex-high-fast": "openai/gpt-5.3-codex",
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

function parseCsv(text) {
  const rows = []
  let row = []
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
      if (row.some((value) => value !== "")) {
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
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  )
}

function numberValue(value) {
  const parsed = Number(String(value).replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function addToMap(map, key, value) {
  map.set(key, (map.get(key) ?? 0) + value)
}

function toUsd(tokens, usdPerMillionTokens) {
  return (tokens * usdPerMillionTokens) / 1_000_000
}

function getKnownRates(model) {
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

function applyHighContextRates(row, rates) {
  if (!rates) {
    return null
  }

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

function getRowRates(row, fallbackRates) {
  return applyHighContextRates(row, getKnownRates(row.model) ?? fallbackRates)
}

const rawRows = parseCsv(readFileSync(sourcePath, "utf8")).map((row) => {
  const date = new Date(row.Date)
  const inputWithCacheWrite = numberValue(row["Input (w/ Cache Write)"])
  const inputWithoutCacheWrite = numberValue(row["Input (w/o Cache Write)"])
  const cacheRead = numberValue(row["Cache Read"])
  const output = numberValue(row["Output Tokens"])
  const total = numberValue(row["Total Tokens"])

  return {
    date,
    day: date.toISOString().slice(0, 10),
    hour: date.getUTCHours(),
    kind: row.Kind || "Unknown",
    model: row.Model || "Unknown",
    maxMode: row["Max Mode"] || "Unknown",
    inputWithCacheWrite,
    inputWithoutCacheWrite,
    cacheRead,
    output,
    total,
  }
})

const blended = {
  prompt: { tokens: 0, cost: 0 },
  inputCacheWrite: { tokens: 0, cost: 0 },
  inputCacheRead: { tokens: 0, cost: 0 },
  completion: { tokens: 0, cost: 0 },
}

for (const row of rawRows) {
  const rates = getRowRates(row, null)

  if (!rates) {
    continue
  }

  blended.prompt.tokens += row.inputWithoutCacheWrite
  blended.prompt.cost += toUsd(row.inputWithoutCacheWrite, rates.prompt)

  blended.inputCacheWrite.tokens += row.inputWithCacheWrite
  blended.inputCacheWrite.cost += toUsd(
    row.inputWithCacheWrite,
    rates.inputCacheWrite
  )

  blended.inputCacheRead.tokens += row.cacheRead
  blended.inputCacheRead.cost += toUsd(row.cacheRead, rates.inputCacheRead)

  blended.completion.tokens += row.output
  blended.completion.cost += toUsd(row.output, rates.completion)
}

const defaultRates = BASE_MODEL_RATES["openai/gpt-5"]
const blendedFallbackRates = {
  prompt:
    blended.prompt.tokens > 0
      ? (blended.prompt.cost * 1_000_000) / blended.prompt.tokens
      : defaultRates.prompt,
  inputCacheWrite:
    blended.inputCacheWrite.tokens > 0
      ? (blended.inputCacheWrite.cost * 1_000_000) /
        blended.inputCacheWrite.tokens
      : defaultRates.inputCacheWrite,
  inputCacheRead:
    blended.inputCacheRead.tokens > 0
      ? (blended.inputCacheRead.cost * 1_000_000) /
        blended.inputCacheRead.tokens
      : defaultRates.inputCacheRead,
  completion:
    blended.completion.tokens > 0
      ? (blended.completion.cost * 1_000_000) / blended.completion.tokens
      : defaultRates.completion,
  sourceModel: "blended-fallback",
  source: `${CURSOR_MODELS_SOURCE} (weighted from known-model usage)`,
}

const rows = rawRows.map((row) => {
  const rates = getRowRates(row, blendedFallbackRates)
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

const totals = rows.reduce(
  (acc, row) => {
    acc.inputWithCacheWrite += row.inputWithCacheWrite
    acc.inputWithoutCacheWrite += row.inputWithoutCacheWrite
    acc.cacheRead += row.cacheRead
    acc.output += row.output
    acc.total += row.total
    acc.cost += row.estimatedCost
    return acc
  },
  {
    inputWithCacheWrite: 0,
    inputWithoutCacheWrite: 0,
    cacheRead: 0,
    output: 0,
    total: 0,
    cost: 0,
  }
)

const byDay = new Map()
const byModel = new Map()
const byModelCost = new Map()
const byKind = new Map()
const byHour = new Map()
const byDayCost = new Map()

for (const row of rows) {
  addToMap(byDay, row.day, row.total)
  addToMap(byModel, row.model, row.total)
  addToMap(byModelCost, row.model, row.estimatedCost)
  addToMap(byKind, row.kind, row.total)
  addToMap(byHour, String(row.hour).padStart(2, "0"), row.total)
  addToMap(byDayCost, row.day, row.estimatedCost)
}

const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
const models = [...byModel.entries()].sort((a, b) => b[1] - a[1])
const modelCosts = [...byModelCost.entries()].sort((a, b) => b[1] - a[1])
const kinds = [...byKind.entries()].sort((a, b) => b[1] - a[1])
const hours = [...byHour.entries()].sort(([a], [b]) => a.localeCompare(b))
const dayCosts = [...byDayCost.entries()].sort(([a], [b]) => a.localeCompare(b))
const peakDay = days.toSorted((a, b) => b[1] - a[1])[0]
const peakHour = hours.toSorted((a, b) => b[1] - a[1])[0]
const peakCostDay = dayCosts.toSorted((a, b) => b[1] - a[1])[0]
const cacheEfficiency =
  totals.cacheRead / Math.max(1, totals.cacheRead + totals.inputWithoutCacheWrite)
const costPerMillionTokens = (totals.cost / Math.max(1, totals.total)) * 1_000_000

const format = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 })
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

console.log("Cursor usage source analysis")
console.log(`Rows: ${rows.length}`)
console.log(`Date range: ${days[0]?.[0]} to ${days.at(-1)?.[0]}`)
console.log(`Total tokens: ${format.format(totals.total)}`)
console.log(`Estimated total cost: ${money.format(totals.cost)}`)
console.log(`Estimated cost / 1M tokens: ${money.format(costPerMillionTokens)}`)
console.log(`Pricing source: ${CURSOR_MODELS_SOURCE}`)
console.log("Fallback pricing: weighted blended rates for unknown model aliases")
console.log(`Cache read: ${format.format(totals.cacheRead)} (${Math.round(cacheEfficiency * 100)}% of reusable+fresh input)`)
console.log(`Output tokens: ${format.format(totals.output)}`)
console.log(`Peak day: ${peakDay?.[0]} with ${format.format(peakDay?.[1] ?? 0)} tokens`)
console.log(`Peak UTC hour: ${peakHour?.[0]}:00 with ${format.format(peakHour?.[1] ?? 0)} tokens`)
console.log(`Peak cost day: ${peakCostDay?.[0]} with ${money.format(peakCostDay?.[1] ?? 0)}`)
console.log("")
console.log("Recommended dashboard visuals:")
console.log("- KPI strip: total tokens, estimated total cost, cache efficiency, output share")
console.log("- Stacked bars: daily token flow (fresh input, cache write, cache read, output)")
console.log("- Line chart: cumulative estimated cost by day")
console.log("- Stacked bars: model mix by token volume with hover cost metrics")
console.log("- Donut chart: token composition across cache reads, fresh input, cache writes, output")
console.log("- Horizontal bars: busiest UTC hours")
console.log("- Table: top high-token sessions for traceability")
console.log("")
console.log("Top models:")
for (const [model, total] of models.slice(0, 8)) {
  console.log(`- ${model}: ${format.format(total)}`)
}
console.log("")
console.log("Top model costs:")
for (const [model, cost] of modelCosts.slice(0, 8)) {
  console.log(`- ${model}: ${money.format(cost)}`)
}
console.log("")
console.log("Kinds:")
for (const [kind, total] of kinds) {
  console.log(`- ${kind}: ${format.format(total)}`)
}
