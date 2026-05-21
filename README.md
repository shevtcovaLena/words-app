# Word App

<p align="center">
  <a href="https://words-app-three.vercel.app/">Live demo</a> ·
  <a href="https://github.com/shevtcovaLena/words-app">Repository</a>
</p>

**Word App** — приложение для обучения детей словарным словам с заполнением пропущенных букв.  
Проект построен на **Next.js 16**, **React 19** и **Supabase**, поддерживает авторизацию, админ-панель, тренировку слов и PWA-режим.

## Features

- Тренировка слов с пропущенными буквами.
- Авторизация через Supabase.
- Админ-панель для управления словами и группами.
- Адаптивный интерфейс для планшетов и мобильных устройств.
- Поддержка PWA и оффлайн-работы.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Supabase
- TanStack Query v5
- Vitest

## Getting Started

### Requirements

- Node.js >= 18.17.0
- pnpm 10

### Setup

```bash
pnpm install
```

Скопируй `.env.local.example` в `.env.local` и заполни переменные:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### Run locally

```bash
pnpm dev
```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm format`

## License

MIT
