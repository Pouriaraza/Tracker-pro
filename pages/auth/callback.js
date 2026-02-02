import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setError(error.message)
        } else if (data.session) {
          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          setError('No session found')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          <p className="font-semibold">Authentication Error</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => router.push('/signup')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    )
  }

  return null
}
