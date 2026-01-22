'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, RotateCcw } from 'lucide-react'

interface ComplianceFiltersProps {
  onFilterChange: (filters: ComplianceFilterState) => void
}

export interface ComplianceFilterState {
  startDate: string
  endDate: string
  status: 'all' | 'completed' | 'pending' | 'overdue'
  courseId: string
}

export function ComplianceFilters({ onFilterChange }: ComplianceFiltersProps) {
  const [filters, setFilters] = useState<ComplianceFilterState>({
    startDate: '',
    endDate: '',
    status: 'all',
    courseId: 'all',
  })

  const handleFilterUpdate = (key: keyof ComplianceFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters: ComplianceFilterState = {
      startDate: '',
      endDate: '',
      status: 'all',
      courseId: 'all',
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  // Set quick date ranges
  const setDateRange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    const endDate = new Date()
    const startDate = new Date()

    switch (range) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    const newFilters = {
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <Card className="border-border/50 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-end gap-4 flex-wrap">
          {/* Date Range */}
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterUpdate('startDate', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterUpdate('endDate', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="status" className="text-sm font-medium mb-2 block">
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterUpdate('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Quick Date Ranges */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="text-sm text-muted-foreground py-2">Quick ranges:</span>
          <Button variant="outline" size="sm" onClick={() => setDateRange('week')}>
            Last 7 Days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange('month')}>
            Last Month
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange('quarter')}>
            Last Quarter
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange('year')}>
            Last Year
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
