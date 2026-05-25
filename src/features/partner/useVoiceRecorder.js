import { useRef, useState, useCallback } from 'react'

export function useVoiceRecorder() {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      if (!mediaRecorder) return resolve(null)

      mediaRecorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const duration = recordingTime
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach((track) => track.stop())
        
        setIsRecording(false)
        setRecordingTime(0)
        
        resolve({ blob, duration })
      }

      mediaRecorder.stop()
    })
  }, [recordingTime])

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder) {
      mediaRecorder.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    chunksRef.current = []
    setIsRecording(false)
    setRecordingTime(0)
  }, [])

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
