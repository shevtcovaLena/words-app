/**
 * Получает все пропущенные буквы из слова по порядку
 * Один пропуск _ может соответствовать нескольким буквам (например, "ру_ский" → "русский", где _ = "сс")
 * @param fullWord - Полное слово (например, "воробей" или "русский язык")
 * @param mask - Маска с пропусками (например, "в_р_бей" или "ру_ский язык")
 * @returns Массив пропущенных последовательностей букв по порядку (например, ["о", "о"] или ["сс"])
 */
export function getMissingLetters(fullWord: string, mask: string): string[] {
  const missingLetters: string[] = []
  let wordIndex = 0
  let maskIndex = 0

  while (maskIndex < mask.length && wordIndex < fullWord.length) {
    if (mask[maskIndex] === '_') {
      // Нашли пропуск - собираем все буквы до следующего совпадения
      const startWordIndex = wordIndex
      maskIndex++ // Переходим к следующему символу в маске

      // Продолжаем, пока не найдем совпадение или не закончится слово
      while (wordIndex < fullWord.length) {
        // Проверяем, совпадает ли текущая позиция в слове с текущей позицией в маске
        if (
          maskIndex < mask.length &&
          fullWord[wordIndex] === mask[maskIndex] &&
          fullWord[wordIndex] !== ' '
        ) {
          // Нашли совпадение - пропуск закончился
          break
        }
        // Также останавливаемся, если в маске закончились символы
        if (maskIndex >= mask.length) {
          // Берем все оставшиеся буквы
          while (wordIndex < fullWord.length) {
            wordIndex++
          }
          break
        }
        wordIndex++
      }

      // Сохраняем последовательность пропущенных букв
      const missingSequence = fullWord
        .substring(startWordIndex, wordIndex)
        .toLowerCase()
        .replace(/\s+/g, '')
      if (missingSequence) {
        missingLetters.push(missingSequence)
      }
    } else if (mask[maskIndex] === fullWord[wordIndex]) {
      // Символы совпадают
      maskIndex++
      wordIndex++
    } else if (mask[maskIndex] === ' ' && fullWord[wordIndex] === ' ') {
      // Пробелы совпадают
      maskIndex++
      wordIndex++
    } else {
      // Несовпадение - пропускаем в маске (может быть лишний символ)
      maskIndex++
    }
  }

  return missingLetters
}

/**
 * Подсчитывает количество пропусков в маске
 * Один пропуск _ может соответствовать нескольким буквам
 * @param mask - Маска с пропусками
 * @returns Количество пропусков (групп пропущенных букв)
 */
export function countMissingLetters(mask: string): number {
  return (mask.match(/_/g) || []).length
}

/**
 * Проверяет, правильно ли заполнены все пропущенные буквы в слове
 * Один пропуск _ может соответствовать нескольким буквам
 * @param fullWord - Полное слово (например, "воробей" или "русский язык")
 * @param mask - Маска с пропусками (например, "в_р_бей" или "ру_ский язык")
 * @param userInput - Введенные пользователем буквы подряд (например, "оо" или "сс")
 * @returns true, если все последовательности букв правильные
 */
export function checkWord(
  fullWord: string,
  mask: string,
  userInput: string,
): boolean {
  if (!fullWord || !mask || !userInput) {
    return false
  }

  const missingSequences = getMissingLetters(fullWord, mask)
  const inputText = userInput.trim().toLowerCase()

  // Проверяем, что количество последовательностей совпадает
  if (missingSequences.length === 0) {
    return false
  }

  // Сравниваем последовательности
  let inputIndex = 0
  for (let i = 0; i < missingSequences.length; i++) {
    const sequence = missingSequences[i]
    const inputSequence = inputText.substring(
      inputIndex,
      inputIndex + sequence.length,
    )

    if (inputSequence !== sequence) {
      return false
    }

    inputIndex += sequence.length
  }

  // Проверяем, что использовали все введенные буквы
  if (inputIndex !== inputText.length) {
    return false
  }

  return true
}

/**
 * Заменяет все пропуски в маске на введенные буквы по порядку
 * Один пропуск _ заменяется на всю последовательность букв (может быть несколько букв)
 * @param mask - Маска с пропусками (например, "в_р_бей" или "ру_ский")
 * @param letters - Введенные буквы подряд (например, "оо" или "сс")
 * @param fullWord - Полное слово для определения длины последовательности (опционально)
 * @returns Маска с заполненными буквами (например, "воробей" или "русский")
 */
export function fillMask(
  mask: string,
  letters: string,
  fullWord?: string,
): string {
  let result = mask
  const letterSequences = letters.split('') // Пока считаем, что каждая буква - отдельная последовательность
  let sequenceIndex = 0

  // Если передан fullWord, используем его для определения последовательностей
  if (fullWord) {
    const sequences = getMissingLetters(fullWord, mask)
    sequenceIndex = 0

    for (let i = 0; i < result.length; i++) {
      if (result[i] === '_' && sequenceIndex < sequences.length) {
        // Заменяем _ на соответствующую последовательность букв
        const sequence = sequences[sequenceIndex]
        // Берем буквы из введенного текста для этой последовательности
        const startPos = sequences.slice(0, sequenceIndex).join('').length
        const endPos = startPos + sequence.length
        const replacement = letters.substring(startPos, endPos)

        if (replacement) {
          result =
            result.substring(0, i) + replacement + result.substring(i + 1)
          sequenceIndex++
        } else {
          // Если не хватило букв, используем последовательность из fullWord
          result = result.substring(0, i) + sequence + result.substring(i + 1)
          sequenceIndex++
        }
      }
    }
  } else {
    // Старый способ - по одной букве на пропуск
    for (let i = 0; i < result.length; i++) {
      if (result[i] === '_' && sequenceIndex < letterSequences.length) {
        result =
          result.substring(0, i) +
          letterSequences[sequenceIndex] +
          result.substring(i + 1)
        sequenceIndex++
      }
    }
  }

  return result
}

/**
 * Подсчитывает количество правильных попыток
 * @param correctCount - Текущее количество правильных ответов
 * @param isCorrect - Был ли последний ответ правильным
 * @returns Новое количество правильных ответов
 */
export function updateCorrectCount(
  correctCount: number,
  isCorrect: boolean,
): number {
  return isCorrect ? correctCount + 1 : correctCount
}
