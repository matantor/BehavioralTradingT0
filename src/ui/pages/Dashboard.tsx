import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart } from 'recharts'
import { PortfolioService, NorthStarService, type PortfolioTotals, type HistoricalSnapshot } from '@/domain/services'
import type { ThesisVersion } from '@/domain/types/entities'
import { Card } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  BookOpen,
  Lightbulb,
  BarChart3,
  Settings
} from 'lucide-react'

const chartConfig = {
  portfolioValue: {
    label: "Value",
  },
} satisfies ChartConfig

export default function Dashboard() {
  const [totals, setTotals] = useState<PortfolioTotals | null>(null)
  const [thesis, setThesis] = useState<ThesisVersion | null>(null)
  const [history, setHistory] = useState<HistoricalSnapshot[]>([])

  const loadData = useCallback(() => {
    const portfolioTotals = PortfolioService.getPortfolioTotals()
    setTotals(portfolioTotals)

    const thesisData = NorthStarService.getCurrent()
    setThesis(thesisData)

    const historicalData = PortfolioService.getHistoricalSnapshots()
    setHistory(historicalData)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPnL = (value: number | null) => {
    if (value === null) return '—'
    const sign = value >= 0 ? '+' : ''
    return sign + formatCurrency(value)
  }

  const formatTooltipDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Determine chart color based on P&L
  const chartColor = totals?.combinedPnL !== null && totals?.combinedPnL !== undefined
    ? totals.combinedPnL >= 0
      ? 'hsl(152, 69%, 31%)' // emerald-600
      : 'hsl(350, 89%, 60%)' // rose-500
    : 'hsl(215, 16%, 47%)' // slate-500

  const quickAccessItems = [
    { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { path: '/journal', label: 'Trading Journal', icon: BookOpen },
    { path: '/thoughts', label: 'Thoughts & Theses', icon: Lightbulb },
    { path: '/analytics', label: 'Analytics & Patterns', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="pt-2 flex flex-col gap-6">
      {/* SECTION 1: Portfolio Summary */}
      <Link to="/portfolio" className="block">
        <Card className="p-6 cursor-pointer transition-colors hover:bg-accent/50">
          <span className="text-sm text-muted-foreground">
            Total Portfolio Value
          </span>
          <p className="text-4xl font-bold tracking-tight tabular-nums mt-1">
            {totals ? formatCurrency(totals.totalValue) : '$0.00'}
          </p>
          <p className={cn(
            "text-sm font-medium mt-2",
            totals?.combinedPnL !== null && totals?.combinedPnL !== undefined
              ? totals.combinedPnL >= 0
                ? "text-emerald-600"
                : "text-rose-600"
              : "text-muted-foreground"
          )}>
            {totals ? formatPnL(totals.combinedPnL) : '—'} Combined P&L
          </p>

          {/* Historical Chart */}
          {history.length > 1 && (
            <div className="mt-4 h-[80px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart
                  data={history}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload as HistoricalSnapshot
                      return (
                        <div className="bg-background border rounded-md px-2 py-1 text-xs shadow-sm">
                          <div className="text-muted-foreground">{formatTooltipDate(data.date)}</div>
                          <div className="font-medium">{formatCurrency(data.portfolioValue)}</div>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="portfolioValue"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </Card>
      </Link>

      {/* SECTION 2: North Star */}
      <Link to="/northstar" className="block">
        <Card className="p-6 bg-muted/30 cursor-pointer transition-colors hover:bg-muted/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            North Star Thesis
          </span>
          {thesis ? (
            <p className="font-serif text-base leading-relaxed mt-2 line-clamp-4">
              {thesis.content}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm mt-2">
              No thesis defined yet. Tap to create one.
            </p>
          )}
        </Card>
      </Link>

      {/* SECTION 3: Quick Access */}
      <div className="grid grid-cols-2 gap-3">
        {quickAccessItems.map((item, index) => {
          const Icon = item.icon
          const isLastItem = index === quickAccessItems.length - 1
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center h-24 rounded-md p-3 md:p-4",
                "bg-zinc-50 dark:bg-zinc-800/50",
                "transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700/50",
                "text-center",
                isLastItem && "col-span-2"
              )}
            >
              <Icon className="size-6 text-zinc-500 dark:text-zinc-400 mb-2" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
