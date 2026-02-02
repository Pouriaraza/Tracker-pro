import { useState } from 'react'
import Link from 'next/link'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e){
    e.preventDefault()
    alert('Demo login: '+email)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <form onSubmit={submit} className="space-y-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 rounded" placeholder="Email" />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border p-2 rounded" placeholder="Password" />
          <button className="w-full py-2 bg-blue-600 text-white rounded">Login</button>
        </form>
        <p className="text-sm mt-4">Don't have an account? <Link href="/signup"><a className="text-blue-600">Sign up</a></Link></p>
      </div>
    </div>
  )
}
