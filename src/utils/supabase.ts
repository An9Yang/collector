import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Get environment variables - no fallbacks for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging for development (without exposing sensitive data)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration:')
  console.log('URL configured:', !!supabaseUrl)
  console.log('Key configured:', !!supabaseKey)
}

// Validate required configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Disable auth persistence for this read-only app
  },
  db: {
    schema: 'public'
  }
})

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('articles').select('count').limit(1)
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      return false
    }
    console.log('✅ Supabase connection successful')
    return true
  } catch (err) {
    console.error('❌ Supabase connection test error:', err)
    return false
  }
} 