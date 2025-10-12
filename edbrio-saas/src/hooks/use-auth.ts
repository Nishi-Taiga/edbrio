'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { User as DbUser } from '@/lib/types/database'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchDbUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchDbUser(session.user.id)
      } else {
        setDbUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchDbUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      // When no row exists yet, don't treat as an error; allow app to continue.
      if (error) {
        const msg = (error as any)?.message || String(error)
        if (!msg?.toLowerCase().includes('no rows')) {
          console.error('Error fetching user data:', msg)
        }
        setDbUser(null)
        return
      }

      setDbUser(data ?? null)
    } catch (error: any) {
      console.error('Error fetching user data:', error?.message || error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    dbUser,
    loading,
    signOut,
    isTeacher: dbUser?.role === 'teacher',
    isGuardian: dbUser?.role === 'guardian',
    isStudent: dbUser?.role === 'student',
  }
}
