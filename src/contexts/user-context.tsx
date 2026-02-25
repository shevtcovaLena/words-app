'use client'

import { createContext, useContext, ReactNode } from 'react'

export type UserRole = 'admin' | 'user' | null

export interface User {
  id?: string
  email?: string
  role: UserRole
}

interface UserContextType {
  user: User
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  children,
  user,
}: {
  children: ReactNode
  user: User
}) {
  const isAuthenticated = user.role !== null

  return (
    <UserContext.Provider value={{ user, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
