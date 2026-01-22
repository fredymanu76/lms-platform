'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface BookingCalendarProps {
  orgId: string
  userId: string
  instructors: Array<{
    id: string
    name: string
  }>
  onBookingSuccess: (session: any) => void
}

export function BookingCalendar({
  orgId,
  userId,
  instructors,
  onBookingSuccess,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedInstructor, setSelectedInstructor] = useState<string>('')
  const [isBooking, setIsBooking] = useState(false)

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Available time slots (9 AM - 5 PM, 30-minute slots)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30',
  ]

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date | null) => {
    if (!date) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return // Can't book past dates

    setSelectedDate(date)
    setSelectedTime('')
  }

  const handleBookSession = async () => {
    if (!selectedDate || !selectedTime || !selectedInstructor) {
      toast.error('Please select a date, time, and instructor')
      return
    }

    setIsBooking(true)

    try {
      const [hours, minutes] = selectedTime.split(':')
      const startTime = new Date(selectedDate)
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + 30) // 30-minute sessions

      const response = await fetch('/api/classroom/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          instructorId: selectedInstructor,
          studentId: userId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Session booked successfully!')
        onBookingSuccess(data.session)
        setSelectedDate(null)
        setSelectedTime('')
        setSelectedInstructor('')
      } else {
        toast.error(data.error || 'Failed to book session')
      }
    } catch (error) {
      console.error('Error booking session:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsBooking(false)
    }
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{monthName}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          const isToday = date && date.toDateString() === new Date().toDateString()
          const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString()
          const isPast = date && date < today
          const isDisabled = !date || isPast

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={`
                aspect-square p-2 text-sm rounded-lg border transition-colors
                ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                ${isToday ? 'border-primary font-semibold' : 'border-border/50'}
                ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}
              `}
            >
              {date?.getDate()}
            </button>
          )
        })}
      </div>

      {/* Booking Form */}
      {selectedDate && (
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-sm font-medium mb-2">Selected Date</p>
            <p className="text-sm text-muted-foreground">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Instructor</label>
            {instructors.length === 0 ? (
              <div className="p-4 border border-border/50 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  No other instructors available. You cannot book sessions with yourself.
                </p>
              </div>
            ) : (
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an instructor" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50">
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Time</label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleBookSession}
            disabled={!selectedTime || !selectedInstructor || isBooking}
          >
            {isBooking ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </div>
      )}
    </div>
  )
}
