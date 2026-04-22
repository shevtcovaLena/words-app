'use client'

import { Button } from '@/components/ui/button'
import { Volume2, Pause, Play } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'

interface SpeakButtonProps {
  text: string
  className?: string
}

export function SpeakButton({ text, className = '' }: SpeakButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)

  // Инициализация speechSynthesis
  useEffect(() => {
    synthesisRef.current = window.speechSynthesis
    synthesisRef.current.cancel() // Останавливаем предыдущее воспроизведение

    const loadVoices = () => {
      const availableVoices = synthesisRef.current!.getVoices()
      // Предпочтение русским голосам
      const russianVoices = availableVoices.filter(
        (voice) => voice.lang.startsWith('ru') || voice.lang.includes('RU'),
      )
      setVoices(russianVoices.length > 0 ? russianVoices : availableVoices)
    }

    // Голоса загружаются асинхронно
    if (synthesisRef.current.getVoices().length > 0) {
      loadVoices()
    } else {
      synthesisRef.current!.onvoiceschanged = loadVoices
    }

    return () => {
      synthesisRef.current!.cancel()
      synthesisRef.current!.onvoiceschanged = null
    }
  }, [])

  const speak = useCallback(() => {
    if (!synthesisRef.current || !voices.length) {
      alert('Голоса недоступны. Проверьте поддержку браузера.')
      return
    }

    // Останавливаем предыдущее
    synthesisRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // Выбираем русский голос, если есть
    const russianVoice =
      voices.find(
        (voice) =>
          voice.lang.startsWith('ru') ||
          voice.name.toLowerCase().includes('рус'),
      ) || voices[0]

    utterance.voice = russianVoice
    utterance.lang = 'ru-RU'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    synthesisRef.current.speak(utterance)
  }, [text, voices])

  const stop = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsPlaying(false)
    }
  }, [])

  const toggleSpeak = () => {
    if (isPlaying) {
      stop()
    } else {
      speak()
    }
  }

  // 🔧 ЗАЩИТА ОТ SSR: рендерим пустой div на сервере
  if (typeof window === 'undefined') {
    return <div className={`bg-muted/50 h-10 w-10 rounded-lg ${className}`} />
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleSpeak}
      disabled={!voices.length}
      className={className}
      title={isPlaying ? 'Остановить' : 'Прослушать слово'}
    >
      {isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      <span className="ml-1">{isPlaying ? 'Стоп' : 'Слушать'}</span>
    </Button>
  )
}
