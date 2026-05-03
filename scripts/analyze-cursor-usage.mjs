import { readFileSync } from "node:fs"
import { join } from "node:path"

const sourcePath = join(process.cwd(), "public", "cursor-usage.csv")

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

const rows = parseCsv(readFileSync(sourcePath, "utf8")).map((row) => {
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

const totals = rows.reduce(
  (acc, row) => {
    acc.inputWithCacheWrite += row.inputWithCacheWrite
    acc.inputWithoutCacheWrite += row.inputWithoutCacheWrite
    acc.cacheRead += row.cacheRead
    acc.output += row.output
    acc.total += row.total
    return acc
  },
  {
    inputWithCacheWrite: 0,
    inputWithoutCacheWrite: 0,
    cacheRead: 0,
    output: 0,
    total: 0,
  }
)

const byDay = new Map()
const byModel = new Map()
const byKind = new Map()
const byHour = new Map()

for (const row of rows) {
  addToMap(byDay, row.day, row.total)
  addToMap(byModel, row.model, row.total)
  addToMap(byKind, row.kind, row.total)
  addToMap(byHour, String(row.hour).padStart(2, "0"), row.total)
}

const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
const models = [...byModel.entries()].sort((a, b) => b[1] - a[1])
const kinds = [...byKind.entries()].sort((a, b) => b[1] - a[1])
const hours = [...byHour.entries()].sort(([a], [b]) => a.localeCompare(b))
const peakDay = days.toSorted((a, b) => b[1] - a[1])[0]
const peakHour = hours.toSorted((a, b) => b[1] - a[1])[0]
const cacheEfficiency =
  totals.cacheRead / Math.max(1, totals.cacheRead + totals.inputWithoutCacheWrite)

const format = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 })

console.log("Cursor usage source analysis")
console.log(`Rows: ${rows.length}`)
console.log(`Date range: ${days[0]?.[0]} to ${days.at(-1)?.[0]}`)
console.log(`Total tokens: ${format.format(totals.total)}`)
console.log(`Cache read: ${format.format(totals.cacheRead)} (${Math.round(cacheEfficiency * 100)}% of reusable+fresh input)`)
console.log(`Output tokens: ${format.format(totals.output)}`)
console.log(`Peak day: ${peakDay?.[0]} with ${format.format(peakDay?.[1] ?? 0)} tokens`)
console.log(`Peak UTC hour: ${peakHour?.[0]}:00 with ${format.format(peakHour?.[1] ?? 0)} tokens`)
console.log("")
console.log("Recommended dashboard visuals:")
console.log("- KPI strip: total tokens, cache efficiency, output share, max-mode share")
console.log("- Area chart: daily input/cache/output token trend")
console.log("- Stacked bars: model mix by token volume")
console.log("- Donut chart: token composition across cache reads, fresh input, cache writes, output")
console.log("- Horizontal bars: busiest UTC hours")
console.log("- Table: top high-token sessions for traceability")
console.log("")
console.log("Top models:")
for (const [model, total] of models.slice(0, 8)) {
  console.log(`- ${model}: ${format.format(total)}`)
}
console.log("")
console.log("Kinds:")
for (const [kind, total] of kinds) {
  console.log(`- ${kind}: ${format.format(total)}`)
}
