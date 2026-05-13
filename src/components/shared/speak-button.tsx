'use client'

import { Button } from '@/components/ui/button'
import { Volume2, Pause } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
} from 'react'

interface SpeakButtonProps {
  text: string
  className?: string
}

function isUnsafeSpeechPlatform(userAgent: string): boolean {
  return /Android|HarmonyOS/i.test(userAgent)
}

function canUseSpeechSynthesis(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  if (isUnsafeSpeechPlatform(navigator.userAgent)) {
    return false
  }

  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function SpeakButton({ text, className = '' }: SpeakButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const isSupported = useSyncExternalStore(
    () => () => {},
    canUseSpeechSynthesis,
    () => false,
  )
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel()
      } catch {
        // Озвучка не должна ломать игровой экран.
      }
    }
  }, [])

  const speak = useCallback(() => {
    if (!canUseSpeechSynthesis()) {
      setIsPlaying(false)
      return
    }

    try {
      window.speechSynthesis.cancel()

      const utterance = new window.SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance

      utterance.lang = 'ru-RU'
      utterance.rate = 0.9

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)

      window.speechSynthesis.speak(utterance)
    } catch {
      setIsPlaying(false)
    }
  }, [text])

  const stop = useCallback(() => {
    try {
      window.speechSynthesis?.cancel()
    } catch {
      // Озвучка не должна ломать игровой экран.
    }
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop()
    } else {
      speak()
    }
  }, [isPlaying, speak, stop])

  if (!isSupported) {
    return null
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} className={className}>
      {isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      <span className="ml-1 hidden sm:inline">
        {isPlaying ? 'Стоп' : 'Слушать'}
      </span>
    </Button>
  )
}
