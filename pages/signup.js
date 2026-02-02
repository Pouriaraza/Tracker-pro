import { useState } from 'react'
import Link from 'next/link'

export default function Signup(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e){
    e.preventDefault()
    alert('Demo signup: '+email)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
        <form onSubmit={submit} className="space-y-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 rounded" placeholder="Email" />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border p-2 rounded" placeholder="Password" />
          <button className="w-full py-2 bg-green-600 text-white rounded">Create account</button>
        </form>
        <p className="text-sm mt-4">Already have an account? <Link href="/login"><a className="text-blue-600">Login</a></Link></p>
      </div>
    </div>
  )
}
