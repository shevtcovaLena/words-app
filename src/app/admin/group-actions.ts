'use server'

import { createClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/supabase'

type GroupInsert = Database['public']['Tables']['word_groups']['Insert']
type GroupUpdate = Database['public']['Tables']['word_groups']['Update']
type GroupItemInsert =
  Database['public']['Tables']['word_group_items']['Insert']
type GroupItemRow = Database['public']['Tables']['word_group_items']['Row']
type GroupItemUpdate =
  Database['public']['Tables']['word_group_items']['Update']

/**
 * Результат выполнения Server Action
 */
export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

/**
 * Создает новую группу слов
 */
export async function createGroup(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  // Валидация
  if (!name || name.length < 2) {
    return {
      success: false,
      error: 'Название группы должно содержать минимум 2 символа',
    }
  }

  const insertData: GroupInsert = {
    name,
    description,
  }

  // @ts-expect-error - Supabase типизация не всегда корректно работает с insert
  const { error } = await supabase.from('word_groups').insert(insertData)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true, message: 'Группа успешно создана!' }
}

/**
 * Обновляет группу слов
 */
export async function updateGroup(
  groupId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!name || name.length < 2) {
    return {
      success: false,
      error: 'Название группы должно содержать минимум 2 символа',
    }
  }

  const updateData: GroupUpdate = { name, description }

  const { error } = await supabase
    .from('word_groups')
    // @ts-expect-error - Supabase типизация не всегда корректно работает с update
    .update(updateData)
    .eq('id', groupId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true, message: 'Группа успешно обновлена!' }
}

/**
 * Удаляет группу слов
 */
export async function deleteGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createClient()

  if (!groupId) {
    return { success: false, error: 'ID группы не указан' }
  }

  const { error } = await supabase
    .from('word_groups')
    .delete()
    .eq('id', groupId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true, message: 'Группа успешно удалена!' }
}

/**
 * Добавляет слова в группу
 */
export async function addWordsToGroup(
  groupId: string,
  wordIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient()

  if (!groupId || !wordIds || wordIds.length === 0) {
    return { success: false, error: 'ID группы и список слов обязательны' }
  }

  // Получаем максимальный sort_order для группы
  const { data: existingItems } = await supabase
    .from('word_group_items')
    .select('sort_order')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: false })
    .limit(1)

  let nextSortOrder = 0
  if (existingItems && existingItems.length > 0) {
    const item = existingItems[0] as GroupItemRow
    nextSortOrder = (item.sort_order || 0) + 1
  }

  // Создаем записи для каждого слова
  const items: GroupItemInsert[] = wordIds.map((wordId, index) => ({
    group_id: groupId,
    word_id: wordId,
    sort_order: nextSortOrder + index,
  }))

  // @ts-expect-error - Supabase типизация не всегда корректно работает с insert
  const { error } = await supabase.from('word_group_items').insert(items)

  if (error) {
    // Игнорируем ошибки дубликата (слово уже в группе)
    if (error.code !== '23505') {
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/admin')
  return { success: true, message: 'Слова успешно добавлены в группу!' }
}

/**
 * Удаляет слова из группы
 */
export async function removeWordsFromGroup(
  groupId: string,
  wordIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient()

  if (!groupId || !wordIds || wordIds.length === 0) {
    return { success: false, error: 'ID группы и список слов обязательны' }
  }

  const { error } = await supabase
    .from('word_group_items')
    .delete()
    .eq('group_id', groupId)
    .in('word_id', wordIds)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true, message: 'Слова успешно удалены из группы!' }
}

/**
 * Обновляет порядок слов в группе
 */
export async function updateWordsOrder(
  groupId: string,
  wordIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient()

  if (!groupId || !wordIds || wordIds.length === 0) {
    return { success: false, error: 'ID группы и список слов обязательны' }
  }

  // Обновляем sort_order для каждого слова
  const updates = wordIds.map((wordId, index) => {
    const updateData: GroupItemUpdate = { sort_order: index }
    return (
      supabase
        .from('word_group_items')
        // @ts-expect-error - Supabase типизация не всегда корректно работает с update
        .update(updateData)
        .eq('group_id', groupId)
        .eq('word_id', wordId)
    )
  })

  const results = await Promise.all(updates)
  const hasError = results.some((result) => result.error)

  if (hasError) {
    return { success: false, error: 'Ошибка при обновлении порядка слов' }
  }

  revalidatePath('/admin')
  return { success: true, message: 'Порядок слов обновлен!' }
}
