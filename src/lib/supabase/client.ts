import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // Throw a clear error in the browser if env vars are missing
  if (typeof window !== 'undefined' && supabaseUrl.includes('placeholder')) {
    const errorMsg = 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL) are missing in the browser. ' +
      'If you are running locally, please restart your dev server. ' +
      'If you are on Vercel, please set these variables in your Project Settings.'
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}