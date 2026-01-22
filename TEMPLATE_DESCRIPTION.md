# Описание шаблона проекта

## SupaNext Starter Kit

Это полнофункциональный стартовый шаблон для создания современных веб-приложений на базе **Next.js 16** и **Supabase**.

### Основные технологии

#### Фронтенд
- **Next.js 16** (App Router) - React-фреймворк для продакшн-приложений
- **React 19** - последняя версия библиотеки React
- **TypeScript** - типизированный JavaScript для надежности кода
- **Tailwind CSS 4** - утилитарный CSS-фреймворк для стилизации
- **shadcn/ui** - коллекция переиспользуемых UI-компонентов на базе Radix UI
- **TanStack Query v5** - мощная библиотека для управления серверным состоянием и кэширования данных
- **next-themes** - поддержка темной/светлой темы с автоматическим определением системных настроек

#### Бэкенд и аутентификация
- **Supabase** - Backend-as-a-Service (BaaS) платформа
  - Аутентификация пользователей (email/password)
  - База данных PostgreSQL
  - Реальное время (Realtime subscriptions)
  - Хранилище файлов
- **@supabase/ssr** - интеграция Supabase с Next.js Server-Side Rendering
- Готовая реализация:
  - Регистрация пользователей (`/auth/sign-up`)
  - Вход в систему (`/auth/login`)
  - Восстановление пароля (`/auth/forgot-password`)
  - Обновление пароля (`/auth/update-password`)
  - Подтверждение email (`/auth/confirm`)
  - Защищенные маршруты (`/protected`)

#### Инструменты разработки
- **Vitest** - быстрый unit-тест фреймворк
- **React Testing Library** - тестирование React-компонентов
- **MSW v2** (Mock Service Worker) - мокирование HTTP-запросов в тестах
- **ESLint 9** - линтер для поиска и исправления проблем в коде
- **Prettier** - автоматическое форматирование кода
- **Husky** - Git hooks для автоматизации задач
- **lint-staged** - запуск линтера и форматтера только для измененных файлов
- **TypeScript** - статическая проверка типов

#### Дополнительные возможности
- **nextjs-toploader** - индикатор загрузки при навигации
- **Vercel Analytics** - аналитика производительности
- **Geist Font** - современный шрифт от Vercel
- **Path Mapping** - импорт через префикс `@` (например, `@/components`)
- **Next Bundle Analyzer** - анализ размера бандла
- **PWA поддержка** (next-pwa) - возможность создания Progressive Web App

### Структура проекта

```
word-app/
├── src/
│   ├── app/                    # Next.js App Router страницы и маршруты
│   │   ├── auth/              # Страницы аутентификации
│   │   │   ├── login/
│   │   │   ├── sign-up/
│   │   │   ├── forgot-password/
│   │   │   ├── update-password/
│   │   │   ├── confirm/       # Подтверждение email
│   │   │   └── error/         # Страница ошибок аутентификации
│   │   ├── protected/         # Защищенные маршруты (требуют авторизации)
│   │   ├── test-examples/     # Примеры тестов
│   │   └── page.tsx           # Главная страница
│   ├── components/            # React компоненты
│   │   ├── ui/                # shadcn/ui компоненты (Button, Card, Input и т.д.)
│   │   ├── auth-button.tsx    # Кнопка входа/выхода
│   │   ├── login-form.tsx     # Форма входа
│   │   ├── sign-up-form.tsx   # Форма регистрации
│   │   ├── theme-switcher.tsx # Переключатель темы
│   │   └── tutorial/          # Компоненты обучающих шагов
│   ├── supabase/              # Конфигурация Supabase
│   │   ├── client.ts          # Клиент для браузера
│   │   └── server.ts          # Клиент для сервера
│   ├── providers/             # React провайдеры
│   │   ├── ReactQueryProvider.tsx  # Провайдер TanStack Query
│   │   └── ThemeProvider.tsx      # Провайдер темы
│   ├── hooks/                 # Кастомные React хуки
│   ├── types/                 # TypeScript типы
│   │   └── supabase.ts        # Автогенерированные типы из Supabase
│   ├── utils/                 # Утилиты
│   │   ├── env.ts             # Проверка переменных окружения
│   │   └── tailwind.ts        # Утилиты для Tailwind
│   ├── mocks/                 # Моки для тестирования (MSW)
│   └── test/                  # Утилиты для тестирования
├── public/                    # Статические файлы
├── .env.local.example         # Пример файла с переменными окружения
├── package.json               # Зависимости и скрипты
├── tsconfig.json              # Конфигурация TypeScript
├── vitest.config.ts           # Конфигурация Vitest
├── next.config.ts             # Конфигурация Next.js
└── tailwind.config.ts         # Конфигурация Tailwind CSS
```

### Доступные команды

- `pnpm dev` - запуск в режиме разработки на `http://localhost:3000`
- `pnpm build` - создание production-сборки
- `pnpm start` - запуск production-сборки
- `pnpm type-check` - проверка типов TypeScript
- `pnpm lint` - запуск ESLint
- `pnpm format` - форматирование кода с помощью Prettier
- `pnpm format-check` - проверка форматирования
- `pnpm test` - запуск тестов Vitest
- `pnpm test:ui` - запуск тестов с UI-интерфейсом
- `pnpm test:ci` - запуск тестов в CI-режиме
- `pnpm analyze` - анализ размера бандла

### Требования

- Node.js >= 18.17.0
- pnpm 10

### Настройка

1. Создайте проект в [Supabase Dashboard](https://database.new)
2. Скопируйте `.env.local.example` в `.env.local`
3. Заполните переменные окружения:
   - `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - публичный API ключ
4. Установите зависимости: `pnpm install`
5. Запустите проект: `pnpm dev`

### Особенности реализации

#### Аутентификация
- Используется `@supabase/ssr` для работы с Supabase на сервере и клиенте
- Поддержка Server-Side Rendering (SSR) и Client-Side Rendering (CSR)
- Автоматическое управление сессиями через cookies
- Защищенные маршруты через middleware

#### Стилизация
- Tailwind CSS с кастомными темами
- Поддержка темной/светлой темы
- Адаптивный дизайн из коробки
- Готовые UI-компоненты от shadcn/ui

#### Тестирование
- Настроен Vitest с React Testing Library
- MSW для мокирования API-запросов
- Примеры тестов в `test-examples/`
- Утилиты для тестирования в `test/`

#### Качество кода
- Автоматическая проверка типов перед коммитом
- Автоматическое форматирование кода
- Линтинг с помощью ESLint
- Pre-commit hooks через Husky

### Лицензия

MIT License

### Автор

Michael Troya - [@michaeltroya_](https://twitter.com/michaeltroya_)

---

**Этот шаблон предоставляет все необходимое для быстрого старта разработки современного веб-приложения с аутентификацией, базой данных и лучшими практиками разработки.**
