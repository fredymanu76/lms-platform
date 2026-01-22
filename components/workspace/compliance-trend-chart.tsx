'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ComplianceTrendChartProps {
  completions: Array<{
    completed_at: string
    user_id: string
  }>
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
}

export function ComplianceTrendChart({ completions, timeRange = 'month' }: ComplianceTrendChartProps) {
  const chartData = useMemo(() => {
    if (!completions || completions.length === 0) return []

    const now = new Date()
    const periods = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365
    const labels: string[] = []
    const counts: number[] = []

    // Generate labels and count completions for each period
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      const label = timeRange === 'week'
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const count = completions.filter(c => {
        const completedDate = new Date(c.completed_at)
        return completedDate >= dayStart && completedDate <= dayEnd
      }).length

      labels.push(label)
      counts.push(count)
    }

    return labels.map((label, index) => ({
      label,
      count: counts[index],
    }))
  }, [completions, timeRange])

  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const totalCompletions = chartData.reduce((sum, d) => sum + d.count, 0)
  const avgPerPeriod = chartData.length > 0 ? (totalCompletions / chartData.length).toFixed(1) : '0'

  // Calculate trend (comparing first half to second half)
  const halfPoint = Math.floor(chartData.length / 2)
  const firstHalfAvg = chartData.slice(0, halfPoint).reduce((sum, d) => sum + d.count, 0) / halfPoint
  const secondHalfAvg = chartData.slice(halfPoint).reduce((sum, d) => sum + d.count, 0) / (chartData.length - halfPoint)
  const trendDirection = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'flat'
  const trendPercent = firstHalfAvg > 0
    ? Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(0)
    : '0'

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Completion Trend</CardTitle>
            <CardDescription>
              Daily completions over the last {timeRange === 'week' ? '7 days' : timeRange === 'month' ? '30 days' : timeRange === 'quarter' ? '90 days' : 'year'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalCompletions}</div>
            <div className="text-xs text-muted-foreground">Total completions</div>
            {trendDirection !== 'flat' && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trendPercent}% vs previous period</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No completion data available for the selected period
          </div>
        ) : (
          <div className="space-y-1">
            {chartData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-16 text-xs text-muted-foreground text-right shrink-0">
                  {data.label}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(data.count / maxCount) * 100}%`, minWidth: data.count > 0 ? '24px' : '0' }}
                    >
                      {data.count > 0 && (
                        <span className="text-xs font-medium text-white">{data.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            Average: <span className="font-medium text-foreground">{avgPerPeriod}</span> completions per day
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
