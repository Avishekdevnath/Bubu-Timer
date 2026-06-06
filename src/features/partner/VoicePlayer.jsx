import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'

export function VoicePlayer({ audioUrl, duration, isMe }) {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [waveformData, setWaveformData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Format time (mm:ss)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Draw waveform and progress bar
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const barCount = 40
    const progress = currentTime / (duration || 1)

    // Clear canvas
    ctx.fillStyle = isMe ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, width, height)

    // Draw bars with gradient effect
    const barWidth = width / barCount
    const centerY = height / 2

    for (let i = 0; i < barCount; i++) {
      const isPlayed = i < barCount * progress
      const barHeight = 4 + (waveformData[i] || 0.3) * (height * 0.5)
      const y = centerY - barHeight / 2

      // Color based on progress
      ctx.fillStyle = isPlayed
        ? isMe ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 116, 139, 0.8)'
        : isMe ? 'rgba(255, 255, 255, 0.4)' : 'rgba(100, 116, 139, 0.3)'

      ctx.fillRect(i * barWidth + 1, y, barWidth - 2, barHeight)
    }
  }, [currentTime, duration, waveformData, isMe])

  // Load audio and generate waveform
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setIsLoading(false)
      // Deterministic waveform — consistent per audio file, not random
      const seed = audioUrl ? audioUrl.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 42
      const bars = Array.from({ length: 40 }, (_, i) => {
        const t = (i / 40) * Math.PI * 6
        return Math.min(1, 0.25 + Math.abs(Math.sin(t + seed % 11) * 0.45 + Math.sin(t * 1.7 + (seed % 7) * 0.4) * 0.3))
      })
      setWaveformData(bars)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Failed to play audio:', err)
      }
    }
  }

  const handleProgressClick = (e) => {
    const canvas = canvasRef.current
    if (!canvas || !audioRef.current) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const progress = Math.max(0, Math.min(1, x / rect.width))
    const newTime = progress * (duration || 0)

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-2xl ${isMe ? 'bg-white/10' : 'bg-stone-100'}`}>
      <audio ref={audioRef} src={audioUrl} />

      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        disabled={isLoading}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isMe
            ? 'bg-white/20 text-white hover:bg-white/30 disabled:opacity-50'
            : 'bg-stone-200 text-stone-700 hover:bg-stone-300 disabled:opacity-50'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}>
        {isLoading ? (
          <Volume2 size={16} className="animate-pulse" />
        ) : isPlaying ? (
          <Pause size={16} />
        ) : (
          <Play size={16} />
        )}
      </button>

      {/* Waveform progress bar */}
      <div className="flex-1 flex flex-col gap-1">
        <canvas
          ref={canvasRef}
          width={200}
          height={24}
          onClick={handleProgressClick}
          className="w-full cursor-pointer rounded"
        />
      </div>

      {/* Duration */}
      <span className={`text-xs font-medium flex-shrink-0 ${isMe ? 'text-white/70' : 'text-stone-600'}`}>
        {formatTime(currentTime)} / {formatTime(duration || 0)}
      </span>
    </div>
  )
}
