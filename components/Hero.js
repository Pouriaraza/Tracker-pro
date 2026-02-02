import Link from 'next/link'

export default function Hero(){
  return (
    <section className="py-20 bg-white">
      <div className="container text-center">
        <h1 className="text-4xl font-extrabold mb-4">Track Your Progress</h1>
        <p className="text-gray-600 mb-6">A powerful platform for managing site information and tracking personal goals.</p>
        <div className="space-x-3">
          <Link href="/signup"><a className="px-6 py-3 bg-blue-600 text-white rounded">Get Started</a></Link>
          <Link href="/login"><a className="px-6 py-3 border rounded">Login</a></Link>
        </div>
      </div>
    </section>
  )
}
