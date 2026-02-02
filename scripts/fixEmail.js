import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mjwaedvaeonvhdiqapmt.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qd2FlZHZhZW9udmhkaXFhcG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMzkxMiwiZXhwIjoyMDg1NTg5OTEyfQ.hvAuRLQOrE0a2Vr3FFVNP2QjG31iiyPiQ0eAIYJqK1Q'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function disableEmailConfirmation() {
  console.log('Disabling email confirmation requirement...')
  
  try {
    // Note: This API endpoint might not be directly available
    // Instead, we'll provide manual instructions
    
    console.log('\n📧 To disable email confirmation in Supabase:')
    console.log('1. Go to: https://supabase.com/dashboard')
    console.log('2. Select project')
    console.log('3. Authentication → Providers → Email')
    console.log('4. Find "Require email confirmation" toggle')
    console.log('5. Turn it OFF')
    console.log('6. Save')
    console.log('\nOR use Supabase CLI:')
    console.log('supabase auth update --disable-email-confirmation')
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

disableEmailConfirmation()
