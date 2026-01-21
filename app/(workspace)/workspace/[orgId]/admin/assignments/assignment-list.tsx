'use client'

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, CheckCircle, Clock, AlertCircle, Search, Filter } from "lucide-react"
import { AssignmentActions } from "./assignment-actions"

interface Assignment {
  id: any
  course_id: any
  user_id: any
  due_date?: any
  is_mandatory: any
  created_at: any
  courses?: any
  users?: any
  isCompleted: boolean
  isOverdue: any
  completedAt?: any
}

interface AssignmentListProps {
  assignments: Assignment[]
  orgId: string
}

export function AssignmentList({ assignments, orgId }: AssignmentListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [mandatoryFilter, setMandatoryFilter] = useState<string>('all')

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      // Search filter (course name or user name)
      const searchLower = searchTerm.toLowerCase()
      const courseTitle = assignment.courses?.title?.toLowerCase() || ''
      const userName = (assignment.users?.full_name || assignment.users?.email || '').toLowerCase()
      const matchesSearch = courseTitle.includes(searchLower) || userName.includes(searchLower)

      if (!matchesSearch) return false

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && !assignment.isCompleted) return false
        if (statusFilter === 'overdue' && !assignment.isOverdue) return false
        if (statusFilter === 'pending' && (assignment.isCompleted || assignment.isOverdue)) return false
      }

      // Mandatory filter
      if (mandatoryFilter !== 'all') {
        if (mandatoryFilter === 'mandatory' && !assignment.is_mandatory) return false
        if (mandatoryFilter === 'optional' && assignment.is_mandatory) return false
      }

      return true
    })
  }, [assignments, searchTerm, statusFilter, mandatoryFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg border border-border bg-muted/20">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs font-medium flex items-center gap-1">
            <Search className="h-3 w-3" />
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search course or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-xs font-medium flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mandatory-filter" className="text-xs font-medium flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Type
          </Label>
          <Select value={mandatoryFilter} onValueChange={setMandatoryFilter}>
            <SelectTrigger id="mandatory-filter" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="mandatory">Mandatory Only</SelectItem>
              <SelectItem value="optional">Optional Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAssignments.length} of {assignments.length} assignments
      </div>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No assignments found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">
                    {assignment.courses?.title || 'Unknown Course'}
                  </h3>
                  {assignment.is_mandatory && (
                    <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                  )}
                  {assignment.isCompleted && (
                    <Badge variant="default" className="bg-green-600 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  {assignment.isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                  {!assignment.isCompleted && !assignment.isOverdue && (
                    <Badge variant="secondary" className="text-xs">Pending</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Assigned to: {assignment.users?.full_name || assignment.users?.email || 'Unknown User'}
                </p>
                {assignment.due_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </p>
                )}
                {assignment.isCompleted && assignment.completedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <AssignmentActions
                assignmentId={assignment.id}
                orgId={orgId}
                currentDueDate={assignment.due_date}
                currentIsMandatory={assignment.is_mandatory}
                isCompleted={assignment.isCompleted}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
