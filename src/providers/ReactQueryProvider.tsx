'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState } from 'react'

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60, // 1 час - данные считаются свежими
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 дней - хранить в кэше
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  // Создаём персистер для localStorage
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }),
  )

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
        buster: 'v1', // Версия кэша (измените на v2 при смене структуры данных)
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
