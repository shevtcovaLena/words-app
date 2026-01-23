'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister' // ← новый пакет!
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
            staleTime: 1000 * 60 * 60, // 1 час
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 дней
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }),
  )

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
        buster: 'v1',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
