import Dexie, { type Table } from 'dexie'

/**
 * Интерфейс для хранения слова в IndexedDB
 */
export interface WordRecord {
  id: string
  full_word: string
  mask: string
  level: number
  is_public?: boolean
  created_at?: string
}

/**
 * Интерфейс для хранения прогресса в IndexedDB
 */
export interface ProgressRecord {
  device_id: string
  word_id: string
  mistakes: string[]
  correct_count: number
  last_attempt: string
}

/**
 * База данных IndexedDB для оффлайн-режима
 * Использует Dexie для упрощенной работы с IndexedDB
 */
class WordsAppDB extends Dexie {
  words!: Table<WordRecord, string>
  progress!: Table<ProgressRecord, [string, string]>

  constructor() {
    super('WordsAppDB')
    this.version(1).stores({
      words: 'id, full_word, mask, level',
      progress: '[device_id+word_id], mistakes, correct_count, last_attempt',
    })
  }
}

export const db = new WordsAppDB()

/**
 * Получить device_id из localStorage или создать новый
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const stored = localStorage.getItem('device_id')
  if (stored) {
    return stored
  }

  const deviceId = crypto.randomUUID() + navigator.platform
  localStorage.setItem('device_id', deviceId)
  return deviceId
}
