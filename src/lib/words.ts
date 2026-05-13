/**
 * Получает все пропущенные группы букв из слова по порядку
 * Группа подряд идущих _ соответствует такой же группе букв в слове
 * @param fullWord - Полное слово (например, "воробей" или "русский язык")
 * @param mask - Маска с пропусками (например, "в_р_бей" или "ру__кий язык")
 * @returns Массив пропущенных последовательностей букв по порядку (например, ["о", "о"] или ["сс"])
 */
export function getMissingLetters(fullWord: string, mask: string): string[] {
  const missingLetters: string[] = []

  let index = 0
  while (index < mask.length && index < fullWord.length) {
    if (mask[index] === '_') {
      const startIndex = index

      while (index < mask.length && mask[index] === '_') {
        index++
      }

      const missingSequence = fullWord
        .substring(startIndex, index)
        .toLowerCase()
      if (missingSequence) {
        missingLetters.push(missingSequence)
      }
    } else {
      index++
    }
  }

  return missingLetters
}

/**
 * Подсчитывает количество пропусков в маске
 * Подряд идущие _ считаются одним пропуском
 * @param mask - Маска с пропусками
 * @returns Количество пропусков (групп пропущенных букв)
 */
export function countMissingLetters(mask: string): number {
  return (mask.match(/_+/g) || []).length
}

/**
 * Проверяет, правильно ли заполнены все пропущенные буквы в слове
 * Подряд идущие _ считаются одной последовательностью букв
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
 * Подряд идущие _ заменяются на всю последовательность букв
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
  let result = ''
  const letterSequences = letters.split('') // Пока считаем, что каждая буква - отдельная последовательность
  let sequenceIndex = 0

  // Если передан fullWord, используем его для определения последовательностей
  if (fullWord) {
    const sequences = getMissingLetters(fullWord, mask)
    let i = 0

    while (i < mask.length) {
      if (mask[i] === '_' && sequenceIndex < sequences.length) {
        while (i < mask.length && mask[i] === '_') {
          i++
        }

        const sequence = sequences[sequenceIndex]
        const startPos = sequences.slice(0, sequenceIndex).join('').length
        const endPos = startPos + sequence.length
        const replacement = letters.substring(startPos, endPos)

        result += replacement || sequence
        sequenceIndex++
      } else {
        result += mask[i]
        i++
      }
    }
  } else {
    // Старый способ - по одной букве на пропуск
    result = mask
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
