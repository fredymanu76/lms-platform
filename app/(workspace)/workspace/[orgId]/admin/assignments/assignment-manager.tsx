"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { UserPlus, Users } from "lucide-react"
import { useRouter } from "next/navigation"

interface Course {
  id: string
  title: string
  category: string
  versionId: string
}

interface Member {
  id: string
  name: string
  email: string
  role: string
}

interface AssignmentManagerProps {
  orgId: string
  courses: Course[]
  members: Member[]
}

export function AssignmentManager({ orgId, courses, members }: AssignmentManagerProps) {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [dueDate, setDueDate] = useState<string>("")
  const [isMandatory, setIsMandatory] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedMembers(members.map(m => m.id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSubmit = async () => {
    if (!selectedCourse || selectedMembers.length === 0) {
      alert("Please select a course and at least one member")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/assignment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          courseId: selectedCourse,
          userIds: selectedMembers,
          dueDate: dueDate || null,
          isMandatory,
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Successfully created ${selectedMembers.length} assignment(s)`)
        // Reset form
        setSelectedCourse("")
        setSelectedMembers([])
        setSelectAll(false)
        setDueDate("")
        setIsMandatory(true)
        router.refresh()
      } else {
        alert(`Failed to create assignments: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Assignment creation error:', error)
      alert('An error occurred while creating assignments')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <div className="space-y-2">
        <Label>Select Course</Label>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a course to assign" />
          </SelectTrigger>
          <SelectContent>
            {courses.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No published courses available</div>
            ) : (
              courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Member Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Select Team Members ({selectedMembers.length} selected)</Label>
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-normal cursor-pointer">
              Select All
            </Label>
          </div>
        </div>

        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No team members found
            </p>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => handleToggleMember(member.id)}
              >
                <Checkbox
                  checked={selectedMembers.includes(member.id)}
                  onCheckedChange={() => handleToggleMember(member.id)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label>Due Date (Optional)</Label>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Mandatory Flag */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="mandatory"
          checked={isMandatory}
          onCheckedChange={(checked) => setIsMandatory(checked as boolean)}
        />
        <Label htmlFor="mandatory" className="font-normal cursor-pointer">
          Mark as mandatory training
        </Label>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedCourse || selectedMembers.length === 0}
        className="w-full"
        size="lg"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Creating Assignments...' : `Create ${selectedMembers.length} Assignment${selectedMembers.length !== 1 ? 's' : ''}`}
      </Button>
    </div>
  )
}
