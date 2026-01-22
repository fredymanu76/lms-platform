'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { ComplianceFilters, ComplianceFilterState } from './compliance-filters'
import { ComplianceTrendChart } from './compliance-trend-chart'

interface ComplianceDashboardClientProps {
  assignmentStats: any[]
  courseStats: any[]
  userComplianceReport: any[]
  completions: any[]
  initialMetrics: {
    totalAssignments: number
    completedCount: number
    pendingCount: number
    overdueCount: number
    complianceRate: number
  }
}

export function ComplianceDashboardClient({
  assignmentStats,
  courseStats,
  userComplianceReport,
  completions,
  initialMetrics,
}: ComplianceDashboardClientProps) {
  const [filters, setFilters] = useState<ComplianceFilterState>({
    startDate: '',
    endDate: '',
    status: 'all',
    courseId: 'all',
  })

  // Filter assignments based on filters
  const filteredAssignments = useMemo(() => {
    return assignmentStats.filter((assignment: any) => {
      // Date range filter
      if (filters.startDate || filters.endDate) {
        const completedDate = assignment.completion?.completed_at
        if (completedDate) {
          const date = new Date(completedDate)
          if (filters.startDate && date < new Date(filters.startDate)) return false
          if (filters.endDate && date > new Date(filters.endDate)) return false
        } else if (filters.startDate || filters.endDate) {
          // If no completion date and date filter is active, exclude pending items
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'completed' && !assignment.isCompleted) return false
        if (filters.status === 'overdue' && !assignment.isOverdue) return false
        if (filters.status === 'pending' && (assignment.isCompleted || assignment.isOverdue)) return false
      }

      return true
    })
  }, [assignmentStats, filters])

  // Recalculate metrics based on filtered data
  const metrics = useMemo(() => {
    const totalFiltered = filteredAssignments.length
    const completed = filteredAssignments.filter((a: any) => a.isCompleted).length
    const overdue = filteredAssignments.filter((a: any) => a.isOverdue).length
    const pending = totalFiltered - completed - overdue
    const rate = totalFiltered > 0 ? Math.round((completed / totalFiltered) * 100) : 0

    return {
      totalAssignments: totalFiltered,
      completedCount: completed,
      pendingCount: pending,
      overdueCount: overdue,
      complianceRate: rate,
    }
  }, [filteredAssignments])

  // Recalculate course stats based on filtered assignments
  const filteredCourseStats = useMemo(() => {
    return courseStats.map((course: any) => {
      const courseAssignments = filteredAssignments.filter(
        (a: any) => a.course_id === course.id
      )
      const completed = courseAssignments.filter((a: any) => a.isCompleted).length
      const total = courseAssignments.length
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        ...course,
        assigned: total,
        completed,
        rate,
      }
    }).filter((c: any) => c.assigned > 0) // Only show courses with assignments
  }, [courseStats, filteredAssignments])

  // Recalculate user compliance based on filtered assignments
  const filteredUserReport = useMemo(() => {
    return userComplianceReport.map((user: any) => {
      const userAssignments = filteredAssignments.filter((a: any) => a.user_id === user.id)
      const completed = userAssignments.filter((a: any) => a.isCompleted).length
      const overdue = userAssignments.filter((a: any) => a.isOverdue).length
      const rate = userAssignments.length > 0 ? Math.round((completed / userAssignments.length) * 100) : 0

      return {
        ...user,
        assigned: userAssignments.length,
        completed,
        overdue,
        rate,
      }
    }).filter((u: any) => u.assigned > 0) // Only show users with assignments
  }, [userComplianceReport, filteredAssignments])

  return (
    <>
      {/* Filters */}
      <ComplianceFilters onFilterChange={setFilters} />

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.complianceRate}%</div>
            <Progress value={metrics.complianceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.completedCount} of {metrics.totalAssignments} assignments completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.completedCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Training courses completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Awaiting completion
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trend Chart */}
      <div className="mb-8">
        <ComplianceTrendChart completions={completions} timeRange="month" />
      </div>

      {/* Course Completion Rates */}
      <Card className="border-border/50 mb-8">
        <CardHeader>
          <CardTitle>Course Completion Rates</CardTitle>
          <CardDescription>
            Compliance rates by course{filters.startDate || filters.endDate ? ' (filtered)' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourseStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No course assignments found for the selected filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourseStats.map((course: any) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{course.title}</p>
                        {course.category && (
                          <Badge variant="outline" className="text-xs">{course.category}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.completed} of {course.assigned} assigned users completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{course.rate}%</p>
                    </div>
                  </div>
                  <Progress value={course.rate} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Compliance Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>User Compliance Report</CardTitle>
          <CardDescription>
            Individual completion status{filters.startDate || filters.endDate ? ' (filtered)' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-center">Assigned</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Overdue</TableHead>
                <TableHead className="text-center">Rate</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUserReport.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users found for the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredUserReport.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{user.assigned}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">{user.completed}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.overdue > 0 ? (
                        <span className="text-red-600 font-medium">{user.overdue}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{user.rate}%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.assigned === 0 ? (
                        <Badge variant="outline">No Assignments</Badge>
                      ) : user.rate === 100 ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Compliant
                        </Badge>
                      ) : user.overdue > 0 ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
