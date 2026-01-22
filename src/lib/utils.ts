import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Утилита для объединения классов Tailwind CSS
 * Объединяет clsx и tailwind-merge для правильной обработки конфликтующих классов
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
