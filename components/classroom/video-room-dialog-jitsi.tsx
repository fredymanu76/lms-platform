'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Video, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface VideoRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: any
  userId: string
}

// Declare Jitsi API type
declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export function VideoRoomDialog({ open, onOpenChange, session, userId }: VideoRoomDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const jitsiApiRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Load Jitsi Meet API script
    if (!scriptLoaded && typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.async = true
      script.onload = () => setScriptLoaded(true)
      document.body.appendChild(script)

      return () => {
        // Cleanup script on unmount
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (open && scriptLoaded && containerRef.current && !jitsiApiRef.current) {
      initializeJitsi()
    }

    return () => {
      // Cleanup Jitsi when dialog closes
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
        jitsiApiRef.current = null
      }
    }
  }, [open, scriptLoaded, session])

  const initializeJitsi = () => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return

    try {
      // Generate unique room name for this session
      const roomName = `session-${session.id}`

      const isInstructor = session.instructor_id === userId
      const otherPerson = isInstructor ? session.student : session.instructor
      const userName = isInstructor ? 'Instructor' : 'Student'

      // Jitsi configuration
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'raisehand',
            'videoquality',
            'tileview',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        },
        userInfo: {
          displayName: userName,
        },
      }

      // Create Jitsi Meet instance
      jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options)

      // Event listeners
      jitsiApiRef.current.on('videoConferenceJoined', () => {
        setIsLoading(false)
        toast.success('Joined video session')
      })

      jitsiApiRef.current.on('videoConferenceLeft', () => {
        handleLeave()
      })

      jitsiApiRef.current.on('readyToClose', () => {
        handleLeave()
      })

    } catch (error) {
      console.error('Error initializing Jitsi:', error)
      toast.error('Failed to initialize video session')
      setIsLoading(false)
    }
  }

  const handleLeave = () => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose()
        jitsiApiRef.current = null
      } catch (error) {
        console.error('Error disposing Jitsi:', error)
      }
    }
    onOpenChange(false)
  }

  const isInstructor = session.instructor_id === userId
  const otherPerson = isInstructor ? session.student : session.instructor

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleLeave()
      else onOpenChange(open)
    }}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Live Session
          </DialogTitle>
          <DialogDescription>
            1-on-1 session with {otherPerson?.full_name || otherPerson?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative bg-slate-900 rounded-lg overflow-hidden mx-6 mb-6">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-slate-300">Connecting to video session...</p>
              </div>
            </div>
          )}

          {!scriptLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-slate-300">Loading video platform...</p>
              </div>
            </div>
          )}

          {/* Jitsi container */}
          <div ref={containerRef} className="w-full h-full" />
        </div>

        <div className="px-6 pb-4">
          <div className="text-xs text-muted-foreground text-center">
            <p>
              🎥 Powered by <strong>Jitsi Meet</strong> - 100% free and open source
            </p>
            <p className="mt-1">
              Camera and microphone controls are in the video interface
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
