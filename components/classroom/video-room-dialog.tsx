'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface VideoRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: any
  userId: string
}

export function VideoRoomDialog({ open, onOpenChange, session, userId }: VideoRoomDialogProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (open && session) {
      initializeVideoCall()
    }

    return () => {
      // Cleanup video call when dialog closes
      if (videoRef.current) {
        videoRef.current.innerHTML = ''
      }
    }
  }, [open, session])

  const initializeVideoCall = async () => {
    setIsConnecting(true)

    try {
      // In a real implementation, you would:
      // 1. Create a room using Daily.co API
      // 2. Get the room URL from your backend
      // 3. Initialize Daily iframe or call object

      // For now, we'll simulate the connection
      setTimeout(() => {
        setIsConnected(true)
        setIsConnecting(false)

        // Set up local video preview
        setupLocalVideo()
      }, 1500)

    } catch (error) {
      console.error('Error initializing video call:', error)
      toast.error('Failed to connect to video call')
      setIsConnecting(false)
    }
  }

  const setupLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      if (videoRef.current) {
        const video = document.createElement('video')
        video.srcObject = stream
        video.autoplay = true
        video.muted = true
        video.playsInline = true
        video.className = 'w-full h-full object-cover rounded-lg'

        videoRef.current.innerHTML = ''
        videoRef.current.appendChild(video)
      }
    } catch (error) {
      console.error('Error accessing camera/microphone:', error)
      toast.error('Please allow camera and microphone access')
    }
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    // In real implementation: call dailyCall.setLocalAudio(!isAudioEnabled)
    toast.success(isAudioEnabled ? 'Microphone muted' : 'Microphone unmuted')
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    // In real implementation: call dailyCall.setLocalVideo(!isVideoEnabled)

    if (videoRef.current) {
      const video = videoRef.current.querySelector('video')
      if (video) {
        video.style.display = isVideoEnabled ? 'none' : 'block'
      }
    }
    toast.success(isVideoEnabled ? 'Camera off' : 'Camera on')
  }

  const handleLeave = () => {
    // In real implementation: call dailyCall.leave()
    if (videoRef.current) {
      const video = videoRef.current.querySelector('video')
      if (video && video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
      videoRef.current.innerHTML = ''
    }

    setIsConnected(false)
    onOpenChange(false)
    toast.success('Left the session')
  }

  const isInstructor = session.instructor_id === userId
  const otherPerson = isInstructor ? session.student : session.instructor

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Session
          </DialogTitle>
          <DialogDescription>
            1-on-1 session with {otherPerson?.full_name || otherPerson?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Video Container */}
          <div className="flex-1 bg-slate-900 rounded-lg relative overflow-hidden">
            {isConnecting ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-slate-300">Connecting to session...</p>
                </div>
              </div>
            ) : (
              <div
                ref={videoRef}
                className="w-full h-full flex items-center justify-center"
              >
                {!isConnected && (
                  <div className="text-center text-slate-300">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Camera preview will appear here</p>
                  </div>
                )}
              </div>
            )}

            {/* Remote participant would appear here in full implementation */}
            {isConnected && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-slate-800 rounded-lg border-2 border-slate-700 overflow-hidden">
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  Waiting for {otherPerson?.full_name || 'other participant'}...
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 pb-4">
            <Button
              variant={isAudioEnabled ? 'default' : 'destructive'}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={toggleAudio}
              disabled={!isConnected}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={isVideoEnabled ? 'default' : 'destructive'}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={toggleVideo}
              disabled={!isConnected}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={handleLeave}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground text-center pb-2">
            <p className="mb-1">
              🎥 This is a demo video interface. In production, this uses Daily.co WebRTC for real-time video.
            </p>
            <p>
              Allow camera/microphone access when prompted to test the interface.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
