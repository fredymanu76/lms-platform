'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Video, Clock, User, ArrowRight } from 'lucide-react'
import { BookingCalendar } from './booking-calendar'
import { SessionCard } from './session-card'
import { VideoRoomDialog } from './video-room-dialog-jitsi'

interface VirtualClassroomClientProps {
  orgId: string
  userId: string
  isInstructor: boolean
  upcomingSessions: any[]
  instructors: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
}

export function VirtualClassroomClient({
  orgId,
  userId,
  isInstructor,
  upcomingSessions,
  instructors,
}: VirtualClassroomClientProps) {
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showVideoRoom, setShowVideoRoom] = useState(false)
  const [sessions, setSessions] = useState(upcomingSessions)

  const handleBookingSuccess = (newSession: any) => {
    setSessions([newSession, ...sessions])
  }

  const handleJoinSession = (session: any) => {
    setSelectedSession(session)
    setShowVideoRoom(true)
  }

  const handleCancelSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/classroom/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      console.error('Error canceling session:', error)
    }
  }

  return (
    <>
      <Tabs defaultValue="book" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="book">
            <Calendar className="h-4 w-4 mr-2" />
            Book Session
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Video className="h-4 w-4 mr-2" />
            My Sessions ({sessions.length})
          </TabsTrigger>
        </TabsList>

        {/* Booking Tab */}
        <TabsContent value="book" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Instructors List */}
            <Card className="lg:col-span-1 border-border/50">
              <CardHeader>
                <CardTitle>Available Instructors</CardTitle>
                <CardDescription>
                  Select an instructor to view their availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {instructors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No instructors available
                  </p>
                ) : (
                  instructors.map((instructor) => (
                    <div
                      key={instructor.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{instructor.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{instructor.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {instructor.role}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader>
                <CardTitle>Book a Session</CardTitle>
                <CardDescription>
                  Select a date and time for your 1-on-1 session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  orgId={orgId}
                  userId={userId}
                  instructors={instructors}
                  onBookingSuccess={handleBookingSuccess}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-6">
          {sessions.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold text-lg mb-2">No upcoming sessions</h3>
                <p className="text-muted-foreground mb-6">
                  Book a 1-on-1 session with an instructor to get started
                </p>
                <Button onClick={() => document.querySelector('[value="book"]')?.dispatchEvent(new Event('click'))}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Your First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  userId={userId}
                  onJoin={handleJoinSession}
                  onCancel={handleCancelSession}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
