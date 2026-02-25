import { QueryCache } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'

const queryCache = new QueryCache()

afterEach(() => {
  queryCache.clear()
})
