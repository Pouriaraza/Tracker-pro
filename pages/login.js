import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Login(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            className="w-full border p-2 rounded" 
            placeholder="Email"
            disabled={loading}
          />
          <input 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            type="password" 
            className="w-full border p-2 rounded" 
            placeholder="Password"
            disabled={loading}
          />
          <button 
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-sm mt-4">Don't have an account? <Link href="/signup"><a className="text-blue-600">Sign up</a></Link></p>
      </div>
    </div>
  )
}
