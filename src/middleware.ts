// middleware.ts (в корне проекта, рядом с package.json)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/supabase/server' // ← ваш готовый файл!

export async function middleware(request: NextRequest) {
  // Ждём создания клиента (async!)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Защита /admin/*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
