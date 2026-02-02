import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mjwaedvaeonvhdiqapmt.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qd2FlZHZhZW9udmhkaXFhcG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMzkxMiwiZXhwIjoyMDg1NTg5OTEyfQ.hvAuRLQOrE0a2Vr3FFVNP2QjG31iiyPiQ0eAIYJqK1Q'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function updateAuthConfig() {
  console.log('Updating Supabase Auth Configuration...')
  
  try {
    // Note: Supabase Admin API doesn't have direct endpoint for updating URL config
    // This is a workaround - we'll log instructions instead
    
    console.log('\n✅ Please follow these steps manually in Supabase Dashboard:')
    console.log('1. Go to: https://supabase.com/dashboard')
    console.log('2. Select your project: mjwaedvaeonvhdiqapmt')
    console.log('3. Go to: Authentication → URL Configuration')
    console.log('4. In "Redirect URLs" section, add these URLs:')
    console.log('   - https://site-tracker-theta.vercel.app')
    console.log('   - https://site-tracker-theta.vercel.app/auth/callback')
    console.log('   - http://localhost:3000 (for local development)')
    console.log('5. Click "Save"')
    console.log('\nAlternatively, test email confirmation with corrected URL:')
    console.log('Replace "localhost:3000" with "site-tracker-theta.vercel.app" in the email link')
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

updateAuthConfig()
