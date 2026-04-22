'use client'

import { Button } from '@/components/ui/button'
import { Volume2, Pause } from 'lucide-react'
import { useCallback, useState, useRef } from 'react'

interface SpeakButtonProps {
  text: string
  className?: string
}

export function SpeakButton({ text, className = '' }: SpeakButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback(() => {
    // HarmonyOS fallback
    if (navigator.userAgent.includes('HarmonyOS')) {
      // Пробуем Huawei TTS
      if ((window as any).huawei?.tts?.speak) {
        ;(window as any).huawei.tts.speak(text)
        setIsPlaying(true)
        setTimeout(() => setIsPlaying(false), 3000)
        return
      }

      // Fallback: уведомление
      alert('Звук недоступен на этом устройстве')
      return
    }

    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    utterance.lang = 'ru-RU'
    utterance.rate = 0.9

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.speak(utterance)
  }, [text])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop()
    } else {
      speak()
    }
  }, [isPlaying, speak, stop])

  // Защита SSR
  if (typeof window === 'undefined') {
    return <div className={`bg-muted/50 h-10 w-10 rounded-lg ${className}`} />
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
