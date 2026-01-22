'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Video, X } from 'lucide-react'
import { format } from 'date-fns'
import { VideoRoomDialog } from './video-room-dialog-jitsi'
import { toast } from 'sonner'

interface InstructorSessionManagerProps {
  sessions: any[]
  userId: string
}

export function InstructorSessionManager({ sessions: initialSessions, userId }: InstructorSessionManagerProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showVideoRoom, setShowVideoRoom] = useState(false)

  const handleJoinSession = (session: any) => {
    setSelectedSession(session)
    setShowVideoRoom(true)
  }

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session? The student will be notified.')) {
      return
    }

    try {
      const response = await fetch(`/api/classroom/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
        toast.success('Session cancelled successfully')
      } else {
        toast.error('Failed to cancel session')
      }
    } catch (error) {
      console.error('Error canceling session:', error)
      toast.error('An unexpected error occurred')
    }
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-lg mb-2">No upcoming sessions</h3>
          <p className="text-muted-foreground">
            Students can book sessions with you through the Virtual Classroom
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map((session) => {
              const startTime = new Date(session.start_time)
              const endTime = new Date(session.end_time)
              const now = new Date()
              const canJoin = startTime <= now && endTime >= now

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {session.student?.full_name || session.student?.email || 'Student'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(startTime, 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canJoin ? (
                      <>
                        <Badge className="bg-green-500">Live</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleJoinSession(session)}
                        >
                          <Video className="h-3.5 w-3.5 mr-1" />
                          Join
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary">Scheduled</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelSession(session.id)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Video Room Dialog */}
      {selectedSession && (
        <VideoRoomDialog
          open={showVideoRoom}
          onOpenChange={setShowVideoRoom}
          session={selectedSession}
          userId={userId}
        />
      )}
    </>
  )
}
