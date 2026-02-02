import Hero from '../components/Hero'
import FeatureCard from '../components/FeatureCard'

export default function Home(){
  return (
    <main>
      <nav className="py-4 bg-white shadow-sm">
        <div className="container flex justify-between items-center">
          <div className="font-bold text-lg">Site Tracker</div>
          <div className="space-x-4">
            <a href="/dashboard" className="text-sm font-semibold text-blue-600">Dashboard</a>
            <a href="/login" className="text-sm">Login</a>
            <a href="/signup" className="text-sm">Sign Up</a>
          </div>
        </div>
      </nav>

      <Hero />

      <section className="py-12">
        <div className="container grid md:grid-cols-3 gap-6">
          <FeatureCard title="Excel-like Sheets">Manage your site information with powerful spreadsheet capabilities and real-time collaboration.</FeatureCard>
          <FeatureCard title="Progress Tracking">Set goals, track habits, and visualize your progress with beautiful charts and statistics.</FeatureCard>
          <FeatureCard title="User Permissions">Control who can view and edit your data with granular permissions and secure sharing.</FeatureCard>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-500">© 2026 Site Tracker. All rights reserved.</footer>
    </main>
  )
}
