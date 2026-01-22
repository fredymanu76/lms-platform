'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, Calendar, Clock, User, X } from 'lucide-react'
import { format, formatDistanceToNow, isPast, isBefore, addMinutes } from 'date-fns'

interface SessionCardProps {
  session: any
  userId: string
  onJoin: (session: any) => void
  onCancel: (sessionId: string) => void
}

export function SessionCard({ session, userId, onJoin, onCancel }: SessionCardProps) {
  const startTime = new Date(session.start_time)
  const endTime = new Date(session.end_time)
  const now = new Date()

  const isInstructor = session.instructor_id === userId
  const otherPerson = isInstructor ? session.student : session.instructor

  // Can join 5 minutes before start time
  const canJoin = isBefore(now, endTime) && isBefore(addMinutes(startTime, -5), now)
  const isLive = isBefore(now, endTime) && isBefore(startTime, now)
  const hasEnded = isPast(endTime)

  const getStatusBadge = () => {
    if (hasEnded) {
      return <Badge variant="outline" className="text-xs">Completed</Badge>
    }
    if (isLive) {
      return <Badge className="bg-red-500 text-xs">Live Now</Badge>
    }
    if (canJoin) {
      return <Badge className="bg-green-500 text-xs">Starting Soon</Badge>
    }
    return <Badge variant="secondary" className="text-xs">Upcoming</Badge>
  }

  return (
    <Card className="border-border/50 hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {isInstructor ? 'Teaching Session' : '1-on-1 Session'}
              </p>
              <p className="text-xs text-muted-foreground">with {otherPerson?.full_name || otherPerson?.email}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
          </div>
          {!hasEnded && (
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(startTime, { addSuffix: true })}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border/50">
          {canJoin && !hasEnded && (
            <Button
              className="flex-1"
              size="sm"
              onClick={() => onJoin(session)}
            >
              <Video className="h-3.5 w-3.5 mr-1" />
              Join Session
            </Button>
          )}
          {!hasEnded && !isLive && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                if (confirm('Are you sure you want to cancel this session?')) {
                  onCancel(session.id)
                }
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
