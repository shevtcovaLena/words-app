import { createClient } from '@/supabase/server'
import type { UserRole } from '@/contexts/user-context'

export interface CurrentUser {
  id: string
  email: string
  role: UserRole
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Получаем роль пользователя из таблицы profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: UserRole }>()

    return {
      id: user.id,
      email: user.email || '',
      role: profile?.role || null,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
