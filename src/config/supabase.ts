import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xhetlcctjefqpjwkjdwc.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
