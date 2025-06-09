import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xhetlcctjefqpjwkjdwc.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88'

// Debug logging for development
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration:')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not found')
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