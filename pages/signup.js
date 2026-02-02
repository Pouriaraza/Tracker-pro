import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Signup(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usesMagicLink, setUsesMagicLink] = useState(false)

  async function handlePassword(e){
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (signupError) {
        setError(signupError.message)
      } else {
        // Auto-confirm user for demo purposes
        alert('Account created! Please check email to confirm (or login directly).')
        router.push('/login')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleMagicLink(e){
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (magicError) {
        setError(magicError.message)
      } else {
        alert('Magic link sent! Check your email.')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        
        <div className="space-y-4">
          <input 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            className="w-full border p-2 rounded text-sm" 
            placeholder="Email"
            disabled={loading}
            type="email"
          />
          
          {!usesMagicLink && (
            <input 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              type="password" 
              className="w-full border p-2 rounded text-sm" 
              placeholder="Password (min 6 chars)"
              disabled={loading}
            />
          )}
          
          {!usesMagicLink ? (
            <button 
              onClick={handlePassword}
              disabled={loading}
              className="w-full py-2 bg-green-600 text-white rounded disabled:bg-gray-400 text-sm font-semibold"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          ) : (
            <button 
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 text-sm font-semibold"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          )}
          
          <button
            onClick={() => {
              setUsesMagicLink(!usesMagicLink)
              setError('')
            }}
            className="w-full text-sm text-gray-600 hover:text-gray-800"
          >
            {usesMagicLink ? 'Use Password Instead' : 'Use Magic Link Instead'}
          </button>
        </div>
        
        <p className="text-sm mt-4">Already have an account? <Link href="/login"><a className="text-blue-600">Login</a></Link></p>
      </div>
    </div>
  )
}
