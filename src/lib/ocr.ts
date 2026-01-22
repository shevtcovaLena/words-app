import { createWorker } from 'tesseract.js'

/**
 * Результат распознавания текста из изображения
 */
export interface OCRResult {
  text: string
  confidence: number
}

/**
 * Распознает текст из изображения с помощью Tesseract.js
 * @param imageFile - Файл изображения для распознавания
 * @param language - Язык распознавания (по умолчанию 'rus')
 * @returns Распознанный текст и уровень уверенности
 */
export async function extractTextFromImage(
  imageFile: File,
  language: string = 'rus',
): Promise<OCRResult> {
  const worker = await createWorker(language)
  try {
    const { data } = await worker.recognize(imageFile)
    await worker.terminate()

    return {
      text: data.text,
      confidence: data.confidence,
    }
  } catch (error) {
    await worker.terminate()
    throw new Error(
      `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Результат распознавания слов из изображения
 */
export interface ExtractWordsResult {
  words: string[]
  rawText: string
}

/**
 * Извлекает слова из изображения с помощью OCR
 * @param imageFile - Файл изображения для распознавания
 * @param onProgress - Callback для отслеживания прогресса (0-100)
 * @returns Результат с массивом распознанных слов и исходным текстом
 */
export async function extractWordsFromImage(
  imageFile: File,
  onProgress?: (progress: number) => void,
): Promise<ExtractWordsResult> {
  const worker = await createWorker('rus', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress * 100)
      }
    },
  })

  try {
    const { data } = await worker.recognize(imageFile)
    await worker.terminate()

    // Парсинг: более гибкая обработка текста
    const rawText = data.text.trim()

    if (!rawText) {
      return {
        words: [],
        rawText: '',
      }
    }

    // Разбиваем на строки и слова
    const lines = rawText.split(/\r?\n/)
    const words: string[] = []

    for (const line of lines) {
      // Убираем лишние пробелы и разбиваем на слова
      const lineWords = line
        .trim()
        .split(/\s+/) // Разбиваем по пробелам
        .map((word) => {
          // Убираем знаки препинания в начале и конце
          return word.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '').toLowerCase()
        })
        .filter((word) => {
          // Фильтруем: минимум 2 символа, содержит хотя бы одну русскую букву
          return (
            word.length >= 2 &&
            /[а-яё]/i.test(word) &&
            // Разрешаем только русские буквы, дефисы и апострофы (для составных слов)
            /^[а-яё\-\']+$/i.test(word)
          )
        })

      words.push(...lineWords)
    }

    // Убираем дубликаты и сортируем
    const uniqueWords = Array.from(new Set(words))

    return {
      words: uniqueWords,
      rawText: rawText,
    }
  } catch (error) {
    await worker.terminate()
    throw new Error(
      `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Парсит текст из двух столбцов (слово и маска с пропусками)
 * @param text - Распознанный текст
 * @returns Массив объектов { full_word, mask }
 */
export function parseWordsFromText(
  text: string,
): Array<{ full_word: string; mask: string }> {
  const lines = text.split('\n').filter((line) => line.trim().length > 0)
  const words: Array<{ full_word: string; mask: string }> = []

  for (const line of lines) {
    // Пытаемся найти два слова в строке (полное слово и маска)
    const parts = line
      .trim()
      .split(/\s+/)
      .filter((p) => p.length > 0)

    if (parts.length >= 2) {
      // Предполагаем, что первое слово - полное, второе - маска
      words.push({
        full_word: parts[0],
        mask: parts[1],
      })
    } else if (parts.length === 1) {
      // Если одно слово, проверяем, есть ли в нем пропуски (например, "к_т")
      const word = parts[0]
      if (word.includes('_')) {
        // Это маска, нужно найти полное слово (пока оставляем пустым)
        words.push({
          full_word: '',
          mask: word,
        })
      } else {
        // Это полное слово
        words.push({
          full_word: word,
          mask: '',
        })
      }
    }
  }

  return words
}
