import { describe, expect, it } from 'vitest'
import { countMissingLetters, fillMask, getMissingLetters } from './words'

describe('word mask helpers', () => {
  it('treats consecutive underscores as one missing sequence', () => {
    expect(getMissingLetters('сейчас', 'с__час')).toEqual(['ей'])
    expect(countMissingLetters('с__час')).toBe(1)
  })

  it('handles a trailing missing letter after a consecutive sequence', () => {
    expect(getMissingLetters('чувство', 'чу__тв_')).toEqual(['вс', 'о'])
    expect(countMissingLetters('чу__тв_')).toBe(2)
  })

  it('fills grouped underscore sequences without leaving extra underscores', () => {
    expect(fillMask('с__час', 'ей', 'сейчас')).toBe('сейчас')
    expect(fillMask('чу__тв_', 'всо', 'чувство')).toBe('чувство')
  })
})
