'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Upload, Image as ImageIcon, X } from 'lucide-react'
import { extractWordsFromImage } from '@/lib/ocr'

interface PhotoUploadProps {
  onWordsExtracted: (words: string[]) => void
  disabled?: boolean
}

/**
 * Компонент для загрузки фото и распознавания слов через OCR
 */
export function PhotoUpload({ onWordsExtracted, disabled }: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [rawText, setRawText] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Обработка выбранного файла
   */
  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      return
    }

    // Проверка типа файла
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
      setError('Поддерживаются только форматы JPEG и PNG')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Создаем preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.onerror = () => {
      setError('Ошибка чтения файла')
    }
    reader.readAsDataURL(file)
  }, [])

  /**
   * Обработка изменения input
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      handleFileSelect(file)
    },
    [handleFileSelect],
  )

  /**
   * Обработка drag and drop
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      if (disabled || isProcessing) {
        return
      }

      const file = e.dataTransfer.files?.[0] || null
      handleFileSelect(file)
    },
    [disabled, isProcessing, handleFileSelect],
  )

  /**
   * Открытие диалога выбора файла
   */
  const handleClick = useCallback(() => {
    if (disabled || isProcessing) {
      return
    }
    fileInputRef.current?.click()
  }, [disabled, isProcessing])

  /**
   * Обработка распознавания слов
   */
  async function handleRecognize() {
    if (!selectedFile) {
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const result = await extractWordsFromImage(
        selectedFile,
        (progressValue) => {
          setProgress(progressValue)
        },
      )

      setRawText(result.rawText)

      if (result.words.length === 0) {
        setError(
          `Не удалось распознать слова на изображении. Распознанный текст: "${result.rawText.substring(0, 100)}${result.rawText.length > 100 ? '...' : ''}". Попробуйте другое фото или проверьте качество изображения.`,
        )
        setIsProcessing(false)
        return
      }

      onWordsExtracted(result.words)
      // Очищаем после успешного распознавания
      handleClear()
    } catch (err) {
      setError(
        err instanceof Error
          ? `Ошибка распознавания: ${err.message}`
          : 'Произошла ошибка при распознавании текста',
      )
      setIsProcessing(false)
    }
  }

  /**
   * Очистка выбранного файла
   */
  function handleClear() {
    setSelectedFile(null)
    setPreview(null)
    setProgress(0)
    setError(null)
    setRawText(null)
    setIsProcessing(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Загрузка фото с словами</CardTitle>
        <CardDescription>
          Загрузите фото листочка со словарными словами для автоматического
          распознавания
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag-n-drop зона */}
        {!preview && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            } ${disabled || isProcessing ? 'cursor-not-allowed opacity-50' : ''} `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleInputChange}
              className="hidden"
              disabled={disabled || isProcessing}
            />
            <Upload className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="mb-2 text-lg font-medium">
              {isDragActive
                ? 'Отпустите для загрузки'
                : 'Перетащите фото сюда или нажмите для выбора'}
            </p>
            <p className="text-muted-foreground text-sm">
              Поддерживаются форматы: JPEG, PNG
            </p>
          </div>
        )}

        {/* Preview загруженного фото */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <div className="border-border relative overflow-hidden rounded-lg border-2">
                <Image
                  src={preview}
                  alt="Preview"
                  width={800}
                  height={600}
                  className="bg-muted h-auto max-h-[400px] w-full object-contain"
                  unoptimized
                />
                {!isProcessing && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleClear}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Прогресс распознавания */}
              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Распознавание текста...
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <motion.div
                      className="bg-primary h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div className="text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Пожалуйста, подождите...</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ошибка */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            <p>{error}</p>
            {rawText && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">
                  Распознанный текст (для отладки)
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-white p-2 text-xs dark:bg-gray-800">
                  {rawText}
                </pre>
              </details>
            )}
          </motion.div>
        )}

        {/* Кнопки действий */}
        {preview && !isProcessing && (
          <div className="flex gap-3">
            <Button
              onClick={handleRecognize}
              className="min-h-[44px] flex-1"
              disabled={disabled}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Распознать слова
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="min-h-[44px]"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
