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

  // Проверка, что маска соответствует слову
  // _ = ровно один символ
  if (mask.length !== full_word.length) {
    return {
      success: false,
      error: `Длина маски должна совпадать с длиной слова (${full_word.length} символов)`,
    }
  }

  for (let i = 0; i < mask.length; i++) {
    const maskChar = mask[i]
    const wordChar = full_word[i]

    if (maskChar === '_') {
      continue
    }

    if (maskChar !== wordChar) {
      return {
        success: false,
        error: `Маска не соответствует слову на позиции ${i + 1}: ожидалось "${wordChar}", найдено "${maskChar}"`,
      }
    }
  }

  if (level < 1 || level > 5) {
    return { success: false, error: 'Уровень сложности должен быть от 1 до 5' }
  }

  //защита от дублей
  const { data: existingWord } = await supabase
    .from('words')
    .select('id')
    .eq('full_word', full_word)
    .single()

  if (existingWord) {
    return {
      success: false,
      error: 'Это слово уже существует в базе данных',
    }
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
