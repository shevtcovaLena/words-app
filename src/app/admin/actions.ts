'use server'

import { createClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/supabase'

type WordInsert = Database['public']['Tables']['words']['Insert']

/**
 * Результат выполнения Server Action
 */
export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

/**
 * Добавляет новое слово в базу данных
 */
export async function addWord(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const full_word = (formData.get('full_word') as string)?.trim()
  const mask = (formData.get('mask') as string)?.trim()
  const level = parseInt((formData.get('level') as string) || '1', 10)
  const is_public = formData.get('is_public') === 'on'

  // Валидация
  if (!full_word || full_word.length < 2) {
    return {
      success: false,
      error: 'Полное слово должно содержать минимум 2 символа',
    }
  }

  if (!mask || !mask.includes('_')) {
    return {
      success: false,
      error: 'Маска должна содержать минимум один пропуск (_)',
    }
  }

  // Проверка, что маска соответствует слову (кроме пропусков)
  // Один пропуск _ может соответствовать нескольким буквам (например, "ру_ский" → "русский", где _ = "сс")
  let wordIndex = 0
  let maskIndex = 0

  while (maskIndex < mask.length && wordIndex < full_word.length) {
    if (mask[maskIndex] === '_') {
      // Пропуск - пропускаем буквы в слове до следующего совпадения
      maskIndex++ // Переходим к следующему символу в маске

      // Продолжаем, пока не найдем совпадение или не закончится слово
      while (wordIndex < full_word.length) {
        // Проверяем, совпадает ли текущая позиция в слове с текущей позицией в маске
        if (
          maskIndex < mask.length &&
          full_word[wordIndex] === mask[maskIndex] &&
          full_word[wordIndex] !== ' '
        ) {
          // Нашли совпадение - пропуск закончился
          break
        }
        // Также останавливаемся, если в маске закончились символы
        if (maskIndex >= mask.length) {
          // Берем все оставшиеся буквы
          wordIndex = full_word.length
          break
        }
        wordIndex++
      }
    } else if (mask[maskIndex] === full_word[wordIndex]) {
      // Символы совпадают
      maskIndex++
      wordIndex++
    } else if (mask[maskIndex] === ' ' && full_word[wordIndex] === ' ') {
      // Пробелы совпадают
      maskIndex++
      wordIndex++
    } else {
      return {
        success: false,
        error: `Маска не соответствует слову на позиции ${wordIndex + 1}: ожидалось "${full_word[wordIndex]}", найдено "${mask[maskIndex]}"`,
      }
    }
  }

  // Проверяем, что обработали все символы
  if (maskIndex < mask.length) {
    return {
      success: false,
      error: `В маске остались необработанные символы начиная с позиции ${maskIndex + 1}`,
    }
  }

  if (wordIndex < full_word.length) {
    return {
      success: false,
      error: `В слове остались необработанные символы начиная с позиции ${wordIndex + 1}`,
    }
  }

  if (level < 1 || level > 5) {
    return { success: false, error: 'Уровень сложности должен быть от 1 до 5' }
  }

  // Используем двойное приведение типа для обхода проблемы с типизацией Supabase
  const insertData: WordInsert = {
    full_word,
    mask,
    level,
    is_public,
  }

  // @ts-expect-error - Supabase типизация не всегда корректно работает с insert
  const { error } = await supabase.from('words').insert(insertData)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true, message: 'Слово успешно добавлено!' }
}

/**
 * Удаляет слово из базы данных
 */
export async function deleteWord(wordId: string): Promise<ActionResult> {
  const supabase = await createClient()

  if (!wordId) {
    return { success: false, error: 'ID слова не указан' }
  }

  const { error } = await supabase.from('words').delete().eq('id', wordId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true, message: 'Слово успешно удалено!' }
}
