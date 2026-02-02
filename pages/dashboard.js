import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Sheet from '../components/Sheet'
import Chart from '../components/Chart'

export default function Dashboard(){
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.push('/login')
    } else {
      setUser(data.session.user)
      loadProjects(data.session.user.id)
    }
  }

  async function loadProjects(userId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
    
    if (error) console.error(error)
    else {
      setProjects(data || [])
      if (data && data.length > 0) setSelectedProject(data[0].id)
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return
    setLoading(true)
    
    const { data, error } = await supabase
      .from('projects')
      .insert([{ user_id: user.id, name: newProjectName }])
      .select()
    
    if (!error && data) {
      setProjects([...projects, data[0]])
      setSelectedProject(data[0].id)
      setNewProjectName('')
    }
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm py-4">
        <div className="container flex justify-between items-center">
          <h1 className="font-bold text-lg">Dashboard</h1>
          <div className="space-x-3">
            <a href="/share" className="text-sm text-blue-600 font-semibold">Share & Permissions</a>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <p className="mb-6 text-gray-700">Welcome, <strong>{user?.email}</strong></p>

        <div className="grid md:grid-cols-4 gap-4">
          {/* Projects List */}
          <div className="md:col-span-1 bg-white rounded shadow p-4 h-fit">
            <h2 className="font-semibold mb-4">Your Projects</h2>
            <div className="space-y-2">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className={`w-full text-left p-2 rounded text-sm ${
                    selectedProject === p.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <input
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                className="w-full border p-2 rounded text-sm"
                placeholder="New project name..."
              />
              <button
                onClick={createProject}
                disabled={loading}
                className="w-full py-2 bg-green-600 text-white text-sm rounded disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {selectedProject ? (
              <>
                <Sheet projectId={selectedProject} />
                <Chart projectId={selectedProject} />
              </>
            ) : (
              <div className="bg-white rounded shadow p-4 text-center text-gray-500">
                Create a project to start tracking
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
