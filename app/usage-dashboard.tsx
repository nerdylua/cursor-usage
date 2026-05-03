"use client"

import type * as React from "react"
import {
  Activity,
  Bot,
  CalendarRange,
  Download,
  Gauge,
  LayoutDashboard,
  Layers3,
  LineChart,
  Moon,
  Sparkles,
  Zap,
} from "lucide-react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { CursorUsageDashboardData } from "@/lib/cursor-usage"

const tokenFlowConfig = {
  freshInput: {
    label: "Fresh input",
    color: "var(--chart-1)",
  },
  cacheWrite: {
    label: "Cache write",
    color: "var(--chart-5)",
  },
  cacheRead: {
    label: "Cache read",
    color: "var(--chart-2)",
  },
  output: {
    label: "Output",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const modelConfig = {
  tokens: {
    label: "Tokens",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const hourConfig = {
  tokens: {
    label: "Tokens",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const compositionConfig = {
  cache: {
    label: "Cache read",
    color: "var(--chart-2)",
  },
  fresh: {
    label: "Fresh input",
    color: "var(--chart-1)",
  },
  write: {
    label: "Cache write",
    color: "var(--chart-5)",
  },
  output: {
    label: "Output",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const modelPalette = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-5)",
  "var(--chart-3)",
  "var(--chart-4)",
]

const cursorExportUrl =
  "https://cursor.com/api/dashboard/export-usage-events-csv?startDate=1704997800000&endDate=1777746599999&strategy=tokens"

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function integer(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function percent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value))
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "var(--chart-1)",
}: {
  icon: typeof Activity
  label: string
  value: string
  detail: string
  tone?: string
}) {
  return (
    <Card className="dashboard-card">
      <CardContent className="flex items-start justify-between gap-4 pt-0">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-heading text-3xl font-semibold tracking-normal">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        <div
          className="flex size-10 items-center justify-center rounded-lg border shadow-sm"
          style={{
            backgroundColor: `color-mix(in oklch, ${tone} 14%, transparent)`,
            borderColor: `color-mix(in oklch, ${tone} 28%, transparent)`,
            color: tone,
          }}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  children,
  description,
  title,
  className,
}: {
  children: React.ReactNode
  description: string
  title: string
  className?: string
}) {
  return (
    <Card className={`dashboard-card ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg tracking-normal">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function CursorUsageDashboard({
  data,
}: {
  data: CursorUsageDashboardData
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar className="border-r border-sidebar-border/80 bg-sidebar/95">
          <SidebarHeader className="border-b border-sidebar-border/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/20">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Cursor Usage</p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  Token intelligence
                </p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Views</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    ["Overview", LayoutDashboard],
                    ["Token Flow", LineChart],
                    ["Models", Bot],
                    ["Sessions", Activity],
                  ].map(([label, Icon]) => (
                    <SidebarMenuItem key={label as string}>
                      <SidebarMenuButton
                        asChild
                        isActive={label === "Overview"}
                        tooltip={label as string}
                      >
                        <a href={`#${String(label).toLowerCase().replace(" ", "-")}`}>
                          <Icon className="size-4" />
                          <span>{label as string}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border/70 p-4">
            <div className="rounded-lg border bg-sidebar-accent/50 p-3">
              <p className="text-xs text-sidebar-foreground/60">Range</p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(data.range.start)} to {formatDate(data.range.end)}
              </p>
              <p className="mt-2 text-xs text-sidebar-foreground/60">
                {integer(data.kpis.rows)} recorded sessions
              </p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0 bg-background">
          <main className="dashboard-shell min-h-svh">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
              <header className="sticky top-0 z-20 -mx-4 border-b bg-background/78 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <SidebarTrigger className="rounded-lg" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="font-heading truncate text-xl font-semibold tracking-normal sm:text-2xl">
                          Cursor token usage
                        </h1>
                        <Badge
                          variant="outline"
                          className="rounded-lg border-primary/20 bg-primary/10 text-primary"
                        >
                          {compactNumber(data.kpis.totalTokens)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        A focused read on cache leverage, model load, and peak
                        token sessions.
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      asChild
                      className="rounded-lg"
                      size="sm"
                      variant="outline"
                    >
                      <a
                        href={cursorExportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="size-4" />
                        <span className="hidden sm:inline">CSV</span>
                      </a>
                    </Button>
                    <ThemeToggle />
                  </div>
                </div>
              </header>

              <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                <div className="dashboard-card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-lg border-primary/25 bg-primary/10 text-primary"
                    >
                      Static CSV
                    </Badge>
                    <Badge variant="outline" className="rounded-lg bg-card/70">
                      {formatDate(data.range.start)} to{" "}
                      {formatDate(data.range.end)}
                    </Badge>
                  </div>
                  <div className="mt-6 max-w-3xl">
                    <p className="font-heading text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                      Most of the workload is cache reuse, with output now
                      tracked on its own scale.
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                      The charts separate reused context, fresh input, cache
                      writes, and generated tokens so the smaller signals stay
                      readable instead of disappearing into the token mass.
                    </p>
                  </div>
                </div>

                <div className="dashboard-card p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Billing shape
                  </p>
                  <div className="mt-4 space-y-3">
                    {data.kindBreakdown.slice(0, 3).map((kind) => (
                      <div key={kind.kind}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{kind.kind}</span>
                          <span className="font-mono text-muted-foreground">
                            {percent(kind.tokens / data.kpis.totalTokens)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.max(
                                3,
                                (kind.tokens / data.kpis.totalTokens) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section
                id="overview"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <KpiCard
                  icon={Zap}
                  label="Total tokens"
                  value={compactNumber(data.kpis.totalTokens)}
                  detail={`${compactNumber(data.totals.cacheRead)} served from cache`}
                  tone="var(--chart-2)"
                />
                <KpiCard
                  icon={Gauge}
                  label="Cache efficiency"
                  value={percent(data.kpis.cacheEfficiency)}
                  detail="Cache reads vs reusable plus fresh input"
                  tone="var(--chart-1)"
                />
                <KpiCard
                  icon={Layers3}
                  label="Output share"
                  value={percent(data.kpis.outputShare)}
                  detail={`${compactNumber(data.totals.output)} generated tokens`}
                  tone="var(--chart-3)"
                />
                <KpiCard
                  icon={CalendarRange}
                  label="Peak day"
                  value={formatDate(data.kpis.peakDay)}
                  detail={`${compactNumber(data.kpis.peakDayTokens)} tokens`}
                  tone="var(--chart-5)"
                />
              </section>

              <section id="token-flow" className="grid gap-4 xl:grid-cols-3">
                <ChartCard
                  className="xl:col-span-2"
                  title="Daily token flow"
                  description="Cache and input volume on the left axis, generated output on its own right axis."
                >
                    <ChartContainer
                      config={tokenFlowConfig}
                      className="h-[340px] w-full"
                    >
                      <ComposedChart data={data.daily} accessibilityLayer>
                        <defs>
                          <linearGradient id="cacheReadFill" x1="0" x2="0" y1="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="var(--color-cacheRead)"
                              stopOpacity={0.36}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-cacheRead)"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                          <linearGradient id="freshInputFill" x1="0" x2="0" y1="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="var(--color-freshInput)"
                              stopOpacity={0.24}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-freshInput)"
                              stopOpacity={0.01}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 6"
                          strokeOpacity={0.55}
                        />
                        <XAxis
                          dataKey="date"
                          minTickGap={28}
                          tickFormatter={formatDate}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={12}
                        />
                        <YAxis
                          yAxisId="tokens"
                          tickFormatter={compactNumber}
                          tickLine={false}
                          axisLine={false}
                          width={54}
                        />
                        <YAxis
                          yAxisId="output"
                          orientation="right"
                          tickFormatter={compactNumber}
                          tickLine={false}
                          axisLine={false}
                          width={46}
                          stroke="var(--color-output)"
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(value) =>
                                new Intl.DateTimeFormat("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                  timeZone: "UTC",
                                }).format(new Date(String(value)))
                              }
                            />
                          }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Area
                          yAxisId="tokens"
                          dataKey="cacheRead"
                          type="monotone"
                          fill="url(#cacheReadFill)"
                          stroke="var(--color-cacheRead)"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Area
                          yAxisId="tokens"
                          dataKey="freshInput"
                          type="monotone"
                          fill="url(#freshInputFill)"
                          stroke="var(--color-freshInput)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="tokens"
                          dataKey="cacheWrite"
                          type="monotone"
                          stroke="var(--color-cacheWrite)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="output"
                          dataKey="output"
                          type="monotone"
                          stroke="var(--color-output)"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ChartContainer>
                </ChartCard>

                <ChartCard
                  title="Token composition"
                  description="Cache reads dominate the workload profile."
                >
                    <ChartContainer
                      config={compositionConfig}
                      className="h-[320px] w-full"
                    >
                      <PieChart accessibilityLayer>
                        <ChartTooltip
                          content={<ChartTooltipContent nameKey="name" />}
                        />
                        <Pie
                          data={data.composition}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={64}
                          outerRadius={104}
                          paddingAngle={3}
                          strokeWidth={4}
                        >
                          {data.composition.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                          <Label
                            content={({ viewBox }) => {
                              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                                return null
                              }

                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground font-heading text-2xl font-semibold"
                                  >
                                    {percent(data.kpis.cacheEfficiency)}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy ?? 0) + 22}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    cache leverage
                                  </tspan>
                                </text>
                              )
                            }}
                          />
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {data.composition.map((entry) => (
                        <div
                          key={entry.name}
                          className="rounded-lg border bg-muted/35 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: entry.fill }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {entry.name}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-sm font-medium">
                            {compactNumber(entry.value)}
                          </p>
                        </div>
                      ))}
                    </div>
                </ChartCard>
              </section>

              <section id="models" className="grid gap-4 xl:grid-cols-5">
                <ChartCard
                  className="xl:col-span-3"
                  title="Model mix"
                  description="The largest token consumers, grouped by model family."
                >
                    <ChartContainer
                      config={modelConfig}
                      className="h-[320px] w-full"
                    >
                      <BarChart data={data.modelMix} accessibilityLayer>
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 6"
                          strokeOpacity={0.5}
                        />
                        <XAxis
                          dataKey="model"
                          interval={0}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          angle={-18}
                          textAnchor="end"
                          height={72}
                        />
                        <YAxis
                          tickFormatter={compactNumber}
                          tickLine={false}
                          axisLine={false}
                          width={48}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="tokens" radius={[7, 7, 2, 2]}>
                          {data.modelMix.map((entry, index) => (
                            <Cell
                              key={entry.model}
                              fill={modelPalette[index % modelPalette.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                </ChartCard>

                <ChartCard
                  className="xl:col-span-2"
                  title="Busiest UTC hours"
                  description="The hours where token traffic is most concentrated."
                >
                    <ChartContainer
                      config={hourConfig}
                      className="h-[320px] w-full"
                    >
                      <BarChart
                        data={data.busiestHours}
                        layout="vertical"
                        accessibilityLayer
                      >
                        <defs>
                          <linearGradient id="hourBar" x1="0" x2="1" y1="0" y2="0">
                            <stop
                              offset="0%"
                              stopColor="var(--color-tokens)"
                              stopOpacity={0.58}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--color-tokens)"
                              stopOpacity={1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          horizontal={false}
                          strokeDasharray="3 6"
                          strokeOpacity={0.5}
                        />
                        <XAxis
                          type="number"
                          tickFormatter={compactNumber}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          dataKey="hour"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="tokens"
                          fill="url(#hourBar)"
                          radius={[0, 7, 7, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                </ChartCard>
              </section>

              <section id="sessions">
                <Card className="dashboard-card">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg tracking-normal">
                          Top sessions
                        </CardTitle>
                        <CardDescription>
                          High-volume rows from the usage export for quick
                          traceability.
                        </CardDescription>
                      </div>
                      <Badge className="rounded-lg" variant="secondary">
                        <Moon className="mr-1 size-3" />
                        {percent(data.kpis.maxModeShare)} max-mode share
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Date</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Kind</TableHead>
                          <TableHead className="text-right">Tokens</TableHead>
                          <TableHead className="text-right">Cache</TableHead>
                          <TableHead className="text-right">Output</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.topSessions.map((session) => (
                          <TableRow
                            key={`${session.date}-${session.model}`}
                            className="border-border/60 hover:bg-muted/35"
                          >
                            <TableCell className="font-medium">
                              {formatDateTime(session.date)}
                            </TableCell>
                            <TableCell>{session.model}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="rounded-lg">
                                {session.kind}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {compactNumber(session.tokens)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {compactNumber(session.cacheRead)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {compactNumber(session.output)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </section>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
