import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjwaedvaeonvhdiqapmt.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8sLlD0Cpa9l3FB7Zj-fPqw_UjOlZSjA'

if (!supabaseUrl) throw new Error('supabaseUrl is required')
if (!supabaseKey) throw new Error('supabaseKey is required')

export const supabase = createClient(supabaseUrl, supabaseKey)
