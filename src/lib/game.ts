import type { Database } from '@/types/supabase'

type Word = Database['public']['Tables']['words']['Row']

/**
 * Класс для представления слова в игре
 */
export class WordItem {
  public readonly id: string
  public readonly fullWord: string
  public readonly mask: string
  public readonly level: number
  private _attempts: number = 0
  private _isCompleted: boolean = false

  constructor(word: Word) {
    this.id = word.id
    this.fullWord = word.full_word
    this.mask = word.mask
    this.level = word.level
  }

  /**
   * Регистрирует попытку ответа
   * @param isCorrect - Правильность ответа
   */
  recordAttempt(isCorrect: boolean): void {
    this._attempts++
    if (isCorrect) {
      this._isCompleted = true
    }
  }

  /**
   * Количество попыток
   */
  get attempts(): number {
    return this._attempts
  }

  /**
   * Количество ошибок
   */
  get mistakes(): number {
    return this._isCompleted ? this._attempts - 1 : this._attempts
  }

  /**
   * Завершено ли слово (написано правильно)
   */
  get isCompleted(): boolean {
    return this._isCompleted
  }

  /**
   * Нужно ли повторить слово (были ошибки)
   */
  get needsRetry(): boolean {
    return !this._isCompleted && this._attempts > 0
  }
}

/**
 * Класс для управления игровой сессией
 */
export class GameSession {
  private words: WordItem[] = []
  private currentIndex: number = 0
  private completedWords: WordItem[] = []
  private retryQueue: WordItem[] = []
  private totalMistakes: number = 0

  constructor(words: Word[]) {
    // Создаем WordItem для каждого слова и перемешиваем
    this.words = words.map((word) => new WordItem(word))
    this.shuffleArray(this.words)
  }

  /**
   * Перемешивает массив случайным образом
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  /**
   * Получить текущее слово
   */
  getCurrentWord(): WordItem | null {
    // Сначала обрабатываем обычные слова
    if (this.currentIndex < this.words.length) {
      return this.words[this.currentIndex]
    }

    // Затем очередь повторных слов
    if (this.retryQueue.length > 0) {
      return this.retryQueue[0]
    }

    return null
  }

  /**
   * Обработать ответ на текущее слово
   * @param isCorrect - Правильность ответа
   */
  handleAnswer(isCorrect: boolean): void {
    const currentWord = this.getCurrentWord()
    if (!currentWord) {
      return
    }

    currentWord.recordAttempt(isCorrect)

    if (isCorrect) {
      // Слово угадано правильно
      if (!this.completedWords.includes(currentWord)) {
        this.completedWords.push(currentWord)
      }

      // Удаляем из очереди повторных, если там было
      const retryIndex = this.retryQueue.indexOf(currentWord)
      if (retryIndex > -1) {
        this.retryQueue.splice(retryIndex, 1)
      } else {
        // Если это было обычное слово, переходим к следующему
        this.currentIndex++
      }
    } else {
      // Ошибка
      this.totalMistakes++

      // Проверяем, откуда взялось слово
      const isFromMainQueue =
        this.currentIndex < this.words.length &&
        this.words[this.currentIndex] === currentWord

      if (isFromMainQueue) {
        // Это обычное слово - добавляем в очередь повторных и переходим к следующему
        this.retryQueue.push(currentWord)
        this.currentIndex++
      } else {
        // Это слово из очереди повторных - удаляем из начала очереди
        // и добавляем в конец для повторения
        this.retryQueue.shift()
        this.retryQueue.push(currentWord)
      }
    }
  }

  /**
   * Проверяет, завершена ли игра
   */
  isCompleted(): boolean {
    return (
      this.currentIndex >= this.words.length &&
      this.retryQueue.length === 0 &&
      this.completedWords.length === this.words.length
    )
  }

  /**
   * Общее количество слов
   */
  get totalWords(): number {
    return this.words.length
  }

  /**
   * Количество правильно угаданных слов
   */
  get completedCount(): number {
    return this.completedWords.length
  }

  /**
   * Количество слов в очереди повторных
   */
  get retryCount(): number {
    return this.retryQueue.length
  }

  /**
   * Общее количество ошибок
   */
  get mistakes(): number {
    return this.totalMistakes
  }

  /**
   * Прогресс выполнения (0-100)
   */
  get progress(): number {
    if (this.totalWords === 0) {
      return 0
    }
    return Math.round((this.completedCount / this.totalWords) * 100)
  }

  /**
   * Получить статистику по ошибкам для каждого слова
   */
  getWordsStats(): Array<{ word: WordItem; mistakes: number }> {
    return this.words.map((word) => ({
      word,
      mistakes: word.mistakes,
    }))
  }

  /**
   * Получить текущий статус игры
   */
  getStatus(): {
    currentWord: WordItem | null
    isCompleted: boolean
    progress: number
    completedCount: number
    totalWords: number
    retryCount: number
    mistakes: number
  } {
    return {
      currentWord: this.getCurrentWord(),
      isCompleted: this.isCompleted(),
      progress: this.progress,
      completedCount: this.completedCount,
      totalWords: this.totalWords,
      retryCount: this.retryCount,
      mistakes: this.mistakes,
    }
  }
}
