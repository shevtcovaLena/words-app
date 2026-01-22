# Words Learning App - Cursor AI Rules

## Контекст проекта
Приложение для обучения детей словарным словам с заполнением пропущенных букв. 
PWA на Next.js 16 + Supabase для работы на планшетах (Huawei Android).
Цель: MVP для сына + портфолио с production-ready качеством.

## Технологический стек

### Фронтенд
- Next.js 16 (App Router) - используй Server Components по умолчанию
- React 19 - предпочитай новые хуки (useActionState, useOptimistic)
- TypeScript strict mode - всегда типизируй, избегай `any`
- Tailwind CSS 4 + shadcn/ui - используй готовые компоненты
- TanStack Query v5 - для client-side fetching из Supabase
- next-pwa - для Service Workers и оффлайн-режима

### Backend & Database
- Supabase (Postgres + Auth + Storage)
- @supabase/ssr - для server/client интеграции
- Типы из `src/types/supabase.ts` - импортируй `Database` везде

### Инструменты
- pnpm - package manager (НЕ npm/yarn)
- Vitest + React Testing Library - пиши тесты для критичных фич
- ESLint 9 + Prettier - форматируй через `pnpm format`
- Husky + lint-staged - pre-commit hooks работают автоматически

## Архитектурные правила

### Структура компонентов
```
src/
├── app/                  # Страницы и маршруты (App Router)
│   ├── admin/           # Admin-панель для добавления слов (protected)
│   ├── words/           # Страница обучения (публичная)
│   └── api/             # Server Actions / Route Handlers
├── components/
│   ├── ui/              # shadcn/ui компоненты (не трогай)
│   ├── words/           # Компоненты для работы со словами
│   └── ocr/             # OCR компоненты (Tesseract.js)
├── lib/
│   ├── supabase.ts      # Supabase client с типами Database
│   ├── storage.ts       # IndexedDB (Dexie) для локального хранения
│   └── ocr.ts           # Tesseract.js утилиты
└── types/
    └── supabase.ts      # Автогенерированные типы БД
```

### База данных (Supabase)

**Таблицы:**
- `words` (id, full_word, mask, level, is_public, created_at)
- `progress` (id, device_id, word_id, mistakes jsonb, correct_count, last_attempt)

**Правила:**
- RLS включен для всех таблиц
- Анонимный доступ: read для `words` WHERE is_public=true
- Admin (authenticated): full CRUD для `words`
- Progress: anonymous read/write (по device_id)

**Queries:**
```typescript
// Всегда используй типизированный client
import { createClient } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

const supabase = createClient<Database>()
const { data, error } = await supabase
  .from('words')
  .select('*')
  .eq('is_public', true)
```

### PWA & Offline

**Service Worker (next-pwa):**
- Кэширует words из Supabase (NetworkFirst)
- Оффлайн: работа с IndexedDB через Dexie
- Background Sync для отправки progress при reconnect

**IndexedDB структура (Dexie):**
```typescript
// lib/storage.ts
export const db = new Dexie('WordsAppDB')
db.version(1).stores({
  words: 'id, full_word, mask, level',
  progress: '[device_id+word_id], mistakes, correct_count'
})
```

**device_id генерация:**
```typescript
// Храни в localStorage
const deviceId = localStorage.getItem('device_id') || 
  crypto.randomUUID() + navigator.platform
```

### Стилизация

- Используй Tailwind utilities, избегай inline styles
- Touch-friendly: min-height 44px для кнопок (планшет)
- Адаптив: mobile-first подход
- Dark mode через next-themes (уже настроен)
- Анимации: framer-motion или CSS transitions

### OCR для загрузки слов

**Tesseract.js:**
```typescript
// lib/ocr.ts
import { createWorker } from 'tesseract.js'

export async function extractWords(imageFile: File) {
  const worker = await createWorker('rus')
  const { data } = await worker.recognize(imageFile)
  await worker.terminate()
  
  // Парсинг двух столбцов из текста
  return parseColumns(data.text)
}
```

- Admin панель: drag-drop фото листика → OCR → preview → save to Supabase
- Парсинг: split по `\n`, detect пропуски (например "_о_" для "кот")

### Тестирование

**Приоритеты:**
1. Критичные фичи: логика проверки слов, сохранение progress
2. UI: формы admin панели, OCR upload
3. Integration: Supabase queries, Service Worker sync

**Примеры:**
```typescript
// __tests__/words/check-word.test.ts
import { checkWord } from '@/lib/words'

test('проверка правильного ввода', () => {
  expect(checkWord('кот', 'к_т', 'о')).toBe(true)
})
```

## Кодовые соглашения

### TypeScript
- Strict mode: `"strict": true`
- Явные типы для функций, не полагайся на inference
- Используй `interface` для объектов, `type` для unions
- Избегай `any`, используй `unknown` если тип неизвестен

### Naming
- Компоненты: PascalCase (`WordInput.tsx`)
- Функции/переменные: camelCase (`checkWord`)
- Константы: UPPER_SNAKE_CASE (`MAX_WORDS`)
- Файлы: kebab-case для utils (`ocr-parser.ts`)

### Imports
- Используй path alias `@/`: `import { Button } from '@/components/ui/button'`
- Группируй: external → internal → relative → styles
- Server Components: НЕ импортируй `'use client'` код напрямую

### Комментарии
- JSDoc для публичных функций/компонентов
- Inline комментарии только для сложной логики
- TODO с датой: `// TODO (2026-01-22): implement retry logic`

## Специфика для детского приложения

### UX для ребёнка 8-10 лет
- Большие кнопки/инпуты (min 44px)
- Яркий feedback: анимации при правильном/неправильном ответе
- Звуки: Web Audio API для success/error (опционально)
- Прогресс: визуализация (progress bar, звёздочки)
- Без отвлекающих элементов: минимализм

### Производительность
- Preload 20-30 слов в IndexedDB при старте
- Lazy load admin компоненты (OCR, Tesseract.js тяжёлый)
- Оптимизация изображений: next/image для иконок
- Service Worker: кэш TTL 24 часа для words

## Деплой (Vercel)

- Environment variables: `NEXT_PUBLIC_SUPABASE_*` в dashboard
- Auto-deploy из main branch
- Preview deploys для PR
- PWA: проверь manifest.json и sw.js в build
- Lighthouse: цель 90+ для Performance, 100 для PWA

## Запрещено

❌ Использовать `any` без обоснования
❌ Писать inline styles вместо Tailwind
❌ Создавать client components без необходимости (`'use client'`)
❌ Хардкодить Supabase credentials в коде
❌ Коммитить без прохождения lint/format (Husky блокирует)
❌ Использовать npm/yarn вместо pnpm
❌ Игнорировать TypeScript ошибки

## Полезные команды

- `pnpm dev` - разработка
- `pnpm build` - проверка production build перед commit
- `pnpm test` - запуск тестов
- `pnpm format` - форматирование перед коммитом
- `pnpm type-check` - проверка типов
- `pnpm gen-types` - обновление типов Supabase (если настроен CLI)

## AI Assistant Guidelines

- Всегда предлагай типизированные решения
- Проверяй совместимость с PWA/Service Workers
- Учитывай оффлайн-режим в архитектурных решениях
- Предлагай доступные UI для детей (WCAG AA)
- Помни о performance на планшетах (Huawei Android)
- Генерируй тесты для новых функций
- Используй shadcn/ui компоненты вместо custom UI